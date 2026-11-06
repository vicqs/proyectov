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
import { MONEDA_SCHEMA, normalizarMoneda } from "../lib/monedas";
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

const manualSchema = z
  .object({
    /** Reserva por cupos: horario publicado. */
    horarioId: z.string().uuid("Horario inválido").optional(),
    /** Venta directa de ítems: servicio con `unit_type = 'item'`. */
    servicioId: z.string().uuid("Servicio inválido").optional(),
    nombre: z.string().trim().min(1, "Ingresa el nombre").max(100),
    email: z.union([
      z.literal(""),
      z
        .string()
        .trim()
        .email("Correo inválido")
        .max(254, "Correo demasiado largo"),
    ]),
    cupos: z.number().int().min(1, "Mínimo 1").max(50),
    pagada: z.boolean(),
    moneda: MONEDA_SCHEMA.optional(),
  })
  .refine((d) => Boolean(d.horarioId) !== Boolean(d.servicioId), {
    message: "Selecciona un horario o un ítem.",
    path: ["horarioId"],
  });

/** Traduce los errores de las restricciones y triggers de `bookings` a mensajes para el negocio. */
function mensajeErrorReservaManual(
  error: {
    code?: string;
    message: string;
  },
  esItem = false,
): string {
  if (error.code === "23505")
    return "Este correo ya tiene una reserva para este servicio.";
  if (error.code === "23514")
    return esItem
      ? "No quedan suficientes unidades disponibles."
      : "El horario se agotó o no admite esa cantidad de cupos.";
  if (/horario no esta disponible/i.test(error.message)) {
    return "Este horario ya no está disponible.";
  }
  return "No se pudo crear la reserva.";
}

/**
 * Registra una venta/reserva manual (cliente que llama, escribe por WhatsApp o compra en
 * una feria). Con `horarioId` respeta cupos, bloqueos y duplicados igual que el flujo público;
 * con `servicioId` (ítems) descuenta stock al instante. Sin cobro ni correos de pasarela: se
 * identifica siempre con prefijo `manual_` y se marca como pagada solo si el dueño ya recibió
 * el dinero.
 *
 * Las validaciones previas son solo para dar mensajes claros: la fuente de verdad es el
 * trigger `prepare_booking`, que bloquea el horario/servicio y revalida cupos, stock,
 * bloqueos y duplicados. El monto cobrado lo fija ese trigger con el precio vigente del servicio.
 */
export async function crearReservaManualAction(
  slug: string,
  datos: z.input<typeof manualSchema>,
): Promise<ReservaActionResult> {
  const parsed = manualSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const { horarioId, servicioId, nombre, email, cupos, pagada, moneda } =
    parsed.data;
  const emailNorm = email.toLowerCase();

  return accionEmpresa(
    slug,
    "No se pudo crear la reserva. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const negocioId = negocio.id;

      if (servicioId) {
        const { data: servicioItem, error: itemError } = await supabase
          .from("servicios")
          .select("id, unit_type, stock, currency")
          .eq("id", servicioId)
          .eq("negocio_id", negocioId)
          .maybeSingle();
        if (itemError) {
          return {
            error: "No se pudo verificar el ítem. Intenta de nuevo.",
          };
        }
        if (!servicioItem) return { error: "El ítem no existe." };
        if (servicioItem.unit_type !== "item") {
          return { error: "Este servicio se reserva por horario." };
        }
        const disponibles = servicioItem.stock ?? 0;
        if (disponibles < cupos) {
          return {
            error:
              disponibles <= 0
                ? "Este ítem está agotado."
                : `Solo quedan ${disponibles} unidades disponibles.`,
          };
        }
        const monedaItem = normalizarMoneda(
          moneda ?? servicioItem.currency ?? negocio.moneda,
          "USD",
        );
        const { error: errorVenta } = await supabase.from("reservas").insert({
          servicio_id: servicioItem.id,
          negocio_id: negocioId,
          fecha_hora: new Date().toISOString(),
          email_cliente: emailNorm,
          nombre_cliente: nombre,
          cupos,
          estado: pagada ? "pagada" : "pendiente",
          trx_id: generarTrxManual(),
          currency: monedaItem,
        });
        if (errorVenta) {
          return { error: mensajeErrorReservaManual(errorVenta, true) };
        }
        revalidarEmpresa(negocio.slug);
        revalidarAdmin();
        return { success: true };
      }

      const { data: horario, error: horarioError } = await supabase
        .from("horarios")
        .select("id, negocio_id, servicio_id, fecha_hora, cupos_totales")
        .eq("id", horarioId as string)
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
        { data: servicio, error: servicioError },
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
        supabase
          .from("servicios")
          .select("currency")
          .eq("id", horario.servicio_id)
          .eq("negocio_id", negocioId)
          .maybeSingle(),
      ]);
      // Si alguna lectura falla no se asume "sin reservas" ni "sin bloqueos": se aborta.
      if (reservasError || bloqueosError || servicioError) {
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
        emailNorm &&
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

      const monedaEfectiva = normalizarMoneda(
        moneda ?? servicio?.currency ?? negocio.moneda,
        "USD",
      );

      const { error } = await supabase.from("reservas").insert({
        servicio_id: horario.servicio_id,
        negocio_id: negocioId,
        fecha_hora: horario.fecha_hora,
        email_cliente: emailNorm,
        nombre_cliente: nombre,
        cupos,
        estado: pagada ? "pagada" : "pendiente",
        trx_id: generarTrxManual(),
        currency: monedaEfectiva,
        // `monto_usd` no se envía: el trigger `prepare_booking` lo calcula con el precio real
        // del servicio convertido a `currency`, así una lectura fallida nunca registra $0.
      });
      if (error) return { error: mensajeErrorReservaManual(error) };

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}
