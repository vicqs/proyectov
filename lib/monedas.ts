import { z } from "zod";

/**
 * Catálogo centralizado de monedas soportadas por la plataforma para
 * empresas, servicios, reservas, pagos y trazabilidad fiscal.
 */
export const MONEDAS_SOPORTADAS = [
  "USD",
  "CRC",
  "CAD",
  "EUR",
  "GBP",
] as const;

export type CodigoMoneda = (typeof MONEDAS_SOPORTADAS)[number];

export const MONEDA_POR_DEFECTO: CodigoMoneda = "USD";

export const MONEDA_SCHEMA = z.enum(MONEDAS_SOPORTADAS);

export interface InfoMoneda {
  codigo: CodigoMoneda;
  /** Prefijo visual del monto (ej. `"$"`, `"₡"`, `"CA$"`, `"€"`, `"£"`). */
  simbolo: string;
  /** Locale numérico recomendado para separadores de miles y decimales. */
  locale: string;
  /** Nombre completo en español. */
  nombreEs: string;
  /** Nombre completo en inglés. */
  nombreEn: string;
  /** Etiqueta compacta para selectores. */
  etiquetaCortaEs: string;
  etiquetaCortaEn: string;
  /** Tope máximo razonable para validación de precios unitarios de servicios. */
  maxPrecioServicio: number;
  /** Paso sugerido en inputs numéricos. */
  stepInput: string;
  /** Placeholder de ejemplo en formularios de servicios. */
  ejemploPrecio: string;
  /** Botones de precio rápido en el formulario de creación/edición de servicios. */
  preciosRapidos: readonly string[];
  /**
   * Tipo de cambio de referencia en colones costarricenses (CRC) por 1 unidad
   * de esta moneda (base BCCR / referencia internacional).
   * - `CRC = 1`
   * - `USD = 515`
   * - `CAD = 375.95`
   * - `EUR = 556.20`
   * - `GBP = 654.05`
   */
  tasaBccrCrc: number;
}

export const CATALOGO_MONEDAS: Record<CodigoMoneda, InfoMoneda> = {
  USD: {
    codigo: "USD",
    simbolo: "$",
    locale: "en-US",
    nombreEs: "Dólar estadounidense",
    nombreEn: "US Dollar",
    etiquetaCortaEs: "Dólar EE. UU.",
    etiquetaCortaEn: "US Dollar",
    maxPrecioServicio: 100_000,
    stepInput: "0.01",
    ejemploPrecio: "45.00",
    preciosRapidos: ["25", "35", "45", "65", "95"],
    tasaBccrCrc: 515,
  },
  CRC: {
    codigo: "CRC",
    simbolo: "₡",
    locale: "es-CR",
    nombreEs: "Colón costarricense",
    nombreEn: "Costa Rican Colón",
    etiquetaCortaEs: "Colón CR",
    etiquetaCortaEn: "Costa Rican Colón",
    maxPrecioServicio: 50_000_000,
    stepInput: "1",
    ejemploPrecio: "25000",
    preciosRapidos: ["10000", "15000", "25000", "35000", "50000"],
    tasaBccrCrc: 1,
  },
  CAD: {
    codigo: "CAD",
    simbolo: "CA$",
    locale: "en-CA",
    nombreEs: "Dólar canadiense",
    nombreEn: "Canadian Dollar",
    etiquetaCortaEs: "Dólar canadiense",
    etiquetaCortaEn: "Canadian Dollar",
    maxPrecioServicio: 150_000,
    stepInput: "0.01",
    ejemploPrecio: "60.00",
    preciosRapidos: ["35", "50", "65", "90", "130"],
    tasaBccrCrc: 375.95,
  },
  EUR: {
    codigo: "EUR",
    simbolo: "€",
    locale: "es-ES",
    nombreEs: "Euro",
    nombreEn: "Euro",
    etiquetaCortaEs: "Euro",
    etiquetaCortaEn: "Euro",
    maxPrecioServicio: 100_000,
    stepInput: "0.01",
    ejemploPrecio: "40.00",
    preciosRapidos: ["25", "35", "45", "60", "90"],
    tasaBccrCrc: 556.2,
  },
  GBP: {
    codigo: "GBP",
    simbolo: "£",
    locale: "en-GB",
    nombreEs: "Libra esterlina",
    nombreEn: "British Pound",
    etiquetaCortaEs: "Libra esterlina",
    etiquetaCortaEn: "British Pound",
    maxPrecioServicio: 100_000,
    stepInput: "0.01",
    ejemploPrecio: "35.00",
    preciosRapidos: ["20", "30", "40", "55", "80"],
    tasaBccrCrc: 654.05,
  },
};

