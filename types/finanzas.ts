/**
 * Modelos relacionales de trazabilidad fiscal y facturación electrónica
 * (Ministerio de Hacienda - Costa Rica, Declaración D-104).
 *
 * Diseñados con nombres de columna `snake_case` listos para migrarse
 * directamente a tablas/vistas de PostgreSQL en Supabase sin refactorizar la UI.
 */

/** Tipo de comprobante electrónico ante el Ministerio de Hacienda (CR). */
export type VoucherType = "TE" | "FE";

/** Tipo de identificación fiscal del receptor según catálogo de Hacienda (CR). */
export type ClientIdType =
  | "fisica"
  | "juridica"
  | "dimex"
  | "nite"
  | "extranjero"
  | null;

/** Moneda de cobro y facturación de la transacción. */
export type FiscalCurrency = "USD" | "CRC";

/** Estado de emisión del comprobante electrónico ante Hacienda. */
export type InvoiceStatus = "pending" | "issued";

/**
 * Transacción financiera procesada por pasarela con desglose tributario
 * completo (IVA, CABYS, tipo de cambio BCCR y estado de comprobante electrónico).
 *
 * Tabla objetivo en Supabase/PostgreSQL: `public.financial_transactions`.
 */
export interface FinancialTransaction {
  /** PK UUID (`uuid primary key default gen_random_uuid()`). */
  id: string;
  /** FK -> `public.negocios(id)` para aislamiento multi-tenant con RLS. */
  negocio_id: string;
  /** FK opcional -> `public.reservas(id)`. */
  reserva_id: string | null;
  /** FK opcional -> `public.servicios(id)`. */
  servicio_id: string | null;
  /** Fecha/hora programada del servicio (`timestamptz` ISO 8601). */
  service_date: string;
  /** Cantidad de personas/cupos incluidos en la reserva. */
  cupos: number;
  /** Referencia única de la pasarela bancaria (ej. `"trx_mock_demo_1"`). */
  transaction_ref: string;
  /** Nombre comercial del servicio facturado. */
  service_name: string;
  /** Código del Catálogo de Bienes y Servicios BCCR/Hacienda (13 dígitos exactos). */
  cabys_code: string;
  /** `'TE'` (Tiquete Electrónico, por defecto para turistas) o `'FE'` (Factura Electrónica). */
  voucher_type: VoucherType;
  /** Correo electrónico del cliente receptor. */
  client_email: string;
  /** Nombre completo o razón social del receptor (requerido en `FE`, opcional en `TE`). */
  client_name: string | null;
  /** Tipo de documento de identidad del receptor (`null` en `TE` sin receptor identificado). */
  client_id_type: ClientIdType;
  /** Número de cédula/identificación fiscal del receptor (`null` en `TE` para turistas). */
  client_tax_id: string | null;
  /** Moneda de la operación (`'USD'` | `'CRC'`). */
  currency: FiscalCurrency;
  /** Tipo de cambio de referencia de venta del BCCR al momento del cobro (ej. `515.00`). */
  exchange_rate_bccr: number;
  /** Tarifa de IVA aplicable en decimal (ej. `0.13` general o `0.04` turismo). */
  iva_rate: number;
  /** Base imponible / subtotal sin IVA (`gross_amount / (1 + iva_rate)`). */
  subtotal_amount: number;
  /** Monto de IVA recaudado (`gross_amount - subtotal_amount`). */
  iva_amount: number;
  /** Monto bruto total cobrado y facturado al cliente (100% con IVA incluido). */
  gross_amount: number;
  /** Tasa de comisión estimada de la pasarela bancaria (`0.0425` = 4.25%). */
  gateway_fee_rate: number;
  /** Comisión retenida por la pasarela bancaria (gasto deducible para el comercio). */
  gateway_fee_amount: number;
  /** Monto neto estimado a liquidar en la cuenta IBAN del negocio. */
  net_amount: number;
  /** Estado de emisión del comprobante electrónico (`'pending'` | `'issued'`). */
  invoice_status: InvoiceStatus;
  /** Número consecutivo oficial de 20 dígitos de Hacienda (o de prueba), `null` si está pendiente. */
  invoice_consecutive: string | null;
  /** Marca temporal de registro (`timestamptz` ISO 8601). */
  created_at?: string;
}

/**
 * Resumen fiscal y financiero agrupado por servicio para el período seleccionado.
 *
 * Equivalente directo a una vista SQL o RPC en Supabase (`v_service_fiscal_summary`).
 */
export interface ServiceFiscalSummary {
  /** FK -> `public.servicios(id)` (`null` si el servicio fue eliminado o no está vinculado). */
  servicio_id: string | null;
  /** FK -> `public.negocios(id)`. */
  negocio_id: string;
  /** Nombre comercial del servicio (ej. `"Clase de surf 1h"`). */
  service_name: string;
  /** Código CABYS de 13 dígitos configurado para el servicio. */
  cabys_code: string;
  /** Tarifa de IVA configurada en el servicio (ej. `0.13` o `0.04`). */
  iva_rate: number;
  /** Moneda base del resumen (`'USD'` | `'CRC'`). */
  currency: FiscalCurrency;
  /** Cantidad de pagos procesados por pasarela para este servicio. */
  transactions_count: number;
  /** Total de cupos/personas vendidos en el período. */
  total_cupos: number;
  /** Suma de subtotales sin IVA del servicio. */
  subtotal_amount: number;
  /** Suma de IVA recaudado por el servicio. */
  iva_amount: number;
  /** Suma de ingresos brutos facturados por el servicio. */
  gross_amount: number;
  /** Suma de comisiones de pasarela asociadas al servicio. */
  gateway_fee_amount: number;
  /** Suma del neto estimado a liquidar del servicio. */
  net_amount: number;
  /** Cantidad de comprobantes pendientes de emitir ante Hacienda. */
  pending_invoices_count: number;
  /** Cantidad de comprobantes ya emitidos/facturados. */
  issued_invoices_count: number;
}

