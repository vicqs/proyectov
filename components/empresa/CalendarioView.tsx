"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  CalendarOff,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListChecks,
  Plus,
  User,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";

export interface CalendarioReservaItem {
  id: string;
  cliente: string;
  email?: string;
  cupos: number;
  estado: "pendiente" | "pagada";
}

export interface CalendarioReservaSuelta extends CalendarioReservaItem {
  servicioId: string;
  servicioNombre: string;
  hora: string;
}

export interface CalendarioSlotItem {
  id: string;
  servicioId: string;
  servicioNombre: string;
  duracionMin?: number;
  hora: string;
  cuposTotales: number;
  cuposDisponibles: number;
  bloqueado: boolean;
  yaPaso: boolean;
  reservas: CalendarioReservaItem[];
}

export interface CalendarioBloqueoItem {
  id: string;
  motivo: string;
  horarioTexto: string;
}

export interface CalendarioDiaItem {
  clave: string; // YYYY-MM-DD
  iso: string;
  diaNumero: number;
  diaSemanaCorto: string;
  diaSemanaLargo: string;
  mesCorto: string;
  mesLargo: string;
  esHoy: boolean;
  esManana: boolean;
  esPasado: boolean;
  slots: CalendarioSlotItem[];
  reservasSueltas: CalendarioReservaSuelta[];
  bloqueos: CalendarioBloqueoItem[];
}

export interface CalendarioViewProps {
  rangoSemana: string;
  etiquetaPeriodo: string;
  offset: number;
  enlaceAnterior?: string;
  enlaceHoy: string;
  enlaceSiguiente?: string;
  hrefHorarios: string;
  hrefAgenda: string;
  hrefReservas: string;
  hrefServicios: string;
  textoMarca: "#ffffff" | "#0f172a";
  servicios: { id: string; nombre: string }[];
  dias: CalendarioDiaItem[];
}

const ESTADO_RESERVA_BADGE: Record<"pendiente" | "pagada", string> = {
  pagada: "bg-emerald-100 text-emerald-800",
  pendiente: "bg-amber-100 text-amber-800",
};

const ESTADO_RESERVA_TEXTO: Record<"pendiente" | "pagada", string> = {
  pagada: "Pagado",
  pendiente: "Pendiente",
};

/**
 * Vista semanal interactiva del calendario operativo de la empresa:
 * destaca el día de hoy, resume ocupación/reservas/bloqueos de la semana,
 * permite saltar rápido entre días y filtrar por servicio o actividad.
 */
