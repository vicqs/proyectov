/**
 * Utilidades de formateo estandarizado de moneda para el panel de administración.
 * Formato unificado: `$45.00 USD`
 */

export function formatearPrecioUsd(monto: number | null | undefined): string {
  const n = typeof monto === "number" && !Number.isNaN(monto) ? monto : 0;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} USD`;
}

export function formatearMoneda(
  monto: number | null | undefined,
  moneda: "USD" | "CRC" = "USD",
): string {
  const n = typeof monto === "number" && !Number.isNaN(monto) ? monto : 0;
  if (moneda === "CRC") {
    return `₡${n.toLocaleString("es-CR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CRC`;
  }
  return formatearPrecioUsd(n);
}

