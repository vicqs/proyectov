"use server";

import { z } from "zod";
import { obtenerEmpresaOperativa, revalidarEmpresa } from "../lib/empresa";
import { cuposOcupados } from "../lib/horarios";
import { obtenerConfiguracion } from "../lib/plataforma";

const horarioSchema = z.object({
  servicio_id: z.string().uuid("Servicio inválido"),
  fecha_hora: z.string().datetime({ message: "Fecha y hora inválidas" }),
  cupos_totales: z.coerce
    .number()
    .int("Los cupos deben ser un número entero")
    .min(1, "Debe haber al menos 1 cupo")
    .max(500, "Máximo 500 cupos"),
});

export interface HorarioActionResult {
  error?: string;
  success?: boolean;
}

/** Crea un horario para un servicio del negocio autenticado. */
export async function crearHorarioAction(
  slug: string,
  datos: {
    servicio_id: string;
    fecha_hora: string;
    cupos_totales: number;
  },
): Promise<HorarioActionResult> {
  const parsed = horarioSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, negocio } = ctx;
  const negocioId = negocio.id;
  const { max_cupos_horario } = await obtenerConfiguracion();
  if (parsed.data.cupos_totales > max_cupos_horario) {
    return { error: `Máximo ${max_cupos_horario} cupos por horario.` };
  }

  // El servicio debe pertenecer al negocio autenticado.
  const { data: servicio } = await supabase
    .from("servicios")
    .select("id")
    .eq("id", parsed.data.servicio_id)
    .eq("negocio_id", negocioId)
    .single();
  if (!servicio) return { error: "El servicio no existe." };

  const { error } = await supabase.from("horarios").insert({
    negocio_id: negocioId,
    servicio_id: parsed.data.servicio_id,
    fecha_hora: parsed.data.fecha_hora,
    cupos_totales: parsed.data.cupos_totales,
  });
  if (error) return { error: "No se pudo crear el horario." };

  revalidarEmpresa(negocio.slug);
  return { success: true };
}

/** Elimina un horario del negocio autenticado (filtra por `negocio_id`). */
export async function eliminarHorarioAction(
  slug: string,
  horarioId: string,
): Promise<HorarioActionResult> {
  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, negocio } = ctx;
  const negocioId = negocio.id;

  const { data: horario } = await supabase
    .from("horarios")
    .select("*")
    .eq("id", horarioId)
    .eq("negocio_id", negocioId)
    .single();
  if (!horario) return { error: "El horario no existe." };

  // No eliminar horarios con reservas vigentes: quedarían huérfanas.
  const { data: reservas } = await supabase
    .from("reservas")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("servicio_id", horario.servicio_id);
  if (
    cuposOcupados(reservas ?? [], horario.servicio_id, horario.fecha_hora) > 0
  ) {
    return {
      error:
        "Este horario tiene reservas. Cancélalas primero en la sección Reservas.",
    };
  }

  const { error } = await supabase
    .from("horarios")
    .delete()
    .eq("id", horarioId)
    .eq("negocio_id", negocioId);
  if (error) return { error: "No se pudo eliminar el horario." };

  revalidarEmpresa(negocio.slug);
  return { success: true };
}

const loteSchema = z.object({
  servicio_id: z.string().uuid("Servicio inválido"),
  fechas: z
    .array(z.string().datetime({ message: "Fecha y hora inválidas" }))
    .min(1, "No hay fechas para crear")
    .max(100, "Máximo 100 horarios por lote"),
  cupos_totales: horarioSchema.shape.cupos_totales,
});

/**
 * Crea varios horarios de una vez (repetición semanal). Omite los que ya
 * existen para el mismo servicio y fecha/hora, para no duplicar.
 */
export async function crearHorariosLoteAction(
  slug: string,
  datos: {
    servicio_id: string;
    fechas: string[];
    cupos_totales: number;
  },
): Promise<HorarioActionResult & { creados?: number }> {
  const parsed = loteSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, negocio } = ctx;
  const negocioId = negocio.id;
  const { max_cupos_horario } = await obtenerConfiguracion();
  if (parsed.data.cupos_totales > max_cupos_horario) {
    return { error: `Máximo ${max_cupos_horario} cupos por horario.` };
  }

  const { data: servicio } = await supabase
    .from("servicios")
    .select("id")
    .eq("id", parsed.data.servicio_id)
    .eq("negocio_id", negocioId)
    .single();
  if (!servicio) return { error: "El servicio no existe." };

  const { data: existentes } = await supabase
    .from("horarios")
    .select("*")
    .eq("negocio_id", negocioId)
    .eq("servicio_id", parsed.data.servicio_id);
  const ocupadas = new Set(
    (existentes ?? []).map((h) => new Date(h.fecha_hora).getTime()),
  );

  const nuevas = Array.from(new Set(parsed.data.fechas)).filter(
    (f) => !ocupadas.has(new Date(f).getTime()),
  );
  if (nuevas.length === 0) {
    return { error: "Todos esos horarios ya existen." };
  }

  const { error } = await supabase.from("horarios").insert(
    nuevas.map((fecha_hora) => ({
      negocio_id: negocioId,
      servicio_id: parsed.data.servicio_id,
      fecha_hora,
      cupos_totales: parsed.data.cupos_totales,
    })),
  );
  if (error) return { error: "No se pudieron crear los horarios." };

  revalidarEmpresa(negocio.slug);
  return { success: true, creados: nuevas.length };
}
