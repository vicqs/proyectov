"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  Copy,
  DollarSign,
  ExternalLink,
  ListChecks,
  Mail,
  Plus,
  TrendingUp,
  User,
  Users,
} from "lucide-react";
import EmpresaPage, { ItemLista, KpiCard, Lista } from "../EmpresaPage";
import { toast } from "../Toast";

export interface InicioPrueba {
  /** Días restantes (0 si vence hoy); negativo si ya terminó. */
  dias: number;
  fechaFin: string;
  hrefSuscripcion: string;
}

export interface InicioHorarioAlerta {
  id: string;
  servicioId?: string;
  servicio: string;
  label: string;
  cuposDisponibles: number;
}

export interface InicioServicio {
  id: string;
  nombre: string;
  duracionMin: number;
  precioUsd: number;
  horariosActivos?: number;
}

export interface InicioReserva {
  id: string;
  fechaIso: string;
  cliente: string;
  email?: string;
  servicio?: string;
  cupos?: number;
  monto?: number;
  esManual?: boolean;
  estado: string;
}

export interface InicioRutas {
  publico: string;
  calendario: string;
  horarios: string;
  reservas: string;
  servicios: string;
  finanzas: string;
  agenda: string;
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
  /** Cupos/personas reservadas para hoy (opcional). */
  personasHoy?: number;
  /** Ingresos cobrados en los últimos 7 días (opcional). */
  ingresosSemana?: number;
  /** Total cobrado fuera de pasarela (SINPE/efectivo) para nota contextual. */
  cobrosManualesUsd?: number;
  /** Total de horarios futuros publicados en el negocio. */
  totalHorariosFuturos?: number;
  /** Clave `YYYY-MM-DD` del día actual en Costa Rica para etiquetas relativas. */
  hoyClave?: string;
  /** Rutas de navegación rápida entre secciones del panel. */
  rutas?: InicioRutas;
  /** Horarios próximos con pocos cupos (opcional). */
  horariosPocosCupos?: InicioHorarioAlerta[];
  /** Presente solo si el negocio está en período de prueba. */
  prueba?: InicioPrueba;
  /** Suscripción activa: fecha legible del próximo cobro mensual. */
  proximoCobro?: { fecha: string; dias: number; automatico: boolean };
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

const ESTADO_STYLES: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-800",
  pagada: "bg-emerald-100 text-emerald-800",
  pagado: "bg-emerald-100 text-emerald-800",
};

const ESTADO_TEXTO: Record<string, string> = {
  pendiente: "Pendiente",
  pagada: "Pagado",
  pagado: "Pagado",
};

function sumarUnDiaClave(clave: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return "";
  const [y, m, d] = clave.split("-").map(Number);
  const f = new Date(y, m - 1, d + 1);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
}

function formatearFechaReservaCR(iso: string, hoyClave?: string): string {
  const cr = new Date(new Date(iso).getTime() + CR_OFFSET_MS);
  const p = (n: number) => String(n).padStart(2, "0");
  const clave = `${cr.getUTCFullYear()}-${p(cr.getUTCMonth() + 1)}-${p(cr.getUTCDate())}`;
  const hora24 = cr.getUTCHours();
  const min = cr.getUTCMinutes();
  const h12 = hora24 % 12 === 0 ? 12 : hora24 % 12;
  const horaTexto = `${h12}:${p(min)} ${hora24 < 12 ? "a.m." : "p.m."}`;

  if (hoyClave) {
    if (clave === hoyClave) return `Hoy · ${horaTexto}`;
    if (clave === sumarUnDiaClave(hoyClave)) return `Mañana · ${horaTexto}`;
  }

  return `${DIAS_CORTOS[cr.getUTCDay()]} ${cr.getUTCDate()} ${MESES_CORTOS[cr.getUTCMonth()]} · ${horaTexto}`;
}

function formatearDuracion(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return "";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) {
    return `${horas} ${horas === 1 ? "hora" : "horas"} (${minutos} min)`;
  }
  return `${horas} h ${resto} min`;
}

