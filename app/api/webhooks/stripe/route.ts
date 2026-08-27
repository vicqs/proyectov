import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeMockMode } from "../../../../lib/stripe";
import { supabaseAdmin } from "../../../../lib/supabase";

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Activa la suscripción del negocio correspondiente en Supabase. Se usa
 * tanto para `checkout.session.completed` (primer pago) como para
 * `invoice.paid` (renovaciones mensuales).
 */
async function activarSuscripcion(negocioId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("negocios")
    .update({ estado_suscripcion: "activa" })
    .eq("id", negocioId);

  if (error) {
    console.error(
      `No se pudo activar la suscripción del negocio ${negocioId}:`,
      error,
    );
  }
}

/** Busca el negocio_id a partir de un stripe_customer_id (usado en invoice.paid). */
async function buscarNegocioIdPorCustomer(
  customerId: string,
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("negocios")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (error || !data) {
    return null;
  }
  return data.id;
}

/**
 * Webhook de suscripciones de Stripe. Verifica la firma del evento con
 * `stripe.webhooks.constructEvent` (usando el cuerpo crudo, requisito de
 * Stripe) y actualiza `negocios.estado_suscripcion` a 'activa' cuando el
 * pago de la suscripción se confirma.
 */
export async function POST(request: NextRequest) {
  if (isStripeMockMode || !stripe) {
    // En modo simulado este webhook no se usa: la activación ocurre
    // directamente vía Server Action (ver actions/billing.ts).
    return NextResponse.json(
      { error: "Webhook de Stripe deshabilitado en modo simulado." },
      { status: 503 },
    );
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET no está configurado.");
    return NextResponse.json(
      { error: "Webhook no configurado." },
      { status: 500 },
    );
  }

  const rawBody = await request.text();
  const firma = request.headers.get("stripe-signature");

  if (!firma) {
    return NextResponse.json(
      { error: "Falta el header stripe-signature." },
      { status: 400 },
    );
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      firma,
      STRIPE_WEBHOOK_SECRET,
    );
  } catch (error) {
    console.error("Firma de webhook de Stripe inválida:", error);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const negocioId = session.metadata?.negocio_id;

        if (!negocioId) {
          console.error(
            "checkout.session.completed sin metadata.negocio_id:",
            session.id,
          );
          break;
        }

        await activarSuscripcion(negocioId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) {
          console.error("invoice.paid sin customer:", invoice.id);
          break;
        }

        const negocioId = await buscarNegocioIdPorCustomer(customerId);
        if (!negocioId) {
          console.error(
            `No se encontró negocio para stripe_customer_id=${customerId}`,
          );
          break;
        }

        await activarSuscripcion(negocioId);
        break;
      }

      default:
        // Otros eventos (ej. invoice.payment_failed) no requieren acción
        // por ahora, pero se reconocen sin error para evitar reintentos.
        break;
    }
  } catch (error) {
    console.error(`Error procesando el evento de Stripe ${event.type}:`, error);
    return NextResponse.json(
      { error: "Error interno procesando el evento." },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
