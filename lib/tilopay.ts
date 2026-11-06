import "server-only";

import { z } from "zod";
import type { ConfiguracionPlataforma, DetalleReservaPublica } from "@/types/database";
import { DataError } from "./data/db";
import { convertirMoneda, normalizarMoneda } from "./monedas";
import { esPagoManual } from "./pagos";
import { isPlaceholder } from "./supabase/config";

export type ProveedorPasarelaReservas = "tilopay" | "simulado" | "deshabilitado";

export interface ConfiguracionTilopay {
  apiUrl: string;
  apiKey: string;
  apiUser: string;
  apiPassword: string;
}

const DEFAULT_TILOPAY_API_URL = "https://app.tilopay.com/api/v1";

export function obtenerConfiguracionTilopay(): ConfiguracionTilopay | null {
  const apiKey = process.env.TILOPAY_API_KEY?.trim();
  const apiUser = process.env.TILOPAY_API_USER?.trim();
  const apiPassword = process.env.TILOPAY_API_PASSWORD?.trim();
  const apiUrl = (process.env.TILOPAY_API_URL?.trim() || DEFAULT_TILOPAY_API_URL).replace(/\/+$/, "");

  if (
    !apiKey ||
    !apiUser ||
    !apiPassword ||
    isPlaceholder(apiKey) ||
    isPlaceholder(apiUser) ||
    isPlaceholder(apiPassword)
  ) {
    return null;
  }

  return { apiUrl, apiKey, apiUser, apiPassword };
}

export function isTilopayConfigured(): boolean {
  return obtenerConfiguracionTilopay() !== null;
}

/**
 * Determina el proveedor activo para reservas de turistas:
 * - Si `pagos_simulados` está activo en plataforma, prioriza el flujo simulado de pruebas.
 * - Si hay credenciales válidas de Tilopay, usa la API de Tilopay.
 * - En caso contrario, la pasarela permanece deshabilitada.
 */
export function obtenerModoPasarelaReservas(
  config: Pick<ConfiguracionPlataforma, "pagos_simulados">,
): ProveedorPasarelaReservas {
  if (config.pagos_simulados) return "simulado";
  if (isTilopayConfigured()) return "tilopay";
  return "deshabilitado";
}

export interface SesionCheckoutReserva {
  proveedor: Exclude<ProveedorPasarelaReservas, "deshabilitado">;
  reservaId: string;
  token: string;
  checkoutUrl: string;
}

async function obtenerTokenBearerTilopay(cfg: ConfiguracionTilopay): Promise<string> {
  const response = await fetch(`${cfg.apiUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ apiuser: cfg.apiUser, password: cfg.apiPassword }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new DataError(`No se pudo autenticar con Tilopay (HTTP ${response.status}).`);
  }
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new DataError("Tilopay no devolvió un access_token válido.");
  }
  return data.access_token;
}

/**
 * Crea la sesión de pago para una reserva recién registrada en estado `pendiente`.
 * Mantiene el modo simulado actual y deja listo el contrato de redirección para Tilopay.
 */
export async function crearSesionCheckoutReserva(
  reserva: DetalleReservaPublica,
  modo: Exclude<ProveedorPasarelaReservas, "deshabilitado">,
): Promise<SesionCheckoutReserva> {
  if (!reserva.token_gestion) {
    throw new DataError("No se recibió el token privado de la reserva.");
  }

  if (modo === "simulado") {
    return {
      proveedor: "simulado",
      reservaId: reserva.id,
      token: reserva.token_gestion,
      checkoutUrl: `/pago-simulado/${reserva.id}?token=${encodeURIComponent(reserva.token_gestion)}`,
    };
  }

  const cfg = obtenerConfiguracionTilopay();
  if (!cfg) {
    throw new DataError("Las credenciales de Tilopay no están configuradas.");
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "");
  const bearer = await obtenerTokenBearerTilopay(cfg);
  const monedaReserva = normalizarMoneda(
    reserva.currency ?? reserva.servicio_currency ?? reserva.negocio_moneda,
    "USD",
  );
  const monedaServicio = normalizarMoneda(
    reserva.servicio_currency ?? reserva.negocio_moneda,
    monedaReserva,
  );
  const montoBase =
    reserva.gross_amount ??
    convertirMoneda(
      reserva.servicio_precio_usd * (reserva.cupos ?? 1),
      monedaServicio,
      monedaReserva,
    );
  // Tilopay CR procesa terminales en USD y CRC; si la reserva está en otra divisa, convierte a USD.
  const monedaPasarela =
    monedaReserva === "CRC" || monedaReserva === "USD" ? monedaReserva : "USD";
  const amount = Number(
    convertirMoneda(
      montoBase,
      monedaReserva,
      monedaPasarela,
      reserva.exchange_rate_bccr,
    ).toFixed(2),
  );
  const nombrePartes = (reserva.nombre_cliente ?? "Turista Vuki").trim().split(/\s+/);
  const firstName = nombrePartes[0] || "Turista";
  const lastName = nombrePartes[1] ? nombrePartes.slice(1).join(" ") : "Vuki";

  const response = await fetch(`${cfg.apiUrl}/processPayment`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${bearer}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      redirect: `${appUrl}/reserva/${encodeURIComponent(reserva.token_gestion)}`,
      key: cfg.apiKey,
      amount: amount.toFixed(2),
      currency: monedaPasarela,
      orderNumber: reserva.id,
      capture: "1",
      subscription: "0",
      platform: "vuki",
      billToFirstName: firstName,
      billToLastName: lastName,
      billToEmail: reserva.email_cliente,
      billToCountry: "CR",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new DataError(`Tilopay rechazó la creación del checkout (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as { url?: string; urlPaymentForm?: string };
  const checkoutUrl = payload.url ?? payload.urlPaymentForm;
  if (!checkoutUrl) {
    throw new DataError("Tilopay no devolvió una URL de redirección de pago.");
  }

  return {
    proveedor: "tilopay",
    reservaId: reserva.id,
    token: reserva.token_gestion,
    checkoutUrl,
  };
}

export const webhookPagoNormalizadoSchema = z
  .object({
    reserva_id: z.string().uuid(),
    estado: z.enum(["pendiente", "pagada", "cancelada"]),
    trx_id: z
      .string()
      .min(1)
      .refine((v) => !esPagoManual(v), "Prefijo trx_id reservado")
      .optional(),
    proveedor: z.enum(["vuki", "tilopay"]).default("vuki"),
  })
  .superRefine((value, context) => {
    if (value.estado === "pagada" && !value.trx_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["trx_id"],
        message: "Un pago confirmado requiere trx_id.",
      });
    }
  });

