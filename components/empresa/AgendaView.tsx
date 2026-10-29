"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  Clock,
  Info,
  Loader2,
  Palmtree,
  Plus,
  Trash2,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { localCRaIso } from "../../lib/zona-horaria";

export interface VistaBloqueo {
  id: string;
  inicioIso: string;
  finIso: string;
  motivo: string;
}

export interface SugerenciaBloqueoInicial {
  abrir?: boolean;
  fecha?: string; // YYYY-MM-DD
}

type Resultado = string | void | Promise<string | void>;

interface AgendaViewProps {
  bloqueos: VistaBloqueo[];
  /** Fechas en formato `datetime-local` (sin zona horaria). Devuelve un error o nada. */
  onCrear: (datos: {
    inicio: string;
    fin: string;
    motivo: string;
  }) => Resultado;
  onEliminar: (id: string) => Resultado;
  /** Timestamps ISO de horarios futuros (para informar cuántos se pausan). */
  horariosIso?: string[];
  /** Timestamps ISO de reservas activas (para detectar conflictos antes de guardar). */
  reservasActivasIso?: string[];
  /** Valores calculados en servidor para evitar diferencias de hidratación. */
  hoyClave?: string;
  ahoraMs?: number;
  sugerenciaInicial?: SugerenciaBloqueoInicial;
  hrefCalendario?: string;
  hrefReservas?: string;
  onCerrarInicial?: () => void;
}

