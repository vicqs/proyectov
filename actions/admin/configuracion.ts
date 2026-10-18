"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { leerUno, upsertar } from "../../lib/admin/db";
import { campo, revalidarAdmin } from "../../lib/admin/util";
import { CONFIG_POR_DEFECTO, FLAGS_CONOCIDOS } from "../../lib/plataforma";
import { revalidatePath } from "next/cache";
import type { ConfiguracionPlataforma } from "../../types/database";

/** Config actual con valores por defecto, para guardar cambios parciales. */
async function actual(): Promise<ConfiguracionPlataforma> {
  const fila = await leerUno("configuracion_plataforma", { eq: { id: 1 } });
  return { ...CONFIG_POR_DEFECTO, ...(fila ?? {}) };
}

async function guardar(
  cambios: Partial<ConfiguracionPlataforma>,
): Promise<void> {
  const base = await actual();
  await upsertar(
    "configuracion_plataforma",
    { ...base, ...cambios, id: 1, actualizado_en: new Date().toISOString() },
    "id",
  );
  revalidarAdmin();
  // La configuración afecta a todo el sitio (mantenimiento, legales, flags).
  revalidatePath("/", "layout");
}

const SLUG_RE = /^[a-z0-9][a-z0-9_-]{0,48}$/;

export async function guardarGeneralAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("configuracion", async (admin) => {
    const parsed = z
      .object({
        dias_prueba: z.coerce.number().int().min(0).max(90),
        max_cupos_horario: z.coerce.number().int().min(1).max(10000),
        max_imagen_mb: z.coerce.number().min(0.1).max(20),
        mensaje_mantenimiento: z.string().max(300),
      })
      .safeParse({
        dias_prueba: campo(datos, "dias_prueba"),
        max_cupos_horario: campo(datos, "max_cupos_horario"),
        max_imagen_mb: campo(datos, "max_imagen_mb"),
        mensaje_mantenimiento: campo(datos, "mensaje_mantenimiento"),
      });
    if (!parsed.success) {
      return { error: "Revisa los valores: hay números fuera de rango." };
    }

    const slugs = campo(datos, "slugs_reservados")
      .split(/[\s,]+/)
      .map((s) => s.toLowerCase())
      .filter(Boolean);
    const invalido = slugs.find((s) => !SLUG_RE.test(s));
    if (invalido) return { error: `Slug no válido: «${invalido}».` };

    const flags: Record<string, boolean> = {};
    for (const f of FLAGS_CONOCIDOS)
      flags[f.clave] = datos.get(`flag_${f.clave}`) === "on";

    const anterior = await actual();
    const mantenimiento = datos.get("modo_mantenimiento") === "on";
    await guardar({
      dias_prueba: parsed.data.dias_prueba,
      max_cupos_horario: parsed.data.max_cupos_horario,
      max_imagen_mb: parsed.data.max_imagen_mb,
      mensaje_mantenimiento: parsed.data.mensaje_mantenimiento || null,
      modo_mantenimiento: mantenimiento,
      slugs_reservados: [...new Set(slugs)],
      flags,
    });
    await registrarAuditoria(admin, {
      accion: "configuracion.general",
      entidad: "configuracion",
      detalle: {
        mantenimiento_antes: anterior.modo_mantenimiento,
        mantenimiento_despues: mantenimiento,
        flags,
      },
    });
    return { ok: "Configuración guardada." };
  });
}

export async function guardarPlantillasAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("configuracion", async (admin) => {
    const plantillas: ConfiguracionPlataforma["plantillas_correo"] = {};
    for (const clave of ["recibo", "alerta"]) {
      const asunto = campo(datos, `${clave}_asunto`);
      const encabezado = campo(datos, `${clave}_encabezado`);
      const pie = campo(datos, `${clave}_pie`);
      if (asunto.length > 150 || encabezado.length > 500 || pie.length > 500) {
        return { error: "Algún texto supera el largo permitido." };
      }
      if (asunto || encabezado || pie) {
        plantillas[clave] = {
          ...(asunto ? { asunto } : {}),
          ...(encabezado ? { encabezado } : {}),
          ...(pie ? { pie } : {}),
        };
      }
    }
    await guardar({ plantillas_correo: plantillas });
    await registrarAuditoria(admin, {
      accion: "configuracion.plantillas",
      entidad: "configuracion",
    });
    return { ok: "Plantillas guardadas." };
  });
}

export async function guardarLegalAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("configuracion", async (admin) => {
    const terminos = campo(datos, "terminos_texto");
    const privacidad = campo(datos, "privacidad_texto");
    if (terminos.length > 30000 || privacidad.length > 30000) {
      return { error: "Cada texto admite hasta 30.000 caracteres." };
    }
    await guardar({
      terminos_texto: terminos || null,
      privacidad_texto: privacidad || null,
    });
    revalidatePath("/terminos");
    revalidatePath("/privacidad");
    await registrarAuditoria(admin, {
      accion: "configuracion.legal",
      entidad: "configuracion",
    });
    return {
      ok: "Textos legales guardados. Vacío = usa el texto por defecto.",
    };
  });
}
