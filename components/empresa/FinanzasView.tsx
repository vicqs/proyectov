"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  HandCoins,
  Info,
  Percent,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import EmpresaPage, { KpiCard, Lista } from "../EmpresaPage";
import { toast } from "../Toast";
import { descargarCsv } from "../../lib/csv";
import { formatearMoneda } from "@/lib/formato";
import { mensajeErrorUsuario } from "../../lib/errores";
import {
  calcularResumenKpiFinanciero,
  COLUMNAS_CSV_D104,
  filasCsvD104,
  generarConsecutivoHaciendaMock,
  resumirServiciosFiscales,
} from "../../lib/finanzas";
import {
  desplazarClave,
  diaCR,
  fechaHoraCR,
  rangoMesActual,
} from "../../lib/zona-horaria";
import type {
  FinancialTransaction,
  FiscalCurrency,
  ServiceFiscalSummary,
} from "../../types/finanzas";
import type {
  ComprobanteInput,
  ComprobanteResultado,
} from "@/actions/facturacion";
import DesgloseServiciosTabla from "./finanzas/DesgloseServiciosTabla";
import ModalComprobanteHacienda, {
  type ModalFacturaState,
} from "./finanzas/ModalComprobanteHacienda";
import TablaPagosPasarela from "./finanzas/TablaPagosPasarela";

export type { FinancialTransaction, ServiceFiscalSummary };

const formatoNumeroCr = new Intl.NumberFormat("es-CR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatearIban(iban?: string | null): string | null {
  const limpio = (iban ?? "").replace(/\s+/g, "").trim();
  if (!limpio) return null;
  if (limpio.length <= 8) return limpio;
  return `${limpio.slice(0, 4)} •••• •••• ${limpio.slice(-4)}`;
}

