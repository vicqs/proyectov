"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Copy,
  Download,
  Loader2,
  Mail,
  Plus,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { descargarCsv } from "../../lib/csv";
import { esPagoManual, esTrxPasarela } from "../../lib/pagos";

export interface VistaReserva {
  id: string;
  fechaIso: string;
  cliente: string;
  email?: string;
  servicio: string;
  horario?: string;
  cupos?: number;
  estado: "pendiente" | "pagada" | "cancelada";
  monto?: number;
  /** Monto esperado según tarifa × cupos (útil en reservas pendientes o reembolsos). */
  montoEstimado?: number;
  trxId?: string | null;
}

type Resultado = string | void | Promise<string | void>;

export interface HorarioManual {
  id: string;
  servicio: string;
  label: string;
  cuposDisponibles: number;
  precioUsd?: number;
}

type VistaRapida =
  | "todas"
  | "proximas"
  | "hoy"
  | "pagadas"
  | "pendientes"
  | "canceladas";

type OrdenReservas = "proximas" | "recientes";

interface ReservasViewProps {
  reservas: VistaReserva[];
  mensajeVacio?: React.ReactNode;
  /** Clave `YYYY-MM-DD` de hoy en Costa Rica (evita diferencias de hidratación). */
  hoyClave?: string;
  /** Timestamp del servidor al renderizar. */
  ahoraMs?: number;
  /** Abre el Drawer de reserva manual al cargar (`?nueva=1`). */
  abrirManualInicial?: boolean;
  hrefHorarios?: string;
  hrefCalendario?: string;
  onCerrarManualInicial?: () => void;
  /** Si se define, muestra el botón "Cancelar" en reservas no canceladas. */
  onCancelar?: (id: string) => Resultado;
  /** Si se define, habilita el alta de reservas manuales. */
  manual?: {
    horarios: HorarioManual[];
    onCrear: (datos: {
      horarioId: string;
      nombre: string;
      email: string;
      cupos: number;
      pagada: boolean;
    }) => Resultado;
  };
}

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

const ESTADO_STYLES: Record<VistaReserva["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-800",
  pagada: "bg-emerald-100 text-emerald-800",
  cancelada: "bg-slate-100 text-slate-600",
};

const ESTADO_LABEL: Record<VistaReserva["estado"], string> = {
  pendiente: "Pendiente",
  pagada: "Pagado",
  cancelada: "Cancelada",
};

const INPUT =
  "vuki-focus min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500";

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

/** Fecha `YYYY-MM-DD` en zona horaria de Costa Rica (`UTC-06:00`). */
function diaCR(iso: string): string {
  return partesCR(iso).clave;
}

/** Fecha y hora legible determinista en Costa Rica (`Dom 1 nov 2026 · 6:00 a.m.`). */
function fechaHoraCR(iso: string): string {
  const { anio, mes, dia, diaSemana, hora, minuto } = partesCR(iso);
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  const min = String(minuto).padStart(2, "0");
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  return `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes]} ${anio} · ${h12}:${min} ${sufijo}`;
}

function sumarUnDiaClave(clave: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return "";
  const [y, m, d] = clave.split("-").map(Number);
  const f = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
}

function contextoTemporal(
  iso: string,
  hoyClave?: string,
  ahoraMs?: number,
): {
  etiqueta: string;
  clase: string;
  esHoy: boolean;
  esProxima: boolean;
} {
  const clave = diaCR(iso);
  const ms = new Date(iso).getTime();

  if (hoyClave && clave === hoyClave) {
    return {
      etiqueta: "Hoy",
      clase:
        "border border-(--marca-borde) bg-(--marca-fondo) font-bold text-(--marca-texto)",
      esHoy: true,
      esProxima: !ahoraMs || ms >= ahoraMs,
    };
  }

  if (hoyClave && clave === sumarUnDiaClave(hoyClave)) {
    return {
      etiqueta: "Mañana",
      clase: "bg-sky-50 font-semibold text-sky-700 ring-1 ring-sky-200/70",
      esHoy: false,
      esProxima: true,
    };
  }

  const futura = ahoraMs
    ? ms >= ahoraMs
    : hoyClave
      ? clave > hoyClave
      : false;

  if (futura) {
    return {
      etiqueta: "Próxima",
      clase: "bg-emerald-50 font-medium text-emerald-700",
      esHoy: false,
      esProxima: true,
    };
  }

  return {
    etiqueta: "Pasada",
    clase: "bg-slate-100 font-medium text-slate-500",
    esHoy: false,
    esProxima: false,
  };
}

