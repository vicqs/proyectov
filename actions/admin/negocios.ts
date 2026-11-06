"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import {
  actualizar,
  authAdmin,
  insertar,
  leerUno,
  listarUsuariosAuth,
} from "../../lib/admin/db";
import {
  campo,
  esUuid,
  fechaEnDias,
  generarContrasena,
  revalidarAdmin,
} from "../../lib/admin/util";
import type { NegocioListado } from "../../lib/data/columnas";
import { revalidarEmpresa } from "../../lib/empresa";
import { obtenerConfiguracion, slugReservado } from "../../lib/plataforma";
import { MONEDA_SCHEMA } from "../../lib/monedas";
import { SLUG_SCHEMA as SLUG } from "../../lib/validaciones";

const esquemaNuevo = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  slug: SLUG,
  email: z.string().trim().toLowerCase().email("Correo del dueño inválido"),
  moneda: MONEDA_SCHEMA.default("USD"),
  cuenta_iban: z.string().trim().max(40).optional(),
});

/** Comprueba que el slug sea válido, no esté reservado y no lo use otro negocio. */
async function validarSlugLibre(
  slug: string,
  excluirId?: string,
): Promise<string | null> {
  if (await slugReservado(slug))
    return "Ese slug está reservado por la plataforma.";
  const otro = await leerUno("negocios", { eq: { slug } });
  if (otro && otro.id !== excluirId)
    return "Ya existe un negocio con ese slug.";
  return null;
}

export async function crearNegocioAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  const resultado = await accionAdmin("negocios_gestionar", async (admin) => {
    const parsed = esquemaNuevo.safeParse({
      nombre: campo(datos, "nombre"),
      slug: campo(datos, "slug"),
      email: campo(datos, "email"),
      moneda: campo(datos, "moneda") || "USD",
      cuenta_iban: campo(datos, "cuenta_iban") || undefined,
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
    }
    const { nombre, slug, email, moneda, cuenta_iban } = parsed.data;

    const errorSlug = await validarSlugLibre(slug);
    if (errorSlug) return { error: errorSlug };

    const perfilExistente = await leerUno("perfiles", { eq: { email } });
    const existenteId =
      perfilExistente?.user_id ??
      (await listarUsuariosAuth()).find((u) => u.email?.toLowerCase() === email)
        ?.id;
    let userId: string;
    let temporal: string | null = null;
    if (existenteId) {
      if (await leerUno("negocios", { eq: { user_id: existenteId } })) {
        return { error: "Ese usuario ya es dueño de otro negocio." };
      }
      userId = existenteId;
    } else {
      temporal = generarContrasena();
      const { data, error } = await authAdmin.createUser({
        email,
        password: temporal,
        email_confirm: true,
      });
      if (error || !data.user) {
        return { error: error?.message ?? "No se pudo crear al dueño." };
      }
      userId = data.user.id;
    }

    const config = await obtenerConfiguracion();
    const negocio = await insertar("negocios", {
      user_id: userId,
      nombre,
      slug,
      moneda,
      cuenta_iban: cuenta_iban ?? "",
      descripcion: null,
      color_tema: "#0284c7",
      logo_url: null,
      imagen_portada_url: null,
      estado_suscripcion: "prueba",
      stripe_customer_id: null,
      prueba_hasta: fechaEnDias(config.dias_prueba),
    });

    await registrarAuditoria(admin, {
      accion: "negocio.crear",
      entidad: "negocio",
      entidad_id: negocio.id,
      negocio_id: negocio.id,
      detalle: { slug, email, moneda, usuario_nuevo: !existenteId },
    });
    revalidarAdmin();
    revalidarEmpresa(slug);

    // Se expone al cliente solo la proyección del listado (sin IBAN, user_id ni stripe_customer_id).
    const negocioListado: NegocioListado = {
      id: negocio.id,
      nombre: negocio.nombre,
      slug: negocio.slug,
      moneda: negocio.moneda,
      estado_suscripcion: negocio.estado_suscripcion,
      prueba_hasta: negocio.prueba_hasta,
      suspendido: negocio.suspendido,
      eliminado_en: negocio.eliminado_en,
      creado_en: negocio.creado_en,
    };

    // La contraseña temporal solo se muestra una vez, en el modal.
    return {
      ok: temporal
        ? `Negocio creado para ${email}.`
        : `Negocio creado y asignado a ${email}.`,
      negocio: negocioListado,
      ...(temporal
        ? {
            contrasenaTemporal: {
              email,
              password: temporal,
              contexto: `Se creó la cuenta del dueño para el negocio «${nombre}». Compártele esta contraseña de forma segura; no se volverá a mostrar al cerrar esta ventana.`,
            },
          }
        : {}),
    };
  });
  return resultado;
}

