import Stripe from "stripe";
import { isPlaceholder } from "./supabase/config";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * En modo de prueba local (sin STRIPE_SECRET_KEY real) no se
 * inicializa el SDK de Stripe: la Server Action de billing usa en su lugar
 * un flujo de checkout simulado dentro de la propia app (ver
 * `/[slug]/admin/suscripcion/simulado`).
 */
export const isStripeMockMode =
  !stripeSecretKey || isPlaceholder(stripeSecretKey);

export const stripe: Stripe | null = isStripeMockMode
  ? null
  : new Stripe(stripeSecretKey!, {
      apiVersion: "2026-08-26.dahlia",
    });
