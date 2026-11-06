"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Download,
  Plus,
  Search,
} from "lucide-react";
import EmpresaPage from "../EmpresaPage";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { descargarCsv } from "../../lib/csv";
import { esPagoManual, esTrxPasarela } from "../../lib/pagos";
import { esTransaccionSimulada, formatearMoneda } from "@/lib/formato";
import {
  convertirMoneda,
  redondearMoneda,
  type CodigoMoneda,
} from "@/lib/monedas";
import { mensajeErrorUsuario } from "../../lib/errores";
import { diaCR, fechaHoraCR } from "@/lib/zona-horaria";
import TablaReservasEmpresa from "./reservas/TablaReservasEmpresa";
import NuevaReservaManualDrawer from "./reservas/NuevaReservaManualDrawer";

export interface VistaReserva {
  id: string;
  fechaIso: string;
  cliente: string;
  email?: string;
  servicio: string;
  horario?: string;
  cupos?: number;
  /** Venta directa de un ítem (descuenta stock, sin horario). */
  esItem?: boolean;
  estado: "pendiente" | "pagada" | "cancelada";
  monto?: number;
  /** Monto esperado según tarifa × cupos (útil en reservas pendientes o reembolsos). */
  montoEstimado?: number;
  moneda?: CodigoMoneda;
  tipoCambioBccr?: number;
  trxId?: string | null;
}

export interface HorarioManual {
  id: string;
  label: string;
  servicioNombre?: string;
  fechaHora?: string;
  duracionMin?: number;
  precioUsd?: number;
  moneda?: CodigoMoneda;
  cuposDisponibles: number;
}

/** Ítem de venta directa disponible para registrar una venta manual (ferias). */
export interface ItemManual {
  servicioId: string;
  nombre: string;
  stock: number;
  precioUsd?: number;
  moneda?: CodigoMoneda;
}

export type OpcionHorarioManual = HorarioManual;

interface ReservasViewProps {
  reservas: VistaReserva[];
  monedaNegocio?: CodigoMoneda;
  mensajeVacio?: React.ReactNode;
  hoyClave?: string;
  ahoraIso?: string;
  ahoraMs?: number;
  abrirManualInicial?: boolean;
  onCerrarManualInicial?: () => void;
  hrefHorarios?: string;
  hrefCalendario?: string;
  manual?: {
    horarios?: HorarioManual[];
    horariosDisponibles?: HorarioManual[];
    items?: ItemManual[];
    onCrear: (datos: {
      horarioId?: string;
      servicioId?: string;
      nombre: string;
      email: string;
      cupos: number;
      pagada: boolean;
      moneda?: CodigoMoneda;
    }) => Promise<string | null | undefined | void> | void;
  };
  onCancelar?: (id: string) => Promise<string | null | undefined | void> | void;
  onMarcarPagada?: (
    id: string,
  ) => Promise<string | null | undefined | void> | void;
}

type VistaRapida =
  | "todas"
  | "proximas"
  | "hoy"
  | "pagadas"
  | "pendientes"
  | "canceladas";

type OrdenReservas = "proximas" | "recientes";

