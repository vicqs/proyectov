"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { insertar, leer } from "../lib/admin/db";
import { supabaseAdmin } from "../lib/supabase";
import { funcionActivaNegocio } from "../lib/plataforma";

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
  },
  en: {
    correo: "Invalid email address.",
    invalido: "Invalid data.",
    noEncontrado: "Business not found.",
    deshabilitado: "Reports are currently disabled.",
    saturado: "This profile has already received several recent reports. Thank you.",
    ok: "Thank you, we will review the profile.",
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

  const { data: negocio } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (!negocio || negocio.eliminado_en) return { error: m.noEncontrado };
  if (!(await funcionActivaNegocio(negocio, "reportes_publicos"))) {
    return { error: m.deshabilitado };
  }

  const pendientes = (
    await leer("reportes_perfil", { eq: { negocio_id: negocio.id } })
  ).filter(
    (r) =>
      r.estado === "pendiente" &&
      Date.now() - new Date(r.creado_en).getTime() < 3_600_000,
  );
  if (pendientes.length >= 5) {
    return { error: m.saturado };
  }

  await insertar("reportes_perfil", {
    negocio_id: negocio.id,
    motivo: parsed.data.motivo,
    detalle: parsed.data.detalle || null,
    email_reportante: parsed.data.email || null,
    estado: "pendiente",
  });
  revalidatePath("/admin/moderacion");
  return { ok: m.ok };
}
