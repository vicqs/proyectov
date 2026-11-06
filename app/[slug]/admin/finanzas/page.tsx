import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import FinanzasView from "@/components/empresa/FinanzasView";
import { leer } from "@/lib/data/server";
import { leer as leerAdmin } from "@/lib/admin/db";
import { DataError } from "@/lib/data/db";
import { reconciliarFinanzasNegocio } from "@/lib/finanzas";
import { obtenerConfiguracion } from "@/lib/plataforma";
import { hoyClaveCR } from "@/lib/zona-horaria";
import { guardarComprobanteAction } from "@/actions/facturacion";

/**
 * Dashboard Financiero: KPIs, trazabilidad fiscal (Ministerio de Hacienda - CR,
 * Declaración D-104) y liquidaciones calculadas sobre los pagos por pasarela
 * del negocio autenticado. Server Component, respeta RLS.
 */
export default async function FinanzasPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const [{ negocio }, config] = await Promise.all([
    requerirEmpresa(slug),
    obtenerConfiguracion(),
  ]);

  const hoyClave = hoyClaveCR(Date.now());

  let reconciliado: ReturnType<typeof reconciliarFinanzasNegocio> | null = null;
  let errorCarga: string | null = null;

  if (negocio) {
    try {
      const [reservasDb, trxPersistidas, servicios, reembolsosDb] =
        await Promise.all([
          leer("reservas", {
            eq: { negocio_id: negocio.id },
            orden: ["fecha_hora", false],
          }),
          leer("transacciones_financieras", {
            eq: { negocio_id: negocio.id },
            orden: ["service_date", false],
          }),
          leer("servicios", { eq: { negocio_id: negocio.id } }),
          leer("reembolsos", { eq: { negocio_id: negocio.id } }).catch(() =>
            leerAdmin("reembolsos", { eq: { negocio_id: negocio.id } }).catch(
              () => [],
            ),
          ),
        ]);

      reconciliado = reconciliarFinanzasNegocio({
        reservasDb,
        trxPersistidas,
        servicios,
        reembolsosDb,
      });
    } catch (error) {
      if (!(error instanceof DataError)) throw error;
      console.error("[finanzas] No se pudieron cargar los datos.", error);
      errorCarga =
        "No se pudieron cargar los datos financieros. Intenta recargar la página.";
    }
  } else {
    errorCarga = "No se encontró el negocio asociado a este usuario.";
  }

  const slugActual = negocio?.slug ?? slug;

  return (
    <FinanzasView
      error={errorCarga}
      hoyClave={hoyClave}
      cuentaIban={negocio?.cuenta_iban}
      hrefReservas={rutaPanelEmpresa(slugActual, "reservas")}
      hrefPersonalizacion={rutaPanelEmpresa(slugActual, "personalizacion")}
      pagosManuales={
        reconciliado?.pagosManualesResumen ?? { cantidad: 0, monto: 0 }
      }
      detalleManuales={reconciliado?.detalleManuales ?? []}
      reembolsosPendientes={
        reconciliado?.reembolsosPendientes ?? { cantidad: 0, monto: 0 }
      }
      pendientesCobro={
        reconciliado?.pendientesCobro ?? { cantidad: 0, monto: 0 }
      }
      transacciones={reconciliado?.transacciones ?? []}
      modoDemo={config.pagos_simulados}
      onGuardarComprobante={guardarComprobanteAction.bind(null, slugActual)}
    />
  );
}
