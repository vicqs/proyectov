"use client";

import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Clock,
  DollarSign,
  ListChecks,
  Mail,
  TrendingUp,
} from "lucide-react";
import AdminPage, { ItemLista, KpiCard, Lista } from "../AdminPage";

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
}

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
  pagado: "bg-emerald-100 text-emerald-700",
};

/** Vista de "Inicio" compartida por `/admin` y `/demo/admin`. */
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
}: InicioViewProps) {
  return (
    <AdminPage titulo={`Bienvenido, ${nombre}`} descripcion={descripcion}>
      <Lista className="grid grid-cols-2 gap-4">
        <KpiCard
          icono={<CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Reservas"
          valor={String(totalReservas)}
        />
        <KpiCard
          icono={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Total cobrado"
          valor={`$${totalCobrado.toFixed(2)}`}
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
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
          <CalendarCheck className="h-4 w-4" aria-hidden="true" />
          Próximas reservas
        </h2>
        {proximasReservas.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tienes reservas pendientes o pagadas por ahora.
          </p>
        ) : (
          <Lista as="ul" className="space-y-3">
            {proximasReservas.map((reserva) => (
              <ItemLista
                as="li"
                key={reserva.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
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
                  <span className="flex items-center gap-1.5">
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
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Tus servicios
        </h2>
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has creado servicios.</p>
        ) : (
          <Lista className="space-y-3">
            {servicios.map((servicio) => (
              <ItemLista
                key={servicio.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {servicio.nombre}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {servicio.duracionMin} min
                  </p>
                </div>
                <span className="flex items-center gap-1 text-lg font-bold text-slate-900">
                  <DollarSign
                    className="h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                  {servicio.precioUsd.toFixed(2)}
                </span>
              </ItemLista>
            ))}
          </Lista>
        )}
      </section>
    </AdminPage>
  );
}
