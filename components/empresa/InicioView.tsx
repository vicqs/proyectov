"use client";

import {
  AlertTriangle,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  DollarSign,
  ListChecks,
  Mail,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import EmpresaPage, { ItemLista, KpiCard, Lista } from "../EmpresaPage";

export interface InicioPrueba {
  /** Días restantes (0 si vence hoy); negativo si ya terminó. */
  dias: number;
  fechaFin: string;
  hrefSuscripcion: string;
}

export interface InicioHorarioAlerta {
  id: string;
  servicio: string;
  label: string;
  cuposDisponibles: number;
}

export interface InicioServicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precioUsd: number;
}

export interface InicioReserva {
  id: string;
  fechaIso: string;
  cliente: string;
  estado: string;
}

interface InicioViewProps {
  nombre: string;
  descripcion: string;
  totalReservas: number;
  totalCobrado: number;
  servicios: InicioServicio[];
  proximasReservas: InicioReserva[];
  /** Reservas activas con horario hoy (opcional). */
  reservasHoy?: number;
  /** Ingresos cobrados en los últimos 7 días (opcional). */
  ingresosSemana?: number;
  /** Horarios próximos con pocos cupos (opcional). */
  horariosPocosCupos?: InicioHorarioAlerta[];
  /** Presente solo si el negocio está en período de prueba. */
  prueba?: InicioPrueba;
  /** Suscripción activa: fecha legible del próximo cobro mensual. */
  proximoCobro?: { fecha: string; dias: number; automatico: boolean };
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
  pagado: "bg-emerald-100 text-emerald-700",
};

/** Vista de "Inicio" compartida por `/[slug]/admin`. */
export default function InicioView({
  nombre,
  descripcion,
  totalReservas,
  totalCobrado,
  servicios,
  proximasReservas,
  reservasHoy,
  ingresosSemana,
  horariosPocosCupos,
  prueba,
  proximoCobro,
}: InicioViewProps) {
  const terminada = prueba ? prueba.dias < 0 : false;
  const urgente = prueba ? prueba.dias <= 3 : false;
  return (
    <EmpresaPage titulo={`Bienvenido, ${nombre}`} descripcion={descripcion}>
      {prueba && (
        <div
          role="status"
          className={`mb-4 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
            terminada
              ? "border-red-200 bg-red-50 text-red-900"
              : urgente
                ? "border-amber-200 bg-amber-50 text-amber-900"
                : "border-sky-200 bg-sky-50 text-sky-900"
          }`}
        >
          <div className="text-sm">
            <p className="font-semibold">
              {terminada
                ? "Tu período de prueba terminó"
                : "Estás en período de prueba"}
            </p>
            <p>
              {terminada
                ? `Finalizó el ${prueba.fechaFin}. Suscríbete para seguir recibiendo reservas.`
                : prueba.dias === 0
                  ? `Termina hoy (${prueba.fechaFin}).`
                  : `Te quedan ${prueba.dias} ${prueba.dias === 1 ? "día" : "días"} (hasta el ${prueba.fechaFin}).`}
            </p>
          </div>
          <Link
            href={prueba.hrefSuscripcion}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Ver planes
          </Link>
        </div>
      )}
      {!prueba && proximoCobro && (
        <p className="mb-4 flex items-center gap-2 text-xs text-slate-500">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          {proximoCobro.dias < 0
            ? "Tu renovación mensual está pendiente de confirmación."
            : `Próximo cobro: ${proximoCobro.fecha}${
                proximoCobro.dias <= 3
                  ? proximoCobro.dias === 0
                    ? " (hoy)"
                    : ` (en ${proximoCobro.dias} ${proximoCobro.dias === 1 ? "día" : "días"})`
                  : ""
              }`}
          {proximoCobro.automatico
            ? " · Se cobra automáticamente a tu tarjeta."
            : ""}
        </p>
      )}
      <Lista className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icono={<CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Reservas"
          valor={String(totalReservas)}
        />
        <KpiCard
          icono={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Total cobrado"
          valor={`$${totalCobrado.toFixed(2)}`}
          acento
        />
        {reservasHoy !== undefined && (
          <KpiCard
            icono={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
            titulo="Reservas de hoy"
            valor={String(reservasHoy)}
          />
        )}
        {ingresosSemana !== undefined && (
          <KpiCard
            icono={<TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
            titulo="Cobrado (7 días)"
            valor={`$${ingresosSemana.toFixed(2)}`}
            acento
          />
        )}
      </Lista>

      {horariosPocosCupos && horariosPocosCupos.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-600">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Pocos cupos
          </h2>
          <ul className="space-y-2">
            {horariosPocosCupos.map((h) => (
              <li
                key={h.id}
                className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm"
              >
                <span className="text-slate-700">
                  {h.servicio} · {h.label}
                </span>
                <span className="font-semibold text-amber-700">
                  {h.cuposDisponibles === 0
                    ? "Completo"
                    : `${h.cuposDisponibles} cupo(s)`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-vuki-ink">
          <span className="rounded-xl bg-(--marca-fondo) p-2 text-(--marca-texto)">
            <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          Próximas reservas
        </h2>
        {proximasReservas.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-5 text-sm leading-relaxed text-slate-600">
            No tienes reservas pendientes o pagadas por ahora.
          </p>
        ) : (
          <Lista as="ul" className="space-y-3">
            {proximasReservas.map((reserva) => (
              <ItemLista
                as="li"
                key={reserva.id}
                className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-borde) bg-white p-4 shadow-sm shadow-slate-900/[0.03]"
              >
                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span
                    className="flex items-center gap-1.5"
                    suppressHydrationWarning
                  >
                    <Clock
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    {new Date(reserva.fechaIso).toLocaleString("es-CR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="flex min-w-0 items-center gap-1.5 [overflow-wrap:anywhere]">
                    <Mail
                      className="h-4 w-4 text-slate-400"
                      aria-hidden="true"
                    />
                    {reserva.cliente}
                  </span>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado] ?? "bg-slate-100 text-slate-600"}`}
                >
                  {reserva.estado}
                </span>
              </ItemLista>
            ))}
          </Lista>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-vuki-ink">
          <span className="rounded-xl bg-(--marca-2-fondo) p-2 text-(--marca-2-texto)">
            <ListChecks className="h-4 w-4" aria-hidden="true" />
          </span>
          Tus servicios
        </h2>
        {servicios.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-(--marca-2-borde) bg-(--marca-2-fondo) p-5 text-sm text-slate-600">
            Aún no has creado servicios.
          </p>
        ) : (
          <Lista className="space-y-3">
            {servicios.map((servicio) => (
              <ItemLista
                key={servicio.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-2-borde) bg-white p-5 shadow-sm shadow-slate-900/[0.03]"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {servicio.nombre}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {servicio.duracionMin} min
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-(--marca-2-fondo) px-3 py-1 font-display text-lg font-bold text-(--marca-2-texto)">
                  <DollarSign className="h-4 w-4" aria-hidden="true" />
                  {servicio.precioUsd.toFixed(2)}
                </span>
              </ItemLista>
            ))}
          </Lista>
        )}
      </section>
    </EmpresaPage>
  );
}
