import Stripe from "stripe";
import { isMockMode } from "./mock/client";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

/**
 * En modo simulado (sin credenciales reales de Supabase/Stripe) no se
 * inicializa el SDK de Stripe: la Server Action de billing usa en su lugar
 * un flujo de checkout simulado dentro de la propia app (ver
 * `/admin/suscripcion/simulado`).
 */
export const isStripeMockMode = isMockMode || !stripeSecretKey;

if (!isStripeMockMode && !stripeSecretKey) {
  throw new Error("Falta la variable de entorno STRIPE_SECRET_KEY.");
}

export const stripe: Stripe | null = isStripeMockMode
  ? null
  : new Stripe(stripeSecretKey!, {
      apiVersion: "2026-08-26.dahlia",
    });
