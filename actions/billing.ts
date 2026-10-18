"use server";

import { redirect } from "next/navigation";
import { requerirEmpresa, revalidarEmpresa } from "../lib/empresa";
import { rutaPanelEmpresa } from "../lib/rutas-empresa";
import { supabaseAdmin } from "../lib/supabase";
import { stripe, isStripeMockMode } from "../lib/stripe";

function obtenerAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/+$/,
    "",
  );
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
export async function crearCheckoutSuscripcionAction(
  slug: string,
): Promise<never> {
  const { user, negocio } = await requerirEmpresa(slug);

  if (isStripeMockMode || !stripe) {
    redirect(
      rutaPanelEmpresa(
        negocio.slug,
        `suscripcion/simulado/${encodeURIComponent(negocio.id)}`,
      ),
    );
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error("Falta la variable de entorno STRIPE_PRICE_ID.");
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
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
    success_url: `${appUrl}${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=activa`,
    cancel_url: `${appUrl}${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=cancelado`,
    metadata: { negocio_id: negocio.id },
  });

  if (!session.url) {
    console.error("Stripe no devolvió una URL de checkout válida.");
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  redirect(session.url);
}

/**
 * Confirma la activación simulada de la suscripción (equivalente al webhook
 * real de Stripe `checkout.session.completed`/`invoice.paid`), solo
 * disponible en modo simulado. Marca `estado_suscripcion` como 'activa'.
 */
export async function confirmarSuscripcionSimuladaAction(
  slug: string,
): Promise<never> {
  const { negocio, user } = await requerirEmpresa(slug);
  if (!isStripeMockMode) {
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }
  const { error } = await supabaseAdmin
    .from("negocios")
    .update({
      estado_suscripcion: "activa",
      proximo_cobro: new Date(Date.now() + 30 * 86_400_000).toISOString(),
      stripe_customer_id: `mock_cus_${negocio.id}`,
    })
    .eq("id", negocio.id)
    .eq("user_id", user.id);

  if (error) {
    console.error("No se pudo activar la suscripción simulada:", error.message);
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  revalidarEmpresa(negocio.slug);
  redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=activa`);
}

/** Cancela el flujo de suscripción simulada sin activar nada. */
export async function cancelarSuscripcionSimuladaAction(
  slug: string,
): Promise<never> {
  const { negocio } = await requerirEmpresa(slug);
  redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=cancelado`);
}

/**
 * Cancela la suscripción activa del negocio autenticado (simula un impago).
 * Solo disponible en modo simulado; con Stripe real la cancelación se
 * gestiona desde el portal de facturación de Stripe.
 */
export async function cancelarSuscripcionActivaAction(
  slug: string,
): Promise<never> {
  const { negocio, user } = await requerirEmpresa(slug);
  if (!isStripeMockMode) {
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  const { error } = await supabaseAdmin
    .from("negocios")
    .update({ estado_suscripcion: "inactiva" })
    .eq("id", negocio.id)
    .eq("user_id", user.id);
  if (error) {
    console.error("No se pudo cancelar la suscripción:", error.message);
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  revalidarEmpresa(negocio.slug);
  redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=inactiva`);
}
