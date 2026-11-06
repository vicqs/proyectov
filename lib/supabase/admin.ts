import "server-only";

import { cache } from "react";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { obtenerAdminAutenticado } from "../admin/auth";
import { stripe, isStripeMockMode } from "../stripe";
import { getSupabasePublicConfig, isPlaceholder } from "./config";

function createServiceRoleClient() {
  const config = getSupabasePublicConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!config || !key || isPlaceholder(key)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY es requerida para la administracion y los webhooks verificados.");
  }
  return createClient<Database>(config.url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export const createSupabaseAdminClient = cache(async () => {
  if (!(await obtenerAdminAutenticado())) {
    throw new Error("Se requiere una sesion de administracion valida.");
  }
  return createServiceRoleClient();
});

export class WebhookAuthenticationError extends Error {}

export function createSupabasePaymentWebhookClient(rawBody: string, signature: string | null) {
  const secret = process.env.TILOPAY_WEBHOOK_SECRET || process.env.PAGO_WEBHOOK_SECRET;
  if (!secret || isPlaceholder(secret)) {
    throw new Error("PAGO_WEBHOOK_SECRET o TILOPAY_WEBHOOK_SECRET no esta configurado.");
  }
  const normalizedSig = signature?.trim().replace(/^sha256=/i, "").toLowerCase() ?? "";
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!/^[0-9a-f]{64}$/.test(normalizedSig) ||
    !timingSafeEqual(Buffer.from(normalizedSig), Buffer.from(expected))) {
    throw new WebhookAuthenticationError("Firma de pago invalida.");
  }
  return createServiceRoleClient();
}

export function createSupabaseStripeWebhookClient(rawBody: string, signature: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (isStripeMockMode || !stripe || !secret || isPlaceholder(secret)) {
    throw new Error("El webhook de Stripe no esta configurado.");
  }
  if (!signature) throw new WebhookAuthenticationError("Falta la firma de Stripe.");
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    console.error("[stripe] Firma rechazada.", error instanceof Error ? error.name : "error");
    throw new WebhookAuthenticationError("Firma de Stripe invalida.");
  }
  return { client: createServiceRoleClient(), event };
}

export type PrivilegedSupabaseClient = ReturnType<typeof createServiceRoleClient>;
