"use server";

import { redirect } from "next/navigation";
import { revalidarAdmin } from "../lib/admin/util";
import {
  obtenerEmpresaOperativa,
  requerirEmpresa,
  revalidarEmpresa,
} from "../lib/empresa";
import { obtenerConfiguracion, precioDelNegocio } from "../lib/plataforma";
import { rutaPanelEmpresa } from "../lib/rutas-empresa";
import { cambiarSuscripcionSimulada } from "../lib/data/public";
import { stripe, isStripeMockMode } from "../lib/stripe";

async function requerirEmpresaParaFacturacion(slug: string) {
  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) {
    if (ctx.sinSesion) redirect("/login");
    redirect(`${rutaPanelEmpresa(slug, "suscripcion")}?estado=error`);
  }
  return ctx;
}

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
  const [{ user, negocio }, config] = await Promise.all([
    requerirEmpresaParaFacturacion(slug),
    obtenerConfiguracion(),
  ]);

  if (isStripeMockMode || !stripe) {
    if (!config.pagos_simulados) {
      redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
    }
    redirect(
      rutaPanelEmpresa(
        negocio.slug,
        `suscripcion/simulado/${encodeURIComponent(negocio.id)}`,
      ),
    );
  }

  const { plan } = await precioDelNegocio(negocio);
  const priceId = plan.stripe_price_id || process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    console.error("Falta el Stripe Price ID del plan o la variable STRIPE_PRICE_ID.");
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

    // El customer se persiste solo al recibir el evento firmado de Stripe.
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
  const [{ negocio }, config] = await Promise.all([
    requerirEmpresaParaFacturacion(slug),
    obtenerConfiguracion(),
  ]);
  if (!isStripeMockMode || !config.pagos_simulados) {
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }
  try {
    await cambiarSuscripcionSimulada(negocio.id, true);
  } catch (error) {
    console.error("No se pudo activar la suscripción simulada:", error);
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  revalidarEmpresa(negocio.slug);
  revalidarAdmin();
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
  const [{ negocio }, config] = await Promise.all([
    requerirEmpresaParaFacturacion(slug),
    obtenerConfiguracion(),
  ]);
  if (!isStripeMockMode || !config.pagos_simulados) {
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  try {
    await cambiarSuscripcionSimulada(negocio.id, false);
  } catch (error) {
    console.error("No se pudo cancelar la suscripción:", error);
    redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=error`);
  }

  revalidarEmpresa(negocio.slug);
  revalidarAdmin();
  redirect(`${rutaPanelEmpresa(negocio.slug, "suscripcion")}?estado=inactiva`);
}