export const LISTA_MONEDAS: readonly InfoMoneda[] = MONEDAS_SOPORTADAS.map(
  (codigo) => CATALOGO_MONEDAS[codigo],
);

/** Comprueba si una cadena desconocida es un código ISO de moneda soportado. */
export function esMonedaSoportada(valor: unknown): valor is CodigoMoneda {
  return (
    typeof valor === "string" &&
    (MONEDAS_SOPORTADAS as readonly string[]).includes(valor)
  );
}

/** Normaliza un valor arbitrario a un `CodigoMoneda` válido con respaldo seguro. */
export function normalizarMoneda(
  valor: unknown,
  respaldo: CodigoMoneda = MONEDA_POR_DEFECTO,
): CodigoMoneda {
  if (typeof valor === "string") {
    const limpio = valor.trim().toUpperCase();
    if (esMonedaSoportada(limpio)) return limpio;
  }
  return respaldo;
}

/** Obtiene la ficha descriptiva de una moneda (con respaldo a `USD`). */
export function obtenerInfoMoneda(moneda?: string | null): InfoMoneda {
  return CATALOGO_MONEDAS[normalizarMoneda(moneda)];
}

/** Redondea montos monetarios a 2 decimales evitando deriva binaria IEEE 754. */
export function redondearMontoMoneda(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export const redondearMoneda = redondearMontoMoneda;

/**
 * Devuelve el tipo de cambio de referencia en CRC por 1 unidad de `moneda`.
 * Para `CRC` retorna `1`; para `USD` retorna `515`, etc.
 */
export function obtenerTipoCambioBccr(moneda?: string | null): number {
  return obtenerInfoMoneda(moneda).tasaBccrCrc;
}

/**
 * Resuelve el tipo de cambio efectivo (CRC por 1 unidad de `moneda`) respetando
 * el valor persistido en la transacción/reserva cuando corresponde.
 */
export function resolverTipoCambioCrc(
  moneda: CodigoMoneda,
  exchangeRateBccr?: number | null,
): number {
  if (moneda === "CRC") return 1;
  const tasaCatalogo = CATALOGO_MONEDAS[moneda].tasaBccrCrc;
  if (
    typeof exchangeRateBccr === "number" &&
    Number.isFinite(exchangeRateBccr) &&
    exchangeRateBccr > 0
  ) {
    // Si una fila no-USD conservó el default legado 515 de USD, usa su tasa real.
    if (moneda !== "USD" && Math.abs(exchangeRateBccr - 515) < 0.001) {
      return tasaCatalogo;
    }
    return exchangeRateBccr;
  }
  return tasaCatalogo;
}

/** Convierte un monto desde `moneda` hacia colones costarricenses (`CRC`). */
export function convertirACrc(
  monto: number,
  moneda: CodigoMoneda,
  exchangeRateBccr?: number | null,
): number {
  if (!Number.isFinite(monto)) return 0;
  if (moneda === "CRC") return redondearMontoMoneda(monto);
  const tc = resolverTipoCambioCrc(moneda, exchangeRateBccr);
  return redondearMontoMoneda(monto * tc);
}

/** Convierte un monto desde `moneda` hacia dólares estadounidenses (`USD`). */
export function convertirAUsd(
  monto: number,
  moneda: CodigoMoneda,
  exchangeRateBccr?: number | null,
): number {
  if (!Number.isFinite(monto)) return 0;
  if (moneda === "USD") return redondearMontoMoneda(monto);
  if (moneda === "CRC") {
    const divisorUsd =
      typeof exchangeRateBccr === "number" && exchangeRateBccr > 10
        ? exchangeRateBccr
        : CATALOGO_MONEDAS.USD.tasaBccrCrc;
    return redondearMontoMoneda(monto / divisorUsd);
  }
  const enCrc = convertirACrc(monto, moneda, exchangeRateBccr);
  return redondearMontoMoneda(enCrc / CATALOGO_MONEDAS.USD.tasaBccrCrc);
}

/**
 * Convierte un monto entre cualesquiera dos monedas soportadas.
 * Si `origen === destino`, retorna el monto redondeado sin pérdida por cruce.
 */
export function convertirMoneda(
  monto: number,
  origen: CodigoMoneda,
  destino: CodigoMoneda,
  exchangeRateOrigenBccr?: number | null,
): number {
  if (!Number.isFinite(monto)) return 0;
  if (origen === destino) return redondearMontoMoneda(monto);
  const enCrc = convertirACrc(monto, origen, exchangeRateOrigenBccr);
  if (destino === "CRC") return enCrc;
  const tasaDestino = CATALOGO_MONEDAS[destino].tasaBccrCrc;
  return redondearMontoMoneda(enCrc / tasaDestino);
}