/** Vista de "Inicio" compartida por `/[slug]/admin`. */
export default function InicioView({
  nombre,
  descripcion,
  totalReservas,
  totalCobrado,
  servicios,
  proximasReservas,
  reservasHoy,
  personasHoy,
  ingresosSemana,
  cobrosManualesUsd = 0,
  totalHorariosFuturos,
  hoyClave,
  rutas,
  horariosPocosCupos,
  prueba,
  proximoCobro,
}: InicioViewProps) {
  const [copiado, setCopiado] = useState(false);

  const terminada = prueba ? prueba.dias < 0 : false;
  const urgente = prueba ? prueba.dias <= 3 : false;

  const sinServicios = servicios.length === 0;
  const sinHorariosFuturos =
    !sinServicios &&
    totalHorariosFuturos !== undefined &&
    totalHorariosFuturos === 0;

  async function copiarEnlacePublico() {
    if (!rutas?.publico || typeof window === "undefined") return;
    const url = `${window.location.origin}${rutas.publico}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Enlace público copiado para compartir");
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar el enlace automáticamente.");
    }
  }

  const notaHoy =
    reservasHoy !== undefined
      ? reservasHoy === 0
        ? "Sin salidas hoy · Ver calendario"
        : personasHoy !== undefined
          ? `${personasHoy} ${personasHoy === 1 ? "persona esperada" : "personas esperadas"} hoy`
          : "Salidas programadas para hoy"
      : undefined;

  const notaReservas =
    proximasReservas.length > 0
      ? `${proximasReservas.length} ${proximasReservas.length === 1 ? "próxima salida" : "próximas salidas"}`
      : "Historial de reservas activas";

  const notaCobrado =
    cobrosManualesUsd > 0
      ? `Pasarela · +$${cobrosManualesUsd.toFixed(2)} cobro directo`
      : "Procesado por pasarela";

  return (
    <EmpresaPage
      titulo={`Bienvenido, ${nombre}`}
      descripcion={descripcion}
      accion={
        rutas ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <button
              type="button"
              onClick={() => void copiarEnlacePublico()}
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
            >
              {copiado ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
                  ¡Enlace copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" aria-hidden="true" />
                  Copiar enlace
                </>
              )}
            </button>
            <Link
              href={rutas.publico}
              target="_blank"
              rel="noopener noreferrer"
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:flex-none"
            >
              Ver enlace público
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        ) : undefined
      }
    >
      {prueba && (
        <div
          role="status"
          className={`mb-5 flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
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
            className="vuki-focus inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
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

      {/* Aviso inteligente si el enlace público aún no tiene horarios o servicios reservables */}
      {rutas && (sinServicios || sinHorariosFuturos) && (
        <div
          role="status"
          className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-semibold">
                {sinServicios
                  ? "Crea tu primer servicio para activar tu enlace público"
                  : "No tienes horarios futuros publicados en este momento"}
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-900/90">
                {sinServicios
                  ? "Agrega los tours o actividades que ofreces y luego publica sus horarios para empezar a recibir reservas."
                  : "Tus clientes pueden ver tu catálogo, pero necesitan horarios disponibles para poder reservar en línea."}
              </p>
            </div>
          </div>
          <Link
            href={
              sinServicios
                ? `${rutas.servicios}?nuevo=1`
                : `${rutas.horarios}?nuevo=1`
            }
            className="vuki-focus inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {sinServicios ? "Crear servicio" : "Publicar horario"}
          </Link>
        </div>
      )}

      {/* Barra de atajos operativos en 1 clic */}
      {rutas && (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-(--marca-borde) bg-white px-4 py-3 shadow-sm">
          <span className="mr-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Acciones rápidas:
          </span>
          <Link
            href={
              sinServicios
                ? `${rutas.servicios}?nuevo=1`
                : `${rutas.horarios}?nuevo=1`
            }
            className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-(--marca-fondo) px-3 py-1.5 text-xs font-semibold text-(--marca-texto) ring-1 ring-(--marca-borde) transition hover:brightness-95"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            {sinServicios ? "Nuevo servicio" : "Publicar horario"}
          </Link>
          <Link
            href={`${rutas.reservas}?nueva=1`}
            className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <CalendarCheck className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Reserva manual
          </Link>
          <Link
            href={rutas.calendario}
            className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <CalendarDays className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Calendario de hoy
          </Link>
          <Link
            href={`${rutas.agenda}?nuevo=1`}
            className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            <CalendarOff className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Bloquear fecha
          </Link>
        </div>
      )}

      <Lista className="grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 xl:grid-cols-4">
        {reservasHoy !== undefined && (
          <KpiCard
            icono={<CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />}
            titulo="Salidas de hoy"
            valor={String(reservasHoy)}
            nota={notaHoy}
            href={rutas ? `${rutas.calendario}#hoy` : undefined}
          />
        )}
        <KpiCard
          icono={<CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Reservas activas"
          valor={String(totalReservas)}
          nota={notaReservas}
          href={rutas?.reservas}
        />
        {ingresosSemana !== undefined && (
          <KpiCard
            icono={<TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
            titulo="Cobrado (7 días)"
            valor={`$${ingresosSemana.toFixed(2)}`}
            nota="Últimos 7 días y próximos"
            acento
            href={rutas?.finanzas}
          />
        )}
        <KpiCard
          icono={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
          titulo="Total cobrado"
          valor={`$${totalCobrado.toFixed(2)}`}
          nota={notaCobrado}
          acento
          href={rutas?.finanzas}
        />
      </Lista>

      {horariosPocosCupos && horariosPocosCupos.length > 0 && (
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-700">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              Horarios por llenarse (próximos 7 días)
            </h2>
            {rutas && (
              <Link
                href={rutas.horarios}
                className="vuki-focus text-xs font-semibold text-amber-800 hover:underline"
              >
                Ver todos los horarios →
              </Link>
            )}
          </div>
          <ul className="space-y-2">
            {horariosPocosCupos.map((h) => (
              <li
                key={h.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm"
              >
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">
                    {h.servicio}
                  </span>
                  <span className="mx-1.5 text-slate-400">·</span>
                  <span className="text-slate-700">{h.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      h.cuposDisponibles === 0
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {h.cuposDisponibles === 0
                      ? "Completo"
                      : `${h.cuposDisponibles} ${h.cuposDisponibles === 1 ? "cupo libre" : "cupos libres"}`}
                  </span>
                  {rutas && (
                    <Link
                      href={
                        h.servicioId
                          ? `${rutas.horarios}?nuevo=1&servicio=${encodeURIComponent(h.servicioId)}`
                          : `${rutas.horarios}?nuevo=1`
                      }
                      className="vuki-focus inline-flex min-h-8 items-center gap-1 rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-100/50"
                    >
                      <Plus className="h-3 w-3" aria-hidden="true" />
                      Abrir otro horario
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-vuki-ink">
            <span className="rounded-xl bg-(--marca-fondo) p-2 text-(--marca-texto)">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            Próximas reservas
          </h2>
          {rutas && (
            <Link
              href={rutas.reservas}
              className="vuki-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-(--marca-texto) transition hover:bg-(--marca-fondo)"
            >
              Ver todas
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {proximasReservas.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-vuki-ink">
                No tienes salidas reservadas próximamente
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                Comparte tu enlace público en WhatsApp o Instagram, o registra
                una reserva manual si un cliente ya te contactó.
              </p>
            </div>
            {rutas && (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copiarEnlacePublico()}
                  className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  Copiar enlace
                </button>
                <Link
                  href={`${rutas.reservas}?nueva=1`}
                  className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl bg-vuki-ink px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  Reserva manual
                </Link>
              </div>
            )}
          </div>
        ) : (
          <Lista as="ul" className="space-y-3">
            {proximasReservas.map((reserva) => {
              const tieneNombre = Boolean(
                reserva.email && reserva.cliente !== reserva.email,
              );
              const fechaTexto = formatearFechaReservaCR(
                reserva.fechaIso,
                hoyClave,
              );
              const esHoy = fechaTexto.startsWith("Hoy");

              return (
                <ItemLista
                  as="li"
                  key={reserva.id}
                  className={`flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4 shadow-sm shadow-slate-900/[0.03] ${
                    esHoy
                      ? "border-(--marca) ring-1 ring-(--marca-borde)"
                      : "border-(--marca-borde)"
                  }`}
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          esHoy
                            ? "bg-(--marca-fondo) text-(--marca-texto)"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {fechaTexto}
                      </span>

                      {reserva.servicio && (
                        <span className="font-display text-sm font-bold text-vuki-ink">
                          {reserva.servicio}
                        </span>
                      )}

                      {reserva.cupos !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          {reserva.cupos}{" "}
                          {reserva.cupos === 1 ? "persona" : "personas"}
                        </span>
                      )}
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                      <span className="flex min-w-0 items-center gap-1.5 font-medium text-slate-800 [overflow-wrap:anywhere]">
                        {tieneNombre ? (
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
                        {reserva.cliente}
                      </span>
                      {tieneNombre && reserva.email && (
                        <span className="flex min-w-0 items-center gap-1 text-slate-500 [overflow-wrap:anywhere]">
                          <Mail
                            className="h-3 w-3 shrink-0 text-slate-400"
                            aria-hidden="true"
                          />
                          {reserva.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {reserva.monto !== undefined && (
                      <span className="font-display text-sm font-bold text-vuki-ink">
                        ${reserva.monto.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {reserva.esManual && reserva.estado === "pagada"
                        ? "Cobro directo"
                        : (ESTADO_TEXTO[reserva.estado] ?? reserva.estado)}
                    </span>
                  </div>
                </ItemLista>
              );
            })}
          </Lista>
        )}
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-3 font-display text-lg font-semibold tracking-tight text-vuki-ink">
            <span className="rounded-xl bg-(--marca-2-fondo) p-2 text-(--marca-2-texto)">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </span>
            Tus servicios
          </h2>
          {rutas && (
            <Link
              href={rutas.servicios}
              className="vuki-focus inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-(--marca-2-texto) transition hover:bg-(--marca-2-fondo)"
            >
              Gestionar catálogo
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {servicios.length === 0 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-(--marca-2-borde) bg-(--marca-2-fondo) p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">
              Aún no has creado servicios en tu catálogo.
            </p>
            {rutas && (
              <Link
                href={`${rutas.servicios}?nuevo=1`}
                className="vuki-focus inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-xl bg-vuki-ink px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Crear mi primer servicio
              </Link>
            )}
          </div>
        ) : (
          <Lista className="grid gap-3 sm:grid-cols-2">
            {servicios.map((servicio) => {
              const sinHorarios =
                servicio.horariosActivos !== undefined &&
                servicio.horariosActivos === 0;

              return (
                <ItemLista
                  key={servicio.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-2-borde) bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5"
                >
                  <div className="min-w-0">
                    <p className="font-display font-bold text-vuki-ink">
                      {servicio.nombre}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                        <Clock className="h-3 w-3 text-slate-500" aria-hidden="true" />
                        {formatearDuracion(servicio.duracionMin)}
                      </span>
                      {servicio.horariosActivos !== undefined && (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ${
                            sinHorarios
                              ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
                              : "bg-emerald-50 text-emerald-800"
                          }`}
                        >
                          {sinHorarios
                            ? "Sin horarios"
                            : `${servicio.horariosActivos} ${servicio.horariosActivos === 1 ? "horario" : "horarios"}`}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-(--marca-2-fondo) px-3 py-1 font-display text-base font-bold text-(--marca-2-texto)">
                      <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                      {servicio.precioUsd.toFixed(2)}
                    </span>
                    {rutas && (
                      <Link
                        href={`${rutas.horarios}?nuevo=1&servicio=${encodeURIComponent(servicio.id)}`}
                        className={`vuki-focus inline-flex min-h-9 items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                          sinHorarios
                            ? "bg-vuki-ink text-white hover:bg-slate-800"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        Horario
                      </Link>
                    )}
                  </div>
                </ItemLista>
              );
            })}
          </Lista>
        )}
      </section>
    </EmpresaPage>
  );
}
