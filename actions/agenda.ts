"use server";

import { z } from "zod";
import { accionEmpresa, revalidarEmpresa } from "../lib/empresa";
import { reservaOcupaCupo } from "../lib/horarios";
import { esUuidValido } from "../lib/validaciones";
import { localCRaIso } from "../lib/zona-horaria";

const bloqueoSchema = z
  .object({
    fecha_inicio: z.string().datetime({ message: "Fecha de inicio inválida" }),
    fecha_fin: z.string().datetime({ message: "Fecha de fin inválida" }),
    motivo: z
      .string()
      .trim()
      .min(3, "El motivo debe tener al menos 3 caracteres")
      .max(200, "El motivo es muy largo"),
  })
  .refine((data) => new Date(data.fecha_fin) > new Date(data.fecha_inicio), {
    message: "La fecha de fin debe ser posterior a la fecha de inicio.",
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
  slug: string,
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

  return accionEmpresa(
    slug,
    "No se pudo crear el bloqueo. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { data: reservasRango, error: countError } = await supabase
        .from("reservas")
        .select("estado, trx_id")
        .eq("negocio_id", negocio.id)
        .neq("estado", "cancelada")
        .gte("fecha_hora", parsed.data.fecha_inicio)
        .lte("fecha_hora", parsed.data.fecha_fin);
      if (countError) {
        return { error: "No se pudo verificar la disponibilidad del rango." };
      }
      const afectadas = (reservasRango ?? []).filter((r) =>
        reservaOcupaCupo(r),
      ).length;
      if (afectadas > 0) {
        return {
          error: `Hay ${afectadas} reserva(s) en ese rango. Cancélalas primero en Reservas.`,
        };
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
        // El trigger `guard_block_write` revalida reservas activas aunque otra se cree entre medias.
        return {
          error:
            insertError.code === "23514"
              ? "Hay reservas activas en ese rango. Cancélalas primero en Reservas."
              : "No se pudo crear el bloqueo. Intenta de nuevo.",
        };
      }

      revalidarEmpresa(negocio.slug);
      return { success: true };
    },
  );
}

/** Elimina un bloqueo del negocio autenticado (filtra siempre por `negocio_id`). */
export async function eliminarBloqueoAction(
  slug: string,
  bloqueoId: string,
): Promise<CrearBloqueoActionState> {
  if (!esUuidValido(bloqueoId)) {
    return { error: "Bloqueo inválido." };
  }
  return accionEmpresa(
    slug,
    "No se pudo eliminar el bloqueo. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { error } = await supabase
        .from("bloqueos_excepcion")
        .delete()
        .eq("id", bloqueoId)
        .eq("negocio_id", negocio.id);

      if (error) {
        return { error: "No se pudo eliminar el bloqueo." };
      }

      revalidarEmpresa(negocio.slug);
      return { success: true };
    },
  );
}

function toIsoDateTime(value: FormDataEntryValue | null): string {
  if (typeof value !== "string" || value.length === 0) {
    return "";
  }
  return localCRaIso(value);
}
