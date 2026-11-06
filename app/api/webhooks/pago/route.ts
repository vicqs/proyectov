import { NextRequest, NextResponse, after } from "next/server";
import {
  createSupabasePaymentWebhookClient, WebhookAuthenticationError, type PrivilegedSupabaseClient,
} from "@/lib/supabase/admin";
import { revalidarAdmin } from "@/lib/admin/util";
import { enviarCorreosConfirmacion } from "@/lib/email";
import { revalidarEmpresa } from "@/lib/empresa";
import { normalizarMoneda } from "@/lib/monedas";
import { registrarSistema } from "@/lib/registro";
import { DataError } from "@/lib/data/db";
import { normalizarWebhookPago, type WebhookPagoNormalizado } from "@/lib/tilopay";

export async function POST(request: NextRequest) {
  let verifiedClient: PrivilegedSupabaseClient | undefined;
  let validatedPayload: WebhookPagoNormalizado | undefined;
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-tilopay-signature") ?? request.headers.get("x-signature");
    const client = createSupabasePaymentWebhookClient(rawBody, signature);
    verifiedClient = client;
    const body: unknown = JSON.parse(rawBody);
    const parsed = normalizarWebhookPago(body);
    if (!parsed.success) {
      await registrarSistema({
        tipo: "webhook", origen: "pago", estado: "error", detalle: "Payload inválido",
      }, client);
      return NextResponse.json({ error: "Payload inválido", detalles: parsed.error.flatten() }, { status: 400 });
    }
    validatedPayload = parsed.data;
    const { reserva_id, estado, trx_id } = validatedPayload;
    const { data, error } = await client.rpc("record_gateway_payment", {
      p_booking_id: reserva_id, p_status: estado, p_transaction_ref: trx_id ?? null,
    });
    if (error) throw new DataError(error.message, error.code);
    const reserva = data?.[0];
    if (!reserva) throw new DataError("La confirmación no devolvió la reserva.");
    if (reserva.pago_confirmado_ahora) {
      if (!reserva.negocio_email || !reserva.trx_id || reserva.monto_usd == null) {
        console.error(`[webhook pago] Datos de notificación incompletos para ${reserva.id}.`);
      } else {
        const negocioEmail = reserva.negocio_email;
        const reference = reserva.trx_id;
        const amount = reserva.monto_usd;
        const moneda = normalizarMoneda(
          reserva.currency ?? reserva.servicio_currency ?? reserva.negocio_moneda,
          "USD",
        );
        after(async () => {
          const result = await enviarCorreosConfirmacion({
            negocioNombre: reserva.negocio_nombre, negocioLogoUrl: reserva.negocio_logo_url,
            negocioEmail, servicioNombre: reserva.servicio_nombre, fechaHora: reserva.fecha_hora,
            montoUsd: amount, moneda, trxId: reference, emailCliente: reserva.email_cliente,
            gestionUrl: reserva.token_gestion
              ? `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/reserva/${reserva.token_gestion}`
              : undefined,
          }, client);
          if (!result.reciboTuristaOk || !result.alertaPymeOk) {
            console.error(`[webhook pago] Correos incompletos para ${reserva.id}.`, result);
          }
        });
      }
    }
    revalidarEmpresa(reserva.negocio_slug);
    revalidarAdmin();
    return NextResponse.json({ ok: true, reserva_id: reserva.id });
  } catch (error) {
    const detalle = error instanceof SyntaxError
      ? "JSON inválido."
      : error instanceof Error ? error.message : "Error interno";
    console.error("[webhook pago]", error instanceof SyntaxError ? detalle : error);
    await registrarSistema({
      tipo: "webhook", origen: "pago", estado: "error",
      detalle,
      payload: validatedPayload,
    }, verifiedClient);
    if (error instanceof WebhookAuthenticationError) {
      return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
    }
    if (error instanceof SyntaxError) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    if (error instanceof DataError) {
      if (error.code === "P0002") return NextResponse.json({ error: error.message }, { status: 404 });
      if (["P0001", "23505", "23514"].includes(error.code ?? "")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
      if (error.code === "22023") return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
