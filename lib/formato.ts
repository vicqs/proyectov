/**
 * Utilidades de formateo estandarizado de moneda para toda la aplicación.
 * Soporta USD, CRC, CAD, EUR y GBP (ej. `$45.00 USD`, `₡25,000.00 CRC`, `€40.00 EUR`).
 */

import {
  normalizarMoneda,
  obtenerInfoMoneda,
  type CodigoMoneda,
} from "./monedas";

export interface OpcionesFormatoMoneda {
  /** Si es `false`, omite el sufijo del código ISO (ej. `$45.00` en vez de `$45.00 USD`). Por defecto `true`. */
  mostrarCodigo?: boolean;
  /** Forzar cantidad mínima/máxima de decimales (por defecto 2). */
  decimales?: number;
}

export function formatearMoneda(
  monto: number | null | undefined,
  moneda: CodigoMoneda | string | null | undefined = "USD",
  opciones?: OpcionesFormatoMoneda,
): string {
  const n = typeof monto === "number" && !Number.isNaN(monto) ? monto : 0;
  const codigo = normalizarMoneda(moneda);
  const info = obtenerInfoMoneda(codigo);
  const mostrarCodigo = opciones?.mostrarCodigo ?? true;
  const decimales =
    opciones?.decimales ??
    (codigo === "CRC" && !mostrarCodigo && Number.isInteger(n) ? 0 : 2);

  const numero = n.toLocaleString(info.locale, {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

  return mostrarCodigo
    ? `${info.simbolo}${numero} ${info.codigo}`
    : `${info.simbolo}${numero}`;
}

export function formatearPrecioUsd(monto: number | null | undefined): string {
  return formatearMoneda(monto, "USD");
}

/**
 * Indica si una referencia de transacción corresponde a un pago simulado / de demostración
 * (p. ej. `trx_sim_...` generado por la pasarela simulada o `trx_mock_...` del seed de prueba).
 */
export function esTransaccionSimulada(
  trxId: string | null | undefined,
): boolean {
  if (!trxId) return false;
  const limpio = trxId.trim().toLowerCase();
  return (
    limpio.startsWith("trx_sim_") ||
    limpio.startsWith("trx_mock_") ||
    limpio.startsWith("sim_") ||
    limpio.startsWith("mock_")
  );
}

/**
 * Indica si un identificador de cliente Stripe pertenece al modo simulado / demo (`mock_cus_...`).
 */
export function esClienteStripeSimulado(
  customerId: string | null | undefined,
): boolean {
  if (!customerId) return false;
  const limpio = customerId.trim().toLowerCase();
  return limpio.startsWith("mock_cus_") || limpio.startsWith("sim_cus_");
}


