"use server";

import { redirect } from "next/navigation";
import { supabaseAdmin } from "../lib/supabase";
import { enviarCorreosConfirmacion } from "../lib/email";

/**
 * Simula la confirmación de pago de una pasarela real (ej. Tilopay): marca
 * la reserva como "pagada", genera un `trx_id` simulado, dispara los
 * correos de confirmación (mejor esfuerzo, nunca bloquea) y redirige de
 * vuelta a la página pública del negocio con un aviso de éxito.
 */
export async function confirmarPagoSimuladoAction(reservaId: string) {
  const trxId = `trx_sim_${Date.now()}`;

  const { data: reserva, error: reservaError } = await supabaseAdmin
    .from("reservas")
    .update({ estado: "pagada", trx_id: trxId })
    .eq("id", reservaId)
    .select(
      "id, servicio_id, negocio_id, fecha_hora, email_cliente, estado, trx_id",
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
        montoUsd: servicio.precio_usd,
        trxId: reserva.trx_id ?? "N/A",
        emailCliente: reserva.email_cliente,
      });

      if (!resultado.reciboTuristaOk || !resultado.alertaPymeOk) {
        console.error(
          `Envío de correos incompleto para la reserva ${reserva.id}:`,
          resultado,
        );
      }
    }
  }

  redirect(`/${negocio?.slug ?? ""}?pago=exitoso`);
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
