"use server";

import { z } from "zod";
import { revalidarAdmin } from "../lib/admin/util";
import { accionEmpresa, revalidarEmpresa } from "../lib/empresa";
import {
  construirHorarios,
  estaBloqueado,
  reservaOcupaCupo,
} from "../lib/horarios";
import { generarTrxManual } from "../lib/pagos";
import { esUuidValido } from "../lib/validaciones";

export interface ReservaActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Cancela una reserva del negocio autenticado. La reserva se conserva con
 * estado "cancelada" (historial), libera sus cupos automáticamente y, si tenía
 * cobro por pasarela, registra el reembolso pendiente para conciliación.
 */
export async function cancelarReservaAction(
  slug: string,
  reservaId: string,
): Promise<ReservaActionResult> {
  if (!esUuidValido(reservaId)) {
    return { error: "Reserva inválida." };
  }
  return accionEmpresa(
    slug,
    "No se pudo cancelar la reserva. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const negocioId = negocio.id;

      const { data: reserva, error: lecturaError } = await supabase
        .from("reservas")
        .select("id, estado")
        .eq("id", reservaId)
        .eq("negocio_id", negocioId)
        .maybeSingle();
      if (lecturaError) {
        return {
          error: "No se pudo consultar la reserva. Intenta de nuevo.",
        };
      }
      if (!reserva) return { error: "No se encontró la reserva." };
      if (reserva.estado === "cancelada") {
        return { error: "La reserva ya estaba cancelada." };
      }

      const { error } = await supabase
        .from("reservas")
        .update({ estado: "cancelada" })
        .eq("id", reservaId)
        .eq("negocio_id", negocioId);
      if (error) return { error: "No se pudo cancelar la reserva." };

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}

const manualSchema = z.object({
  horarioId: z.string().uuid("Horario inválido"),
  nombre: z.string().trim().min(1, "Ingresa el nombre").max(100),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .max(254, "Correo demasiado largo"),
  cupos: z.number().int().min(1, "Mínimo 1 cupo").max(50),
  pagada: z.boolean(),
});

/** Traduce los errores de las restricciones y triggers de `bookings` a mensajes para el negocio. */
function mensajeErrorReservaManual(error: {
  code?: string;
  message: string;
}): string {
  if (error.code === "23505")
    return "Este correo ya tiene una reserva para este servicio.";
  if (error.code === "23514")
    return "El horario se agotó o no admite esa cantidad de cupos.";
  if (/horario no esta disponible/i.test(error.message)) {
    return "Este horario ya no está disponible.";
  }
  return "No se pudo crear la reserva.";
}

/**
 * Registra una reserva manual (cliente que llama o escribe por WhatsApp).
 * Respeta cupos, bloqueos y duplicados igual que el flujo público, pero sin cobro ni
 * correos de pasarela: se identifica siempre con prefijo `manual_` y se marca como
 * pagada solo si el dueño ya recibió el dinero.
 *
 * Las validaciones previas son solo para dar mensajes claros: la fuente de verdad es el
 * trigger `prepare_booking`, que bloquea el horario y revalida cupos, bloqueos y duplicados.
 * El monto cobrado lo fija ese trigger con el precio vigente del servicio.
 */
export async function crearReservaManualAction(
  slug: string,
  datos: z.infer<typeof manualSchema>,
): Promise<ReservaActionResult> {
  const parsed = manualSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { horarioId, nombre, email, cupos, pagada } = parsed.data;
  const emailNorm = email.toLowerCase();

  return accionEmpresa(
    slug,
    "No se pudo crear la reserva. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const negocioId = negocio.id;

      const { data: horario, error: horarioError } = await supabase
        .from("horarios")
        .select("id, negocio_id, servicio_id, fecha_hora, cupos_totales")
        .eq("id", horarioId)
        .eq("negocio_id", negocioId)
        .maybeSingle();
      if (horarioError) {
        return {
          error: "No se pudo verificar el horario. Intenta de nuevo.",
        };
      }
      if (!horario) return { error: "El horario no existe." };
      if (new Date(horario.fecha_hora).getTime() <= Date.now()) {
        return {
          error: "No puedes crear una reserva en un horario que ya pasó.",
        };
      }

      const [
        { data: reservas, error: reservasError },
        { data: bloqueos, error: bloqueosError },
      ] = await Promise.all([
        supabase
          .from("reservas")
          .select(
            "servicio_id, fecha_hora, cupos, estado, trx_id, email_cliente",
          )
          .eq("negocio_id", negocioId)
          .eq("servicio_id", horario.servicio_id)
          .neq("estado", "cancelada"),
        supabase
          .from("bloqueos_excepcion")
          .select("fecha_inicio, fecha_fin")
          .eq("negocio_id", negocioId)
          .lte("fecha_inicio", horario.fecha_hora)
          .gte("fecha_fin", horario.fecha_hora),
      ]);
      // Si alguna lectura falla no se asume "sin reservas" ni "sin bloqueos": se aborta.
      if (reservasError || bloqueosError) {
        return {
          error: "No se pudo verificar la disponibilidad. Intenta de nuevo.",
        };
      }

      if (estaBloqueado(horario.fecha_hora, bloqueos ?? [])) {
        return {
          error: "Este horario está bloqueado por una excepción de agenda.",
        };
      }

      const reservasActivas = (reservas ?? []).filter((r) =>
        reservaOcupaCupo(r),
      );
      if (
        reservasActivas.some(
          (r) => r.email_cliente.trim().toLowerCase() === emailNorm,
        )
      ) {
        return {
          error: "Este correo ya tiene una reserva para este servicio.",
        };
      }

      const [slot] = construirHorarios(
        [horario],
        reservasActivas,
        bloqueos ?? [],
        true,
      );
      if (!slot) {
        return { error: "Este horario ya no está disponible." };
      }
      if (slot.cuposDisponibles < cupos) {
        return {
          error: `Solo quedan ${slot.cuposDisponibles} cupos en este horario.`,
        };
      }

      const { error } = await supabase.from("reservas").insert({
        servicio_id: horario.servicio_id,
        negocio_id: negocioId,
        fecha_hora: horario.fecha_hora,
        email_cliente: emailNorm,
        nombre_cliente: nombre,
        cupos,
        estado: pagada ? "pagada" : "pendiente",
        trx_id: generarTrxManual(),
        // `monto_usd` no se envía: el trigger `prepare_booking` lo calcula con el precio real
        // del servicio, así una lectura fallida nunca registra un cobro de $0.
      });
      if (error) return { error: mensajeErrorReservaManual(error) };

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}
