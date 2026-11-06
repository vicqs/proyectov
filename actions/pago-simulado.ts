"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { DetalleReservaPublica } from "@/types/database";
import { revalidarAdmin } from "../lib/admin/util";
import { enviarCorreosConfirmacion } from "../lib/email";
import { revalidarEmpresa } from "../lib/empresa";
import {
  cancelarReservaPorToken,
  confirmarReservaSimulada,
  obtenerReservaPorToken,
  reservarConPagoSimulado,
} from "../lib/data/public";
import { DataError } from "../lib/data/db";
import { MONEDA_SCHEMA, normalizarMoneda, type CodigoMoneda } from "../lib/monedas";

async function notificarPago(reserva: DetalleReservaPublica): Promise<boolean> {
  if (!reserva.pago_confirmado_ahora) return false;
  if (!reserva.negocio_email) {
    console.error("[pago simulado] Falta el correo de contacto del negocio.");
    return false;
  }
  const moneda = normalizarMoneda(
    reserva.currency ?? reserva.servicio_currency ?? reserva.negocio_moneda,
    "USD",
  );
  const result = await enviarCorreosConfirmacion({
    negocioNombre: reserva.negocio_nombre,
    negocioLogoUrl: reserva.negocio_logo_url,
    negocioEmail: reserva.negocio_email,
    servicioNombre: reserva.servicio_nombre,
    fechaHora: reserva.fecha_hora,
    montoUsd:
      reserva.monto_usd ??
      reserva.gross_amount ??
      reserva.servicio_precio_usd * (reserva.cupos ?? 1),
    moneda,
    trxId: reserva.trx_id ?? "",
    emailCliente: reserva.email_cliente,
    esItem: reserva.servicio_tipo_unidad === "item",
    cantidad: reserva.cupos ?? 1,
    gestionUrl: reserva.token_gestion
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reserva/${reserva.token_gestion}`
      : undefined,
  });
  if (!result.reciboTuristaOk || !result.alertaPymeOk) {
    console.error(`[pago simulado] Correos incompletos para ${reserva.id}.`, result);
  }
  return result.reciboTuristaOk;
}

export async function confirmarPagoSimuladoAction(reservaId: string, token: string) {
  if (!z.string().uuid().safeParse(token).success) {
    throw new DataError("Enlace de pago inválido.");
  }
  const booking = await obtenerReservaPorToken(token);
  if (!booking || booking.id !== reservaId) {
    throw new DataError("No se encontró la reserva a confirmar.");
  }
  const paid = await confirmarReservaSimulada(token);
  await notificarPago(paid);
  revalidarEmpresa(paid.negocio_slug);
  revalidarAdmin();
  redirect(`/${paid.negocio_slug}?pago=exitoso`);
}

const reservaPublicaSchema = z.object({
  servicioId: z.string().uuid(),
  email: z.string().email().max(254),
  nombre: z.string().trim().min(1).max(100).optional(),
  cupos: z.number().int().min(1).max(50).default(1),
  /** Obligatoria para servicios por cupo; los ítems de venta directa no la usan. */
  fechaHora: z.string().datetime({ offset: true }).optional(),
  moneda: MONEDA_SCHEMA.optional(),
});

export interface ReservaPublicaResultado {
  error?: string;
  trxId?: string;
  tokenGestion?: string;
  reciboEnviado?: boolean;
  montoPagado?: number;
  moneda?: CodigoMoneda;
}

/** La creación y el pago simulado se confirman en una sola transacción SQL. */
export async function reservarYPagarAction(
  datos: z.input<typeof reservaPublicaSchema>,
): Promise<ReservaPublicaResultado> {
  const parsed = reservaPublicaSchema.safeParse(datos);
  if (!parsed.success) return { error: "Datos de reserva inválidos." };
  try {
    const paid = await reservarConPagoSimulado({
      p_service_id: parsed.data.servicioId,
      p_starts_at: parsed.data.fechaHora ?? null,
      p_client_email: parsed.data.email.trim().toLowerCase(),
      p_client_name: parsed.data.nombre ?? null,
      p_quantity: parsed.data.cupos,
      p_currency: parsed.data.moneda ?? null,
    });
    if (!paid.trx_id) {
      throw new DataError("El pago no devolvió una referencia de transacción.");
    }
    const reciboEnviado = await notificarPago(paid);
    revalidarEmpresa(paid.negocio_slug);
    revalidarAdmin();
    return {
      trxId: paid.trx_id,
      tokenGestion: paid.token_gestion ?? undefined,
      reciboEnviado,
      montoPagado: paid.monto_usd ?? paid.gross_amount ?? undefined,
      moneda: normalizarMoneda(paid.currency ?? paid.servicio_currency, "USD"),
    };
  } catch (error) {
    console.error("[reserva pública] No se pudo completar la operación.", error);
    return {
      error:
        error instanceof DataError
          ? error.message
          : "No se pudo completar la reserva. Intenta de nuevo.",
    };
  }
}

/** Si la reserva aún está pendiente de pago, libera el cupo al cancelar el checkout. */
export async function cancelarPagoSimuladoAction(reservaId: string, token: string) {
  if (!z.string().uuid().safeParse(token).success) {
    throw new DataError("Enlace de pago inválido.");
  }
  const booking = await obtenerReservaPorToken(token);
  if (!booking || booking.id !== reservaId) {
    throw new DataError("No se encontró la reserva.");
  }
  if (booking.estado === "pendiente") {
    await cancelarReservaPorToken(token);
    revalidarEmpresa(booking.negocio_slug);
    revalidarAdmin();
  }
  redirect(`/${booking.negocio_slug}?pago=cancelado`);
}
