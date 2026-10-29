"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  FileCheck2,
  FileText,
  HandCoins,
  Info,
  Percent,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import EmpresaPage, { ItemLista, KpiCard, Lista } from "../EmpresaPage";
import { toast } from "../Toast";
import { descargarCsv } from "../../lib/csv";
import {
  EXCHANGE_RATE_BCCR_DEFAULT,
  etiquetaTarifaIva,
  etiquetaTipoIdentificacion,
  generarConsecutivoHaciendaMock,
  montoEnCrc,
  montoEnUsd,
  redondearMoneda,
  resumirServiciosFiscales,
} from "../../lib/finanzas";
import type {
  ClientIdType,
  FinancialTransaction,
  FiscalCurrency,
  ServiceFiscalSummary,
  VoucherType,
} from "../../types/finanzas";

export type { FinancialTransaction, ServiceFiscalSummary };

const CR_OFFSET_MS = -6 * 3_600_000;
const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

const TIPOS_ID_OPCIONES: { valor: Exclude<ClientIdType, null>; etiqueta: string }[] = [
  { valor: "fisica", etiqueta: "Cédula Física (9 dígitos)" },
  { valor: "juridica", etiqueta: "Cédula Jurídica (10 dígitos)" },
  { valor: "dimex", etiqueta: "DIMEX (11-12 dígitos)" },
  { valor: "nite", etiqueta: "NITE (10 dígitos)" },
  { valor: "extranjero", etiqueta: "Extranjero No Domiciliado" },
];

const formatoUsd = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const formatoNumeroCr = new Intl.NumberFormat("es-CR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatoMoneda(monto: number, currency: FiscalCurrency): string {
  if (currency === "CRC") {
    return `₡${formatoNumeroCr.format(monto)}`;
  }
  return formatoUsd.format(monto);
}

