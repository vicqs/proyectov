import type { Reserva, Servicio } from "@/types/database";
import type {
  ClientIdType,
  FinancialTransaction,
  FiscalCurrency,
  InvoiceStatus,
  ServiceFiscalSummary,
  VoucherType,
} from "@/types/finanzas";

/** Comisión estimada de la pasarela bancaria (4.25%). vuki cobra 0% por venta. */
export const GATEWAY_FEE_RATE_DEFAULT = 0.0425;

/** Tipo de cambio de referencia del BCCR para simulación fiscal (₡ por $1 USD). */
export const EXCHANGE_RATE_BCCR_DEFAULT = 515.0;

/** Tarifa general del IVA en Costa Rica (13%, Ley 9635). */
export const IVA_RATE_DEFAULT = 0.13;

/** Tarifa reducida de IVA para servicios turísticos inscritos ante el ICT (4%). */
export const IVA_RATE_TURISMO = 0.04;

/** CABYS por defecto: servicios de enseñanza deportiva y recreativa (13 dígitos). */
export const CABYS_DEFAULT = "9291200000000";

/** Redondea a 2 decimales evitando deriva de punto flotante IEEE-754. */
export function redondearMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

/**
 * Desglosa un monto bruto cobrado al cliente (precio final con IVA incluido)
 * en base imponible (`subtotal_amount`), impuesto (`iva_amount`), comisión de
 * pasarela (`gateway_fee_amount`, gasto deducible) y neto liquidado (`net_amount`).
 */
export function calcularMontosFiscales({
  grossAmount,
  ivaRate = IVA_RATE_DEFAULT,
  gatewayFeeRate = GATEWAY_FEE_RATE_DEFAULT,
}: {
  grossAmount: number;
  ivaRate?: number;
  gatewayFeeRate?: number;
}) {
  const gross_amount = redondearMoneda(Math.max(0, grossAmount));
  const tarifaSegura = Number.isFinite(ivaRate) && ivaRate >= 0 ? ivaRate : IVA_RATE_DEFAULT;
  const tasaPasarela =
    Number.isFinite(gatewayFeeRate) && gatewayFeeRate >= 0
      ? gatewayFeeRate
      : GATEWAY_FEE_RATE_DEFAULT;

  const subtotal_amount = redondearMoneda(gross_amount / (1 + tarifaSegura));
  const iva_amount = redondearMoneda(gross_amount - subtotal_amount);
  const gateway_fee_amount = redondearMoneda(gross_amount * tasaPasarela);
  const net_amount = redondearMoneda(gross_amount - gateway_fee_amount);

  return {
    iva_rate: tarifaSegura,
    subtotal_amount,
    iva_amount,
    gross_amount,
    gateway_fee_rate: tasaPasarela,
    gateway_fee_amount,
    net_amount,
  };
}

/** Construye un registro `FinancialTransaction` completo y consistente para BD o mock. */
export function crearTransaccionFinanciera(
  input: Omit<
    FinancialTransaction,
    | "subtotal_amount"
    | "iva_amount"
    | "gateway_fee_rate"
    | "gateway_fee_amount"
    | "net_amount"
  > & {
    gateway_fee_rate?: number;
  },
): FinancialTransaction {
  const montos = calcularMontosFiscales({
    grossAmount: input.gross_amount,
    ivaRate: input.iva_rate,
    gatewayFeeRate: input.gateway_fee_rate ?? GATEWAY_FEE_RATE_DEFAULT,
  });

  return {
    ...input,
    ...montos,
  };
}

/**
 * Convierte una `Reserva` pagada por pasarela (con su `Servicio` asociado)
 * en un `FinancialTransaction`. Permite operar de forma transparente tanto con
 * `financial_transactions` persistidas como con reservas recién pagadas en sesión.
 */
export function reservaATransaccionFinanciera(
  reserva: Reserva,
  servicio?: Pick<
    Servicio,
    "nombre" | "precio_usd" | "cabys_code" | "iva_rate"
  > | null,
): FinancialTransaction {
  const cupos = reserva.cupos ?? 1;
  const gross =
    reserva.monto_usd ?? (servicio?.precio_usd ?? 0) * cupos;
  const ivaRate =
    reserva.iva_rate ?? servicio?.iva_rate ?? IVA_RATE_DEFAULT;
  const cabysCode = normalizarCabys(
    reserva.cabys_code ?? servicio?.cabys_code ?? CABYS_DEFAULT,
  );
  const voucherType: VoucherType = reserva.voucher_type ?? "TE";
  const invoiceStatus: InvoiceStatus = reserva.invoice_status ?? "pending";
  const currency: FiscalCurrency = reserva.currency ?? "USD";

  return crearTransaccionFinanciera({
    id: reserva.id,
    negocio_id: reserva.negocio_id,
    reserva_id: reserva.id,
    servicio_id: reserva.servicio_id ?? null,
    service_date: reserva.fecha_hora,
    cupos,
    transaction_ref: reserva.trx_id ?? `trx_${reserva.id.slice(0, 8)}`,
    service_name: servicio?.nombre ?? "Servicio turístico",
    cabys_code: cabysCode,
    voucher_type: voucherType,
    client_email: reserva.email_cliente,
    client_name: reserva.nombre_cliente ?? null,
    client_id_type: reserva.client_id_type ?? null,
    client_tax_id: reserva.client_tax_id ?? null,
    currency,
    exchange_rate_bccr:
      reserva.exchange_rate_bccr ?? EXCHANGE_RATE_BCCR_DEFAULT,
    iva_rate: ivaRate,
    gross_amount: gross,
    invoice_status: invoiceStatus,
    invoice_consecutive:
      invoiceStatus === "issued"
        ? (reserva.invoice_consecutive ?? null)
        : null,
  });
}