/**
 * Reservas con resumen operativo, pestañas rápidas, filtros, exportación CSV,
 * cancelación contextualizada y alta manual con vista previa de monto.
 */
export default function ReservasView({
  reservas,
  mensajeVacio = "Aún no hay reservas registradas.",
  hoyClave,
  ahoraMs,
  abrirManualInicial = false,
  hrefHorarios,
  hrefCalendario,
  onCerrarManualInicial,
  onCancelar,
  manual,
}: ReservasViewProps) {
  const primerHorarioDisponible =
    manual?.horarios.find((h) => h.cuposDisponibles > 0)?.id ??
    manual?.horarios[0]?.id ??
    "";

  const [vista, setVista] = useState<VistaRapida>("todas");
  const [orden, setOrden] = useState<OrdenReservas>("proximas");
  const [texto, setTexto] = useState("");
  const [servicio, setServicio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [correoCopiado, setCorreoCopiado] = useState<string | null>(null);

  const [porCancelar, setPorCancelar] = useState<VistaReserva | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const [abierto, setAbierto] = useState<boolean>(
    Boolean(abrirManualInicial && manual),
  );
  const [horarioId, setHorarioId] = useState(primerHorarioDisponible);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cupos, setCupos] = useState("1");
  const [pagada, setPagada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const servicios = useMemo(
    () => Array.from(new Set(reservas.map((r) => r.servicio))).sort(),
    [reservas],
  );

  const resumen = useMemo(() => {
    const esProxima = (r: VistaReserva): boolean => {
      if (r.estado === "cancelada") return false;
      const ms = new Date(r.fechaIso).getTime();
      if (ahoraMs !== undefined) return ms >= ahoraMs;
      if (hoyClave) return diaCR(r.fechaIso) >= hoyClave;
      return false;
    };
    const esHoy = (r: VistaReserva): boolean => {
      if (r.estado === "cancelada" || !hoyClave) return false;
      return diaCR(r.fechaIso) === hoyClave;
    };

    const proximas = reservas.filter(esProxima);
    const hoy = reservas.filter(esHoy);
    const pagadas = reservas.filter((r) => r.estado === "pagada");
    const pendientes = reservas.filter((r) => r.estado === "pendiente");
    const canceladas = reservas.filter((r) => r.estado === "cancelada");

    return {
      proximasCount: proximas.length,
      proximasPersonas: proximas.reduce((a, r) => a + (r.cupos ?? 1), 0),
      hoyCount: hoy.length,
      hoyPersonas: hoy.reduce((a, r) => a + (r.cupos ?? 1), 0),
      pagadasCount: pagadas.length,
      pagadasMonto: pagadas.reduce(
        (a, r) => a + (r.monto ?? r.montoEstimado ?? 0),
        0,
      ),
      pendientesCount: pendientes.length,
      canceladasCount: canceladas.length,
    };
  }, [reservas, ahoraMs, hoyClave]);

  const filtradas = useMemo(() => {
    const esProxima = (r: VistaReserva): boolean => {
      if (r.estado === "cancelada") return false;
      const ms = new Date(r.fechaIso).getTime();
      if (ahoraMs !== undefined) return ms >= ahoraMs;
      if (hoyClave) return diaCR(r.fechaIso) >= hoyClave;
      return false;
    };
    const esHoy = (r: VistaReserva): boolean => {
      if (r.estado === "cancelada" || !hoyClave) return false;
      return diaCR(r.fechaIso) === hoyClave;
    };

    const q = texto.trim().toLowerCase();
    const base = reservas.filter((r) => {
      if (vista === "proximas" && !esProxima(r)) return false;
      if (vista === "hoy" && !esHoy(r)) return false;
      if (vista === "pagadas" && r.estado !== "pagada") return false;
      if (vista === "pendientes" && r.estado !== "pendiente") return false;
      if (vista === "canceladas" && r.estado !== "cancelada") return false;

      if (servicio && r.servicio !== servicio) return false;
      const dia = diaCR(r.fechaIso);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      if (
        q &&
        !`${r.cliente} ${r.email ?? ""} ${r.servicio} ${r.trxId ?? ""}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });

    const refMs =
      ahoraMs ??
      (hoyClave ? new Date(`${hoyClave}T00:00:00-06:00`).getTime() : 0);

    return [...base].sort((a, b) => {
      const aMs = new Date(a.fechaIso).getTime();
      const bMs = new Date(b.fechaIso).getTime();

      if (orden === "recientes" || !refMs) {
        return bMs - aMs;
      }

      // Orden "Próximas primero": salidas vigentes futuras/hoy en orden ascendente,
      // seguidas de pasadas/canceladas de la más reciente a la más antigua.
      const aActivaFutura = a.estado !== "cancelada" && aMs >= refMs;
      const bActivaFutura = b.estado !== "cancelada" && bMs >= refMs;
      if (aActivaFutura && !bActivaFutura) return -1;
      if (!aActivaFutura && bActivaFutura) return 1;
      if (aActivaFutura && bActivaFutura) return aMs - bMs;
      return bMs - aMs;
    });
  }, [reservas, vista, orden, texto, servicio, desde, hasta, ahoraMs, hoyClave]);

  const hayFiltros = Boolean(
    vista !== "todas" || texto || servicio || desde || hasta,
  );
  const conMonto = reservas.some(
    (r) => r.monto !== undefined || r.montoEstimado !== undefined,
  );
  const conAcciones = Boolean(onCancelar);

  function limpiarFiltros() {
    setVista("todas");
    setTexto("");
    setServicio("");
    setDesde("");
    setHasta("");
  }

  async function copiarCorreo(correo: string) {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(correo);
      setCorreoCopiado(correo);
      toast.success("Correo copiado al portapapeles");
      window.setTimeout(() => {
        setCorreoCopiado((actual) => (actual === correo ? null : actual));
      }, 2000);
    } catch {
      toast.error("No se pudo copiar el correo.");
    }
  }

  function exportar() {
    const sufijoFecha = hoyClave || diaCR(new Date().toISOString());
    descargarCsv(
      `reservas-${sufijoFecha}.csv`,
      [
        "Fecha y hora (CR)",
        "Cliente",
        "Correo",
        "Servicio",
        "Cupos",
        "Estado",
        "Método de cobro",
        "Monto USD",
        "ID transacción",
      ],
      filtradas.map((r) => {
        const metodo =
          r.estado === "pagada"
            ? esPagoManual(r.trxId)
              ? "Cobro directo"
              : "Pasarela"
            : r.estado === "cancelada" && esTrxPasarela(r.trxId)
              ? "Reembolso pendiente"
              : "—";
        const montoCsv = r.monto ?? r.montoEstimado;
        return [
          fechaHoraCR(r.fechaIso),
          r.cliente,
          r.email ?? r.cliente,
          r.servicio,
          r.cupos ?? 1,
          ESTADO_LABEL[r.estado],
          metodo,
          montoCsv !== undefined ? montoCsv.toFixed(2) : "",
          esPagoManual(r.trxId) ? "manual" : (r.trxId ?? ""),
        ];
      }),
    );
  }

  async function handleCancelar() {
    if (!porCancelar || !onCancelar || cancelando) return;
    setCancelando(true);
    const error = await onCancelar(porCancelar.id);
    setCancelando(false);
    if (error) toast.error(error);
    else toast.success("Reserva cancelada. Los cupos quedaron libres.");
    setPorCancelar(null);
  }

  function abrirManual() {
    const idInicial =
      manual?.horarios.find((h) => h.cuposDisponibles > 0)?.id ??
      manual?.horarios[0]?.id ??
      "";
    setHorarioId(idInicial);
    setNombre("");
    setEmail("");
    setCupos("1");
    setPagada(false);
    setAbierto(true);
  }

  function cerrarDrawerManual() {
    setAbierto(false);
    onCerrarManualInicial?.();
  }

  function cambiarHorarioManual(nuevoId: string) {
    setHorarioId(nuevoId);
    const nuevo = manual?.horarios.find((h) => h.id === nuevoId);
    if (nuevo && Number(cupos) > nuevo.cuposDisponibles) {
      setCupos(String(Math.max(1, nuevo.cuposDisponibles)));
    }
  }

  async function handleManual(evento: React.FormEvent) {
    evento.preventDefault();
    if (!manual) return;
    setGuardando(true);
    const error = await manual.onCrear({
      horarioId,
      nombre: nombre.trim(),
      email: email.trim(),
      cupos: Number(cupos),
      pagada,
    });
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Reserva manual registrada con éxito");
    setAbierto(false);
  }

  const horariosConCupo =
    manual?.horarios.filter((h) => h.cuposDisponibles > 0) ?? [];
  const horarioElegido = manual?.horarios.find((h) => h.id === horarioId);
  const maxCuposManual = Math.max(1, horarioElegido?.cuposDisponibles ?? 1);
  const cuposNum = Math.max(1, Number(cupos) || 1);
  const montoManualEstimado =
    horarioElegido?.precioUsd !== undefined
      ? horarioElegido.precioUsd * cuposNum
      : undefined;

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

  const botonCancelar = (reserva: VistaReserva) =>
    onCancelar && reserva.estado !== "cancelada" ? (
      <button
        type="button"
        onClick={() => setPorCancelar(reserva)}
        aria-label={`Cancelar reserva de ${reserva.cliente}`}
        className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Cancelar
      </button>
    ) : null;

  const descripcionCancelacion = porCancelar
    ? (() => {
        const cuposTxt = `${porCancelar.cupos ?? 1} ${(porCancelar.cupos ?? 1) === 1 ? "cupo" : "cupos"}`;
        const base = `Se cancelará la reserva de "${porCancelar.cliente}" para ${porCancelar.servicio} (${fechaHoraCR(porCancelar.fechaIso)}) y se liberarán ${cuposTxt}.`;
        if (
          porCancelar.estado === "pagada" &&
          esTrxPasarela(porCancelar.trxId)
        ) {
          const m = porCancelar.monto ?? porCancelar.montoEstimado;
          return `${base} Como tiene un pago por pasarela${m !== undefined ? ` ($${m.toFixed(2)})` : ""}, quedará señalada con reembolso pendiente en Finanzas.`;
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
            Exportar CSV{hayFiltros && filtradas.length > 0 ? ` (${filtradas.length})` : ""}
          </button>
          {manual && (
            <motion.button
              type="button"
              onClick={abrirManual}
              whileTap={{ scale: 0.96 }}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:flex-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reserva manual
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
                onClick={abrirManual}
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Registrar reserva manual
              </button>
              {hrefHorarios && horariosConCupo.length === 0 && (
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
                ${resumen.pagadasMonto.toFixed(2)} USD acumulados
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
                      className={`vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        activa
                          ? "bg-vuki-ink text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                      }`}
                    >
                      {tab.etiqueta}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                          activa
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-600"
                        }`}
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
                className="vuki-focus min-h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
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
                  className="vuki-focus min-h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-sky-500"
                />
              </div>

              {servicios.length > 1 && (
                <select
                  aria-label="Filtrar por servicio"
                  value={servicio}
                  onChange={(e) => setServicio(e.target.value)}
                  className="vuki-focus min-h-10 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-sky-500"
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
                <input
                  type="date"
                  aria-label="Desde fecha"
                  title="Desde fecha"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => setDesde(e.target.value)}
                  className="vuki-focus min-h-10 min-w-0 rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-sky-500 sm:text-sm"
                />
                <input
                  type="date"
                  aria-label="Hasta fecha"
                  title="Hasta fecha"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => setHasta(e.target.value)}
                  className="vuki-focus min-h-10 min-w-0 rounded-xl border border-slate-300 bg-white px-2.5 text-xs text-slate-900 focus:border-sky-500 sm:text-sm"
                />
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
            <>
              {/* Tabla en escritorio / tablet */}
              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3.5 whitespace-nowrap">
                        Salida / Horario
                      </th>
                      <th className="px-5 py-3.5">Cliente</th>
                      <th className="px-5 py-3.5">Servicio y cupos</th>
                      <th className="px-5 py-3.5">Estado</th>
                      {conMonto && (
                        <th className="px-5 py-3.5 text-right">Monto</th>
                      )}
                      {conAcciones && (
                        <th className="px-5 py-3.5 text-right">Acción</th>
                      )}
                    </tr>
                  </thead>
                  <Lista key={`${vista}-${orden}-${servicio}`} as="tbody">
                    {filtradas.map((reserva) => {
                      const ctx = contextoTemporal(
                        reserva.fechaIso,
                        hoyClave,
                        ahoraMs,
                      );
                      const correo =
                        reserva.email ??
                        (reserva.cliente.includes("@")
                          ? reserva.cliente
                          : undefined);
                      const reembolsoPendiente =
                        reserva.estado === "cancelada" &&
                        esTrxPasarela(reserva.trxId);
                      const manualPagada =
                        reserva.estado === "pagada" &&
                        esPagoManual(reserva.trxId);
                      const montoVisible =
                        reserva.monto ?? reserva.montoEstimado;

                      return (
                        <ItemLista
                          as="tr"
                          key={reserva.id}
                          className={`border-b border-slate-100 last:border-0 ${
                            reserva.estado === "cancelada"
                              ? "bg-slate-50/50 opacity-75"
                              : ctx.esHoy
                                ? "bg-(--marca-fondo)/40"
                                : ""
                          }`}
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <p className="font-medium text-slate-900">
                              {fechaHoraCR(reserva.fechaIso)}
                            </p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${ctx.clase}`}
                              >
                                {ctx.etiqueta}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-semibold text-slate-900">
                              {reserva.cliente}
                            </p>
                            {correo && (
                              <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                                {reserva.email && (
                                  <a
                                    href={`mailto:${correo}`}
                                    className="vuki-focus truncate hover:text-sky-700 hover:underline"
                                  >
                                    {correo}
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => void copiarCorreo(correo)}
                                  title="Copiar correo del cliente"
                                  aria-label={`Copiar correo ${correo}`}
                                  className="vuki-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                >
                                  {correoCopiado === correo ? (
                                    <>
                                      <Check
                                        className="h-3 w-3 text-emerald-600"
                                        aria-hidden="true"
                                      />
                                      Copiado
                                    </>
                                  ) : (
                                    <>
                                      <Copy
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                      />
                                      Copiar
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            <p className="font-medium text-slate-800">
                              {reserva.servicio}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {reserva.cupos ?? 1}{" "}
                              {(reserva.cupos ?? 1) === 1
                                ? "persona"
                                : "personas"}
                            </span>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex flex-col items-start gap-1">
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado]}`}
                              >
                                {ESTADO_LABEL[reserva.estado]}
                              </span>

                              {reembolsoPendiente ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 ring-1 ring-amber-200/80">
                                  <AlertTriangle
                                    className="h-3 w-3 text-amber-600"
                                    aria-hidden="true"
                                  />
                                  Reembolso pendiente
                                </span>
                              ) : manualPagada ? (
                                <span className="text-[11px] font-medium text-slate-500">
                                  Cobro directo (SINPE / efectivo)
                                </span>
                              ) : reserva.trxId ? (
                                <span
                                  title={reserva.trxId}
                                  className="max-w-[140px] truncate font-mono text-[11px] text-slate-400"
                                >
                                  {reserva.trxId}
                                </span>
                              ) : null}
                            </div>
                          </td>

                          {conMonto && (
                            <td className="px-5 py-4 text-right whitespace-nowrap">
                              {montoVisible !== undefined ? (
                                <div>
                                  <p
                                    className={`font-display font-bold ${
                                      reserva.estado === "pagada"
                                        ? "text-vuki-ink"
                                        : "text-slate-500"
                                    }`}
                                  >
                                    ${montoVisible.toFixed(2)}
                                  </p>
                                  {reserva.estado === "pendiente" && (
                                    <p className="text-[11px] text-amber-700">
                                      por cobrar
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          )}

                          {conAcciones && (
                            <td className="px-5 py-4 text-right">
                              {botonCancelar(reserva)}
                            </td>
                          )}
                        </ItemLista>
                      );
                    })}
                  </Lista>
                </table>
              </div>

              {/* Tarjetas optimizadas en móvil (< sm) */}
              <Lista
                key={`movil-${vista}-${orden}-${servicio}`}
                as="ul"
                className="space-y-3 sm:hidden"
              >
                {filtradas.map((reserva) => {
                  const ctx = contextoTemporal(
                    reserva.fechaIso,
                    hoyClave,
                    ahoraMs,
                  );
                  const correo =
                    reserva.email ??
                    (reserva.cliente.includes("@")
                      ? reserva.cliente
                      : undefined);
                  const reembolsoPendiente =
                    reserva.estado === "cancelada" &&
                    esTrxPasarela(reserva.trxId);
                  const montoVisible = reserva.monto ?? reserva.montoEstimado;

                  return (
                    <ItemLista
                      as="li"
                      key={reserva.id}
                      className={`rounded-2xl border bg-white p-4 shadow-sm ${
                        reserva.estado === "cancelada"
                          ? "border-slate-200 opacity-75"
                          : ctx.esHoy
                            ? "border-(--marca) ring-1 ring-(--marca-borde)"
                            : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${ctx.clase}`}
                            >
                              {ctx.etiqueta}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                              <Users className="h-3 w-3" aria-hidden="true" />
                              {reserva.cupos ?? 1}{" "}
                              {(reserva.cupos ?? 1) === 1
                                ? "persona"
                                : "personas"}
                            </span>
                          </div>
                          <p className="mt-1.5 font-display text-base font-bold text-vuki-ink">
                            {reserva.servicio}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-600">
                            {fechaHoraCR(reserva.fechaIso)}
                          </p>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado]}`}
                        >
                          {ESTADO_LABEL[reserva.estado]}
                        </span>
                      </div>

                      <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-600">
                        <p className="flex items-center gap-1.5 font-medium text-slate-800">
                          {reserva.email ? (
                            <User
                              className="h-3.5 w-3.5 shrink-0 text-slate-400"
                              aria-hidden="true"
                            />
                          ) : (
                            <Mail
                              className="h-3.5 w-3.5 shrink-0 text-slate-400"
                              aria-hidden="true"
                            />
                          )}
                          <span className="truncate">{reserva.cliente}</span>
                        </p>

                        {correo && (
                          <div className="flex items-center justify-between gap-2">
                            {reserva.email ? (
                              <a
                                href={`mailto:${correo}`}
                                className="flex min-w-0 items-center gap-1.5 truncate text-sky-700 hover:underline"
                              >
                                <Mail
                                  className="h-3.5 w-3.5 shrink-0 text-slate-400"
                                  aria-hidden="true"
                                />
                                <span className="truncate">{correo}</span>
                              </a>
                            ) : (
                              <span />
                            )}
                            <button
                              type="button"
                              onClick={() => void copiarCorreo(correo)}
                              className="vuki-focus inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
                            >
                              {correoCopiado === correo ? (
                                <>
                                  <Check
                                    className="h-3 w-3 text-emerald-600"
                                    aria-hidden="true"
                                  />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" aria-hidden="true" />
                                  Copiar correo
                                </>
                              )}
                            </button>
                          </div>
                        )}

                        {reembolsoPendiente && (
                          <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                            <AlertTriangle
                              className="h-3 w-3 text-amber-600"
                              aria-hidden="true"
                            />
                            Reembolso pendiente por devolver
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                        <div>
                          {montoVisible !== undefined && (
                            <span
                              className={`font-display text-sm font-bold ${
                                reserva.estado === "pagada"
                                  ? "text-vuki-ink"
                                  : "text-slate-500"
                              }`}
                            >
                              ${montoVisible.toFixed(2)}{" "}
                              {reserva.estado === "pendiente" && (
                                <span className="font-sans text-xs font-normal text-amber-700">
                                  (por cobrar)
                                </span>
                              )}
                            </span>
                          )}
                          {reserva.estado === "pagada" &&
                            esPagoManual(reserva.trxId) && (
                              <p className="text-[11px] text-slate-500">
                                Cobro directo
                              </p>
                            )}
                        </div>
                        {botonCancelar(reserva)}
                      </div>
                    </ItemLista>
                  );
                })}
              </Lista>
            </>
          )}
        </>
      )}

      {manual && (
        <Drawer
          abierto={abierto}
          onClose={cerrarDrawerManual}
          titulo="Reserva manual"
        >
          {horariosConCupo.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
                <Clock className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="mt-3 font-display text-sm font-bold text-vuki-ink">
                {manual.horarios.length === 0
                  ? "No tienes horarios futuros publicados"
                  : "Todos tus horarios futuros están completos"}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                Para registrar una reserva manual primero necesitas un horario
                futuro con cupos disponibles.
              </p>
              {hrefHorarios && (
                <Link
                  href={`${hrefHorarios}?nuevo=1`}
                  className="vuki-focus mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Publicar nuevo horario
                </Link>
              )}
            </div>
          ) : (
            <form onSubmit={handleManual} className="flex flex-col gap-5">
              <div>
                <label
                  htmlFor="m-horario"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Salida / Horario disponible
                </label>
                <select
                  id="m-horario"
                  required
                  value={horarioId}
                  onChange={(e) => cambiarHorarioManual(e.target.value)}
                  className={INPUT}
                >
                  {manual.horarios.map((h) => (
                    <option
                      key={h.id}
                      value={h.id}
                      disabled={h.cuposDisponibles === 0}
                    >
                      {h.servicio} · {h.label} (
                      {h.cuposDisponibles === 0
                        ? "Completo"
                        : `${h.cuposDisponibles} ${h.cuposDisponibles === 1 ? "cupo libre" : "cupos libres"}`}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="m-nombre"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Nombre del cliente
                </label>
                <input
                  id="m-nombre"
                  required
                  maxLength={100}
                  placeholder="Ej. Andrea Vargas"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div>
                <label
                  htmlFor="m-email"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Correo electrónico
                </label>
                <input
                  id="m-email"
                  type="email"
                  required
                  placeholder="cliente@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="m-cupos"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Personas (cupos)
                  </label>
                  {horarioElegido && (
                    <span className="text-xs text-slate-500">
                      Máx. {horarioElegido.cuposDisponibles} disponibles
                    </span>
                  )}
                </div>
                <input
                  id="m-cupos"
                  type="number"
                  min="1"
                  max={maxCuposManual}
                  required
                  value={cupos}
                  onChange={(e) => setCupos(e.target.value)}
                  className={INPUT}
                />
                {maxCuposManual > 1 && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-slate-500">Rápido:</span>
                    {[1, 2, 3, 4, 5, 6]
                      .filter((n) => n <= maxCuposManual)
                      .map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCupos(String(n))}
                          className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            Number(cupos) === n
                              ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {n} {n === 1 ? "persona" : "personas"}
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Estado del pago
                </span>
                <div
                  role="group"
                  aria-label="Estado del pago de la reserva manual"
                  className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1"
                >
                  <button
                    type="button"
                    aria-pressed={!pagada}
                    onClick={() => setPagada(false)}
                    className={`vuki-focus min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      !pagada
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Pendiente de cobro
                  </button>
                  <button
                    type="button"
                    aria-pressed={pagada}
                    onClick={() => setPagada(true)}
                    className={`vuki-focus min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      pagada
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ya pagó (SINPE / efectivo)
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-slate-500">
                  {pagada
                    ? "Se registrará como cobro directo fuera de pasarela (sin comisión del 4.25%)."
                    : "Se apartan los cupos de inmediato y queda marcada como pendiente por cobrar."}
                </p>
              </div>

              {horarioElegido && (
                <div className="rounded-2xl border border-(--marca-borde) bg-(--marca-fondo) px-4 py-3 text-xs text-slate-700">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {horarioElegido.servicio} · {cuposNum}{" "}
                      {cuposNum === 1 ? "cupo" : "cupos"}
                    </span>
                    {montoManualEstimado !== undefined && (
                      <span className="font-display text-sm font-bold text-vuki-ink">
                        ${montoManualEstimado.toFixed(2)} USD
                      </span>
                    )}
                  </div>
                </div>
              )}

              <motion.button
                type="submit"
                disabled={guardando || !horarioId}
                whileTap={{ scale: 0.97 }}
                className="vuki-focus flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Registrar reserva
              </motion.button>
            </form>
          )}
        </Drawer>
      )}

      <ConfirmDialog
        abierto={porCancelar !== null}
        titulo="¿Cancelar esta reserva?"
        descripcion={descripcionCancelacion}
        onConfirmar={() => void handleCancelar()}
        onCancelar={() => setPorCancelar(null)}
      />
    </EmpresaPage>
  );
}
