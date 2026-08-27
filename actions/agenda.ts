"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";

const bloqueoSchema = z
  .object({
    fecha_inicio: z.string().datetime({ message: "Fecha de inicio inválida" }),
    fecha_fin: z.string().datetime({ message: "Fecha de fin inválida" }),
    motivo: z.string().min(3, "El motivo debe tener al menos 3 caracteres"),
  })
  .refine((data) => new Date(data.fecha_fin) >= new Date(data.fecha_inicio), {
    message: "La fecha de fin no puede ser anterior a la fecha de inicio.",
    path: ["fecha_fin"],
  });

export interface CrearBloqueoActionState {
  error?: string;
  success?: boolean;
}

/**
 * Server Action para crear un bloqueo de horario (excepción de disponibilidad).
 * El `negocio_id` se resuelve en el servidor a partir del usuario autenticado,
 * nunca se toma del formulario (aislamiento multi-tenant).
 */
export async function crearBloqueoAction(
  _prevState: CrearBloqueoActionState,
  formData: FormData,
): Promise<CrearBloqueoActionState> {
  // Los <input type="datetime-local"> envían un valor sin zona horaria
  // (ej. "2026-09-01T10:00"); lo normalizamos a ISO 8601 completo antes de validar.
  const inicioRaw = formData.get("fecha_inicio");
  const finRaw = formData.get("fecha_fin");

  const fecha_inicio = toIsoDateTime(inicioRaw);
  const fecha_fin = toIsoDateTime(finRaw);

  const parsed = bloqueoSchema.safeParse({
    fecha_inicio,
    fecha_fin,
    motivo: formData.get("motivo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión expirada, vuelve a iniciar sesión." };
  }

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (negocioError || !negocio) {
    return { error: "No se encontró el negocio asociado a tu cuenta." };
  }

  const { error: insertError } = await supabase
    .from("bloqueos_excepcion")
    .insert({
      negocio_id: negocio.id,
      fecha_inicio: parsed.data.fecha_inicio,
      fecha_fin: parsed.data.fecha_fin,
      motivo: parsed.data.motivo,
    });

  if (insertError) {
    return { error: "No se pudo crear el bloqueo. Intenta de nuevo." };
  }

  revalidatePath("/admin/agenda");
  return { success: true };
}

function toIsoDateTime(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}
