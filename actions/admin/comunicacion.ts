"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import {
  actualizar,
  authAdmin,
  eliminar,
  insertar,
  leer,
} from "../../lib/admin/db";
import { campo, esUuid, revalidarAdmin } from "../../lib/admin/util";
import { enviarCorreoTexto } from "../../lib/email";
import { estadoEfectivo } from "../../lib/negocio-estado";

const SEGMENTOS = ["todas", "prueba", "activa", "inactiva"] as const;
const MAX_DESTINATARIOS = 200;
/** UUIDs por consulta `IN` (cada uno ocupa ~40 caracteres de URL). */
const TAMANO_LOTE_IN = 50;
/** Correos enviados en paralelo por tanda. */
const CONCURRENCIA_ENVIO = 5;

function refrescar() {
  revalidarAdmin();
  // Los anuncios se muestran en el panel de cada empresa.
  revalidatePath("/[slug]/admin", "layout");
}

export async function crearAnuncioAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("comunicacion", async (admin) => {
    const parsed = z
      .object({
        titulo: z.string().min(3, "El título es muy corto.").max(100),
        mensaje: z.string().min(3, "Escribe el mensaje.").max(600),
        severidad: z.enum(["info", "aviso", "critico"]),
        segmento: z.enum(SEGMENTOS),
        dias: z.coerce.number().int().min(0).max(365),
      })
      .safeParse({
        titulo: campo(datos, "titulo"),
        mensaje: campo(datos, "mensaje"),
        severidad: campo(datos, "severidad"),
        segmento: campo(datos, "segmento"),
        dias: campo(datos, "dias") || "0",
      });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const { dias, ...resto } = parsed.data;
    const anuncio = await insertar("anuncios", {
      ...resto,
      activo: true,
      expira_en:
        dias > 0
          ? new Date(Date.now() + dias * 86_400_000).toISOString()
          : null,
      creado_por: admin.email,
    });
    await registrarAuditoria(admin, {
      accion: "anuncio.crear",
      entidad: "anuncio",
      entidad_id: anuncio.id,
    });
    refrescar();
    return { ok: "Anuncio publicado." };
  });
}

export async function alternarAnuncioAction(
  id: string,
  activo: boolean,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("comunicacion", async (admin) => {
    if (!esUuid(id) || !z.boolean().safeParse(activo).success) {
      return { error: "Parámetros de anuncio inválidos." };
    }
    await actualizar("anuncios", { activo }, { id });
    await registrarAuditoria(admin, {
      accion: activo ? "anuncio.activar" : "anuncio.desactivar",
      entidad: "anuncio",
      entidad_id: id,
    });
    refrescar();
    return { ok: activo ? "Anuncio activado." : "Anuncio desactivado." };
  });
}

export async function eliminarAnuncioAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("comunicacion", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de anuncio inválido." };
    await eliminar("anuncios", { id });
    await registrarAuditoria(admin, {
      accion: "anuncio.eliminar",
      entidad: "anuncio",
      entidad_id: id,
    });
    refrescar();
    return { ok: "Anuncio eliminado." };
  });
}

export async function enviarComunicadoAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("comunicacion", async (admin) => {
    const parsed = z
      .object({
        asunto: z.string().min(3, "El asunto es muy corto.").max(150),
        mensaje: z.string().min(10, "El mensaje es muy corto.").max(5000),
        segmento: z.enum(SEGMENTOS),
      })
      .safeParse({
        asunto: campo(datos, "asunto"),
        mensaje: campo(datos, "mensaje"),
        segmento: campo(datos, "segmento"),
      });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    // Solo las columnas necesarias para segmentar y resolver el destinatario.
    const negocios = (
      await leer("negocios", {
        columnas: [
          "id", "user_id", "email_contacto", "estado_suscripcion", "prueba_hasta", "eliminado_en",
        ],
      })
    ).filter(
      (n) =>
        !n.eliminado_en &&
        (parsed.data.segmento === "todas" ||
          estadoEfectivo(n) === parsed.data.segmento),
    );
    if (negocios.length === 0)
      return { error: "Ese segmento no tiene negocios." };
    if (negocios.length > MAX_DESTINATARIOS) {
      return {
        error: `El segmento tiene ${negocios.length} negocios; el máximo por envío es ${MAX_DESTINATARIOS}.`,
      };
    }

    // El filtro IN va en la URL: se parte en lotes para no superar su límite de longitud.
    const userIds = negocios.map((n) => n.user_id);
    const lotes: string[][] = [];
    for (let i = 0; i < userIds.length; i += TAMANO_LOTE_IN) {
      lotes.push(userIds.slice(i, i + TAMANO_LOTE_IN));
    }
    const perfiles = (
      await Promise.all(
        lotes.map((lote) =>
          leer("perfiles", {
            en: { user_id: lote },
            columnas: ["user_id", "email"],
          }),
        ),
      )
    ).flat();
    const emailPorUser = new Map(perfiles.map((p) => [p.user_id, p.email]));

    // Solo se consulta Auth para quienes no tienen correo conocido (en paralelo, sin N+1 secuencial).
    const sinCorreo = negocios.filter(
      (n) => !(n.email_contacto || emailPorUser.get(n.user_id)),
    );
    await Promise.all(
      sinCorreo.map(async (n) => {
        const { data } = await authAdmin.getUserById(n.user_id);
        if (data.user?.email) emailPorUser.set(n.user_id, data.user.email);
      }),
    );

    let enviados = 0;
    let fallidos = 0;
    const destinatarios = negocios.map(
      (n) => n.email_contacto || emailPorUser.get(n.user_id),
    );
    // Envío con concurrencia acotada: mucho más rápido que uno a uno sin saturar al proveedor.
    for (let i = 0; i < destinatarios.length; i += CONCURRENCIA_ENVIO) {
      const resultados = await Promise.all(
        destinatarios.slice(i, i + CONCURRENCIA_ENVIO).map(async (to) => {
          if (!to) return false;
          return enviarCorreoTexto({
            to,
            asunto: parsed.data.asunto,
            texto: parsed.data.mensaje,
          });
        }),
      );
      for (const ok of resultados) ok ? enviados++ : fallidos++;
    }
    const comunicado = await insertar("comunicados", {
      ...parsed.data,
      destinatarios: negocios.length,
      enviados,
      fallidos,
      creado_por: admin.email,
    });
    await registrarAuditoria(admin, {
      accion: "comunicado.enviar",
      entidad: "comunicado",
      entidad_id: comunicado.id,
      detalle: { segmento: parsed.data.segmento, enviados, fallidos },
    });
    refrescar();
    return {
      ok: `Comunicado enviado: ${enviados} correo(s), ${fallidos} fallido(s).`,
    };
  });
}