export default function CalendarioView({
  rangoSemana,
  etiquetaPeriodo,
  offset,
  enlaceAnterior,
  enlaceHoy,
  enlaceSiguiente,
  hrefHorarios,
  hrefAgenda,
  hrefReservas,
  hrefServicios,
  textoMarca,
  servicios,
  dias,
}: CalendarioViewProps) {
  const [servicioFiltro, setServicioFiltro] = useState("");
  const [soloConActividad, setSoloConActividad] = useState(false);
  const [diaEnfocado, setDiaEnfocado] = useState<string | null>(null);
  const [slotsAbiertos, setSlotsAbiertos] = useState<Record<string, boolean>>(
    {},
  );

  const diasFiltrados = useMemo(
    () =>
      dias.map((d) => ({
        ...d,
        slots: servicioFiltro
          ? d.slots.filter((s) => s.servicioId === servicioFiltro)
          : d.slots,
        reservasSueltas: servicioFiltro
          ? d.reservasSueltas.filter((r) => r.servicioId === servicioFiltro)
          : d.reservasSueltas,
      })),
    [dias, servicioFiltro],
  );

  const resumen = useMemo(() => {
    let horarios = 0;
    let cuposTotales = 0;
    let cuposOcupados = 0;
    let reservasActivas = 0;
    let reservasPendientes = 0;
    const bloqueosUnicos = new Set<string>();

    for (const d of diasFiltrados) {
      horarios += d.slots.length;
      for (const s of d.slots) {
        cuposTotales += s.cuposTotales;
        cuposOcupados += s.cuposTotales - s.cuposDisponibles;
        reservasActivas += s.reservas.length;
        reservasPendientes += s.reservas.filter(
          (r) => r.estado === "pendiente",
        ).length;
      }
      reservasActivas += d.reservasSueltas.length;
      reservasPendientes += d.reservasSueltas.filter(
        (r) => r.estado === "pendiente",
      ).length;
      for (const b of d.bloqueos) {
        bloqueosUnicos.add(b.id);
      }
    }

    const porcentaje =
      cuposTotales > 0 ? Math.round((cuposOcupados / cuposTotales) * 100) : 0;

    return {
      horarios,
      cuposTotales,
      cuposOcupados,
      porcentaje,
      reservasActivas,
      reservasPendientes,
      bloqueos: bloqueosUnicos.size,
    };
  }, [diasFiltrados]);

  const tieneAlgunDiaActivo = diasFiltrados.some(
    (d) =>
      d.slots.length > 0 ||
      d.reservasSueltas.length > 0 ||
      d.bloqueos.length > 0,
  );
  const tieneAlgunDiaVacio = diasFiltrados.some(
    (d) =>
      !d.esHoy &&
      d.slots.length === 0 &&
      d.reservasSueltas.length === 0 &&
      d.bloqueos.length === 0,
  );

  const diasVisibles = soloConActividad
    ? diasFiltrados.filter(
        (d) =>
          d.esHoy ||
          d.slots.length > 0 ||
          d.reservasSueltas.length > 0 ||
          d.bloqueos.length > 0,
      )
    : diasFiltrados;

  function irADia(clave: string, esHoy: boolean) {
    if (soloConActividad) {
      const target = diasFiltrados.find((d) => d.clave === clave);
      const vacio =
        target &&
        !target.esHoy &&
        target.slots.length === 0 &&
        target.reservasSueltas.length === 0 &&
        target.bloqueos.length === 0;
      if (vacio) setSoloConActividad(false);
    }
    setDiaEnfocado(clave);
    requestAnimationFrame(() => {
      const id = esHoy ? "hoy" : `dia-${clave}`;
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function slotEstaAbierto(slotId: string, esHoy: boolean) {
    return slotsAbiertos[slotId] ?? esHoy;
  }

  function alternarSlot(slotId: string, esHoy: boolean) {
    setSlotsAbiertos((prev) => ({
      ...prev,
      [slotId]: !(prev[slotId] ?? esHoy),
    }));
  }

  function enlaceAgregarHorario(fecha?: string): string {
    if (servicios.length === 0) return hrefHorarios;
    const params = new URLSearchParams({ nuevo: "1" });
    if (fecha) params.set("fecha", fecha);
    if (servicioFiltro) params.set("servicio", servicioFiltro);
    return `${hrefHorarios}?${params.toString()}`;
  }

  const fechaBaseSemana = offset > 0 ? dias[0]?.clave : undefined;

  const botonNav =
    "vuki-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50";

  return (
    <EmpresaPage
      titulo="Calendario"
      descripcion={
        <span className="inline-flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              offset === 0
                ? "border border-(--marca-borde) bg-(--marca-fondo) text-(--marca-texto)"
                : "border border-slate-200 bg-white text-slate-700"
            }`}
          >
            {offset === 0 && (
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full bg-(--marca)"
              />
            )}
            {etiquetaPeriodo}
          </span>
          <span>
            Semana del <strong className="font-semibold text-slate-800">{rangoSemana}</strong>: horarios, ocupación y bloqueos.
          </span>
        </span>
      }
      accion={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <div
            role="group"
            aria-label="Navegación por semana"
            className="flex items-center gap-1.5"
          >
            {enlaceAnterior ? (
              <Link
                href={enlaceAnterior}
                aria-label="Semana anterior"
                className={botonNav}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={`${botonNav} cursor-not-allowed opacity-40`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </span>
            )}

            {offset === 0 ? (
              <a
                href="#hoy"
                onClick={(e) => {
                  const hoy = dias.find((d) => d.esHoy);
                  if (hoy) {
                    e.preventDefault();
                    irADia(hoy.clave, true);
                  }
                }}
                className="vuki-focus inline-flex min-h-11 items-center gap-2 rounded-xl border border-(--marca-borde) bg-white px-3.5 text-sm font-semibold text-(--marca-texto) shadow-2xs transition hover:bg-(--marca-fondo)"
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 rounded-full bg-(--marca)"
                />
                Hoy
              </a>
            ) : (
              <Link
                href={enlaceHoy}
                className="vuki-focus inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-(--marca) bg-(--marca-fondo) px-3.5 text-sm font-semibold text-(--marca-texto) shadow-2xs transition hover:brightness-95"
              >
                Volver a hoy
              </Link>
            )}

            {enlaceSiguiente ? (
              <Link
                href={enlaceSiguiente}
                aria-label="Semana siguiente"
                className={botonNav}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <span
                aria-disabled="true"
                className={`${botonNav} cursor-not-allowed opacity-40`}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </div>

          <Link
            href={enlaceAgregarHorario(fechaBaseSemana)}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar horario
          </Link>
        </div>
      }
    >
      {/* Tira rápida de los 7 días + resumen operativo y filtros */}
      <section
        aria-label="Resumen de la semana"
        className="mb-6 rounded-3xl border border-(--marca-borde) bg-white p-3 shadow-sm shadow-slate-900/[0.03] sm:p-4"
      >
        <div
          role="navigation"
          aria-label="Días de la semana"
          className="grid grid-cols-7 gap-1 sm:gap-2"
        >
          {diasFiltrados.map((d) => {
            const totalItems = d.slots.length + d.reservasSueltas.length;
            const tieneBloqueo = d.bloqueos.length > 0;
            const hayCuposCriticos = d.slots.some(
              (s) => !s.bloqueado && s.cuposDisponibles <= 2,
            );
            const enfocado = diaEnfocado === d.clave;

            return (
              <button
                key={d.clave}
                type="button"
                onClick={() => irADia(d.clave, d.esHoy)}
                aria-current={d.esHoy ? "date" : undefined}
                aria-label={`${d.diaSemanaLargo} ${d.diaNumero} de ${d.mesLargo}${d.esHoy ? " (Hoy)" : ""}: ${d.slots.length} horarios`}
                style={
                  d.esHoy
                    ? { backgroundColor: "var(--marca)", color: textoMarca }
                    : undefined
                }
                className={`vuki-focus group relative flex min-h-16 flex-col items-center justify-center rounded-2xl px-1 py-2 text-center transition sm:min-h-20 sm:px-2 ${
                  d.esHoy
                    ? "shadow-md ring-2 ring-(--marca-borde)"
                    : enfocado
                      ? "bg-(--marca-fondo) text-(--marca-texto) ring-1 ring-(--marca-borde)"
                      : d.esPasado
                        ? "text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                        : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wider ${
                    d.esHoy
                      ? "opacity-90"
                      : d.esPasado
                        ? "text-slate-400"
                        : "text-slate-500"
                  }`}
                >
                  {d.diaSemanaCorto}
                </span>
                <span className="mt-0.5 font-display text-base font-bold leading-none sm:text-lg">
                  {d.diaNumero}
                </span>

                {d.esHoy ? (
                  <span
                    className="mt-1 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ color: textoMarca }}
                  >
                    Hoy{totalItems > 0 ? ` · ${totalItems}` : ""}
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 flex h-3 items-center justify-center gap-1"
                  >
                    {tieneBloqueo && (
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    )}
                    {totalItems > 0 ? (
                      <>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            hayCuposCriticos
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="hidden text-[10px] font-semibold text-slate-500 sm:inline">
                          {totalItems}
                        </span>
                      </>
                    ) : (
                      !tieneBloqueo && (
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                      )
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
              <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
              {resumen.horarios}{" "}
              {resumen.horarios === 1 ? "horario" : "horarios"}
            </span>

            {resumen.cuposTotales > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                <CalendarDays
                  className="h-3.5 w-3.5 text-emerald-600"
                  aria-hidden="true"
                />
                {resumen.cuposOcupados}/{resumen.cuposTotales} cupos (
                {resumen.porcentaje}%)
              </span>
            )}

            {resumen.reservasActivas > 0 && (
              <Link
                href={hrefReservas}
                className={`vuki-focus inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium transition hover:brightness-95 ${
                  resumen.reservasPendientes > 0
                    ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
                    : "bg-sky-50 text-sky-800"
                }`}
              >
                <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {resumen.reservasActivas}{" "}
                {resumen.reservasActivas === 1 ? "reserva" : "reservas"}
                {resumen.reservasPendientes > 0
                  ? ` (${resumen.reservasPendientes} pendiente${resumen.reservasPendientes === 1 ? "" : "s"})`
                  : ""}
              </Link>
            )}

            {resumen.bloqueos > 0 && (
              <Link
                href={hrefAgenda}
                className="vuki-focus inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700 transition hover:bg-red-100"
              >
                <CalendarOff className="h-3.5 w-3.5" aria-hidden="true" />
                {resumen.bloqueos}{" "}
                {resumen.bloqueos === 1 ? "bloqueo" : "bloqueos"}
              </Link>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {servicios.length > 1 && (
              <select
                aria-label="Filtrar por servicio"
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
            )}

            {tieneAlgunDiaActivo && tieneAlgunDiaVacio && (
              <button
                type="button"
                aria-pressed={soloConActividad}
                onClick={() => setSoloConActividad((v) => !v)}
                className={`vuki-focus min-h-9 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                  soloConActividad
                    ? "border-(--marca) bg-(--marca-fondo) text-(--marca-texto)"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {soloConActividad
                  ? "Mostrando días con actividad"
                  : "Ocultar días vacíos"}
              </button>
            )}

            <Link
              href={hrefAgenda}
              className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              <CalendarOff className="h-3.5 w-3.5" aria-hidden="true" />
              Bloqueos
            </Link>
          </div>
        </div>
      </section>

      {/* Aviso accionable cuando toda la semana carece de horarios publicados */}
      {resumen.horarios === 0 && offset >= 0 && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-3 rounded-2xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-vuki-ink">
              {servicios.length === 0
                ? "Crea tu primer servicio para activar el calendario"
                : servicioFiltro
                  ? "Este servicio no tiene horarios publicados en esta semana"
                  : "No tienes horarios publicados para esta semana"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              {servicios.length === 0
                ? "Primero registra los tours o actividades que ofreces y luego publica sus franjas horarias."
                : "Agrega horarios individuales o repetidos por semana para empezar a recibir reservas en tu enlace público."}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {servicios.length === 0 ? (
              <Link
                href={`${hrefServicios}?nuevo=1`}
                className="vuki-focus inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                Crear servicio
              </Link>
            ) : (
              <>
                {servicioFiltro && (
                  <button
                    type="button"
                    onClick={() => setServicioFiltro("")}
                    className="vuki-focus inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Ver todos
                  </button>
                )}
                <Link
                  href={enlaceAgregarHorario(fechaBaseSemana)}
                  className="vuki-focus inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Publicar horarios
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Lista de días de la semana */}
      <Lista
        key={`${servicioFiltro}-${soloConActividad ? "activos" : "todos"}`}
        as="ul"
        className="space-y-3.5"
      >
        {diasVisibles.map((dia) => {
          const sinActividad =
            dia.slots.length === 0 &&
            dia.reservasSueltas.length === 0 &&
            dia.bloqueos.length === 0;
          const enfocado = diaEnfocado === dia.clave;

          // Días pasados sin actividad: fila compacta de bajo peso visual
          // para no empujar el día de HOY fuera de la pantalla.
          if (dia.esPasado && sinActividad) {
            return (
              <ItemLista
                as="li"
                key={dia.iso}
              >
                <div
                  id={`dia-${dia.clave}`}
                  className={`flex scroll-mt-24 items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition ${
                    enfocado
                      ? "border-(--marca) bg-white ring-2 ring-(--marca-borde)"
                      : "border-slate-200/75 bg-slate-50/70"
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 font-display text-xs font-bold text-slate-500">
                      {dia.diaNumero}
                    </span>
                    <h2 className="truncate text-sm font-medium text-slate-500">
                      {dia.diaSemanaLargo}{" "}
                      <span className="text-slate-400">
                        {dia.diaNumero} {dia.mesCorto}
                      </span>
                    </h2>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">
                    Sin actividad
                  </span>
                </div>
              </ItemLista>
            );
          }

          const cuposDiaTotales = dia.slots.reduce(
            (acc, s) => acc + s.cuposTotales,
            0,
          );
          const cuposDiaOcupados = dia.slots.reduce(
            (acc, s) => acc + (s.cuposTotales - s.cuposDisponibles),
            0,
          );

          return (
            <ItemLista as="li" key={dia.iso}>
              <article
                id={dia.esHoy ? "hoy" : `dia-${dia.clave}`}
                className={`relative scroll-mt-24 overflow-hidden transition ${
                  dia.esHoy
                    ? "rounded-3xl border-2 border-(--marca) bg-linear-to-br from-(--marca-fondo) via-white to-white p-5 shadow-md shadow-slate-900/[0.05] sm:p-6"
                    : enfocado
                      ? "rounded-2xl border border-(--marca) bg-white p-4 shadow-sm ring-2 ring-(--marca-borde) sm:p-5"
                      : dia.esPasado
                        ? "rounded-2xl border border-slate-200/85 bg-slate-50/50 p-4 sm:p-5"
                        : "rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300/90 sm:p-5"
                }`}
              >
                {dia.esHoy && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1.5 bg-linear-to-r from-(--marca) to-(--marca-2)"
                  />
                )}

                {/* Encabezado del día */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      aria-hidden="true"
                      style={
                        dia.esHoy
                          ? {
                              backgroundColor: "var(--marca)",
                              color: textoMarca,
                            }
                          : undefined
                      }
                      className={`flex shrink-0 flex-col items-center justify-center font-display leading-none ${
                        dia.esHoy
                          ? "h-12 w-12 rounded-2xl shadow-sm"
                          : dia.esPasado
                            ? "h-10 w-10 rounded-xl bg-slate-200/70 text-slate-600"
                            : "h-10 w-10 rounded-xl bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          dia.esHoy ? "opacity-85" : "text-slate-500"
                        }`}
                      >
                        {dia.diaSemanaCorto}
                      </span>
                      <span
                        className={`mt-0.5 font-bold ${
                          dia.esHoy ? "text-lg" : "text-sm"
                        }`}
                      >
                        {dia.diaNumero}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          className={`font-display tracking-tight ${
                            dia.esHoy
                              ? "text-base font-bold text-vuki-ink sm:text-lg"
                              : dia.esPasado
                                ? "text-sm font-semibold text-slate-600"
                                : "text-sm font-semibold text-slate-900 sm:text-base"
                          }`}
                        >
                          {dia.diaSemanaLargo} {dia.diaNumero} de {dia.mesLargo}
                        </h2>

                        {dia.esHoy && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-(--marca-borde) bg-(--marca-fondo) px-2.5 py-0.5 text-xs font-bold text-(--marca-texto)">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 rounded-full bg-(--marca)"
                            />
                            Hoy
                          </span>
                        )}

                        {dia.esManana && (
                          <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/70">
                            Mañana
                          </span>
                        )}

                        {dia.esPasado && (
                          <span className="inline-flex items-center rounded-full bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            Pasado
                          </span>
                        )}
                      </div>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {dia.slots.length > 0
                          ? `${dia.slots.length} ${dia.slots.length === 1 ? "horario" : "horarios"} · ${cuposDiaOcupados} de ${cuposDiaTotales} cupos reservados`
                          : dia.reservasSueltas.length > 0
                            ? `${dia.reservasSueltas.length} ${dia.reservasSueltas.length === 1 ? "reserva registrada" : "reservas registradas"}`
                            : dia.bloqueos.length > 0
                              ? "Fecha con bloqueo en agenda"
                              : dia.esHoy
                                ? "Sin horarios programados para hoy"
                                : "Sin horarios programados"}
                      </p>
                    </div>
                  </div>

                  {/* Acción rápida del día para publicar horario en esa fecha */}
                  {!dia.esPasado && servicios.length > 0 && (
                    <Link
                      href={enlaceAgregarHorario(dia.clave)}
                      className={`vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                        dia.esHoy
                          ? "border border-(--marca-borde) bg-white text-(--marca-texto) shadow-sm hover:bg-(--marca-fondo)"
                          : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                      Agregar horario
                    </Link>
                  )}
                </div>

                {/* Bloqueos del día */}
                {dia.bloqueos.length > 0 && (
                  <div className="mt-3.5 space-y-2">
                    {dia.bloqueos.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200/80 bg-red-50/90 px-3.5 py-2.5 text-xs text-red-800"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <CalendarOff
                            className="h-3.5 w-3.5 shrink-0 text-red-600"
                            aria-hidden="true"
                          />
                          <span>
                            <strong className="font-semibold">
                              Bloqueado:
                            </strong>{" "}
                            {b.motivo}
                          </span>
                        </span>
                        <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-200/70">
                          {b.horarioTexto}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Franjas horarias del día */}
                {dia.slots.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {dia.slots.map((s) => {
                      const ocupados = s.cuposTotales - s.cuposDisponibles;
                      const pct =
                        s.cuposTotales > 0
                          ? Math.round((ocupados / s.cuposTotales) * 100)
                          : 0;
                      const lleno = s.cuposDisponibles === 0;
                      const pocosCupos = !lleno && s.cuposDisponibles <= 2;
                      const tienePendientes = s.reservas.some(
                        (r) => r.estado === "pendiente",
                      );
                      const abierto = slotEstaAbierto(s.id, dia.esHoy);

                      const badgeClase = s.bloqueado
                        ? "bg-red-100 text-red-700"
                        : lleno
                          ? "bg-red-100 text-red-700"
                          : pocosCupos
                            ? "bg-amber-100 text-amber-800"
                            : ocupados > 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200/70 text-slate-700";

                      const badgeTexto = s.bloqueado
                        ? "Bloqueado"
                        : lleno
                          ? `Completo · ${ocupados}/${s.cuposTotales}`
                          : pocosCupos
                            ? `Últimos ${s.cuposDisponibles} · ${ocupados}/${s.cuposTotales}`
                            : `${ocupados}/${s.cuposTotales} cupos`;

                      const barraClase = s.bloqueado
                        ? "bg-red-400"
                        : lleno
                          ? "bg-red-500"
                          : pocosCupos
                            ? "bg-amber-500"
                            : "bg-emerald-500";

                      return (
                        <li
                          key={s.id}
                          className={`rounded-2xl border p-3.5 transition ${
                            dia.esHoy
                              ? "border-slate-200/90 bg-white shadow-2xs"
                              : "border-slate-200/70 bg-slate-50/75"
                          } ${s.yaPaso && !dia.esPasado ? "opacity-75" : ""}`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-vuki-ink">
                                <Clock
                                  className="h-3.5 w-3.5 text-slate-400"
                                  aria-hidden="true"
                                />
                                {s.hora}
                              </span>
                              <span
                                aria-hidden="true"
                                className="text-slate-300"
                              >
                                ·
                              </span>
                              <span className="font-medium text-slate-800">
                                {s.servicioNombre}
                              </span>
                              {s.duracionMin && (
                                <span className="text-xs text-slate-500">
                                  ({s.duracionMin} min)
                                </span>
                              )}
                            </div>

                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeClase}`}
                            >
                              {badgeTexto}
                            </span>
                          </div>

                          {/* Barra de ocupación */}
                          {!s.bloqueado && (
                            <div
                              aria-hidden="true"
                              className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/75"
                            >
                              <div
                                style={{ width: `${pct}%` }}
                                className={`h-full rounded-full transition-all ${barraClase}`}
                              />
                            </div>
                          )}

                          {/* Clientes reservados en este horario */}
                          {s.reservas.length > 0 && (
                            <div className="mt-2.5 border-t border-slate-200/70 pt-2">
                              <button
                                type="button"
                                aria-expanded={abierto}
                                onClick={() => alternarSlot(s.id, dia.esHoy)}
                                className="vuki-focus flex w-full items-center justify-between gap-2 rounded-lg py-1 text-left text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                              >
                                <span className="flex items-center gap-1.5">
                                  <User
                                    className="h-3.5 w-3.5 text-slate-400"
                                    aria-hidden="true"
                                  />
                                  {s.reservas.length}{" "}
                                  {s.reservas.length === 1
                                    ? "reserva en este horario"
                                    : "reservas en este horario"}
                                  {tienePendientes && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                      Pago pendiente
                                    </span>
                                  )}
                                </span>
                                <ChevronDown
                                  aria-hidden="true"
                                  className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
                                    abierto ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {abierto && (
                                <ul className="mt-1.5 space-y-1.5">
                                  {s.reservas.map((r) => (
                                    <li
                                      key={r.id}
                                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs"
                                    >
                                      <span className="min-w-0 truncate text-slate-700">
                                        <strong className="font-medium text-slate-900">
                                          {r.cliente}
                                        </strong>
                                        {r.email && (
                                          <span className="text-slate-500">
                                            {" "}
                                            · {r.email}
                                          </span>
                                        )}
                                        <span className="text-slate-500">
                                          {" "}
                                          · {r.cupos}{" "}
                                          {r.cupos === 1 ? "cupo" : "cupos"}
                                        </span>
                                      </span>
                                      <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADO_RESERVA_BADGE[r.estado]}`}
                                      >
                                        {ESTADO_RESERVA_TEXTO[r.estado]}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {/* Reservas registradas cuyo horario exacto no figura en la tabla horarios */}
                {dia.reservasSueltas.length > 0 && (
                  <div className="mt-3.5">
                    {dia.slots.length > 0 && (
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        Otras reservas del día
                      </p>
                    )}
                    <ul className="space-y-2">
                      {dia.reservasSueltas.map((r) => (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3.5 py-2.5 text-xs shadow-2xs"
                        >
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-slate-700">
                            <span className="inline-flex items-center gap-1 font-semibold text-vuki-ink">
                              <CalendarCheck
                                className="h-3.5 w-3.5 text-slate-400"
                                aria-hidden="true"
                              />
                              {r.hora}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="font-medium text-slate-800">
                              {r.servicioNombre}
                            </span>
                            <span aria-hidden="true" className="text-slate-300">
                              ·
                            </span>
                            <span className="truncate text-slate-600">
                              {r.cliente} ({r.cupos}{" "}
                              {r.cupos === 1 ? "cupo" : "cupos"})
                            </span>
                          </div>
                          <Link
                            href={hrefReservas}
                            className={`vuki-focus inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition hover:brightness-95 ${ESTADO_RESERVA_BADGE[r.estado]}`}
                          >
                            {ESTADO_RESERVA_TEXTO[r.estado]}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </article>
            </ItemLista>
          );
        })}
      </Lista>
    </EmpresaPage>
  );
}
