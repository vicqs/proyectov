"use server";

import { z } from "zod";
import { obtenerEmpresaOperativa, revalidarEmpresa } from "../lib/empresa";
import { construirHorarios } from "../lib/horarios";
import { generarTrxManual } from "../lib/pagos";

export interface ReservaActionResult {
  error?: string;
  success?: boolean;
}

/**
 * Cancela una reserva del negocio autenticado. La reserva se conserva con
 * estado "cancelada" (historial) y libera sus cupos automáticamente.
 */
export async function cancelarReservaAction(
  slug: string,
  reservaId: string,
): Promise<ReservaActionResult> {
  if (!z.string().min(1).safeParse(reservaId).success) {
    return { error: "Reserva inválida." };
  }
  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, negocio } = ctx;
  const negocioId = negocio.id;

  const { data: reserva } = await supabase
    .from("reservas")
    .select("id, estado")
    .eq("id", reservaId)
    .eq("negocio_id", negocioId)
    .single();
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
  return { success: true };
}

const manualSchema = z.object({
  horarioId: z.string().min(1, "Horario inválido"),
  nombre: z.string().trim().min(1, "Ingresa el nombre").max(100),
  email: z.string().trim().email("Correo inválido"),
  cupos: z.number().int().min(1, "Mínimo 1 cupo").max(50),
  pagada: z.boolean(),
});

/**
 * Registra una reserva manual (cliente que llama o escribe por WhatsApp).
 * Respeta cupos y duplicados igual que el flujo público, pero sin cobro ni
 * correos: se marca como pagada solo si el dueño ya recibió el dinero.
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

  const { data: reservas } = await supabase
    .from("reservas")
    .select("*")
    .eq("negocio_id", negocioId);

  if (
    (reservas ?? []).some(
      (r) =>
        r.estado !== "cancelada" &&
        r.servicio_id === horario.servicio_id &&
        r.email_cliente.trim().toLowerCase() === emailNorm,
    )
  ) {
    return { error: "Este correo ya tiene una reserva para este servicio." };
  }

  const [slot] = construirHorarios([horario], reservas ?? [], []);
  if (!slot || slot.cuposDisponibles < cupos) {
    return {
      error: `Solo quedan ${slot?.cuposDisponibles ?? 0} cupos en este horario.`,
    };
  }

  const { data: servicioReserva } = await supabase
    .from("servicios")
    .select("precio_usd")
    .eq("id", horario.servicio_id)
    .single();

  const { error } = await supabase.from("reservas").insert({
    servicio_id: horario.servicio_id,
    negocio_id: negocioId,
    fecha_hora: horario.fecha_hora,
    email_cliente: emailNorm,
    nombre_cliente: nombre,
    cupos,
    estado: pagada ? "pagada" : "pendiente",
    trx_id: pagada ? generarTrxManual() : null,
    monto_usd: pagada ? (servicioReserva?.precio_usd ?? 0) * cupos : null,
  });
  if (error) return { error: "No se pudo crear la reserva." };

  revalidarEmpresa(negocio.slug);
  return { success: true };
}