/** Garantiza un código CABYS limpio de exactamente 13 dígitos numéricos. */
export function normalizarCabys(codigo?: string | null): string {
  const digitos = (codigo ?? "").replace(/\D/g, "");
  if (digitos.length === 13) return digitos;
  if (digitos.length > 13) return digitos.slice(0, 13);
  return digitos ? digitos.padEnd(13, "0") : CABYS_DEFAULT;
}

/** Convierte un monto a USD usando el tipo de cambio BCCR de la transacción. */
export function montoEnUsd(
  monto: number,
  currency: FiscalCurrency,
  exchangeRateBccr: number,
): number {
  if (currency === "USD") return monto;
  const tc = exchangeRateBccr > 0 ? exchangeRateBccr : EXCHANGE_RATE_BCCR_DEFAULT;
  return redondearMoneda(monto / tc);
}

/** Convierte un monto a colones costarricenses (CRC) según `exchange_rate_bccr`. */
export function montoEnCrc(
  monto: number,
  currency: FiscalCurrency,
  exchangeRateBccr: number,
): number {
  if (currency === "CRC") return monto;
  const tc = exchangeRateBccr > 0 ? exchangeRateBccr : EXCHANGE_RATE_BCCR_DEFAULT;
  return redondearMoneda(monto * tc);
}

/**
 * Agrupa las transacciones filtradas por servicio produciendo resúmenes
 * `ServiceFiscalSummary` listos para renderizar en "Ingresos por servicio".
 */
export function resumirServiciosFiscales(
  transacciones: FinancialTransaction[],
): ServiceFiscalSummary[] {
  const mapa = new Map<string, ServiceFiscalSummary>();

  for (const t of transacciones) {
    const clave = t.servicio_id ?? `${t.service_name}::${t.cabys_code}`;
    const subtotalUsd = montoEnUsd(
      t.subtotal_amount,
      t.currency,
      t.exchange_rate_bccr,
    );
    const ivaUsd = montoEnUsd(t.iva_amount, t.currency, t.exchange_rate_bccr);
    const brutoUsd = montoEnUsd(
      t.gross_amount,
      t.currency,
      t.exchange_rate_bccr,
    );
    const comisionUsd = montoEnUsd(
      t.gateway_fee_amount,
      t.currency,
      t.exchange_rate_bccr,
    );
    const netoUsd = montoEnUsd(t.net_amount, t.currency, t.exchange_rate_bccr);

    const actual = mapa.get(clave) ?? {
      servicio_id: t.servicio_id,
      negocio_id: t.negocio_id,
      service_name: t.service_name,
      cabys_code: t.cabys_code,
      iva_rate: t.iva_rate,
      currency: "USD" as FiscalCurrency,
      transactions_count: 0,
      total_cupos: 0,
      subtotal_amount: 0,
      iva_amount: 0,
      gross_amount: 0,
      gateway_fee_amount: 0,
      net_amount: 0,
      pending_invoices_count: 0,
      issued_invoices_count: 0,
    };

    actual.transactions_count += 1;
    actual.total_cupos += t.cupos ?? 1;
    actual.subtotal_amount = redondearMoneda(
      actual.subtotal_amount + subtotalUsd,
    );
    actual.iva_amount = redondearMoneda(actual.iva_amount + ivaUsd);
    actual.gross_amount = redondearMoneda(actual.gross_amount + brutoUsd);
    actual.gateway_fee_amount = redondearMoneda(
      actual.gateway_fee_amount + comisionUsd,
    );
    actual.net_amount = redondearMoneda(actual.net_amount + netoUsd);

    if (t.invoice_status === "issued") {
      actual.issued_invoices_count += 1;
    } else {
      actual.pending_invoices_count += 1;
    }

    mapa.set(clave, actual);
  }

  return Array.from(mapa.values()).sort(
    (a, b) => b.gross_amount - a.gross_amount,
  );
}

/** Etiqueta fiscal legible para el badge de tarifa IVA del servicio. */
export function etiquetaTarifaIva(ivaRate: number): string {
  const pct = Math.round(ivaRate * 100);
  if (pct === 4) return "IVA 4% Turismo";
  return `IVA ${pct}% Inc.`;
}

/** Etiqueta corta del tipo de identificación fiscal del receptor en Costa Rica. */
export function etiquetaTipoIdentificacion(tipo: ClientIdType): string {
  switch (tipo) {
    case "fisica":
      return "Céd. Física";
    case "juridica":
      return "Céd. Jurídica";
    case "dimex":
      return "DIMEX";
    case "nite":
      return "NITE";
    case "extranjero":
      return "Extranjero";
    default:
      return "Sin ID";
  }
}

/**
 * Genera un número consecutivo de prueba de 20 dígitos con estructura oficial
 * del Ministerio de Hacienda CR: `001` (sucursal) + `00001` (terminal) +
 * `01`/`04` (`FE` / `TE`) + secuencia de 10 dígitos.
 */
export function generarConsecutivoHaciendaMock(
  voucherType: VoucherType,
  secuencia = 1,
): string {
  const codigoDoc = voucherType === "FE" ? "01" : "04";
  const num = String(Math.max(1, Math.floor(secuencia))).padStart(10, "0");
  return `00100001${codigoDoc}${num}`;
}

