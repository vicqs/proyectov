"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, leerUno } from "../../lib/admin/db";
import { revalidarAdmin } from "../../lib/admin/util";
import { esPagoManual } from "../../lib/pagos";
import { supabaseAdmin } from "../../lib/supabase";

export async function resolverRegistroAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("sistema", async (admin) => {
    await actualizar("registro_sistema", { resuelto: true }, { id });
    await registrarAuditoria(admin, {
      accion: "sistema.resolver",
      entidad: "registro_sistema",
      entidad_id: id,
    });
    revalidarAdmin();
    return { ok: "Marcado como resuelto." };
  });
}

const payloadPago = z.object({
  reserva_id: z.string().uuid(),
  estado: z.enum(["pendiente", "pagada"]),
  trx_id: z
    .string()
    .refine((v) => !esPagoManual(v), "Prefijo trx_id reservado")
    .nullable()
    .optional(),
});

/**
 * Reintenta aplicar un webhook de pago fallido. Es idempotente: no revive
 * reservas canceladas y no reenvía correos (eso solo ocurre en el webhook real).
 */
export async function reprocesarWebhookAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("sistema", async (admin) => {
    const registro = await leerUno("registro_sistema", { eq: { id } });
    if (
      !registro ||
      registro.tipo !== "webhook" ||
      registro.origen !== "pago"
    ) {
      return { error: "Solo se pueden reprocesar webhooks de pago." };
    }
    const payload = payloadPago.safeParse(registro.payload);
    if (!payload.success)
      return { error: "El registro no conserva datos suficientes." };

    const reserva = await leerUno("reservas", {
      eq: { id: payload.data.reserva_id },
    });
    if (!reserva) return { error: "La reserva ya no existe." };
    if (reserva.estado === "cancelada") {
      return {
        error: "La reserva está cancelada: gestiona el reembolso en Reservas.",
      };
    }
    const { error } = await supabaseAdmin
      .from("reservas")
      .update({
        estado: payload.data.estado,
        trx_id: payload.data.trx_id ?? null,
      })
      .eq("id", reserva.id);
    if (error) return { error: error.message };
    await actualizar("registro_sistema", { resuelto: true }, { id });
    await registrarAuditoria(admin, {
      accion: "sistema.reprocesar_webhook",
      entidad: "reserva",
      entidad_id: reserva.id,
      negocio_id: reserva.negocio_id,
    });
    revalidarAdmin();
    return { ok: "Webhook reprocesado. Los correos no se reenvían." };
  });
}
