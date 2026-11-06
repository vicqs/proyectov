"use server";

import { z } from "zod";
import {
  accionEmpresa,
  revalidarEmpresa,
  type ContextoEmpresa,
} from "../lib/empresa";
import { cuposOcupados } from "../lib/horarios";
import { obtenerConfiguracion } from "../lib/plataforma";
import { esUuidValido } from "../lib/validaciones";

const horarioSchema = z.object({
  servicio_id: z.string().uuid("Servicio inválido"),
  fecha_hora: z.string().datetime({ message: "Fecha y hora inválidas" }),
  // El tope real lo define `platform_settings.max_schedule_capacity` (hasta 10000, igual que la
  // restricción de la BD); aquí solo se valida el rango absoluto para no contradecir la configuración.
  cupos_totales: z.coerce
    .number()
    .int("Los cupos deben ser un número entero")
    .min(1, "Debe haber al menos 1 cupo")
    .max(10000, "Máximo 10000 cupos"),
});

export interface HorarioActionResult {
  error?: string;
  success?: boolean;
}

/** Traduce errores de restricciones/triggers de `schedules` a mensajes para el negocio. */
function mensajeErrorHorario(
  error: { code?: string; message: string },
  porDefecto: string,
): string {
  if (error.code === "23505") {
    return "Ya existe un horario para ese servicio en esa fecha y hora.";
  }
  if (error.code === "23503") {
    return "Este horario tiene reservas activas. Cancélalas primero en la sección Reservas.";
  }
  return porDefecto;
}

/**
 * Verifica que el servicio pertenezca al negocio autenticado y que la capacidad
 * solicitada no exceda el tope de la plataforma (`max_cupos_horario`).
 */
async function verificarServicioYCapacidad(
  ctx: ContextoEmpresa,
  servicioId: string,
  cuposTotales: number,
): Promise<string | null> {
  const [{ max_cupos_horario }, { data: servicio, error: servicioError }] =
    await Promise.all([
      obtenerConfiguracion(),
      ctx.supabase
        .from("servicios")
        .select("id, unit_type")
        .eq("id", servicioId)
        .eq("negocio_id", ctx.negocio.id)
        .maybeSingle(),
    ]);

  if (cuposTotales > max_cupos_horario) {
    return `Máximo ${max_cupos_horario} cupos por horario.`;
  }
  if (servicioError) {
    return "No se pudo verificar el servicio. Intenta de nuevo.";
  }
  if (!servicio) {
    return "El servicio no existe.";
  }
  if (servicio.unit_type === "item") {
    return "Los servicios por ítems no usan horarios: se venden por stock.";
  }
  return null;
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

  return accionEmpresa(
    slug,
    "No se pudo crear el horario. Intenta de nuevo.",
    async (ctx) => {
      const errorPrevio = await verificarServicioYCapacidad(
        ctx,
        parsed.data.servicio_id,
        parsed.data.cupos_totales,
      );
      if (errorPrevio) return { error: errorPrevio };

      const { error } = await ctx.supabase.from("horarios").insert({
        negocio_id: ctx.negocio.id,
        servicio_id: parsed.data.servicio_id,
        fecha_hora: parsed.data.fecha_hora,
        cupos_totales: parsed.data.cupos_totales,
      });
      if (error) {
        return {
          error: mensajeErrorHorario(error, "No se pudo crear el horario."),
        };
      }

      revalidarEmpresa(ctx.negocio.slug);
      return { success: true };
    },
  );
}

/** Elimina un horario del negocio autenticado (filtra por `negocio_id`). */
export async function eliminarHorarioAction(
  slug: string,
  horarioId: string,
): Promise<HorarioActionResult> {
  if (!esUuidValido(horarioId)) {
    return { error: "Horario inválido." };
  }
  return accionEmpresa(
    slug,
    "No se pudo eliminar el horario. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const negocioId = negocio.id;

      const { data: horario, error: horarioError } = await supabase
        .from("horarios")
        .select("servicio_id, fecha_hora")
        .eq("id", horarioId)
        .eq("negocio_id", negocioId)
        .maybeSingle();
      if (horarioError) {
        return {
          error: "No se pudo consultar el horario. Intenta de nuevo.",
        };
      }
      if (!horario) return { error: "El horario no existe." };

      // No eliminar horarios con reservas vigentes: quedarían huérfanas.
      const { data: reservas, error: reservasError } = await supabase
        .from("reservas")
        .select("servicio_id, fecha_hora, estado, trx_id, cupos")
        .eq("negocio_id", negocioId)
        .eq("servicio_id", horario.servicio_id)
        .eq("fecha_hora", horario.fecha_hora)
        .neq("estado", "cancelada");
      if (reservasError) {
        return {
          error:
            "No se pudieron verificar las reservas del horario. Intenta de nuevo.",
        };
      }
      if (
        cuposOcupados(
          reservas ?? [],
          horario.servicio_id,
          horario.fecha_hora,
        ) > 0
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
      if (error) {
        return {
          error: mensajeErrorHorario(error, "No se pudo eliminar el horario."),
        };
      }

      revalidarEmpresa(negocio.slug);
      return { success: true };
    },
  );
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

  return accionEmpresa<HorarioActionResult & { creados?: number }>(
    slug,
    "No se pudieron crear los horarios. Intenta de nuevo.",
    async (ctx) => {
      const errorPrevio = await verificarServicioYCapacidad(
        ctx,
        parsed.data.servicio_id,
        parsed.data.cupos_totales,
      );
      if (errorPrevio) return { error: errorPrevio };

      const { supabase, negocio } = ctx;
      const negocioId = negocio.id;

      const timestamps = parsed.data.fechas.map((f) => new Date(f).getTime());
      const minIso = new Date(Math.min(...timestamps)).toISOString();
      const maxIso = new Date(Math.max(...timestamps)).toISOString();

      const { data: existentes, error: existentesError } = await supabase
        .from("horarios")
        .select("fecha_hora")
        .eq("negocio_id", negocioId)
        .eq("servicio_id", parsed.data.servicio_id)
        .gte("fecha_hora", minIso)
        .lte("fecha_hora", maxIso);
      if (existentesError) {
        return {
          error:
            "No se pudieron verificar los horarios existentes. Intenta de nuevo.",
        };
      }
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
      if (error) {
        return {
          error: mensajeErrorHorario(
            error,
            "No se pudieron crear los horarios.",
          ),
        };
      }

      revalidarEmpresa(negocio.slug);
      return { success: true, creados: nuevas.length };
    },
  );
}