/** Dashboard financiero con trazabilidad fiscal (Hacienda CR) para `/[slug]/admin/finanzas`. */
export default function FinanzasView({
  transacciones: transaccionesIniciales,
  monedaBase = "USD",
  error,
  reembolsosPendientes,
  pagosManuales,
  pendientesCobro,
  detalleManuales,
  cuentaIban,
  hoyClave,
  hrefReservas,
  hrefPersonalizacion,
  modoDemo = false,
  onGuardarComprobante,
}: {
  transacciones: FinancialTransaction[];
  monedaBase?: FiscalCurrency;
  error?: string | null;
  /** Reservas pagadas y luego canceladas: dinero que falta devolver al cliente. */
  reembolsosPendientes?: { cantidad: number; monto: number };
  /** Reservas cobradas directamente por el comercio (fuera de pasarela). */
  pagosManuales?: { cantidad: number; monto: number };
  /** Reservas activas aún en estado pendiente de cobro. */
  pendientesCobro?: { cantidad: number; monto: number };
  /** Detalle fechado de cobros manuales para filtrar junto con el período. */
  detalleManuales?: { fechaIso: string; monto: number }[];
  /** Cuenta IBAN configurada en el negocio. */
  cuentaIban?: string | null;
  /** Clave `YYYY-MM-DD` de hoy en Costa Rica para atajos de período. */
  hoyClave?: string;
  hrefReservas?: string;
  hrefPersonalizacion?: string;
  modoDemo?: boolean;
  onGuardarComprobante: (
    input: ComprobanteInput,
  ) => Promise<ComprobanteResultado>;
}) {
  const [listaTransacciones, setListaTransacciones] = useState<
    FinancialTransaction[]
  >(transaccionesIniciales);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  const [modalFactura, setModalFactura] = useState<ModalFacturaState | null>(
    null,
  );
  const [errorModal, setErrorModal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setListaTransacciones(transaccionesIniciales);
  }, [transaccionesIniciales]);

  const filtrando = Boolean(desde || hasta);

  const transaccionesFiltradas = useMemo(
    () =>
      listaTransacciones.filter((t) => {
        const d = diaCR(t.service_date);
        return (!desde || d >= desde) && (!hasta || d <= hasta);
      }),
    [listaTransacciones, desde, hasta],
  );

  const manualesVisibles = useMemo(() => {
    if (detalleManuales) {
      const filas = detalleManuales.filter((m) => {
        const d = diaCR(m.fechaIso);
        return (!desde || d >= desde) && (!hasta || d <= hasta);
      });
      return {
        cantidad: filas.length,
        monto: filas.reduce((a, m) => a + m.monto, 0),
      };
    }
    return pagosManuales ?? { cantidad: 0, monto: 0 };
  }, [detalleManuales, pagosManuales, desde, hasta]);

  const formatoBase = (monto: number | null | undefined) =>
    formatearMoneda(monto, monedaBase);

  const resumenKpi = useMemo(
    () =>
      calcularResumenKpiFinanciero(
        transaccionesFiltradas,
        listaTransacciones,
        monedaBase,
      ),
    [transaccionesFiltradas, listaTransacciones, monedaBase],
  );

  const desgloseServicios: ServiceFiscalSummary[] = useMemo(
    () => resumirServiciosFiscales(transaccionesFiltradas, monedaBase),
    [transaccionesFiltradas, monedaBase],
  );

  const ultimos =
    filtrando || verTodos
      ? transaccionesFiltradas
      : transaccionesFiltradas.slice(0, 10);
  const plural = transaccionesFiltradas.length === 1 ? "" : "s";
  const ibanVisible = formatearIban(cuentaIban);

  const trxEnModal = useMemo(
    () =>
      modalFactura
        ? (listaTransacciones.find((t) => t.id === modalFactura.trxId) ?? null)
        : null,
    [modalFactura, listaTransacciones],
  );

  const atajosPeriodo = useMemo(() => {
    if (!hoyClave) return [];
    const mes = rangoMesActual(hoyClave);
    return [
      { etiqueta: "Todo", desde: "", hasta: "" },
      { etiqueta: "Próximas salidas", desde: hoyClave, hasta: "" },
      { etiqueta: "Hoy", desde: hoyClave, hasta: hoyClave },
      { etiqueta: "Este mes", desde: mes.desde, hasta: mes.hasta },
      {
        etiqueta: "Últimos 30 días",
        desde: desplazarClave(hoyClave, -30),
        hasta: hoyClave,
      },
    ];
  }, [hoyClave]);

  function abrirModalFactura(trx: FinancialTransaction) {
    setErrorModal(null);
    setModalFactura({
      trxId: trx.id,
      voucherType: trx.voucher_type,
      clientName: trx.client_name ?? "",
      clientIdType: trx.client_id_type ?? "fisica",
      clientTaxId: trx.client_tax_id ?? "",
      consecutive: trx.invoice_consecutive ?? "",
    });
  }

  function autocompletarConsecutivoPrueba() {
    if (!modalFactura || !modoDemo || guardando) return;
    const indice =
      listaTransacciones.findIndex((t) => t.id === modalFactura.trxId) + 1;
    const sugerido = generarConsecutivoHaciendaMock(
      modalFactura.voucherType,
      indice > 0 ? indice : 1,
    );
    setModalFactura({ ...modalFactura, consecutive: sugerido });
  }

  async function guardarComprobante(nuevoEstado: "pending" | "issued") {
    if (!modalFactura || guardando || !trxEnModal) return;
    const esFE = modalFactura.voucherType === "FE";
    const nombreLimpio = modalFactura.clientName.trim();
    const idFiscalLimpio = modalFactura.clientTaxId.trim();
    const consecutivoLimpio = modalFactura.consecutive.trim();

    if (esFE && (!nombreLimpio || !idFiscalLimpio)) {
      setErrorModal(
        "Para Factura Electrónica (FE) ingresa el nombre y la identificación del receptor.",
      );
      return;
    }

    setGuardando(true);
    setErrorModal(null);
    try {
      const result = await onGuardarComprobante({
        id: modalFactura.trxId,
        voucher_type: modalFactura.voucherType,
        client_name: esFE
          ? nombreLimpio
          : nombreLimpio || trxEnModal.client_name || null,
        client_id_type: esFE ? modalFactura.clientIdType : null,
        client_tax_id: esFE ? idFiscalLimpio : null,
        invoice_status: nuevoEstado,
        invoice_consecutive:
          nuevoEstado === "issued" ? consecutivoLimpio || null : null,
      });
      if ("error" in result) {
        setErrorModal(result.error);
        return;
      }
      const saved = result.transaccion;
      setListaTransacciones((prev) =>
        prev.map((item) => (item.id === saved.id ? saved : item)),
      );
      setModalFactura(null);
      toast.success(
        saved.invoice_status === "issued"
          ? "Comprobante guardado como Facturado"
          : "Estado de factura actualizado a Pendiente",
      );
    } catch (error) {
      console.error("[facturación] No se pudo guardar el comprobante.", error);
      setErrorModal(
        mensajeErrorUsuario(
          error,
          "No se pudo guardar el comprobante. Intenta de nuevo.",
        ),
      );
    } finally {
      setGuardando(false);
    }
  }

  function exportar() {
    const sufijo = hoyClave || diaCR(new Date().toISOString());
    descargarCsv(
      `declaracion-d104-pagos-${sufijo}.csv`,
      COLUMNAS_CSV_D104,
      filasCsvD104(transaccionesFiltradas, fechaHoraCR),
    );
  }

  return (
    <EmpresaPage
      titulo="Dashboard Financiero"
      descripcion="Ingresos por pasarela, desglose de IVA y trazabilidad de facturación electrónica (Ministerio de Hacienda · CR)."
      accion={
        !error ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            {hrefReservas && (
              <Link
                href={hrefReservas}
                className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
              >
                Ver reservas
              </Link>
            )}
            <button
              type="button"
              onClick={exportar}
              disabled={transaccionesFiltradas.length === 0}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar CSV
              {filtrando && transaccionesFiltradas.length > 0
                ? ` (${transaccionesFiltradas.length})`
                : ""}
            </button>
          </div>
        ) : undefined
      }
    >
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          {modoDemo && (
            <div
              role="status"
              className="mb-5 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-xs leading-relaxed text-amber-950"
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold">
                  Modo demostración activo:
                </strong>{" "}
                Los pagos simulados, la liquidación neta y el registro de
                comprobantes funcionan como entorno de prueba; no mueven dinero
                real ni emiten documentos ante el Ministerio de Hacienda.
              </span>
            </div>
          )}

          {/* Barra de período: atajos en 1 clic + rango de fechas */}
          <div className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {atajosPeriodo.length > 0 && (
                <div
                  role="group"
                  aria-label="Períodos rápidos por fecha del servicio"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  {atajosPeriodo.map((op) => {
                    const activo = desde === op.desde && hasta === op.hasta;
                    return (
                      <button
                        key={op.etiqueta}
                        type="button"
                        aria-pressed={activo}
                        onClick={() => {
                          setDesde(op.desde);
                          setHasta(op.hasta);
                        }}
                        className={`vuki-tab-pill ${
                          activo ? "vuki-tab-pill-active" : ""
                        }`}
                      >
                        {op.etiqueta}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span>Desde</span>
                  <input
                    type="date"
                    aria-label="Desde"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    className="vuki-input-sm w-auto px-2.5"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span>Hasta</span>
                  <input
                    type="date"
                    aria-label="Hasta"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    className="vuki-input-sm w-auto px-2.5"
                  />
                </label>
                {filtrando && (
                  <button
                    type="button"
                    onClick={() => {
                      setDesde("");
                      setHasta("");
                    }}
                    className="vuki-focus rounded-lg px-2.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                  >
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* KPIs principales de pasarela y desglose tributario */}
          <Lista as="section" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              icono={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Ingresos brutos (pasarela)"
              valor={formatoBase(resumenKpi.brutoBase)}
              detalle={
                <>
                  <p className="text-xs text-slate-500">
                    Subtotal (sin IVA):{" "}
                    <span className="font-medium text-slate-700">
                      {formatoBase(resumenKpi.subtotalBase)}
                    </span>{" "}
                    + IVA recaudado:{" "}
                    <span className="font-medium text-slate-700">
                      {formatoBase(resumenKpi.ivaBase)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    ≈{" "}
                    <span className="font-medium text-slate-700">
                      {monedaBase === "CRC"
                        ? formatearMoneda(resumenKpi.brutoUsd, "USD")
                        : `CRC ₡${formatoNumeroCr.format(resumenKpi.brutoCrc)}`}
                    </span>{" "}
                    <span className="text-[11px] text-slate-400">
                      (T.C. ref. BCCR ₡
                      {formatoNumeroCr.format(resumenKpi.tipoCambioRef)}/
                      {monedaBase === "CRC" ? "USD" : monedaBase} · estimado)
                    </span>
                  </p>
                </>
              }
              nota={`${transaccionesFiltradas.length} pago${plural} · ${resumenKpi.cupos} ${resumenKpi.cupos === 1 ? "cupo" : "cupos"}`}
            />

            <KpiCard
              icono={<Percent className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Comisión bancaria estimada"
              valor={formatoBase(resumenKpi.comisionesBase)}
              ayuda={
                <span
                  tabIndex={0}
                  title="Gasto deducible (al cliente se le factura el 100% del monto bruto)"
                  aria-label="Gasto deducible (al cliente se le factura el 100% del monto bruto)"
                  className="vuki-focus group/tip relative inline-flex h-6 w-6 shrink-0 cursor-help items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <Info className="h-3.5 w-3.5" aria-hidden="true" />
                  <span
                    role="tooltip"
                    className="pointer-events-none invisible absolute right-0 top-7 z-20 w-56 rounded-xl bg-vuki-ink px-3 py-2 text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg transition group-hover/tip:visible group-hover/tip:opacity-100 group-focus-visible/tip:visible group-focus-visible/tip:opacity-100"
                  >
                    Gasto deducible (al cliente se le factura el 100% del monto
                    bruto)
                  </span>
                </span>
              }
              detalle={
                <p className="text-xs leading-relaxed text-slate-500">
                  Gasto deducible (al cliente se le factura el 100% del monto
                  bruto)
                </p>
              }
              nota="4.25% pasarela · 0% comisión vuki"
            />

            <KpiCard
              icono={<Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Neto estimado a liquidar"
              valor={formatoBase(resumenKpi.netoBase)}
              detalle={
                <>
                  <p className="text-xs text-slate-500">
                    ≈{" "}
                    <span className="font-medium text-slate-700">
                      {monedaBase === "CRC"
                        ? formatearMoneda(resumenKpi.netoUsd, "USD")
                        : `CRC ₡${formatoNumeroCr.format(resumenKpi.netoCrc)}`}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Hacienda:{" "}
                    <span className="font-medium text-emerald-700">
                      {resumenKpi.facturadas} facturado
                      {resumenKpi.facturadas === 1 ? "" : "s"}
                    </span>
                    {" · "}
                    <span className="font-medium text-amber-700">
                      {resumenKpi.pendientesFactura} pendiente
                      {resumenKpi.pendientesFactura === 1 ? "" : "s"}
                    </span>
                  </p>
                </>
              }
              nota="95.75% después de pasarela"
              acento
            />
          </Lista>

          {/* Nota de transparencia 0% comisión + cuenta IBAN */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <ShieldCheck
                className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                <strong className="font-semibold text-slate-800">
                  Cero comisión de plataforma:
                </strong>{" "}
                vuki no descuenta porcentaje por reserva; el 4.25% es solo la
                estimación del procesador de tarjeta.
              </span>
            </div>

            {ibanVisible ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                <CreditCard
                  className="h-3.5 w-3.5 text-slate-400"
                  aria-hidden="true"
                />
                <span className="font-mono text-[11px] font-medium text-slate-700">
                  IBAN {ibanVisible}
                </span>
                {hrefPersonalizacion && (
                  <Link
                    href={`${hrefPersonalizacion}#liquidacion`}
                    className="vuki-focus font-semibold text-sky-700 hover:underline"
                  >
                    Editar
                  </Link>
                )}
              </div>
            ) : (
              hrefPersonalizacion && (
                <Link
                  href={`${hrefPersonalizacion}#liquidacion`}
                  className="vuki-focus font-semibold text-sky-700 hover:underline"
                >
                  Configurar cuenta IBAN →
                </Link>
              )
            )}
          </div>

          {/* Tarjetas operativas: reembolsos pendientes, cobros manuales y reservas pendientes */}
          {((reembolsosPendientes && reembolsosPendientes.cantidad > 0) ||
            manualesVisibles.cantidad > 0 ||
            (pendientesCobro && pendientesCobro.cantidad > 0)) && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {reembolsosPendientes && reembolsosPendientes.cantidad > 0 && (
                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-xs text-amber-950">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-amber-900">
                      <AlertTriangle
                        className="h-4 w-4 shrink-0 text-amber-600"
                        aria-hidden="true"
                      />
                      Reembolsos por gestionar ({reembolsosPendientes.cantidad})
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold text-amber-950">
                      {formatoBase(reembolsosPendientes.monto)}
                    </p>
                    <p className="mt-1 leading-relaxed text-amber-800">
                      Reservas pagadas que luego se cancelaron. Ya fueron
                      excluidas de tus ingresos brutos.
                    </p>
                  </div>
                  {hrefReservas && (
                    <Link
                      href={hrefReservas}
                      className="vuki-focus inline-flex items-center gap-1 font-semibold text-amber-950 hover:underline"
                    >
                      Revisar en Reservas
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}

              {manualesVisibles.cantidad > 0 && (
                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4 text-xs text-slate-700">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-900">
                      <HandCoins
                        className="h-4 w-4 shrink-0 text-emerald-600"
                        aria-hidden="true"
                      />
                      Cobros directos ({manualesVisibles.cantidad})
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold text-emerald-950">
                      {formatoBase(manualesVisibles.monto)}
                    </p>
                    <p className="mt-1 leading-relaxed text-slate-600">
                      Recibidos por SINPE o efectivo en reservas manuales. No
                      pasan por pasarela ni pagan el 4.25%.
                    </p>
                  </div>
                  {hrefReservas && (
                    <Link
                      href={hrefReservas}
                      className="vuki-focus inline-flex items-center gap-1 font-semibold text-emerald-900 hover:underline"
                    >
                      Ver en Reservas
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}

              {pendientesCobro && pendientesCobro.cantidad > 0 && (
                <div className="flex flex-col justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-700 shadow-sm">
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-slate-800">
                      <Clock
                        className="h-4 w-4 shrink-0 text-slate-500"
                        aria-hidden="true"
                      />
                      Reservas pendientes de pago ({pendientesCobro.cantidad})
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold text-vuki-ink">
                      {formatoBase(pendientesCobro.monto)}
                    </p>
                    <p className="mt-1 leading-relaxed text-slate-500">
                      Cupos apartados aún sin pago confirmado; no suman a tus
                      ingresos hasta cobrarse.
                    </p>
                  </div>
                  {hrefReservas && (
                    <Link
                      href={hrefReservas}
                      className="vuki-focus inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline"
                    >
                      Gestionar pendientes
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Desglose de ingresos por servicio con configuración fiscal */}
          <DesgloseServiciosTabla
            desgloseServicios={desgloseServicios}
            brutoTotal={resumenKpi.brutoBase}
          />

          {/* Historial detallado de pagos procesados por pasarela */}
          <section className="mt-8">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {filtrando
                  ? `Pagos del período (${transaccionesFiltradas.length})`
                  : "Pagos procesados por pasarela"}
              </h2>
              {!filtrando && transaccionesFiltradas.length > 10 && (
                <button
                  type="button"
                  onClick={() => setVerTodos((v) => !v)}
                  className="vuki-focus text-xs font-semibold text-sky-700 hover:underline"
                >
                  {verTodos
                    ? "Mostrar últimos 10"
                    : `Ver todos (${transaccionesFiltradas.length})`}
                </button>
              )}
            </div>

            {ultimos.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-8">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
                  <Wallet className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-display text-sm font-bold text-vuki-ink sm:text-base">
                  {filtrando
                    ? "No hay pagos por pasarela en estas fechas"
                    : "Aún no hay pagos procesados por pasarela"}
                </h3>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                  {filtrando
                    ? "Prueba ampliando el rango de fechas o limpia el filtro para ver todo tu historial."
                    : "Cuando tus clientes reserven y paguen en línea desde tu enlace público, cada liquidación aparecerá aquí con su desglose de IVA, comisión y estado en Hacienda."}
                </p>
                {filtrando && (
                  <button
                    type="button"
                    onClick={() => {
                      setDesde("");
                      setHasta("");
                    }}
                    className="vuki-focus mt-4 inline-flex min-h-9 items-center rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Ver todo el historial
                  </button>
                )}
              </div>
            ) : (
              <TablaPagosPasarela
                ultimos={ultimos}
                claveLista={`${desde}-${hasta}-${verTodos}`}
                modoDemo={modoDemo}
                onAbrirModalFactura={abrirModalFactura}
              />
            )}
          </section>

          <ModalComprobanteHacienda
            modalFactura={modalFactura}
            trxEnModal={trxEnModal}
            guardando={guardando}
            errorModal={errorModal}
            modoDemo={modoDemo}
            onChangeModal={setModalFactura}
            onCerrar={() => {
              setModalFactura(null);
              setErrorModal(null);
            }}
            onLimpiarError={() => setErrorModal(null)}
            onAutocompletarConsecutivo={autocompletarConsecutivoPrueba}
            onGuardar={guardarComprobante}
          />
        </>
      )}
    </EmpresaPage>
  );
}