const esquemaMotivo = z
  .string()
  .trim()
  .min(3, "Indica un motivo (mínimo 3 caracteres).")
  .max(300);

export async function suspenderNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const motivo = esquemaMotivo.safeParse(campo(datos, "motivo"));
    if (!motivo.success) return { error: motivo.error.issues[0].message };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    await actualizar(
      "negocios",
      { suspendido: true, motivo_suspension: motivo.data },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "negocio.suspender",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { motivo: motivo.data },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Negocio suspendido." };
  });
}

export async function reactivarNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    await actualizar(
      "negocios",
      { suspendido: false, motivo_suspension: null },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "negocio.reactivar",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Negocio reactivado." };
  });
}

export async function eliminarNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    if (campo(datos, "confirmar") !== negocio.slug) {
      return { error: "Escribe el slug exacto del negocio para confirmar." };
    }
    await actualizar(
      "negocios",
      { eliminado_en: new Date().toISOString() },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "negocio.eliminar",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { slug: negocio.slug },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Negocio eliminado (borrado lógico, se puede restaurar)." };
  });
}

export async function restaurarNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    const errorSlug = await validarSlugLibre(negocio.slug, id);
    if (errorSlug) return { error: errorSlug };
    await actualizar("negocios", { eliminado_en: null }, { id });
    await registrarAuditoria(admin, {
      accion: "negocio.restaurar",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Negocio restaurado." };
  });
}

const esquemaDatos = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(80),
  descripcion: z.string().trim().max(600),
  moneda: MONEDA_SCHEMA.optional(),
});

export async function editarDatosNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const parsed = esquemaDatos.safeParse({
      nombre: campo(datos, "nombre"),
      descripcion: campo(datos, "descripcion"),
      moneda: campo(datos, "moneda") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    await actualizar(
      "negocios",
      {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion || null,
        ...(parsed.data.moneda ? { moneda: parsed.data.moneda } : {}),
      },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "negocio.editar",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: {
        nombre: parsed.data.nombre,
        ...(parsed.data.moneda ? { moneda: parsed.data.moneda } : {}),
      },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Datos actualizados." };
  });
}

export async function cambiarSlugAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const slug = SLUG.safeParse(campo(datos, "slug"));
    if (!slug.success) return { error: slug.error.issues[0].message };
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    if (negocio.slug === slug.data) return { error: "El slug es el mismo." };
    const errorSlug = await validarSlugLibre(slug.data, id);
    if (errorSlug) return { error: errorSlug };
    await actualizar("negocios", { slug: slug.data }, { id });
    await registrarAuditoria(admin, {
      accion: "negocio.cambiar_slug",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { anterior: negocio.slug, nuevo: slug.data },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    revalidarEmpresa(slug.data);
    return {
      ok: `Slug cambiado. El enlace anterior /${negocio.slug} dejó de funcionar.`,
    };
  });
}

export async function limpiarContenidoAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_gestionar", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const queParsed = z
      .enum(["descripcion", "logo", "portada", "todo"])
      .safeParse(campo(datos, "que"));
    if (!queParsed.success) return { error: "Elige qué contenido limpiar." };
    const que = queParsed.data;
    const negocio = await leerUno("negocios", { eq: { id } });
    if (!negocio) return { error: "Negocio no encontrado." };
    const cambios =
      que === "descripcion"
        ? { descripcion: null }
        : que === "logo"
          ? { logo_url: null }
          : que === "portada"
            ? { imagen_portada_url: null }
            : { descripcion: null, logo_url: null, imagen_portada_url: null };
    await actualizar("negocios", cambios, { id });
    await registrarAuditoria(admin, {
      accion: "negocio.limpiar_contenido",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { que },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Contenido retirado del perfil público." };
  });
}

export async function agregarNotaAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("negocios_ver", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de negocio inválido." };
    const textoParsed = z
      .string()
      .trim()
      .min(2, "La nota debe tener entre 2 y 1000 caracteres.")
      .max(1000, "La nota debe tener entre 2 y 1000 caracteres.")
      .safeParse(campo(datos, "texto"));
    if (!textoParsed.success) {
      return { error: textoParsed.error.issues[0].message };
    }
    const texto = textoParsed.data;
    if (!(await leerUno("negocios", { eq: { id } }))) {
      return { error: "Negocio no encontrado." };
    }
    await insertar("notas_internas", {
      negocio_id: id,
      autor_email: admin.email,
      texto,
    });
    await registrarAuditoria(admin, {
      accion: "negocio.nota",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
    });
    revalidarAdmin();
    return { ok: "Nota guardada." };
  });
}
