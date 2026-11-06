"use server";

import { revalidatePath } from "next/cache";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, leerUno } from "../../lib/admin/db";
import { esUuid, revalidarAdmin } from "../../lib/admin/util";
import { revalidarEmpresa } from "../../lib/empresa";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import { DataError } from "../../lib/data/db";
import { normalizarWebhookPago } from "../../lib/tilopay";

export async function resolverRegistroAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("sistema", async (admin) => {
    if (!esUuid(id)) return { error: "Identificador de registro inválido." };
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
    if (!esUuid(id)) return { error: "Identificador de registro inválido." };
    const registro = await leerUno("registro_sistema", { eq: { id } });
    if (
      !registro ||
      registro.tipo !== "webhook" ||
      registro.origen !== "pago"
    ) {
      return { error: "Solo se pueden reprocesar webhooks de pago." };
    }
    const payload = normalizarWebhookPago(registro.payload);
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
    const client = await createSupabaseAdminClient();
    const { data, error } = await client.rpc("record_gateway_payment", {
      p_booking_id: reserva.id, p_status: payload.data.estado,
      p_transaction_ref: payload.data.trx_id ?? null,
    });
    if (error) throw new DataError(error.message, error.code);
    const confirmada = data?.[0];
    await actualizar("registro_sistema", { resuelto: true }, { id });
    await registrarAuditoria(admin, {
      accion: "sistema.reprocesar_webhook",
      entidad: "reserva",
      entidad_id: reserva.id,
      negocio_id: reserva.negocio_id,
    });
    if (confirmada?.negocio_slug) {
      revalidarEmpresa(confirmada.negocio_slug);
    } else {
      const negocio = await leerUno("negocios", { eq: { id: reserva.negocio_id } });
      if (negocio) revalidarEmpresa(negocio.slug);
    }
    if (confirmada?.token_gestion) {
      revalidatePath(`/reserva/${confirmada.token_gestion}`);
    }
    revalidarAdmin();
    return { ok: "Webhook reprocesado. Los correos no se reenvían." };
  });
}
