"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  CalendarDays,
  Clock,
  Info,
  ListChecks,
  Loader2,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { etiquetaDia } from "../../lib/horarios";

export interface VistaHorario {
  id: string;
  servicioId: string;
  label: string;
  /** ISO de la franja; habilita el agrupado por día. */
  fechaHora?: string;
  cuposTotales: number;
  cuposDisponibles: number;
}

export interface SugerenciaHorarioInicial {
  abrir?: boolean;
  fecha?: string; // YYYY-MM-DD
  hora?: string; // HH:mm
  servicioId?: string;
}

type Resultado = string | void | Promise<string | void>;

const DIAS_SEMANA = ["D", "L", "M", "X", "J", "V", "S"];
const NOMBRES_DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const NOMBRES_DIAS_LARGOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const NOMBRES_MESES_CORTOS = [
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
const NOMBRES_MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const HORAS_RAPIDAS: { valor: string; etiqueta: string }[] = [
  { valor: "06:00", etiqueta: "6:00 a.m." },
  { valor: "08:00", etiqueta: "8:00 a.m." },
  { valor: "09:00", etiqueta: "9:00 a.m." },
  { valor: "11:00", etiqueta: "11:00 a.m." },
  { valor: "14:00", etiqueta: "2:00 p.m." },
  { valor: "16:00", etiqueta: "4:00 p.m." },
];

const CUPOS_RAPIDOS = ["4", "6", "8", "10", "12"];
const SEMANAS_RAPIDAS = [2, 4, 8, 12];
const MAX_LOTE = 100;

function aClaveFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
}