const CR_OFFSET_MS = -6 * 3_600_000;
const DIA_MS = 86_400_000;

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
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
const MESES_LARGOS = [
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

const MOTIVOS_RAPIDOS = [
  "Mantenimiento",
  "Mal clima / Marea",
  "Vacaciones",
  "Día libre / Feriado",
  "Evento privado",
];

const FRANJAS_RAPIDAS: {
  etiqueta: string;
  desde: string;
  hasta: string;
}[] = [
  { etiqueta: "Mañana (6 a.m. – 12 p.m.)", desde: "06:00", hasta: "12:00" },
  { etiqueta: "Tarde (12 p.m. – 6 p.m.)", desde: "12:00", hasta: "18:00" },
  { etiqueta: "Jornada (8 a.m. – 5 p.m.)", desde: "08:00", hasta: "17:00" },
];

const INPUT =
  "vuki-focus min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500";

function partesCR(iso: string) {
  const cr = new Date(new Date(iso).getTime() + CR_OFFSET_MS);
  return {
    anio: cr.getUTCFullYear(),
    mes: cr.getUTCMonth(),
    dia: cr.getUTCDate(),
    diaSemana: cr.getUTCDay(),
    hora: cr.getUTCHours(),
    minuto: cr.getUTCMinutes(),
  };
}

function formatoHora12(hora: number, minuto: number): string {
  const h = hora % 12 === 0 ? 12 : hora % 12;
  const m = String(minuto).padStart(2, "0");
  return `${h}:${m} ${hora < 12 ? "a.m." : "p.m."}`;
}

function describirBloqueo(inicioIso: string, finIso: string): {
  tituloFecha: string;
  etiquetaDuracion: string;
} {
  const ini = partesCR(inicioIso);
  const fin = partesCR(finIso);
  const esInicioDia = ini.hora === 0 && ini.minuto === 0;
  const esFinDia = fin.hora === 23 && fin.minuto >= 55;
  const mismoDia =
    ini.anio === fin.anio && ini.mes === fin.mes && ini.dia === fin.dia;

  if (mismoDia && esInicioDia && esFinDia) {
    return {
      tituloFecha: `${DIAS_LARGOS[ini.diaSemana]} ${ini.dia} de ${MESES_LARGOS[ini.mes]}`,
      etiquetaDuracion: "Todo el día",
    };
  }

  if (!mismoDia && esInicioDia && esFinDia) {
    const iniMs = new Date(inicioIso).getTime();
    const finMs = new Date(finIso).getTime();
    const dias = Math.max(2, Math.round((finMs - iniMs) / DIA_MS));
    return {
      tituloFecha: `${DIAS_CORTOS[ini.diaSemana]} ${ini.dia} ${MESES_CORTOS[ini.mes]} – ${DIAS_CORTOS[fin.diaSemana]} ${fin.dia} ${MESES_CORTOS[fin.mes]}`,
      etiquetaDuracion: `${dias} días completos`,
    };
  }

  if (mismoDia) {
    return {
      tituloFecha: `${DIAS_LARGOS[ini.diaSemana]} ${ini.dia} de ${MESES_LARGOS[ini.mes]}`,
      etiquetaDuracion: `${formatoHora12(ini.hora, ini.minuto)} – ${formatoHora12(fin.hora, fin.minuto)}`,
    };
  }

  return {
    tituloFecha: `${DIAS_CORTOS[ini.diaSemana]} ${ini.dia} ${MESES_CORTOS[ini.mes]} (${formatoHora12(ini.hora, ini.minuto)}) – ${DIAS_CORTOS[fin.diaSemana]} ${fin.dia} ${MESES_CORTOS[fin.mes]} (${formatoHora12(fin.hora, fin.minuto)})`,
    etiquetaDuracion: "Rango personalizado",
  };
}

function aClaveFecha(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}`;
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

function proximoSabadoClave(claveBase: string): string {
  const f = parseClaveFecha(claveBase);
  if (!f) return claveBase;
  const delta = (6 - f.getDay() + 7) % 7;
  f.setDate(f.getDate() + delta);
  return aClaveFecha(f);
}

/** Gestión de bloqueos y excepciones de agenda del panel de empresa. */
export default function AgendaView({
  bloqueos,
  onCrear,
  onEliminar,
  horariosIso = [],
  reservasActivasIso = [],
  hoyClave,
  ahoraMs,
  sugerenciaInicial,
  hrefCalendario,
  hrefReservas,
  onCerrarInicial,
}: AgendaViewProps) {
  const fechaBase =
    sugerenciaInicial?.fecha ||
    (hoyClave ? sumarDiasClave(hoyClave, 1) : "");

  const [abierto, setAbierto] = useState<boolean>(
    Boolean(sugerenciaInicial?.abrir),
  );
  const [modo, setModo] = useState<"dias" | "horas">("dias");
  const [fechaDesde, setFechaDesde] = useState(fechaBase);
  const [fechaHasta, setFechaHasta] = useState(fechaBase);
  const [horaDesde, setHoraDesde] = useState("08:00");
  const [horaHasta, setHoraHasta] = useState("17:00");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);

  const [porEliminar, setPorEliminar] = useState<VistaBloqueo | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const mananaClave = hoyClave ? sumarDiasClave(hoyClave, 1) : "";

  const rangoActual = useMemo(() => {
    const inicioLocal =
      modo === "dias"
        ? fechaDesde
          ? `${fechaDesde}T00:00`
          : ""
        : fechaDesde && horaDesde
          ? `${fechaDesde}T${horaDesde.slice(0, 5)}`
          : "";
    const finLocal =
      modo === "dias"
        ? fechaHasta
          ? `${fechaHasta}T23:59`
          : ""
        : fechaDesde && horaHasta
          ? `${fechaDesde}T${horaHasta.slice(0, 5)}`
          : "";

    const inicioIso = inicioLocal ? localCRaIso(inicioLocal) : "";
    const finIso = finLocal ? localCRaIso(finLocal) : "";
    const iniMs = inicioIso ? new Date(inicioIso).getTime() : NaN;
    const finMs = finIso ? new Date(finIso).getTime() : NaN;
    const valido =
      !Number.isNaN(iniMs) && !Number.isNaN(finMs) && finMs >= iniMs;

    if (!valido) {
      return {
        inicioLocal,
        finLocal,
        inicioIso: "",
        finIso: "",
        valido: false,
        reservasConflicto: 0,
        horariosPausados: 0,
      };
    }

    const reservasConflicto = reservasActivasIso.filter((iso) => {
      const t = new Date(iso).getTime();
      return t >= iniMs && t <= finMs;
    }).length;

    const horariosPausados = horariosIso.filter((iso) => {
      const t = new Date(iso).getTime();
      return t >= iniMs && t <= finMs;
    }).length;

    return {
      inicioLocal,
      finLocal,
      inicioIso,
      finIso,
      valido: true,
      reservasConflicto,
      horariosPausados,
    };
  }, [
    modo,
    fechaDesde,
    fechaHasta,
    horaDesde,
    horaHasta,
    reservasActivasIso,
    horariosIso,
  ]);

  const resumen = useMemo(() => {
    const refMs = ahoraMs ?? 0;
    const enCurso = refMs
      ? bloqueos.filter(
          (b) =>
            new Date(b.inicioIso).getTime() <= refMs &&
            new Date(b.finIso).getTime() >= refMs,
        ).length
      : 0;
    const horariosAfectados = new Set<string>();
    for (const hIso of horariosIso) {
      const t = new Date(hIso).getTime();
      if (
        bloqueos.some(
          (b) =>
            t >= new Date(b.inicioIso).getTime() &&
            t <= new Date(b.finIso).getTime(),
        )
      ) {
        horariosAfectados.add(hIso);
      }
    }
    return {
      total: bloqueos.length,
      enCurso,
      horariosPausados: horariosAfectados.size,
    };
  }, [bloqueos, horariosIso, ahoraMs]);

  function abrirNuevo(opciones?: {
    modoInicial?: "dias" | "horas";
    motivoInicial?: string;
    diasDuracion?: number;
  }) {
    const base =
      mananaClave || hoyClave || aClaveFecha(new Date(Date.now() + DIA_MS));
    const extra = Math.max(0, (opciones?.diasDuracion ?? 1) - 1);

    setModo(opciones?.modoInicial ?? "dias");
    setFechaDesde(base);
    setFechaHasta(extra > 0 ? sumarDiasClave(base, extra) : base);
    setHoraDesde("08:00");
    setHoraHasta("17:00");
    setMotivo(opciones?.motivoInicial ?? "");
    setAbierto(true);
  }

  function cerrarDrawer() {
    setAbierto(false);
    onCerrarInicial?.();
  }

  function cambiarFechaDesde(nueva: string) {
    setFechaDesde(nueva);
    if (!fechaHasta || fechaHasta < nueva) {
      setFechaHasta(nueva);
    }
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!rangoActual.valido) {
      toast.error("La fecha u hora de fin no puede ser anterior a la de inicio.");
      return;
    }
    if (motivo.trim().length < 3) {
      toast.error("Indica un motivo de al menos 3 caracteres.");
      return;
    }
    setGuardando(true);
    const error = await onCrear({
      inicio: rangoActual.inicioLocal,
      fin: rangoActual.finLocal,
      motivo: motivo.trim(),
    });
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Bloqueo guardado con éxito");
    setAbierto(false);
  }

  async function handleEliminar() {
    if (!porEliminar || eliminando) return;
    setEliminando(true);
    const error = await onEliminar(porEliminar.id);
    setEliminando(false);
    if (error) toast.error(error);
    else toast.success("Bloqueo eliminado. Las fechas volvieron a abrirse.");
    setPorEliminar(null);
  }

  return (
    <EmpresaPage
      titulo="Agenda / Bloqueos"
      descripcion="Cierra temporalmente días completos o franjas horarias por vacaciones, mantenimiento o clima."
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
            whileTap={{ scale: 0.96 }}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo bloqueo
          </motion.button>
        </div>
      }
    >
      {/* Resumen cuando existen bloqueos activos o programados */}
      {bloqueos.length > 0 && (
        <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-(--marca-borde) bg-white px-4 py-3 text-xs shadow-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            <CalendarOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            {resumen.total}{" "}
            {resumen.total === 1 ? "bloqueo vigente" : "bloqueos vigentes"}
          </span>

          {resumen.enCurso > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700 ring-1 ring-red-200/80">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-red-500"
              />
              {resumen.enCurso} en curso ahora
            </span>
          )}

          {resumen.horariosPausados > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800">
              <Clock className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
              {resumen.horariosPausados}{" "}
              {resumen.horariosPausados === 1
                ? "horario pausado"
                : "horarios pausados"}
            </span>
          )}
        </div>
      )}

      <p className="flex items-start gap-2 rounded-2xl border border-slate-200/70 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <Info
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
          aria-hidden="true"
        />
        <span>
          Los bloqueos ocultan temporalmente los horarios que caigan dentro de
          esas fechas en tu enlace público, sin borrarlos. Si quitas el bloqueo,
          esos horarios vuelven a estar disponibles de inmediato.
        </span>
      </p>

      <div className="mt-6">
        {bloqueos.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
              <CalendarCheck className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-4 font-display text-base font-bold text-vuki-ink sm:text-lg">
              Tu agenda está abierta y sin bloqueos
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
              Todos tus horarios futuros están recibiendo reservas normalmente.
              Si necesitas cerrar un día, unas horas o irte de vacaciones,
              bloquéalo en un clic:
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => abrirNuevo({ modoInicial: "dias" })}
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <CalendarOff className="h-4 w-4" aria-hidden="true" />
                Bloquear un día
              </button>
              <button
                type="button"
                onClick={() =>
                  abrirNuevo({
                    modoInicial: "dias",
                    motivoInicial: "Vacaciones",
                    diasDuracion: 7,
                  })
                }
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Palmtree className="h-4 w-4" aria-hidden="true" />
                Programar vacaciones
              </button>
              <button
                type="button"
                onClick={() =>
                  abrirNuevo({
                    modoInicial: "horas",
                    motivoInicial: "Mantenimiento",
                  })
                }
                className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                Bloquear unas horas
              </button>
            </div>
          </div>
        ) : (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Bloqueos vigentes y próximos
            </h2>

            <Lista as="ul" className="space-y-3">
              {bloqueos.map((bloqueo) => {
                const { tituloFecha, etiquetaDuracion } = describirBloqueo(
                  bloqueo.inicioIso,
                  bloqueo.finIso,
                );
                const iniMs = new Date(bloqueo.inicioIso).getTime();
                const finMs = new Date(bloqueo.finIso).getTime();
                const enCurso = Boolean(
                  ahoraMs && iniMs <= ahoraMs && finMs >= ahoraMs,
                );
                const pausados = horariosIso.filter((iso) => {
                  const t = new Date(iso).getTime();
                  return t >= iniMs && t <= finMs;
                }).length;

                return (
                  <ItemLista
                    as="li"
                    key={bloqueo.id}
                    className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 shadow-sm sm:p-5 ${
                      enCurso
                        ? "border-red-200 bg-red-50/35"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          enCurso
                            ? "bg-red-100 text-red-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <CalendarOff className="h-4 w-4" aria-hidden="true" />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-display text-sm font-bold text-vuki-ink sm:text-base">
                            {tituloFecha}
                          </p>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                            {etiquetaDuracion}
                          </span>
                          {enCurso && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                              <span
                                aria-hidden="true"
                                className="h-1.5 w-1.5 rounded-full bg-red-500"
                              />
                              En curso
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {bloqueo.motivo}
                        </p>

                        {pausados > 0 && (
                          <p className="mt-1 text-xs font-medium text-amber-700">
                            Pausa {pausados}{" "}
                            {pausados === 1
                              ? "horario publicado"
                              : "horarios publicados"}{" "}
                            en este período
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPorEliminar(bloqueo)}
                      aria-label={`Quitar bloqueo: ${bloqueo.motivo}`}
                      className="vuki-focus inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Quitar
                    </button>
                  </ItemLista>
                );
              })}
            </Lista>
          </section>
        )}
      </div>

      <Drawer
        abierto={abierto}
        onClose={cerrarDrawer}
        titulo="Nuevo bloqueo"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <div
              role="group"
              aria-label="Tipo de bloqueo"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
            >
              {(
                [
                  ["dias", "Día(s) completo(s)"],
                  ["horas", "Franja de horas"],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={modo === valor}
                  onClick={() => setModo(valor)}
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

          {modo === "dias" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                <div>
                  <label
                    htmlFor="bloqueo_desde"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Desde el
                  </label>
                  <input
                    id="bloqueo_desde"
                    type="date"
                    required
                    min={hoyClave || undefined}
                    value={fechaDesde}
                    onChange={(e) => cambiarFechaDesde(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label
                    htmlFor="bloqueo_hasta"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Hasta el
                  </label>
                  <input
                    id="bloqueo_hasta"
                    type="date"
                    required
                    min={fechaDesde || hoyClave || undefined}
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>

              {hoyClave && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="mr-1 text-xs text-slate-500">Rango rápido:</span>
                  {[
                    {
                      etiqueta: "Hoy",
                      desde: hoyClave,
                      hasta: hoyClave,
                    },
                    {
                      etiqueta: "Mañana",
                      desde: mananaClave,
                      hasta: mananaClave,
                    },
                    {
                      etiqueta: "Fin de semana",
                      desde: proximoSabadoClave(hoyClave),
                      hasta: sumarDiasClave(proximoSabadoClave(hoyClave), 1),
                    },
                    {
                      etiqueta: "1 semana",
                      desde: fechaDesde || mananaClave,
                      hasta: sumarDiasClave(fechaDesde || mananaClave, 6),
                    },
                  ].map((op) => {
                    const activo =
                      fechaDesde === op.desde && fechaHasta === op.hasta;
                    return (
                      <button
                        key={op.etiqueta}
                        type="button"
                        onClick={() => {
                          setFechaDesde(op.desde);
                          setFechaHasta(op.hasta);
                        }}
                        className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          activo
                            ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {op.etiqueta}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="bloqueo_fecha_horas"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Fecha
                </label>
                <input
                  id="bloqueo_fecha_horas"
                  type="date"
                  required
                  min={hoyClave || undefined}
                  value={fechaDesde}
                  onChange={(e) => cambiarFechaDesde(e.target.value)}
                  className={INPUT}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="hora_inicio_bloqueo"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Hora inicio
                  </label>
                  <input
                    id="hora_inicio_bloqueo"
                    type="time"
                    required
                    value={horaDesde}
                    onChange={(e) => setHoraDesde(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label
                    htmlFor="hora_fin_bloqueo"
                    className="mb-1.5 block text-sm font-medium text-slate-700"
                  >
                    Hora fin
                  </label>
                  <input
                    id="hora_fin_bloqueo"
                    type="time"
                    required
                    min={horaDesde || undefined}
                    value={horaHasta}
                    onChange={(e) => setHoraHasta(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-slate-500">Franja:</span>
                {FRANJAS_RAPIDAS.map((fr) => {
                  const activa =
                    horaDesde.slice(0, 5) === fr.desde &&
                    horaHasta.slice(0, 5) === fr.hasta;
                  return (
                    <button
                      key={fr.etiqueta}
                      type="button"
                      onClick={() => {
                        setHoraDesde(fr.desde);
                        setHoraHasta(fr.hasta);
                      }}
                      className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                        activa
                          ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {fr.etiqueta}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label
              htmlFor="motivo"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Motivo del cierre
            </label>
            <input
              id="motivo"
              required
              minLength={3}
              maxLength={200}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Mantenimiento de equipo, vacaciones..."
              className={INPUT}
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-slate-500">Sugerencias:</span>
              {MOTIVOS_RAPIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                    motivo === m
                      ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Detector en vivo de conflictos con reservas e impacto en horarios */}
          {rangoActual.valido ? (
            rangoActual.reservasConflicto > 0 ? (
              <div
                role="alert"
                className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900"
              >
                <p className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle
                    className="h-4 w-4 shrink-0 text-amber-600"
                    aria-hidden="true"
                  />
                  Conflicto con {rangoActual.reservasConflicto}{" "}
                  {rangoActual.reservasConflicto === 1
                    ? "reserva activa"
                    : "reservas activas"}
                </p>
                <p className="mt-1 text-amber-800">
                  Ya tienes clientes reservados dentro de este rango. Para
                  bloquear estas fechas, primero gestiónalas en Reservas.
                </p>
                {hrefReservas && (
                  <Link
                    href={hrefReservas}
                    className="vuki-focus mt-2 inline-flex items-center font-semibold text-amber-950 underline"
                  >
                    Ir a Reservas →
                  </Link>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-(--marca-borde) bg-(--marca-fondo) px-4 py-3 text-xs leading-relaxed text-slate-700">
                <p>
                  <strong className="font-semibold text-vuki-ink">
                    Resumen del cierre:
                  </strong>{" "}
                  {
                    describirBloqueo(
                      rangoActual.inicioIso,
                      rangoActual.finIso,
                    ).tituloFecha
                  }{" "}
                  (
                  {
                    describirBloqueo(
                      rangoActual.inicioIso,
                      rangoActual.finIso,
                    ).etiquetaDuracion
                  }
                  ).
                </p>
                {rangoActual.horariosPausados > 0 && (
                  <p className="mt-1 text-slate-600">
                    Se pausarán temporalmente{" "}
                    <strong className="font-semibold text-slate-800">
                      {rangoActual.horariosPausados}{" "}
                      {rangoActual.horariosPausados === 1
                        ? "horario publicado"
                        : "horarios publicados"}
                    </strong>{" "}
                    mientras el bloqueo esté activo.
                  </p>
                )}
              </div>
            )
          ) : (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-700">
              Revisa que la fecha u hora de fin sea posterior a la de inicio.
            </p>
          )}

          <motion.button
            type="submit"
            disabled={
              guardando ||
              !rangoActual.valido ||
              rangoActual.reservasConflicto > 0
            }
            whileTap={{ scale: 0.97 }}
            className="vuki-focus flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarOff className="h-4 w-4" />
            )}
            Guardar bloqueo
          </motion.button>
        </form>
      </Drawer>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Quitar este bloqueo?"
        descripcion="Las fechas y horarios dentro de ese período volverán a estar disponibles en tu enlace público."
        onConfirmar={() => void handleEliminar()}
        onCancelar={() => setPorEliminar(null)}
      />
    </EmpresaPage>
  );
}
