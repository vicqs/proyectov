"use server";

import { z } from "zod";
import { revalidarAdmin } from "../lib/admin/util";
import { registrarReportePublico } from "../lib/data/public";
import { DataError } from "../lib/data/db";

export interface ReporteEstado {
  ok?: string;
  error?: string;
}

const MOTIVOS = ["contenido", "fraude", "suplantacion", "otro"] as const;

const MENSAJES = {
  es: {
    correo: "Correo no válido.",
    invalido: "Datos inválidos.",
    noEncontrado: "Negocio no encontrado.",
    deshabilitado: "Los reportes están deshabilitados por ahora.",
    saturado: "Este perfil ya recibió varios reportes recientes. Gracias.",
    ok: "Gracias, revisaremos el perfil.",
    fallo: "No se pudo enviar el reporte. Intenta de nuevo.",
  },
  en: {
    correo: "Invalid email address.",
    invalido: "Invalid data.",
    noEncontrado: "Business not found.",
    deshabilitado: "Reports are currently disabled.",
    saturado: "This profile has already received several recent reports. Thank you.",
    ok: "Thank you, we will review the profile.",
    fallo: "Could not submit the report. Please try again.",
  },
} as const;

/** Reporte público de un perfil. No requiere sesión; con tope anti-spam. */
export async function reportarPerfilAction(
  slug: string,
  _previo: ReporteEstado,
  datos: FormData,
): Promise<ReporteEstado> {
  const m = MENSAJES[datos.get("idioma") === "en" ? "en" : "es"];

  const parsed = z
    .object({
      motivo: z.enum(MOTIVOS),
      detalle: z.string().trim().max(1000).optional(),
      email: z.union([z.string().trim().email(m.correo), z.literal("")]),
    })
    .safeParse({
      motivo: String(datos.get("motivo") ?? ""),
      detalle: String(datos.get("detalle") ?? ""),
      email: String(datos.get("email") ?? "").trim(),
    });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? m.invalido };

  try {
    await registrarReportePublico({
      p_slug: slug.toLowerCase(), p_reason: parsed.data.motivo,
      p_detail: parsed.data.detalle || null, p_email: parsed.data.email || null,
    });
    revalidarAdmin();
    return { ok: m.ok };
  } catch (error) {
    console.error("[reporte público]", error);
    if (error instanceof DataError) {
      if (error.code === "P0002") return { error: m.noEncontrado };
      if (error.code === "42501") return { error: m.deshabilitado };
      if (error.code === "P0001" && error.message.includes("varios reportes")) return { error: m.saturado };
    }
    return { error: m.fallo };
  }
}