export type WebhookPagoNormalizado = z.infer<typeof webhookPagoNormalizadoSchema>;

const tilopayWebhookSchema = z.object({
  orderNumber: z.string().uuid().optional(),
  order: z.string().uuid().optional(),
  order_id: z.string().uuid().optional(),
  code: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  tpt: z.union([z.string(), z.number()]).optional(),
  transaction_id: z.union([z.string(), z.number()]).optional(),
  auth: z.union([z.string(), z.number()]).optional(),
});

function mapearEstadoTilopay(
  code: string | number | undefined,
  status: string | undefined,
): "pendiente" | "pagada" | "cancelada" | null {
  const codeStr = code != null ? String(code).trim().toLowerCase() : "";
  const statusStr = status != null ? status.trim().toLowerCase() : "";

  if (
    codeStr === "1" ||
    codeStr === "approved" ||
    statusStr === "approved" ||
    statusStr === "paid" ||
    statusStr === "pagada" ||
    statusStr === "success"
  ) {
    return "pagada";
  }
  if (
    codeStr === "pending" ||
    statusStr === "pending" ||
    statusStr === "pendiente" ||
    statusStr === "in_process"
  ) {
    return "pendiente";
  }
  if (
    codeStr !== "" ||
    statusStr === "rejected" ||
    statusStr === "declined" ||
    statusStr === "canceled" ||
    statusStr === "cancelled" ||
    statusStr === "cancelada" ||
    statusStr === "failed" ||
    statusStr === "error"
  ) {
    return "cancelada";
  }
  return null;
}

/**
 * Normaliza tanto el contrato interno de Vuki (`{ reserva_id, estado, trx_id }`)
 * como los payloads de callback/webhook de Tilopay (`orderNumber`, `code`, `tpt`).
 */
export function normalizarWebhookPago(
  rawPayload: unknown,
): z.SafeParseReturnType<unknown, WebhookPagoNormalizado> {
  const directo = webhookPagoNormalizadoSchema.safeParse(rawPayload);
  if (directo.success) return directo;

  const tilo = tilopayWebhookSchema.safeParse(rawPayload);
  if (!tilo.success) return directo;

  const reservaId = tilo.data.orderNumber ?? tilo.data.order ?? tilo.data.order_id;
  const estado = mapearEstadoTilopay(tilo.data.code, tilo.data.status);
  const rawTrx = tilo.data.tpt ?? tilo.data.transaction_id ?? tilo.data.auth;
  const trxId =
    rawTrx != null && String(rawTrx).trim() !== ""
      ? String(rawTrx).startsWith("tlp_")
        ? String(rawTrx).trim()
        : `tlp_${String(rawTrx).trim()}`
      : undefined;

  return webhookPagoNormalizadoSchema.safeParse({
    reserva_id: reservaId,
    estado,
    trx_id: trxId,
    proveedor: "tilopay",
  });
}