function partesCR(iso: string) {
  const cr = new Date(new Date(iso).getTime() + CR_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  const anio = cr.getUTCFullYear();
  const mes = cr.getUTCMonth();
  const dia = cr.getUTCDate();
  return {
    anio,
    mes,
    dia,
    diaSemana: cr.getUTCDay(),
    hora: cr.getUTCHours(),
    minuto: cr.getUTCMinutes(),
    clave: `${anio}-${p(mes + 1)}-${p(dia)}`,
  };
}

function diaCR(iso: string): string {
  return partesCR(iso).clave;
}

function fechaHoraCR(iso: string): string {
  const { anio, mes, dia, diaSemana, hora, minuto } = partesCR(iso);
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  const min = String(minuto).padStart(2, "0");
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  return `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes]} ${anio} · ${h12}:${min} ${sufijo}`;
}

function desplazarClave(clave: string, dias: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return "";
  const [y, m, d] = clave.split("-").map(Number);
  const f = new Date(y, m - 1, d + dias);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
}

function rangoMesActual(clave: string): { desde: string; hasta: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return { desde: "", hasta: "" };
  const [y, m] = clave.split("-").map(Number);
  const ultimoDia = new Date(y, m, 0).getDate();
  const p = (n: number) => String(n).padStart(2, "0");
  return {
    desde: `${y}-${p(m)}-01`,
    hasta: `${y}-${p(m)}-${p(ultimoDia)}`,
  };
}

function formatearIban(iban?: string | null): string | null {
  const limpio = (iban ?? "").replace(/\s+/g, "").trim();
  if (!limpio) return null;
  if (limpio.length <= 8) return limpio;
  return `${limpio.slice(0, 4)} •••• •••• ${limpio.slice(-4)}`;
}

interface ModalFacturaState {
  trxId: string;
  voucherType: VoucherType;
  clientName: string;
  clientIdType: Exclude<ClientIdType, null>;
  clientTaxId: string;
  consecutive: string;
}

/** Dashboard financiero con trazabilidad fiscal (Hacienda CR) para `/[slug]/admin/finanzas`. */
export default function FinanzasView({
  transacciones: transaccionesIniciales,
  error,
  reembolsosPendientes,
  pagosManuales,
  pendientesCobro,
  detalleManuales,
  cuentaIban,
  hoyClave,
  hrefReservas,
  hrefPersonalizacion,
}: {
  transacciones: FinancialTransaction[];
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
}) {
  const [listaTransacciones, setListaTransacciones] = useState<
    FinancialTransaction[]
  >(transaccionesIniciales);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [verTodos, setVerTodos] = useState(false);
  const [receptorAbiertoId, setReceptorAbiertoId] = useState<string | null>(
    null,
  );
  const [modalFactura, setModalFactura] = useState<ModalFacturaState | null>(
    null,
  );
  const [errorModal, setErrorModal] = useState<string | null>(null);

  useEffect(() => {
    setListaTransacciones(transaccionesIniciales);
  }, [transaccionesIniciales]);

  useEffect(() => {
    if (!modalFactura) return;
    function alPresionarEscape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setModalFactura(null);
        setErrorModal(null);
      }
    }
    window.addEventListener("keydown", alPresionarEscape);
    return () => window.removeEventListener("keydown", alPresionarEscape);
  }, [modalFactura]);

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

  const resumenKpi = useMemo(() => {
    let subtotalUsd = 0;
    let ivaUsd = 0;
    let brutoUsd = 0;
    let comisionesUsd = 0;
    let netoUsd = 0;
    let brutoCrc = 0;
    let netoCrc = 0;
    let cupos = 0;
    let facturadas = 0;

    for (const t of transaccionesFiltradas) {
      subtotalUsd += montoEnUsd(
        t.subtotal_amount,
        t.currency,
        t.exchange_rate_bccr,
      );
      ivaUsd += montoEnUsd(t.iva_amount, t.currency, t.exchange_rate_bccr);
      brutoUsd += montoEnUsd(t.gross_amount, t.currency, t.exchange_rate_bccr);
      comisionesUsd += montoEnUsd(
        t.gateway_fee_amount,
        t.currency,
        t.exchange_rate_bccr,
      );
      netoUsd += montoEnUsd(t.net_amount, t.currency, t.exchange_rate_bccr);
      brutoCrc += montoEnCrc(t.gross_amount, t.currency, t.exchange_rate_bccr);
      netoCrc += montoEnCrc(t.net_amount, t.currency, t.exchange_rate_bccr);
      cupos += t.cupos ?? 1;
      if (t.invoice_status === "issued") facturadas += 1;
    }

    const tipoCambioRef =
      transaccionesFiltradas[0]?.exchange_rate_bccr ??
      listaTransacciones[0]?.exchange_rate_bccr ??
      EXCHANGE_RATE_BCCR_DEFAULT;

    return {
      subtotalUsd: redondearMoneda(subtotalUsd),
      ivaUsd: redondearMoneda(ivaUsd),
      brutoUsd: redondearMoneda(brutoUsd),
      comisionesUsd: redondearMoneda(comisionesUsd),
      netoUsd: redondearMoneda(netoUsd),
      brutoCrc: redondearMoneda(brutoCrc),
      netoCrc: redondearMoneda(netoCrc),
      tipoCambioRef,
      cupos,
      facturadas,
      pendientesFactura: transaccionesFiltradas.length - facturadas,
    };
  }, [transaccionesFiltradas, listaTransacciones]);

  const desgloseServicios: ServiceFiscalSummary[] = useMemo(
    () => resumirServiciosFiscales(transaccionesFiltradas),
    [transaccionesFiltradas],
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
    if (!modalFactura) return;
    const indice =
      listaTransacciones.findIndex((t) => t.id === modalFactura.trxId) + 1;
    const sugerido = generarConsecutivoHaciendaMock(
      modalFactura.voucherType,
      indice > 0 ? indice : 1,
    );
    setModalFactura({ ...modalFactura, consecutive: sugerido });
  }

  function guardarComprobante(nuevoEstado: "pending" | "issued") {
    if (!modalFactura) return;
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

    setListaTransacciones((prev) =>
      prev.map((item) => {
        if (item.id !== modalFactura.trxId) return item;
        return {
          ...item,
          voucher_type: modalFactura.voucherType,
          client_name: esFE
            ? nombreLimpio
            : nombreLimpio || item.client_name || null,
          client_id_type: esFE ? modalFactura.clientIdType : null,
          client_tax_id: esFE ? idFiscalLimpio : null,
          invoice_status: nuevoEstado,
          invoice_consecutive:
            nuevoEstado === "issued" ? consecutivoLimpio || null : null,
        };
      }),
    );

    setModalFactura(null);
    setErrorModal(null);

    if (nuevoEstado === "issued") {
      toast.success(
        consecutivoLimpio
          ? `Comprobante marcado como Facturado (${consecutivoLimpio})`
          : "Comprobante marcado como Facturado",
      );
    } else {
      toast.success("Estado de factura actualizado a Pendiente");
    }
  }

  function exportar() {
    const sufijo = hoyClave || diaCR(new Date().toISOString());
    descargarCsv(
      `declaracion-d104-pagos-${sufijo}.csv`,
      [
        "Fecha_Servicio",
        "ID_Transaccion",
        "Servicio",
        "Codigo_CABYS",
        "Tipo_Comprobante",
        "Tipo_ID_Cliente",
        "Identificacion_Cliente",
        "Nombre_Cliente",
        "Correo_Cliente",
        "Moneda",
        "Tipo_Cambio_BCCR",
        "Subtotal_Sin_IVA",
        "Tarifa_IVA",
        "Monto_IVA",
        "Total_Bruto_Facturado",
        "Comision_Pasarela_Gasto",
        "Neto_Liquidado",
        "Estado_Factura",
        "Consecutivo_Hacienda",
      ],
      transaccionesFiltradas.map((t) => [
        fechaHoraCR(t.service_date),
        t.transaction_ref,
        t.service_name,
        t.cabys_code,
        t.voucher_type,
        t.client_id_type ?? "",
        t.client_tax_id ?? "",
        t.client_name ?? "",
        t.client_email,
        t.currency,
        t.exchange_rate_bccr.toFixed(2),
        t.subtotal_amount.toFixed(2),
        t.iva_rate.toFixed(2),
        t.iva_amount.toFixed(2),
        t.gross_amount.toFixed(2),
        t.gateway_fee_amount.toFixed(2),
        t.net_amount.toFixed(2),
        t.invoice_status === "issued" ? "Facturado" : "Pendiente",
        t.invoice_consecutive ?? "",
      ]),
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
                        className={`vuki-focus inline-flex min-h-9 items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          activo
                            ? "bg-vuki-ink text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
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
                    className="vuki-focus min-h-9 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-sky-500"
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
                    className="vuki-focus min-h-9 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-sky-500"
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
              valor={formatoUsd.format(resumenKpi.brutoUsd)}
              detalle={
                <>
                  <p className="text-xs text-slate-500">
                    Subtotal (sin IVA):{" "}
                    <span className="font-medium text-slate-700">
                      {formatoUsd.format(resumenKpi.subtotalUsd)}
                    </span>{" "}
                    + IVA recaudado:{" "}
                    <span className="font-medium text-slate-700">
                      {formatoUsd.format(resumenKpi.ivaUsd)}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    ≈{" "}
                    <span className="font-medium text-slate-700">
                      CRC ₡{formatoNumeroCr.format(resumenKpi.brutoCrc)}
                    </span>{" "}
                    <span className="text-[11px] text-slate-400">
                      (T.C. BCCR ₡{formatoNumeroCr.format(resumenKpi.tipoCambioRef)})
                    </span>
                  </p>
                </>
              }
              nota={`${transaccionesFiltradas.length} pago${plural} · ${resumenKpi.cupos} ${resumenKpi.cupos === 1 ? "cupo" : "cupos"}`}
            />

            <KpiCard
              icono={<Percent className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Comisión bancaria estimada"
              valor={formatoUsd.format(resumenKpi.comisionesUsd)}
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
              valor={formatoUsd.format(resumenKpi.netoUsd)}
              detalle={
                <>
                  <p className="text-xs text-slate-500">
                    ≈{" "}
                    <span className="font-medium text-slate-700">
                      CRC ₡{formatoNumeroCr.format(resumenKpi.netoCrc)}
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
                      Reembolsos por gestionar (
                      {reembolsosPendientes.cantidad})
                    </p>
                    <p className="mt-1.5 font-display text-lg font-bold text-amber-950">
                      {formatoUsd.format(reembolsosPendientes.monto)}
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
                      {formatoUsd.format(manualesVisibles.monto)}
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
                      {formatoUsd.format(pendientesCobro.monto)}
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
          {desgloseServicios.length > 0 && (
            <section className="mt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Ingresos por servicio
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {desgloseServicios.map((item) => {
                  const mostrarParticipacion =
                    desgloseServicios.length > 1 && resumenKpi.brutoUsd > 0;
                  const pct = mostrarParticipacion
                    ? Math.round((item.gross_amount / resumenKpi.brutoUsd) * 100)
                    : 0;
                  return (
                    <div
                      key={`${item.servicio_id ?? item.service_name}-${item.cabys_code}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate font-display text-sm font-bold text-vuki-ink">
                            {item.service_name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.transactions_count}{" "}
                            {item.transactions_count === 1 ? "pago" : "pagos"} ·{" "}
                            {item.total_cupos}{" "}
                            {item.total_cupos === 1 ? "cupo" : "cupos"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-display text-sm font-bold text-vuki-ink">
                            {formatoUsd.format(item.gross_amount)}
                          </p>
                          <p className="text-[11px] font-medium text-emerald-700">
                            Neto {formatoUsd.format(item.net_amount)}
                          </p>
                        </div>
                      </div>

                      {/* Badges discretos de configuración fiscal (CABYS + Tarifa IVA) */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span
                          title="Código del Catálogo de Bienes y Servicios (BCCR / Hacienda)"
                          className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600"
                        >
                          CABYS: {item.cabys_code}
                        </span>
                        <span
                          title="Tarifa del Impuesto al Valor Agregado configurada para el servicio"
                          className="inline-flex items-center rounded-lg border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
                        >
                          {etiquetaTarifaIva(item.iva_rate)}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-slate-500">
                        Subtotal {formatoUsd.format(item.subtotal_amount)} + IVA{" "}
                        {formatoUsd.format(item.iva_amount)}
                      </p>

                      {mostrarParticipacion && (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              style={{ width: `${Math.max(6, pct)}%` }}
                              className="h-full rounded-full bg-(--marca)"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500">
                            {pct}%
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

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
              <>
                {/* Tabla en escritorio / tablet */}
                <div
                  role="region"
                  aria-label="Pagos procesados"
                  tabIndex={0}
                  className="vuki-focus hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block"
                >
                  <table className="min-w-full text-left text-sm">
                    <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3.5 whitespace-nowrap">
                          Fecha del servicio
                        </th>
                        <th className="px-4 py-3.5">Servicio</th>
                        <th className="px-4 py-3.5">Cliente</th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          Impuestos
                        </th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          Bruto
                        </th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          Comisión (4.25%)
                        </th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          Neto
                        </th>
                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                          Hacienda / Factura
                        </th>
                      </tr>
                    </thead>
                    <Lista key={`${desde}-${hasta}-${verTodos}`} as="tbody">
                      {ultimos.map((pago) => {
                        const esFE = pago.voucher_type === "FE";
                        const receptorExpandido =
                          receptorAbiertoId === pago.id;
                        const mostrarDetalleReceptor =
                          esFE || receptorExpandido;
                        const esFacturado = pago.invoice_status === "issued";
                        const tituloComprobante = esFE
                          ? `Factura Electrónica (FE) · Receptor: ${pago.client_name ?? "Sin nombre"} (${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id ?? "—"})`
                          : `Tiquete Electrónico (TE) · Receptor: ${pago.client_name ?? "Consumidor final / Turista"} (${pago.client_tax_id ?? "sin cédula requerida"}). Clic para ver detalle.`;

                        return (
                          <ItemLista
                            as="tr"
                            key={pago.id}
                            className="border-b border-slate-100 align-top last:border-0"
                          >
                            <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                              <p className="font-medium">
                                {fechaHoraCR(pago.service_date)}
                              </p>
                              {pago.transaction_ref && (
                                <p className="font-mono text-[11px] text-slate-400">
                                  {pago.transaction_ref}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <p className="font-medium text-slate-800">
                                {pago.service_name}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                {pago.cupos !== undefined && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                                    <Users
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                    {pago.cupos}{" "}
                                    {pago.cupos === 1 ? "persona" : "personas"}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Columna CLIENTE + badge TE/FE + datos del receptor */}
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="font-medium text-slate-900">
                                  {pago.client_email}
                                </span>
                                <button
                                  type="button"
                                  title={tituloComprobante}
                                  aria-expanded={receptorExpandido}
                                  onClick={() =>
                                    setReceptorAbiertoId((prev) =>
                                      prev === pago.id ? null : pago.id,
                                    )
                                  }
                                  className={`vuki-focus inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide transition ${
                                    esFE
                                      ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100"
                                      : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90 hover:bg-slate-200/70"
                                  }`}
                                >
                                  {pago.voucher_type}
                                </button>
                              </div>

                              {mostrarDetalleReceptor && (
                                <div className="mt-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs text-slate-600">
                                  <p className="font-medium text-slate-800">
                                    {pago.client_name ||
                                      "Consumidor final (Turista)"}
                                  </p>
                                  <p className="font-mono text-[11px] text-slate-500">
                                    {pago.client_tax_id
                                      ? `${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id}`
                                      : "Tiquete Electrónico · Sin cédula requerida"}
                                  </p>
                                  {receptorExpandido && (
                                    <button
                                      type="button"
                                      onClick={() => abrirModalFactura(pago)}
                                      className="vuki-focus mt-1 text-[11px] font-semibold text-sky-700 hover:underline"
                                    >
                                      {esFE
                                        ? "Editar receptor fiscal"
                                        : "Configurar receptor (FE)"}
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>

                            {/* Nueva columna IMPUESTOS (entre CLIENTE y BRUTO) */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <p className="text-xs font-medium text-slate-700">
                                Sub:{" "}
                                {formatoMoneda(
                                  pago.subtotal_amount,
                                  pago.currency,
                                )}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                IVA ({Math.round(pago.iva_rate * 100)}%):{" "}
                                {formatoMoneda(pago.iva_amount, pago.currency)}
                              </p>
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-medium text-slate-800">
                              {formatoMoneda(pago.gross_amount, pago.currency)}
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap text-xs text-slate-500">
                              −
                              {formatoMoneda(
                                pago.gateway_fee_amount,
                                pago.currency,
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-right whitespace-nowrap font-display font-bold text-emerald-800">
                              {formatoMoneda(pago.net_amount, pago.currency)}
                            </td>

                            {/* Nueva columna HACIENDA / FACTURA (al final de la fila) */}
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => abrirModalFactura(pago)}
                                title={
                                  esFacturado
                                    ? "Comprobante emitido · Clic para ver o editar consecutivo"
                                    : "Clic para marcar como Facturado o ingresar consecutivo de Hacienda"
                                }
                                className={`vuki-focus inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                                  esFacturado
                                    ? "bg-[#10B981]/12 text-emerald-900 ring-1 ring-[#10B981]/35 hover:bg-[#10B981]/20"
                                    : "bg-amber-50 text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                                }`}
                              >
                                {esFacturado ? (
                                  <CheckCircle2
                                    className="h-3.5 w-3.5 text-[#10B981]"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <span
                                    aria-hidden="true"
                                    className="h-1.5 w-1.5 rounded-full bg-amber-500"
                                  />
                                )}
                                {esFacturado ? "Facturado" : "Pendiente"}
                              </button>
                              {esFacturado && pago.invoice_consecutive && (
                                <p
                                  title="Consecutivo Ministerio de Hacienda"
                                  className="mt-1 font-mono text-[11px] text-slate-500"
                                >
                                  {pago.invoice_consecutive}
                                </p>
                              )}
                            </td>
                          </ItemLista>
                        );
                      })}
                    </Lista>
                  </table>
                </div>

                {/* Tarjetas responsivas en móvil (< sm) */}
                <Lista
                  key={`movil-${desde}-${hasta}-${verTodos}`}
                  as="ul"
                  className="space-y-3 sm:hidden"
                >
                  {ultimos.map((pago) => {
                    const esFE = pago.voucher_type === "FE";
                    const esFacturado = pago.invoice_status === "issued";
                    const receptorExpandido = receptorAbiertoId === pago.id;

                    return (
                      <ItemLista
                        as="li"
                        key={pago.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-display text-sm font-bold text-vuki-ink">
                              {pago.service_name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {fechaHoraCR(pago.service_date)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-display text-sm font-bold text-emerald-800">
                            {formatoMoneda(pago.net_amount, pago.currency)}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                          <div className="flex min-w-0 items-center gap-1.5">
                            <span className="truncate font-medium text-slate-800">
                              {pago.client_email}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setReceptorAbiertoId((prev) =>
                                  prev === pago.id ? null : pago.id,
                                )
                              }
                              className={`vuki-focus shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                                esFE
                                  ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200"
                                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                              }`}
                            >
                              {pago.voucher_type}
                            </button>
                          </div>

                          {pago.cupos !== undefined && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px]">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {pago.cupos}{" "}
                              {pago.cupos === 1 ? "persona" : "personas"}
                            </span>
                          )}
                        </div>

                        {(esFE || receptorExpandido) && (
                          <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                            <p className="font-medium text-slate-800">
                              {pago.client_name || "Consumidor final (Turista)"}
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              {pago.client_tax_id
                                ? `${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id}`
                                : "Tiquete Electrónico · Sin cédula requerida"}
                            </p>
                          </div>
                        )}

                        <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                          <div className="flex items-center justify-between">
                            <span>
                              Sub:{" "}
                              {formatoMoneda(
                                pago.subtotal_amount,
                                pago.currency,
                              )}{" "}
                              + IVA ({Math.round(pago.iva_rate * 100)}%):{" "}
                              {formatoMoneda(pago.iva_amount, pago.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>
                              Bruto:{" "}
                              {formatoMoneda(pago.gross_amount, pago.currency)}
                            </span>
                            <span>
                              Comisión 4.25%: −
                              {formatoMoneda(
                                pago.gateway_fee_amount,
                                pago.currency,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                          <span className="font-mono text-[11px] text-slate-400">
                            {pago.invoice_consecutive || pago.transaction_ref}
                          </span>
                          <button
                            type="button"
                            onClick={() => abrirModalFactura(pago)}
                            className={`vuki-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition ${
                              esFacturado
                                ? "bg-[#10B981]/12 text-emerald-900 ring-1 ring-[#10B981]/35"
                                : "bg-amber-50 text-amber-800 ring-1 ring-amber-200"
                            }`}
                          >
                            {esFacturado ? (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-[#10B981]"
                                aria-hidden="true"
                              />
                            ) : (
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                              />
                            )}
                            {esFacturado ? "Facturado" : "Pendiente"}
                          </button>
                        </div>
                      </ItemLista>
                    );
                  })}
                </Lista>
              </>
            )}
          </section>

          {/* Modal interactivo de trazabilidad Hacienda / Comprobante Electrónico */}
          {modalFactura && trxEnModal && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-modal-hacienda"
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setModalFactura(null);
                  setErrorModal(null);
                }
              }}
            >
              <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-vuki-ocean">
                      <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3
                        id="titulo-modal-hacienda"
                        className="font-display text-base font-bold text-vuki-ink"
                      >
                        Comprobante electrónico
                      </h3>
                      <p className="text-xs text-slate-500">
                        Ministerio de Hacienda · Trazabilidad local (mock)
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="Cerrar ventana"
                    onClick={() => {
                      setModalFactura(null);
                      setErrorModal(null);
                    }}
                    className="vuki-focus inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                {/* Resumen fiscal del pago */}
                <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-vuki-ink">
                      {trxEnModal.service_name}
                    </span>
                    <span className="font-display text-sm font-bold text-vuki-ink">
                      {formatoMoneda(
                        trxEnModal.gross_amount,
                        trxEnModal.currency,
                      )}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-slate-500">
                    <span>
                      Subtotal{" "}
                      {formatoMoneda(
                        trxEnModal.subtotal_amount,
                        trxEnModal.currency,
                      )}{" "}
                      + IVA ({Math.round(trxEnModal.iva_rate * 100)}%){" "}
                      {formatoMoneda(trxEnModal.iva_amount, trxEnModal.currency)}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      CABYS {trxEnModal.cabys_code}
                    </span>
                  </div>
                </div>

                <div className="mt-4 space-y-3.5">
                  {/* Selector TE / FE */}
                  <div>
                    <span className="block text-xs font-semibold text-slate-700">
                      Tipo de comprobante
                    </span>
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      {(
                        [
                          {
                            tipo: "TE" as const,
                            titulo: "TE · Tiquete",
                            sub: "Turista / consumidor final",
                          },
                          {
                            tipo: "FE" as const,
                            titulo: "FE · Factura",
                            sub: "Con cédula del receptor",
                          },
                        ] as const
                      ).map((op) => {
                        const seleccionado =
                          modalFactura.voucherType === op.tipo;
                        return (
                          <button
                            key={op.tipo}
                            type="button"
                            aria-pressed={seleccionado}
                            onClick={() => {
                              setErrorModal(null);
                              setModalFactura({
                                ...modalFactura,
                                voucherType: op.tipo,
                              });
                            }}
                            className={`vuki-focus rounded-2xl border p-2.5 text-left transition ${
                              seleccionado
                                ? "border-vuki-ocean bg-sky-50/70 ring-1 ring-vuki-ocean"
                                : "border-slate-200 bg-white hover:bg-slate-50"
                            }`}
                          >
                            <p className="flex items-center gap-1.5 text-xs font-bold text-vuki-ink">
                              <FileText
                                className="h-3.5 w-3.5 text-vuki-ocean"
                                aria-hidden="true"
                              />
                              {op.titulo}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {op.sub}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Datos del receptor si se selecciona FE */}
                  {modalFactura.voucherType === "FE" && (
                    <div className="space-y-2.5 rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5">
                      <label className="block text-xs font-medium text-slate-700">
                        Nombre o razón social del receptor
                        <input
                          type="text"
                          value={modalFactura.clientName}
                          onChange={(e) =>
                            setModalFactura({
                              ...modalFactura,
                              clientName: e.target.value,
                            })
                          }
                          placeholder="Ej. Inversiones Arenal S.A."
                          className="vuki-focus mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-900"
                        />
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className="block text-xs font-medium text-slate-700">
                          Tipo de ID
                          <select
                            value={modalFactura.clientIdType}
                            onChange={(e) =>
                              setModalFactura({
                                ...modalFactura,
                                clientIdType: e.target.value as Exclude<
                                  ClientIdType,
                                  null
                                >,
                              })
                            }
                            className="vuki-focus mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900"
                          >
                            {TIPOS_ID_OPCIONES.map((op) => (
                              <option key={op.valor} value={op.valor}>
                                {op.etiqueta}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-xs font-medium text-slate-700">
                          Identificación / Cédula
                          <input
                            type="text"
                            value={modalFactura.clientTaxId}
                            onChange={(e) =>
                              setModalFactura({
                                ...modalFactura,
                                clientTaxId: e.target.value,
                              })
                            }
                            placeholder="Ej. 3-101-123456"
                            className="vuki-focus mt-1 min-h-9 w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Consecutivo Hacienda (opcional) */}
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="input-consecutivo-hacienda"
                        className="text-xs font-semibold text-slate-700"
                      >
                        Consecutivo Hacienda{" "}
                        <span className="font-normal text-slate-400">
                          (opcional)
                        </span>
                      </label>
                      <button
                        type="button"
                        onClick={autocompletarConsecutivoPrueba}
                        className="vuki-focus inline-flex items-center gap-1 text-[11px] font-semibold text-vuki-ocean hover:underline"
                      >
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Generar de prueba
                      </button>
                    </div>
                    <input
                      id="input-consecutivo-hacienda"
                      type="text"
                      maxLength={50}
                      value={modalFactura.consecutive}
                      onChange={(e) =>
                        setModalFactura({
                          ...modalFactura,
                          consecutive: e.target.value,
                        })
                      }
                      placeholder="Ej. 00100001040000000001"
                      className="vuki-focus mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900 placeholder:text-slate-400"
                    />
                  </div>

                  {errorModal && (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      {errorModal}
                    </p>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
                  {trxEnModal.invoice_status === "issued" && (
                    <button
                      type="button"
                      onClick={() => guardarComprobante("pending")}
                      className="vuki-focus mr-auto inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                    >
                      Volver a Pendiente
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setModalFactura(null);
                      setErrorModal(null);
                    }}
                    className="vuki-focus inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => guardarComprobante("issued")}
                    className="vuki-focus inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                  >
                    <CheckCircle2
                      className="h-4 w-4 text-[#10B981]"
                      aria-hidden="true"
                    />
                    {trxEnModal.invoice_status === "issued"
                      ? "Guardar cambios"
                      : "Marcar como Facturado"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </EmpresaPage>
  );
}
