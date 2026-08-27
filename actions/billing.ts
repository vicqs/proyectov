"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { supabaseAdmin } from "../lib/supabase";
import { stripe, isStripeMockMode } from "../lib/stripe";
import type { Negocio } from "../types/database";

const PRECIO_SUSCRIPCION_USD = 15;

function obtenerAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/**
 * Crea (o reutiliza) la sesión de checkout de Stripe para cobrar la
 * suscripción mensual del software ($15 USD) a la pyme dueña del negocio
 * autenticado. Requiere sesión activa de Supabase Auth.
 *
 * En modo simulado (sin `STRIPE_SECRET_KEY` real o sin Supabase real) no se
 * llama a la API de Stripe: se redirige a una pantalla de checkout simulada
 * dentro de la propia app, que al confirmar activa la suscripción igual que
 * lo haría el webhook real de Stripe.
 */
export async function crearCheckoutSuscripcionAction(): Promise<never> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: negocioData, error: negocioError } = await supabase
    .from("negocios")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (negocioError || !negocioData) {
    throw new Error("No se encontró el negocio asociado a este usuario.");
  }

  const negocio = negocioData as Negocio;

  if (isStripeMockMode || !stripe) {
    redirect(`/admin/suscripcion/simulado/${negocio.id}`);
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("Falta la variable de entorno STRIPE_PRICE_ID.");
  }

  // Stripe requiere un Customer para asociar la suscripción; se crea una
  // sola vez y se guarda en `negocios.stripe_customer_id` para reutilizarlo.
  let stripeCustomerId = negocio.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: negocio.nombre,
      metadata: { negocio_id: negocio.id },
    });
    stripeCustomerId = customer.id;

    await supabaseAdmin
      .from("negocios")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("id", negocio.id);
  }

  const appUrl = obtenerAppUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId,
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/admin/suscripcion?estado=activa`,
    cancel_url: `${appUrl}/admin/suscripcion?estado=cancelado`,
    metadata: { negocio_id: negocio.id },
  });

  if (!session.url) {
    throw new Error("Stripe no devolvió una URL de checkout válida.");
  }

  redirect(session.url);
}

/**
 * Confirma la activación simulada de la suscripción (equivalente al webhook
 * real de Stripe `checkout.session.completed`/`invoice.paid`), solo
 * disponible en modo simulado. Marca `estado_suscripcion` como 'activa'.
 */
export async function confirmarSuscripcionSimuladaAction(
  negocioId: string,
): Promise<never> {
  if (!isStripeMockMode) {
    throw new Error(
      "Esta acción solo está disponible en modo simulado (sin Stripe real).",
    );
  }

  const { error } = await supabaseAdmin
    .from("negocios")
    .update({
      estado_suscripcion: "activa",
      stripe_customer_id: `mock_cus_${negocioId}`,
    })
    .eq("id", negocioId);

  if (error) {
    throw new Error("No se pudo activar la suscripción simulada.");
  }

  redirect("/admin/suscripcion?estado=activa");
}

/** Cancela el flujo de suscripción simulada sin activar nada. */
export async function cancelarSuscripcionSimuladaAction(): Promise<never> {
  redirect("/admin/suscripcion?estado=cancelado");
}
