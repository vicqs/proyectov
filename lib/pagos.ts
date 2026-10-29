/** Prefijo reservado en `trx_id` para pagos recibidos fuera de la pasarela (ej. SINPE o efectivo). */
export const PREFIJO_TRX_MANUAL = "manual_";

/** Genera un identificador único para reservas manuales marcadas como pagadas. */
export function generarTrxManual(): string {
  return `${PREFIJO_TRX_MANUAL}${crypto.randomUUID()}`;
}

/** Indica si el `trx_id` corresponde a un pago manual registrado por el negocio (fuera de pasarela). */
export function esPagoManual(trxId?: string | null): boolean {
  return Boolean(trxId && trxId.startsWith(PREFIJO_TRX_MANUAL));
}

/** Indica si el `trx_id` corresponde a una transacción procesada por la pasarela bancaria. */
export function esTrxPasarela(trxId?: string | null): boolean {
  return Boolean(trxId && !esPagoManual(trxId));
}

/**
 * Reserva pagada a través de la pasarela (excluye reservas manuales marcadas como pagadas).
 * Se usa para liquidaciones bancarias, comisiones de pasarela y volumen procesado en plataforma.
 */
export function esCobroPasarela(reserva: {
  estado: string;
  trx_id?: string | null;
}): boolean {
  return reserva.estado === "pagada" && !esPagoManual(reserva.trx_id);
}

/**
 * Reserva que puede requerir o admitir un reembolso de pasarela:
 * está pagada por pasarela, o fue cancelada tras haber recibido un `trx_id` de pasarela.
 */
export function admiteReembolsoPasarela(reserva: {
  estado: string;
  trx_id?: string | null;
}): boolean {
  return (
    esCobroPasarela(reserva) ||
    (reserva.estado === "cancelada" && esTrxPasarela(reserva.trx_id))
  );
}