export default function ReservasView({
  reservas,
  monedaNegocio = "USD",
  mensajeVacio,
  hoyClave = "",
  ahoraIso,
  ahoraMs: ahoraMsProp,
  abrirManualInicial = false,
  onCerrarManualInicial,
  hrefHorarios,
  hrefCalendario,
  manual,
  onCancelar,
  onMarcarPagada,
}: ReservasViewProps) {
  const [texto, setTexto] = useState("");
  const [vista, setVista] = useState<VistaRapida>("todas");
  const [servicio, setServicio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [orden, setOrden] = useState<OrdenReservas>("proximas");
  const [porCancelar, setPorCancelar] = useState<VistaReserva | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [confirmandoPagoId, setConfirmandoPagoId] = useState<string | null>(
    null,
  );
  const [abierto, setAbierto] = useState(abrirManualInicial);

  const ahoraMs = useMemo(
    () => ahoraMsProp ?? (ahoraIso ? new Date(ahoraIso).getTime() : 0),
    [ahoraMsProp, ahoraIso],
  );

  const servicios = useMemo(
    () =>
      Array.from(new Set(reservas.map((r) => r.servicio))).sort((a, b) =>
        a.localeCompare(b, "es"),
      ),
    [reservas],
  );

  const resumen = useMemo(() => {
    let proximasCount = 0;
    let proximasPersonas = 0;
    let hoyCount = 0;
    let hoyPersonas = 0;
    let pagadasCount = 0;
    let pagadasMonto = 0;
    let pendientesCount = 0;
    let canceladasCount = 0;

    for (const r of reservas) {
      const clave = diaCR(r.fechaIso);
      const cupos = r.cupos ?? 1;

      if (r.estado === "cancelada") {
        canceladasCount++;
        continue;
      }

      if (!r.esItem && hoyClave && clave >= hoyClave) {
        proximasCount++;
        proximasPersonas += cupos;
      }
      if (!r.esItem && hoyClave && clave === hoyClave) {
        hoyCount++;
        hoyPersonas += cupos;
      }
      if (r.estado === "pagada") {
        pagadasCount++;
        const nominal = r.monto ?? r.montoEstimado ?? 0;
        pagadasMonto += convertirMoneda(
          nominal,
          r.moneda ?? monedaNegocio,
          monedaNegocio,
          r.tipoCambioBccr,
        );
      } else if (r.estado === "pendiente") {
        pendientesCount++;
      }
    }

    return {
      proximasCount,
      proximasPersonas,
      hoyCount,
      hoyPersonas,
      pagadasCount,
      pagadasMonto: redondearMoneda(pagadasMonto),
      pendientesCount,
      canceladasCount,
    };
  }, [reservas, hoyClave, monedaNegocio]);

  const filtradas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    const lista = reservas.filter((r) => {
      const clave = diaCR(r.fechaIso);

      if (vista === "proximas") {
        if (r.estado === "cancelada" || r.esItem) return false;
        if (hoyClave && clave < hoyClave) return false;
      } else if (vista === "hoy") {
        if (r.estado === "cancelada" || r.esItem) return false;
        if (!hoyClave || clave !== hoyClave) return false;
      } else if (vista === "pagadas") {
        if (r.estado !== "pagada") return false;
      } else if (vista === "pendientes") {
        if (r.estado !== "pendiente") return false;
      } else if (vista === "canceladas") {
        if (r.estado !== "cancelada") return false;
      }

      if (servicio && r.servicio !== servicio) return false;
      if (desde && clave < desde) return false;
      if (hasta && clave > hasta) return false;

      if (q) {
        const coincide =
          r.cliente.toLowerCase().includes(q) ||
          (r.email?.toLowerCase().includes(q) ?? false) ||
          r.servicio.toLowerCase().includes(q) ||
          (r.trxId?.toLowerCase().includes(q) ?? false);
        if (!coincide) return false;
      }
      return true;
    });

    return [...lista].sort((a, b) => {
      if (orden === "recientes") {
        return b.fechaIso.localeCompare(a.fechaIso);
      }
      const aActiva = a.estado !== "cancelada";
      const bActiva = b.estado !== "cancelada";
      if (aActiva !== bActiva) return aActiva ? -1 : 1;

      const claveA = diaCR(a.fechaIso);
      const claveB = diaCR(b.fechaIso);
      const aFutura = !hoyClave || claveA >= hoyClave;
      const bFutura = !hoyClave || claveB >= hoyClave;
      if (aFutura !== bFutura) return aFutura ? -1 : 1;

      return aFutura
        ? a.fechaIso.localeCompare(b.fechaIso)
        : b.fechaIso.localeCompare(a.fechaIso);
    });
  }, [reservas, texto, vista, servicio, desde, hasta, orden, hoyClave]);

  const hayFiltros = Boolean(
    texto || vista !== "todas" || servicio || desde || hasta,
  );

  function limpiarFiltros() {
    setTexto("");
    setVista("todas");
    setServicio("");
    setDesde("");
    setHasta("");
  }

  function exportar() {
    if (filtradas.length === 0) return;
    descargarCsv(
      `reservas_${hoyClave || new Date().toISOString().slice(0, 10)}.csv`,
      [
        "ID",
        "Fecha y hora (CR)",
        "Cliente",
        "Email",
        "Servicio",
        "Cupos",
        "Estado",
        "Monto",
        "Moneda",
        "Canal de pago",
        "Transacción",
      ],
      filtradas.map((r) => [
        r.id,
        fechaHoraCR(r.fechaIso),
        r.cliente,
        r.email ?? "",
        r.servicio,
        r.cupos ?? 1,
        r.estado,
        r.monto ?? r.montoEstimado ?? "",
        r.moneda ?? monedaNegocio,
        esTrxPasarela(r.trxId)
          ? esTransaccionSimulada(r.trxId)
            ? "Pasarela simulada (demo)"
            : "Pasarela Vualá"
          : esPagoManual(r.trxId) || r.estado !== "cancelada"
            ? "Cobro directo"
            : "",
        r.trxId ?? "",
      ]),
    );
    toast.success(`Exportadas ${filtradas.length} reservas a CSV`);
  }

  async function confirmarCancelacion() {
    if (!porCancelar || !onCancelar || cancelando) return;
    setCancelando(true);
    try {
      const error = await onCancelar(porCancelar.id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(`Reserva de ${porCancelar.cliente} cancelada`);
      setPorCancelar(null);
    } catch (e) {
      toast.error(
        mensajeErrorUsuario(
          e,
          "No se pudo cancelar la reserva. Intenta de nuevo.",
        ),
      );
    } finally {
      setCancelando(false);
    }
  }

  async function handleMarcarPagada(id: string) {
    if (!onMarcarPagada || confirmandoPagoId) return;
    setConfirmandoPagoId(id);
    try {
      const error = await onMarcarPagada(id);
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Cobro confirmado como pagado");
    } catch (e) {
      toast.error(
        mensajeErrorUsuario(
          e,
          "No se pudo actualizar el cobro. Intenta de nuevo.",
        ),
      );
    } finally {
      setConfirmandoPagoId(null);
    }
  }

  function cerrarManual() {
    setAbierto(false);
    onCerrarManualInicial?.();
  }

  const itemsManual = manual?.items ?? [];
  const itemsConStock = itemsManual.filter((i) => i.stock > 0);
  const horariosDisponibles =
    manual?.horariosDisponibles ?? manual?.horarios ?? [];
  const horariosConCupo = horariosDisponibles.filter(
    (h) => h.cuposDisponibles > 0,
  );

  const pestanas: { id: VistaRapida; etiqueta: string; conteo: number }[] = [
    { id: "todas", etiqueta: "Todas", conteo: reservas.length },
    { id: "proximas", etiqueta: "Próximas", conteo: resumen.proximasCount },
    ...(hoyClave
      ? [{ id: "hoy" as const, etiqueta: "Hoy", conteo: resumen.hoyCount }]
      : []),
    { id: "pagadas", etiqueta: "Pagadas", conteo: resumen.pagadasCount },
    {
      id: "pendientes",
      etiqueta: "Pendientes",
      conteo: resumen.pendientesCount,
    },
    ...(resumen.canceladasCount > 0 || vista === "canceladas"
      ? [
          {
            id: "canceladas" as const,
            etiqueta: "Canceladas",
            conteo: resumen.canceladasCount,
          },
        ]
      : []),
  ];

  const descripcionCancelacion = porCancelar
    ? (() => {
        const unidadTxt = porCancelar.esItem
          ? (porCancelar.cupos ?? 1) === 1
            ? "ítem"
            : "ítems"
          : (porCancelar.cupos ?? 1) === 1
            ? "cupo"
            : "cupos";
        const cuposTxt = `${porCancelar.cupos ?? 1} ${unidadTxt}`;
        const base = porCancelar.esItem
          ? `Se cancelará la venta de \"${porCancelar.cliente}\" de ${porCancelar.servicio} y se devolverán ${cuposTxt} al stock.`
          : `Se cancelará la reserva de \"${porCancelar.cliente}\" para ${porCancelar.servicio} (${fechaHoraCR(porCancelar.fechaIso)}) y se liberarán ${cuposTxt}.`;
        if (
          porCancelar.estado === "pagada" &&
          esTrxPasarela(porCancelar.trxId)
        ) {
          const m = porCancelar.monto ?? porCancelar.montoEstimado;
          const mon = porCancelar.moneda ?? monedaNegocio;
          return `${base} Como tiene un pago por pasarela${m !== undefined ? ` (${formatearMoneda(m, mon, { mostrarCodigo: mon !== monedaNegocio })})` : ""}, quedará señalada con reembolso pendiente en Finanzas.`;
        }
        if (porCancelar.estado === "pagada") {
          return `${base} Si ya recibiste el pago directo, recuerda coordinar la devolución con el cliente.`;
        }
        return base;
      })()
    : "";

  return (
    <EmpresaPage
      titulo="Reservas"
      descripcion="Gestiona quién asiste a cada salida, registra reservas por teléfono o WhatsApp y exporta tus listas."
      accion={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {hrefCalendario && (
            <Link
              href={hrefCalendario}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Calendario
            </Link>
          )}
          <button
            type="button"
            onClick={exportar}
            disabled={filtradas.length === 0}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar CSV
            {hayFiltros && filtradas.length > 0 ? ` (${filtradas.length})` : ""}
          </button>
          {manual && (
            <motion.button
              type="button"
              onClick={() => setAbierto(true)}
              whileTap={{ scale: 0.96 }}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:flex-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reserva / venta manual
            </motion.button>
          )}
        </div>
      }
    >
      {reservas.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-base font-bold text-vuki-ink sm:text-lg">
            {typeof mensajeVacio === "string"
              ? mensajeVacio
              : "Aún no hay reservas registradas"}
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
            Cuando un turista reserve desde tu enlace público aparecerá aquí
            automáticamente. También puedes anotar reservas recibidas por
            WhatsApp o teléfono.
          </p>
          {manual && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setAbierto(true)}
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Registrar reserva manual
              </button>
              {hrefHorarios && horariosConCupo.length === 0 && itemsConStock.length === 0 && (
                <Link
                  href={`${hrefHorarios}?nuevo=1`}
                  className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  Publicar horarios
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Resumen operativo rápido */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <button
              type="button"
              onClick={() =>
                setVista(vista === "proximas" ? "todas" : "proximas")
              }
              className={`vuki-focus rounded-2xl border p-3.5 text-left shadow-sm transition ${
                vista === "proximas"
                  ? "border-(--marca) bg-(--marca-fondo) ring-1 ring-(--marca-borde)"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">
                Próximas salidas
              </p>
              <p className="mt-1 font-display text-xl font-bold text-vuki-ink">
                {resumen.proximasCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {resumen.proximasPersonas}{" "}
                {resumen.proximasPersonas === 1 ? "persona" : "personas"}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                hoyClave && setVista(vista === "hoy" ? "todas" : "hoy")
              }
              className={`vuki-focus rounded-2xl border p-3.5 text-left shadow-sm transition ${
                vista === "hoy"
                  ? "border-(--marca) bg-(--marca-fondo) ring-1 ring-(--marca-borde)"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">Para hoy</p>
              <p className="mt-1 font-display text-xl font-bold text-vuki-ink">
                {resumen.hoyCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {resumen.hoyCount === 0
                  ? "Sin salidas hoy"
                  : `${resumen.hoyPersonas} ${resumen.hoyPersonas === 1 ? "persona" : "personas"}`}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setVista(vista === "pagadas" ? "todas" : "pagadas")
              }
              className={`vuki-focus rounded-2xl border p-3.5 text-left shadow-sm transition ${
                vista === "pagadas"
                  ? "border-emerald-400 bg-emerald-50/70"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">Pagadas</p>
              <p className="mt-1 font-display text-xl font-bold text-emerald-800">
                {resumen.pagadasCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatearMoneda(resumen.pagadasMonto, monedaNegocio)} acumulados
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                setVista(vista === "pendientes" ? "todas" : "pendientes")
              }
              className={`vuki-focus rounded-2xl border p-3.5 text-left shadow-sm transition ${
                vista === "pendientes"
                  ? "border-amber-400 bg-amber-50"
                  : resumen.pendientesCount > 0
                    ? "border-amber-200 bg-amber-50/40 hover:border-amber-300"
                    : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-xs font-semibold text-slate-500">
                Pendientes de pago
              </p>
              <p
                className={`mt-1 font-display text-xl font-bold ${
                  resumen.pendientesCount > 0
                    ? "text-amber-800"
                    : "text-vuki-ink"
                }`}
              >
                {resumen.pendientesCount}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {resumen.pendientesCount > 0
                  ? "Por confirmar cobro"
                  : "Todo al día"}
              </p>
            </button>
          </div>

          {/* Pestañas rápidas + buscador y filtros */}
          <div className="mb-5 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div
                role="group"
                aria-label="Filtrar reservas por estado o período"
                className="flex flex-wrap items-center gap-1.5"
              >
                {pestanas.map((tab) => {
                  const activa = vista === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      aria-pressed={activa}
                      onClick={() => setVista(tab.id)}
                      className={`vuki-tab-pill ${activa ? "vuki-tab-pill-active" : ""}`}
                    >
                      {tab.etiqueta}
                      <span
                        className={
                          activa
                            ? "vuki-tab-pill-badge-active"
                            : "vuki-tab-pill-badge"
                        }
                      >
                        {tab.conteo}
                      </span>
                    </button>
                  );
                })}
              </div>

              <select
                aria-label="Ordenar reservas"
                value={orden}
                onChange={(e) => setOrden(e.target.value as OrdenReservas)}
                className="vuki-select-sm"
              >
                <option value="proximas">Orden: Próximas primero</option>
                <option value="recientes">Orden: Más recientes</option>
              </select>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
              <div
                className={`relative min-w-0 ${
                  servicios.length > 1 ? "lg:col-span-2" : "lg:col-span-3"
                }`}
              >
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  aria-label="Buscar reservas"
                  placeholder="Buscar cliente, correo, servicio o transacción..."
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  className="vuki-input-search pr-3"
                />
              </div>

              {servicios.length > 1 && (
                <select
                  aria-label="Filtrar por servicio"
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="vuki-select"
                >
                  <option value="">Todos los servicios</option>
                  {servicios.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-2 gap-2 sm:col-span-2 lg:col-span-2">
                <label className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span className="shrink-0">Desde</span>
                  <input
                    type="date"
                    aria-label="Desde fecha"
                    title="Desde fecha"
                    value={desde}
                    max={hasta || undefined}
                    onChange={(e) => setDesde(e.target.value)}
                    className="vuki-input flex-1 px-2.5 text-xs sm:text-sm"
                  />
                </label>
                <label className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span className="shrink-0">Hasta</span>
                  <input
                    type="date"
                    aria-label="Hasta fecha"
                    title="Hasta fecha"
                    value={hasta}
                    min={desde || undefined}
                    onChange={(e) => setHasta(e.target.value)}
                    className="vuki-input flex-1 px-2.5 text-xs sm:text-sm"
                  />
                </label>
              </div>
            </div>

            {hayFiltros && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                <span>
                  Mostrando{" "}
                  <strong className="font-semibold text-slate-700">
                    {filtradas.length}
                  </strong>{" "}
                  de {reservas.length} reservas
                </span>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="vuki-focus rounded-lg px-2 py-1 font-semibold text-sky-700 hover:bg-sky-50"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {filtradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
              <p>Ninguna reserva coincide con los filtros actuales.</p>
              {hayFiltros && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="vuki-focus mt-3 inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Ver todas las reservas
                </button>
              )}
            </div>
          ) : (
            <TablaReservasEmpresa
              reservasFiltradas={filtradas}
              monedaNegocio={monedaNegocio}
              hoyClave={hoyClave}
              ahoraMs={ahoraMs}
              confirmandoPagoId={confirmandoPagoId}
              onMarcarPagada={onMarcarPagada ? handleMarcarPagada : undefined}
              onCancelar={
                onCancelar
                  ? async (id) => {
                      const err = await onCancelar(id);
                      return err ?? null;
                    }
                  : undefined
              }
              onSolicitarCancelar={setPorCancelar}
            />
          )}
        </>
      )}

      {manual && (
        <NuevaReservaManualDrawer
          abierto={abierto}
          onCerrar={cerrarManual}
          monedaNegocio={monedaNegocio}
          horariosDisponibles={horariosDisponibles}
          items={itemsManual}
          hrefHorarios={hrefHorarios}
          onCrear={manual.onCrear}
        />
      )}

      <ConfirmDialog
        abierto={Boolean(porCancelar)}
        titulo="Cancelar reserva"
        descripcion={descripcionCancelacion}
        textoConfirmar="Sí, cancelar"
        cargando={cancelando}
        textoCargando="Cancelando..."
        onConfirmar={confirmarCancelacion}
        onCancelar={() => !cancelando && setPorCancelar(null)}
      />
    </EmpresaPage>
  );
}
