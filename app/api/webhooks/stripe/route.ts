import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeMockMode } from "@/lib/stripe";
import {
  createSupabaseStripeWebhookClient, WebhookAuthenticationError, type PrivilegedSupabaseClient,
} from "@/lib/supabase/admin";
import { createDataAccess, DataError } from "@/lib/data/db";
import { revalidarAdmin } from "@/lib/admin/util";
import { revalidarEmpresa } from "@/lib/empresa";
import { registrarSistema } from "@/lib/registro";
import { enviarCorreoTexto } from "@/lib/email";

async function manejarPagoFallido(client: PrivilegedSupabaseClient, customerId: string): Promise<void> {
  const db = createDataAccess(client);
  const negocio = await db.leerUno("negocios", { eq: { stripe_customer_id: customerId } });
  if (!negocio) {
    console.error(`[stripe] Pago fallido sin negocio para customer=${customerId}.`);
    return;
  }
  await db.actualizar("negocios", { estado_suscripcion: "inactiva" }, { id: negocio.id });
  revalidarEmpresa(negocio.slug);
  revalidarAdmin();
  const { data, error } = await client.auth.admin.getUserById(negocio.user_id);
  if (error) throw new DataError(error.message);
  const email = negocio.email_contacto || data.user?.email;
  if (!email) {
    console.error(`[stripe] Falta el correo del negocio ${negocio.id}.`);
    return;
  }
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const sent = await enviarCorreoTexto({
    to: email, asunto: `No pudimos cobrar tu suscripción de ${negocio.nombre}`,
    texto: `Hola, no pudimos procesar el cobro mensual de ${negocio.nombre}. ` +
      `Mientras tanto tu enlace público está desactivado y no recibe reservas.\n\n` +
      `Actualiza tu método de pago para reactivarlo: ${base}/${negocio.slug}/admin/suscripcion`,
  }, client);
  if (!sent) console.error(`[stripe] No se pudo notificar el cobro fallido del negocio ${negocio.id}.`);
}

async function activarSuscripcion(
  client: PrivilegedSupabaseClient, negocioId: string, finPeriodoUnix?: number, customerId?: string,
): Promise<void> {
  const db = createDataAccess(client);
  const proximoCobro = new Date(finPeriodoUnix ? finPeriodoUnix * 1000 : Date.now() + 30 * 86_400_000).toISOString();
  await db.actualizar("negocios", {
    estado_suscripcion: "activa", proximo_cobro: proximoCobro,
    ...(customerId ? { stripe_customer_id: customerId } : {}),
  }, { id: negocioId });
  const negocio = await db.leerUno("negocios", { eq: { id: negocioId } });
  if (negocio) revalidarEmpresa(negocio.slug);
  revalidarAdmin();
}

export async function POST(request: NextRequest) {
  if (isStripeMockMode || !stripe) {
    return NextResponse.json({ error: "Webhook de Stripe deshabilitado en modo simulado." }, { status: 503 });
  }
  let verified: ReturnType<typeof createSupabaseStripeWebhookClient>;
  try {
    verified = createSupabaseStripeWebhookClient(await request.text(), request.headers.get("stripe-signature"));
  } catch (error) {
    console.error("[webhook stripe] Verificación rechazada.", error);
    await registrarSistema({
      tipo: "webhook", origen: "stripe", estado: "error",
      detalle: error instanceof WebhookAuthenticationError ? "Firma inválida" : "Webhook no configurado",
    });
    return NextResponse.json(
      { error: error instanceof WebhookAuthenticationError ? "Firma inválida" : "Webhook no configurado." },
      { status: error instanceof WebhookAuthenticationError ? 400 : 500 },
    );
  }
  const { client, event } = verified;
  const db = createDataAccess(client);
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const negocioId = session.metadata?.negocio_id;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
        if (!negocioId || !customerId) {
          console.error(`[stripe] Checkout ${session.id} sin negocio_id/customer.`);
          break;
        }
        if (session.payment_status === "unpaid") {
          await db.actualizar("negocios", { stripe_customer_id: customerId }, { id: negocioId });
        } else {
          await activarSuscripcion(client, negocioId, undefined, customerId);
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (!customerId) {
          console.error(`[stripe] Invoice ${invoice.id} sin customer.`);
          break;
        }
        const negocio = await db.leerUno("negocios", { eq: { stripe_customer_id: customerId } });
        if (!negocio) {
          console.error(`[stripe] Sin negocio para customer=${customerId}.`);
          break;
        }
        await activarSuscripcion(client, negocio.id, invoice.lines.data[0]?.period.end);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
        if (customerId) await manejarPagoFallido(client, customerId);
        else console.error(`[stripe] Invoice fallida ${invoice.id} sin customer.`);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[webhook stripe] Error al procesar ${event.type}.`, error);
    await registrarSistema({
      tipo: "webhook", origen: "stripe", estado: "error",
      detalle: `${event.type}: ${error instanceof Error ? error.message : "error"}`,
    }, client);
    return NextResponse.json({ error: "Error interno procesando el evento." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