function aLocalInput(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${aClaveFecha(fecha)}T${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

function parseClaveFecha(clave: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return null;
  const [y, m, d] = clave.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function sumarDiasClave(claveBase: string, diasExtra: number): string {
  const f = parseClaveFecha(claveBase);
  if (!f) return claveBase;
  f.setDate(f.getDate() + diasExtra);
  return aClaveFecha(f);
}

function proximoDiaSemanaClave(claveBase: string, diaObjetivo: number): string {
  const f = parseClaveFecha(claveBase);
  if (!f) return claveBase;
  const actual = f.getDay();
  const delta = (diaObjetivo - actual + 7) % 7;
  f.setDate(f.getDate() + delta);
  return aClaveFecha(f);
}

function diaSemanaDeClave(clave: string): number | null {
  const f = parseClaveFecha(clave);
  return f ? f.getDay() : null;
}

function formatoFechaLargaClave(clave: string): string {
  const f = parseClaveFecha(clave);
  if (!f) return clave;
  return `${NOMBRES_DIAS_LARGOS[f.getDay()]} ${f.getDate()} de ${NOMBRES_MESES_LARGOS[f.getMonth()]}`;
}

function formatoFechaCortaLocal(localInput: string): string {
  const clave = localInput.slice(0, 10);
  const f = parseClaveFecha(clave);
  if (!f) return clave;
  return `${NOMBRES_DIAS_CORTOS[f.getDay()]} ${f.getDate()} ${NOMBRES_MESES_CORTOS[f.getMonth()]}`;
}

function formatoHoraIso(iso: string): string {
  const f = new Date(iso);
  const h = f.getHours();
  const m = String(f.getMinutes()).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "a.m." : "p.m."}`;
}

function formatoHora24a12(hora24: string): string {
  const [hh, mm] = hora24.split(":").map(Number);
  if (Number.isNaN(hh)) return hora24;
  const m = String(Number.isNaN(mm) ? 0 : mm).padStart(2, "0");
  return `${hh % 12 === 0 ? 12 : hh % 12}:${m} ${hh < 12 ? "a.m." : "p.m."}`;
}

/** Genera las fechas (formato `datetime-local`) de una repetición semanal. */
function generarFechas(
  inicio: string,
  hora: string,
  dias: number[],
  semanas: number,
): string[] {
  if (!inicio || !hora || dias.length === 0 || semanas < 1) return [];
  const [y, m, d] = inicio.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const ahora = Date.now();
  const fechas: string[] = [];
  for (let i = 0; i < semanas * 7; i++) {
    const f = new Date(y, m - 1, d + i, hh, mm);
    if (dias.includes(f.getDay()) && f.getTime() > ahora) {
      fechas.push(aLocalInput(f));
    }
  }
  return fechas;
}

interface HorariosViewProps {
  horarios: VistaHorario[];
  servicios: { id: string; nombre: string }[];
  /** `fechaHora` viene en formato `datetime-local` (sin zona horaria). */
  onCrear: (datos: {
    servicioId: string;
    fechaHora: string;
    cupos: number;
  }) => Resultado;
  /** Alta en lote atómica; si no se define, se llama a `onCrear` por fecha. */
  onCrearLote?: (datos: {
    servicioId: string;
    fechasHora: string[];
    cupos: number;
  }) => Resultado;
  onEliminar: (id: string) => Resultado;
  /** Preconfiguración opcional al aterrizar desde Calendario (`?nuevo=1`). */
  sugerenciaInicial?: SugerenciaHorarioInicial;
  /** Clave `YYYY-MM-DD` de hoy calculada en servidor para evitar diferencias SSR. */
  hoyClave?: string;
  /** Enlaces contextuales del panel para navegación fluida. */
  hrefCalendario?: string;
  hrefServicios?: string;
  hrefReservas?: string;
  /** Notifica cuando se cierra el Drawer inicial para limpiar query params. */
  onCerrarInicial?: () => void;
}

const INPUT =
  "vuki-focus min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500";

/** Gestión de horarios y cupos compartida por `/[slug]/admin/horarios`. */
export default function HorariosView({
  horarios,
  servicios,
  onCrear,
  onCrearLote,
  onEliminar,
  sugerenciaInicial,
  hoyClave,
  hrefCalendario,
  hrefServicios,
  hrefReservas,
  onCerrarInicial,
}: HorariosViewProps) {
  const baseFecha = sugerenciaInicial?.fecha || hoyClave || "";
  const baseHora = sugerenciaInicial?.hora || "09:00";
  const servicioValidoInicial =
    (sugerenciaInicial?.servicioId &&
    servicios.some((s) => s.id === sugerenciaInicial.servicioId)
      ? sugerenciaInicial.servicioId
      : servicios[0]?.id) ?? "";
  const diaInicial = baseFecha ? diaSemanaDeClave(baseFecha) : null;

  const [abierto, setAbierto] = useState<boolean>(
    Boolean(sugerenciaInicial?.abrir && servicios.length > 0),
  );
  const [modo, setModo] = useState<"uno" | "repetir">("uno");
  const [servicioId, setServicioId] = useState(servicioValidoInicial);
  const [fecha, setFecha] = useState(baseFecha);
  const [hora, setHora] = useState(baseHora);
  const [dias, setDias] = useState<number[]>(
    diaInicial !== null ? [diaInicial] : [],
  );
  const [semanas, setSemanas] = useState(4);
  const [cupos, setCupos] = useState("6");
  const [guardando, setGuardando] = useState(false);

  const [servicioFiltro, setServicioFiltro] = useState("");
  const [porEliminar, setPorEliminar] = useState<VistaHorario | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const mananaClave = hoyClave ? sumarDiasClave(hoyClave, 1) : "";
  const sabadoClave = hoyClave ? proximoDiaSemanaClave(hoyClave, 6) : "";

  const fechasLote = generarFechas(fecha, hora, dias, semanas);

  function obtenerFechaHoraDefecto(fechaPreferida?: string): {
    fechaDef: string;
    horaDef: string;
  } {
    if (fechaPreferida && /^\d{4}-\d{2}-\d{2}$/.test(fechaPreferida)) {
      const hoyLocal = hoyClave || aClaveFecha(new Date());
      if (fechaPreferida === hoyLocal) {
        const ahora = new Date();
        const sigHora = ahora.getHours() + 1;
        if (sigHora <= 9) return { fechaDef: fechaPreferida, horaDef: "09:00" };
        if (sigHora <= 22) {
          return {
            fechaDef: fechaPreferida,
            horaDef: `${String(sigHora).padStart(2, "0")}:00`,
          };
        }
        return {
          fechaDef: sumarDiasClave(hoyLocal, 1),
          horaDef: "09:00",
        };
      }
      return { fechaDef: fechaPreferida, horaDef: "09:00" };
    }

    if (sugerenciaInicial?.fecha && sugerenciaInicial?.hora) {
      return {
        fechaDef: sugerenciaInicial.fecha,
        horaDef: sugerenciaInicial.hora,
      };
    }

    const proximo = new Date();
    proximo.setMinutes(0, 0, 0);
    proximo.setHours(proximo.getHours() + 1);
    if (proximo.getHours() >= 18 || proximo.getHours() < 6) {
      if (proximo.getHours() >= 18) proximo.setDate(proximo.getDate() + 1);
      proximo.setHours(9, 0, 0, 0);
    }
    return {
      fechaDef: aClaveFecha(proximo),
      horaDef: `${String(proximo.getHours()).padStart(2, "0")}:00`,
    };
  }

  function abrirNuevo(opciones?: {
    modoInicial?: "uno" | "repetir";
    fechaPreferida?: string;
  }) {
    const srvDefault =
      (servicioFiltro && servicios.some((s) => s.id === servicioFiltro)
        ? servicioFiltro
        : servicios[0]?.id) ?? "";
    const { fechaDef, horaDef } = obtenerFechaHoraDefecto(
      opciones?.fechaPreferida,
    );
    const diaSem = diaSemanaDeClave(fechaDef);

    setServicioId(srvDefault);
    setFecha(fechaDef);
    setHora(horaDef);
    setDias(diaSem !== null ? [diaSem] : [1, 2, 3, 4, 5]);
    setSemanas(4);
    setModo(opciones?.modoInicial ?? "uno");
    setCupos("6");
    setAbierto(true);
  }

  function cerrarDrawer() {
    setAbierto(false);
    onCerrarInicial?.();
  }

  function cambiarModo(nuevoModo: "uno" | "repetir") {
    setModo(nuevoModo);
    if (nuevoModo === "repetir" && dias.length === 0 && fecha) {
      const diaSem = diaSemanaDeClave(fecha);
      if (diaSem !== null) setDias([diaSem]);
    }
  }

  function seleccionarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha);
    if (modo === "repetir" && dias.length <= 1) {
      const diaSem = diaSemanaDeClave(nuevaFecha);
      if (diaSem !== null) setDias([diaSem]);
    }
  }

  function alternarDia(dia: number) {
    setDias((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia],
    );
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!servicioId || !cupos || Number(cupos) < 1) return;

    const horaLimpia = hora.slice(0, 5);
    const fechaHoraUnica = fecha && horaLimpia ? `${fecha}T${horaLimpia}` : "";

    if (modo === "uno") {
      if (!fechaHoraUnica) {
        toast.error("Selecciona la fecha y la hora.");
        return;
      }
      if (new Date(fechaHoraUnica).getTime() <= Date.now()) {
        toast.error("Elige una fecha y hora futura.");
        return;
      }
    } else {
      if (fechasLote.length === 0) {
        toast.error("Elige al menos un día y una fecha de inicio futura.");
        return;
      }
      if (fechasLote.length > MAX_LOTE) {
        toast.error(`Máximo ${MAX_LOTE} horarios por lote.`);
        return;
      }
    }

    setGuardando(true);
    let error: string | void = undefined;
    if (modo === "uno") {
      error = await onCrear({
        servicioId,
        fechaHora: fechaHoraUnica,
        cupos: Number(cupos),
      });
    } else if (onCrearLote) {
      error = await onCrearLote({
        servicioId,
        fechasHora: fechasLote,
        cupos: Number(cupos),
      });
    } else {
      for (const f of fechasLote) {
        error = await onCrear({
          servicioId,
          fechaHora: f,
          cupos: Number(cupos),
        });
        if (error) break;
      }
    }
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      modo === "uno"
        ? "Horario agregado con éxito"
        : `${fechasLote.length} horarios agregados`,
    );
    setAbierto(false);
  }

  async function handleEliminar() {
    if (!porEliminar || eliminando) return;
    setEliminando(true);
    const error = await onEliminar(porEliminar.id);
    setEliminando(false);
    if (error) toast.error(error);
    else toast.success(`Horario "${porEliminar.label}" eliminado`);
    setPorEliminar(null);
  }

  function nombreServicio(id: string) {
    return servicios.find((s) => s.id === id)?.nombre ?? "Servicio eliminado";
  }

  const horariosFiltrados = useMemo(
    () =>
      servicioFiltro
        ? horarios.filter((h) => h.servicioId === servicioFiltro)
        : horarios,
    [horarios, servicioFiltro],
  );

  const resumen = useMemo(() => {
    let cuposTotales = 0;
    let cuposOcupados = 0;
    for (const h of horariosFiltrados) {
      cuposTotales += h.cuposTotales;
      cuposOcupados += h.cuposTotales - h.cuposDisponibles;
    }
    return {
      totalHorarios: horariosFiltrados.length,
      cuposTotales,
      cuposOcupados,
      cuposLibres: Math.max(0, cuposTotales - cuposOcupados),
    };
  }, [horariosFiltrados]);

  const grupos = useMemo(() => {
    const resultado: {
      clave: string;
      titulo: string;
      esHoy: boolean;
      esManana: boolean;
      items: VistaHorario[];
    }[] = [];

    for (const h of horariosFiltrados) {
      const clave = h.fechaHora ? aClaveFecha(new Date(h.fechaHora)) : "";
      const titulo = clave
        ? formatoFechaLargaClave(clave)
        : h.fechaHora
          ? etiquetaDia(h.fechaHora)
          : "";
      const esHoy = Boolean(hoyClave && clave === hoyClave);
      const esManana = Boolean(mananaClave && clave === mananaClave);

      const ultimo = resultado[resultado.length - 1];
      if (ultimo && ultimo.clave === clave && ultimo.titulo === titulo) {
        ultimo.items.push(h);
      } else {
        resultado.push({ clave, titulo, esHoy, esManana, items: [h] });
      }
    }
    return resultado;
  }, [horariosFiltrados, hoyClave, mananaClave]);

  const diasIguales = (objetivo: number[]) =>
    dias.length === objetivo.length &&
    objetivo.every((d) => dias.includes(d));

  return (
    <EmpresaPage
      titulo="Horarios disponibles"
      descripcion="Agrega franjas horarias puntuales o repetidas por semana para recibir reservas en tu enlace público."
      accion={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {hrefCalendario && (
            <Link
              href={hrefCalendario}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
            >
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Ver calendario
            </Link>
          )}
          <motion.button
            type="button"
            onClick={() => abrirNuevo()}
            disabled={servicios.length === 0}
            whileTap={{ scale: 0.96 }}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo horario
          </motion.button>
        </div>
      }
    >
      {/* Resumen superior + filtro por servicio */}
      {horarios.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-borde) bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--marca-fondo) px-3 py-1 font-semibold text-(--marca-texto)">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {resumen.totalHorarios}{" "}
              {resumen.totalHorarios === 1
                ? "horario futuro"
                : "horarios futuros"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
              {resumen.cuposLibres}{" "}
              {resumen.cuposLibres === 1 ? "cupo libre" : "cupos libres"}
            </span>
            {resumen.cuposOcupados > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                {resumen.cuposOcupados} reservados
              </span>
            )}
          </div>

          {servicios.length > 1 && (
            <div className="flex items-center gap-2">
              <select
                aria-label="Filtrar horarios por servicio"
                value={servicioFiltro}
                onChange={(e) => setServicioFiltro(e.target.value)}
                className="vuki-focus min-h-9 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                <option value="">Todos los servicios</option>
                {servicios.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <span>
          Para proteger reservas ya confirmadas, los horarios creados no se
          editan en sitio. Si un horario aún no tiene reservas, puedes quitarlo
          y crear uno nuevo en segundos.
        </span>
      </p>

      <div className="mt-6">
        {servicios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-vuki-ink sm:text-lg">
              Primero crea un servicio para asignarle horarios
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
              Registra tus tours, clases o actividades en Mis Servicios; luego
              podrás publicar aquí todas sus franjas horarias y cupos.
            </p>
            {hrefServicios && (
              <Link
                href={`${hrefServicios}?nuevo=1`}
                className="vuki-focus mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Crear mi primer servicio
              </Link>
            )}
          </div>
        ) : horarios.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
              <Clock className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-vuki-ink sm:text-lg">
              Aún no tienes horarios publicados
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
              Publica un horario puntual o programa varias semanas de una sola
              vez para que tus clientes puedan reservar en línea.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => abrirNuevo({ modoInicial: "uno" })}
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Agregar un horario
              </button>
              <button
                type="button"
                onClick={() => abrirNuevo({ modoInicial: "repetir" })}
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Repeat className="h-4 w-4" aria-hidden="true" />
                Repetir cada semana
              </button>
            </div>
          </div>
        ) : horariosFiltrados.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-600">
            <p>Este servicio no tiene horarios futuros publicados.</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => abrirNuevo()}
                className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Agregar horario a este servicio
              </button>
              <button
                type="button"
                onClick={() => setServicioFiltro("")}
                className="vuki-focus inline-flex min-h-10 items-center rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Ver todos
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {grupos.map((grupo) => (
              <section
                key={(grupo.clave || grupo.titulo) + grupo.items[0].id}
                className={
                  grupo.esHoy
                    ? "rounded-3xl border-2 border-(--marca) bg-linear-to-br from-(--marca-fondo) via-white to-white p-4 shadow-sm sm:p-5"
                    : ""
                }
              >
                {grupo.titulo && (
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2
                        suppressHydrationWarning
                        className={`font-display text-sm font-bold tracking-tight ${
                          grupo.esHoy ? "text-vuki-ink sm:text-base" : "text-slate-700"
                        }`}
                      >
                        {grupo.titulo}
                      </h2>
                      {grupo.esHoy && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-(--marca-borde) bg-(--marca-fondo) px-2.5 py-0.5 text-xs font-bold text-(--marca-texto)">
                          <span
                            aria-hidden="true"
                            className="h-1.5 w-1.5 rounded-full bg-(--marca)"
                          />
                          Hoy
                        </span>
                      )}
                      {grupo.esManana && (
                        <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/70">
                          Mañana
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        · {grupo.items.length}{" "}
                        {grupo.items.length === 1 ? "horario" : "horarios"}
                      </span>
                    </div>

                    {grupo.clave && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirNuevo({
                            modoInicial: "uno",
                            fechaPreferida: grupo.clave,
                          })
                        }
                        className="vuki-focus inline-flex min-h-8 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-(--marca-texto) transition hover:bg-(--marca-fondo)"
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Agregar en este día
                      </button>
                    )}
                  </div>
                )}

                <Lista as="ul" className="space-y-3">
                  {grupo.items.map((horario) => {
                    const ocupados =
                      horario.cuposTotales - horario.cuposDisponibles;
                    const porcentaje = Math.round(
                      (ocupados / horario.cuposTotales) * 100,
                    );
                    const lleno = horario.cuposDisponibles === 0;
                    const pocosCupos = !lleno && horario.cuposDisponibles <= 2;
                    const colorBarra = lleno
                      ? "bg-red-500"
                      : pocosCupos || porcentaje >= 50
                        ? "bg-amber-500"
                        : "bg-emerald-500";
                    const horaPrincipal = horario.fechaHora
                      ? formatoHoraIso(horario.fechaHora)
                      : horario.label;

                    return (
                      <ItemLista
                        as="li"
                        key={horario.id}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                              <Clock className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p
                                  suppressHydrationWarning
                                  className="font-display text-sm font-bold text-vuki-ink sm:text-base"
                                >
                                  {horaPrincipal}
                                </p>
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                    lleno
                                      ? "bg-red-100 text-red-700"
                                      : pocosCupos
                                        ? "bg-amber-100 text-amber-800"
                                        : ocupados > 0
                                          ? "bg-emerald-100 text-emerald-800"
                                          : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {lleno
                                    ? "Completo"
                                    : pocosCupos
                                      ? `Últimos ${horario.cuposDisponibles}`
                                      : `${horario.cuposDisponibles} disponibles`}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-xs font-medium text-slate-600">
                                {nombreServicio(horario.servicioId)}
                              </p>
                            </div>
                          </div>

                          {ocupados > 0 ? (
                            hrefReservas ? (
                              <Link
                                href={hrefReservas}
                                title="Cancela primero sus reservas si necesitas quitar este horario"
                                className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                              >
                                <CalendarCheck
                                  className="h-3.5 w-3.5 text-emerald-600"
                                  aria-hidden="true"
                                />
                                Ver reservas ({ocupados})
                              </Link>
                            ) : (
                              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                                Con reservas ({ocupados})
                              </span>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => setPorEliminar(horario)}
                              className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Quitar
                            </button>
                          )}
                        </div>

                        <div className="mt-3">
                          <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
                            <span>
                              {ocupados} de {horario.cuposTotales} cupos
                              reservados
                            </span>
                            <span>{porcentaje}%</span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${porcentaje}%` }}
                              transition={{ duration: 0.4, ease: "easeOut" }}
                              className={`h-full rounded-full ${colorBarra}`}
                            />
                          </div>
                        </div>
                      </ItemLista>
                    );
                  })}
                </Lista>
              </section>
            ))}
          </div>
        )}
      </div>

      <Drawer
        abierto={abierto}
        onClose={cerrarDrawer}
        titulo="Nuevo horario"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <div
              role="group"
              aria-label="Modo de creación"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
            >
              {(
                [
                  ["uno", "Un horario"],
                  ["repetir", "Repetir cada semana"],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={modo === valor}
                  onClick={() => cambiarModo(valor)}
                  className={`vuki-focus min-h-10 rounded-lg px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                    modo === valor
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="servicio"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Servicio
            </label>
            <select
              id="servicio"
              required
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className={INPUT}
            >
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
              <div>
                <label
                  htmlFor="fecha_horario"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  {modo === "uno" ? "Fecha" : "Desde el"}
                </label>
                <input
                  id="fecha_horario"
                  type="date"
                  required
                  min={hoyClave || undefined}
                  value={fecha}
                  onChange={(e) => seleccionarFecha(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div>
                <label
                  htmlFor="hora_horario"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Hora de inicio
                </label>
                <input
                  id="hora_horario"
                  type="time"
                  required
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className={INPUT}
                />
              </div>
            </div>

            {/* Atajos rápidos de fecha para crear en 1 clic */}
            {hoyClave && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-slate-500">Fecha rápida:</span>
                {[
                  { etiqueta: "Hoy", valor: hoyClave },
                  { etiqueta: "Mañana", valor: mananaClave },
                  ...(sabadoClave &&
                  sabadoClave !== hoyClave &&
                  sabadoClave !== mananaClave
                    ? [{ etiqueta: "Próx. sábado", valor: sabadoClave }]
                    : []),
                ].map((op) => (
                  <button
                    key={op.etiqueta}
                    type="button"
                    onClick={() => seleccionarFecha(op.valor)}
                    className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      fecha === op.valor
                        ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {op.etiqueta}
                  </button>
                ))}
              </div>
            )}

            {/* Atajos rápidos de hora frecuente */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-slate-500">Hora rápida:</span>
              {HORAS_RAPIDAS.map((op) => (
                <button
                  key={op.valor}
                  type="button"
                  onClick={() => setHora(op.valor)}
                  className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    hora.slice(0, 5) === op.valor
                      ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {op.etiqueta}
                </button>
              ))}
            </div>
          </div>

          {modo === "repetir" && (
            <>
              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-700">
                    Días de la semana
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {(
                      [
                        ["Lun–Vie", [1, 2, 3, 4, 5]],
                        ["Fin de sem.", [0, 6]],
                        ["Todos", [0, 1, 2, 3, 4, 5, 6]],
                      ] as const
                    ).map(([etiqueta, conjunto]) => {
                      const lista = [...conjunto];
                      const activo = diasIguales(lista);
                      return (
                        <button
                          key={etiqueta}
                          type="button"
                          onClick={() => setDias(lista)}
                          className={`vuki-focus rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
                            activo
                              ? "border-(--marca) bg-(--marca-fondo) text-(--marca-texto)"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {etiqueta}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between gap-1.5 sm:justify-start">
                  {DIAS_SEMANA.map((letra, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={dias.includes(i)}
                      aria-label={NOMBRES_DIAS_LARGOS[i].toLowerCase()}
                      onClick={() => alternarDia(i)}
                      className={`vuki-focus h-10 w-10 rounded-full text-sm font-semibold transition ${
                        dias.includes(i)
                          ? "bg-vuki-ink text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                    >
                      {letra}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="semanas"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Durante cuántas semanas
                  </label>
                  <div className="flex gap-1">
                    {SEMANAS_RAPIDAS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setSemanas(n)}
                        className={`vuki-focus rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
                          semanas === n
                            ? "border-(--marca) bg-(--marca-fondo) text-(--marca-texto)"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {n} sem
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id="semanas"
                  type="number"
                  min={1}
                  max={12}
                  value={semanas}
                  onChange={(e) =>
                    setSemanas(
                      Math.min(12, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  className={INPUT}
                />
              </div>
            </>
          )}

          <div>
            <label
              htmlFor="cupos"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Cantidad de cupos
            </label>
            <input
              id="cupos"
              type="number"
              min="1"
              required
              value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              className={INPUT}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-slate-500">Cupos rápidos:</span>
              {CUPOS_RAPIDOS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCupos(c)}
                  className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    cupos === c
                      ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Vista previa clara de lo que se va a publicar */}
          <div className="rounded-2xl border border-(--marca-borde) bg-(--marca-fondo) px-4 py-3 text-xs leading-relaxed text-slate-700">
            {modo === "uno" ? (
              fecha && hora ? (
                <p>
                  <strong className="font-semibold text-vuki-ink">
                    Listo para publicar:
                  </strong>{" "}
                  {formatoFechaLargaClave(fecha)} a las{" "}
                  {formatoHora24a12(hora.slice(0, 5))} ({cupos || 0}{" "}
                  {Number(cupos) === 1 ? "cupo" : "cupos"}).
                </p>
              ) : (
                <p>Selecciona la fecha y hora del horario.</p>
              )
            ) : fechasLote.length === 0 ? (
              <p>
                Elige una fecha futura y al menos un día de la semana para
                calcular los horarios.
              </p>
            ) : (
              <p>
                <strong className="font-semibold text-vuki-ink">
                  Se crearán {fechasLote.length}{" "}
                  {fechasLote.length === 1 ? "horario" : "horarios"}
                </strong>
                {fechasLote.length > MAX_LOTE ? ` (máximo ${MAX_LOTE})` : ""}:{" "}
                del {formatoFechaCortaLocal(fechasLote[0])} al{" "}
                {formatoFechaCortaLocal(fechasLote[fechasLote.length - 1])} a
                las {formatoHora24a12(hora.slice(0, 5))}.
              </p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={guardando}
            whileTap={{ scale: 0.97 }}
            className="vuki-focus flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {modo === "uno"
              ? "Agregar horario"
              : fechasLote.length > 0
                ? `Agregar ${fechasLote.length} horarios`
                : "Agregar horarios"}
          </motion.button>
        </form>
      </Drawer>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Quitar este horario?"
        descripcion="Dejará de estar disponible para reservar en tu enlace público."
        onConfirmar={() => void handleEliminar()}
        onCancelar={() => setPorEliminar(null)}
      />
    </EmpresaPage>
  );
}
