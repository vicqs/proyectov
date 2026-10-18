"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { enviarCorreosConfirmacion } from "../lib/email";
import { construirHorarios, cuposOcupados } from "../lib/horarios";
import {
  COLUMNAS_OPERATIVIDAD,
  errorReservaNoPermitida,
} from "../lib/reservas-guard";

/**
 * Simula la confirmación de pago de una pasarela real (ej. Tilopay): marca
 * la reserva como "pagada", genera un `trx_id` simulado, dispara los
 * correos de confirmación (mejor esfuerzo, nunca bloquea) y redirige de
 * vuelta a la página pública del negocio con un aviso de éxito.
 */
export async function confirmarPagoSimuladoAction(reservaId: string) {
  const { slug } = await procesarPagoReserva(reservaId);
  redirect(`/${slug}?pago=exitoso`);
}

async function procesarPagoReserva(
  reservaId: string,
): Promise<{ slug: string; trxId: string }> {
  const trxId = `trx_sim_${Date.now()}`;

  const { data: reserva, error: reservaError } = await supabaseAdmin
    .from("reservas")
    .update({ estado: "pagada", trx_id: trxId })
    .eq("id", reservaId)
    .eq("estado", "pendiente")
    .select(
      "id, servicio_id, negocio_id, fecha_hora, email_cliente, estado, trx_id, cupos, token_gestion",
    )
    .single();

  if (reservaError || !reserva) {
    throw new Error("No se encontró la reserva a confirmar.");
  }

  const [{ data: servicio }, { data: negocio }] = await Promise.all([
    supabaseAdmin
      .from("servicios")
      .select("nombre, precio_usd")
      .eq("id", reserva.servicio_id)
      .single(),
    supabaseAdmin
      .from("negocios")
      .select("slug, nombre, logo_url, user_id")
      .eq("id", reserva.negocio_id)
      .single(),
  ]);

  if (servicio && negocio) {
    await supabaseAdmin
      .from("reservas")
      .update({ monto_usd: servicio.precio_usd * (reserva.cupos ?? 1) })
      .eq("id", reserva.id);

    const { data: negocioAuthUser } =
      await supabaseAdmin.auth.admin.getUserById(negocio.user_id);
    const negocioEmail = negocioAuthUser?.user?.email;

    if (negocioEmail) {
      const resultado = await enviarCorreosConfirmacion({
        negocioNombre: negocio.nombre,
        negocioLogoUrl: negocio.logo_url,
        negocioEmail,
        servicioNombre: servicio.nombre,
        fechaHora: reserva.fecha_hora,
        montoUsd: servicio.precio_usd * (reserva.cupos ?? 1),
        trxId: reserva.trx_id ?? "N/A",
        emailCliente: reserva.email_cliente,
        gestionUrl: reserva.token_gestion
          ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reserva/${reserva.token_gestion}`
          : undefined,
      });

      if (!resultado.reciboTuristaOk || !resultado.alertaPymeOk) {
        console.error(
          `Envío de correos incompleto para la reserva ${reserva.id}:`,
          resultado,
        );
      }
    }
  }

  return { slug: negocio?.slug ?? "", trxId };
}

const reservaPublicaSchema = z.object({
  servicioId: z.string().uuid(),
  email: z.string().email(),
  nombre: z.string().trim().min(1).max(100).optional(),
  cupos: z.number().int().min(1).max(50).default(1),
  fechaHora: z.string().datetime(),
});

export interface ReservaPublicaResultado {
  error?: string;
  trxId?: string;
}

/**
 * Flujo del perfil público: valida horario, cupos y suscripción, crea la
 * reserva y registra el pago simulado en un solo paso (sin redirección).
 */
export async function reservarYPagarAction(
  datos: z.input<typeof reservaPublicaSchema>,
): Promise<ReservaPublicaResultado> {
  const parsed = reservaPublicaSchema.safeParse(datos);
  if (!parsed.success) return { error: "Datos de reserva inválidos." };
  const { servicioId, email, fechaHora, nombre, cupos } = parsed.data;
  const emailNorm = email.trim().toLowerCase();

  const { data: servicio } = await supabaseAdmin
    .from("servicios")
    .select("id, negocio_id")
    .eq("id", servicioId)
    .single();
  if (!servicio) return { error: "Servicio no encontrado." };

  const { data: negocio } = await supabaseAdmin
    .from("negocios")
    .select(COLUMNAS_OPERATIVIDAD)
    .eq("id", servicio.negocio_id)
    .single();
  if (!negocio) return { error: "Este negocio no acepta reservas por ahora." };
  const bloqueo = await errorReservaNoPermitida(negocio);
  if (bloqueo) return { error: bloqueo };

  const [{ data: reservas }, { data: bloqueos }, { data: horariosDb }] =
    await Promise.all([
      supabaseAdmin.from("reservas").select("*").eq("negocio_id", negocio.id),
      supabaseAdmin
        .from("bloqueos_excepcion")
        .select("*")
        .eq("negocio_id", negocio.id),
      supabaseAdmin.from("horarios").select("*").eq("negocio_id", negocio.id),
    ]);

  if (
    (reservas ?? []).some(
      (r) =>
        r.estado !== "cancelada" &&
        r.servicio_id === servicioId &&
        r.email_cliente.trim().toLowerCase() === emailNorm,
    )
  ) {
    return { error: "Este correo ya tiene una reserva para este servicio." };
  }

  const slot = construirHorarios(
    (horariosDb ?? []).filter((h) => h.servicio_id === servicioId),
    reservas ?? [],
    bloqueos ?? [],
    true,
  ).find(
    (h) => new Date(h.fechaHora).getTime() === new Date(fechaHora).getTime(),
  );
  if (!slot) return { error: "El horario ya no está disponible." };
  if (slot.cuposDisponibles <= 0)
    return { error: "Este horario está agotado." };
  if (cupos > slot.cuposDisponibles)
    return {
      error: `Solo quedan ${slot.cuposDisponibles} cupos en este horario.`,
    };

  const { data: reserva, error: reservaError } = await supabaseAdmin
    .from("reservas")
    .insert({
      servicio_id: servicioId,
      negocio_id: negocio.id,
      fecha_hora: slot.fechaHora,
      email_cliente: emailNorm,
      nombre_cliente: nombre ?? null,
      cupos,
      token_gestion: crypto.randomUUID(),
      estado: "pendiente",
    })
    .select("id")
    .single();
  if (reservaError || !reserva) {
    return { error: "No se pudo crear la reserva. Intenta de nuevo." };
  }

  // Verificación posterior a la inserción: si dos personas reservaron a la
  // vez y se superó el cupo, se deshace esta reserva en lugar de sobrevender.
  const { data: reservasDespues } = await supabaseAdmin
    .from("reservas")
    .select("*")
    .eq("negocio_id", negocio.id);
  if (
    cuposOcupados(reservasDespues ?? [], servicioId, slot.fechaHora) >
    slot.cuposTotales
  ) {
    await supabaseAdmin.from("reservas").delete().eq("id", reserva.id);
    return { error: "Este horario se agotó mientras reservabas." };
  }

  try {
    const { trxId } = await procesarPagoReserva(reserva.id);
    return { trxId };
  } catch {
    // No dejar una reserva pendiente que bloquee cupos y el correo del cliente.
    await supabaseAdmin.from("reservas").delete().eq("id", reserva.id);
    return { error: "No se pudo confirmar el pago. Intenta de nuevo." };
  }
}

/**
 * Simula la cancelación del pago desde la pasarela: deja la reserva en
 * estado "pendiente" y redirige de vuelta al negocio con un aviso.
 */
export async function cancelarPagoSimuladoAction(reservaId: string) {
  const { data: reserva } = await supabaseAdmin
    .from("reservas")
    .select("negocio_id")
    .eq("id", reservaId)
    .single();

  const { data: negocio } = reserva
    ? await supabaseAdmin
        .from("negocios")
        .select("slug")
        .eq("id", reserva.negocio_id)
        .single()
    : { data: null };

  redirect(`/${negocio?.slug ?? ""}?pago=cancelado`);
}
