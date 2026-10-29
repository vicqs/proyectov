import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { reservaATransaccionFinanciera } from "@/lib/finanzas";
import { esCobroPasarela, esPagoManual, esTrxPasarela } from "@/lib/pagos";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import type {
  FinancialTransaction,
  Reserva,
  Servicio,
} from "@/types/database";
import FinanzasView from "@/components/empresa/FinanzasView";

/** Reserva con la configuración comercial y fiscal del servicio embebida. */
interface ReservaConMontoFiscal extends Reserva {
  servicio: Pick<
    Servicio,
    "nombre" | "precio_usd" | "cabys_code" | "iva_rate"
  > | null;
}

function hoyClaveCR(ahoraMs: number): string {
  const cr = new Date(ahoraMs - 6 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${cr.getUTCFullYear()}-${p(cr.getUTCMonth() + 1)}-${p(cr.getUTCDate())}`;
}

/**
 * Dashboard Financiero: KPIs, trazabilidad fiscal (Ministerio de Hacienda - CR,
 * Declaración D-104) y liquidaciones calculadas sobre los pagos por pasarela
 * del negocio autenticado. Server Component, respeta RLS.
 */
export default async function FinanzasPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { supabase, negocio } = await requerirEmpresa(slug);

  const hoyClave = hoyClaveCR(Date.now());

  let transacciones: FinancialTransaction[] = [];
  let pagosManuales: ReservaConMontoFiscal[] = [];
  let reembolsos: ReservaConMontoFiscal[] = [];
  let pendientes: ReservaConMontoFiscal[] = [];
  let errorCarga: string | null = null;

  if (negocio) {
    const [reservasRes, trxFiscalesRes] = await Promise.all([
      supabase
        .from("reservas")
        .select("*, servicio:servicios(nombre, precio_usd, cabys_code, iva_rate)")
        .eq("negocio_id", negocio.id)
        .order("fecha_hora", { ascending: false }),
      supabase
        .from("financial_transactions")
        .select("*")
        .eq("negocio_id", negocio.id)
        .order("service_date", { ascending: false }),
    ]);

    if (reservasRes.error) {
      errorCarga =
        "No se pudieron cargar los datos financieros. Intenta recargar la página.";
    } else {
      const filas = (reservasRes.data ?? []) as unknown as ReservaConMontoFiscal[];
      const pagos = filas.filter((r) => esCobroPasarela(r));
      const canceladasIds = new Set(
        filas.filter((r) => r.estado === "cancelada").map((r) => r.id),
      );

      pagosManuales = filas.filter(
        (r) => r.estado === "pagada" && esPagoManual(r.trx_id),
      );
      // Cancelada con transacción de pasarela = el cliente pagó y falta devolverle el dinero.
      reembolsos = filas.filter(
        (r) => r.estado === "cancelada" && esTrxPasarela(r.trx_id),
      );
      pendientes = filas.filter((r) => r.estado === "pendiente");

      const trxPersistidas = !trxFiscalesRes.error
        ? ((trxFiscalesRes.data ?? []) as unknown as FinancialTransaction[])
        : [];
      const porReservaId = new Map<string, FinancialTransaction>();
      const porRef = new Map<string, FinancialTransaction>();
      for (const t of trxPersistidas) {
        if (t.reserva_id) porReservaId.set(t.reserva_id, t);
        if (t.transaction_ref) porRef.set(t.transaction_ref, t);
      }

      const usadasIds = new Set<string>();
      const mapeadas = pagos.map((p) => {
        const existente =
          porReservaId.get(p.id) ??
          (p.trx_id ? porRef.get(p.trx_id) : undefined);
        if (existente) {
          usadasIds.add(existente.id);
          return existente;
        }
        return reservaATransaccionFinanciera(p, p.servicio);
      });

      const independientes = trxPersistidas.filter(
        (t) =>
          !usadasIds.has(t.id) &&
          (!t.reserva_id || !canceladasIds.has(t.reserva_id)),
      );

      transacciones = [...mapeadas, ...independientes].sort((a, b) =>
        b.service_date.localeCompare(a.service_date),
      );
    }
  } else {
    errorCarga = "No se encontró el negocio asociado a este usuario.";
  }

  const montoDe = (p: ReservaConMontoFiscal) =>
    p.monto_usd ?? (p.servicio?.precio_usd ?? 0) * (p.cupos ?? 1);

  const slugActual = negocio?.slug ?? slug;

  return (
    <FinanzasView
      error={errorCarga}
      hoyClave={hoyClave}
      cuentaIban={negocio?.cuenta_iban}
      hrefReservas={rutaPanelEmpresa(slugActual, "reservas")}
      hrefPersonalizacion={rutaPanelEmpresa(slugActual, "personalizacion")}
      pagosManuales={{
        cantidad: pagosManuales.length,
        monto: pagosManuales.reduce((acc, r) => acc + montoDe(r), 0),
      }}
      detalleManuales={pagosManuales.map((r) => ({
        fechaIso: r.fecha_hora,
        monto: montoDe(r),
      }))}
      reembolsosPendientes={{
        cantidad: reembolsos.length,
        monto: reembolsos.reduce((acc, r) => acc + montoDe(r), 0),
      }}
      pendientesCobro={{
        cantidad: pendientes.length,
        monto: pendientes.reduce((acc, r) => acc + montoDe(r), 0),
      }}
      transacciones={transacciones}
    />
  );
}
