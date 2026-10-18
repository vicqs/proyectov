import { isStripeMockMode, stripe } from "./stripe";

export interface FacturaPendiente {
  id: string;
  numero: string;
  /** Monto pendiente en la moneda de la factura (unidades mayores). */
  monto: number;
  moneda: string;
  /** ISO; fecha de creación de la factura. */
  creada: string;
  intentos: number;
  /** Último error de cobro conocido, si lo hay. */
  motivo: string | null;
}

export interface ResultadoFacturasPendientes {
  disponible: boolean;
  facturas: FacturaPendiente[];
  /** Explica por qué no hay datos (modo simulado, sin cliente, error). */
  aviso: string | null;
}

/** Facturas abiertas (cobros pendientes) del cliente en Stripe. */
export async function facturasPendientes(
  customerId: string | null | undefined,
): Promise<ResultadoFacturasPendientes> {
  if (isStripeMockMode || !stripe) {
    return {
      disponible: false,
      facturas: [],
      aviso: "Stripe está en modo simulado: no hay cobros reales.",
    };
  }
  if (!customerId) {
    return {
      disponible: false,
      facturas: [],
      aviso: "El negocio aún no tiene cliente en Stripe.",
    };
  }
  try {
    const lista = await stripe.invoices.list({
      customer: customerId,
      status: "open",
      limit: 5,
    });
    return {
      disponible: true,
      facturas: lista.data.map((f) => ({
        id: f.id ?? "",
        numero: f.number ?? f.id ?? "—",
        monto: f.amount_remaining / 100,
        moneda: f.currency.toUpperCase(),
        creada: new Date(f.created * 1000).toISOString(),
        intentos: f.attempt_count ?? 0,
        motivo: null,
      })),
      aviso: null,
    };
  } catch (e) {
    console.error("No se pudieron consultar las facturas pendientes:", e);
    return {
      disponible: false,
      facturas: [],
      aviso: "No se pudo consultar Stripe. Inténtalo de nuevo.",
    };
  }
}
