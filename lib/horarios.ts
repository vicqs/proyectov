import type { BloqueoExcepcion, Horario, Reserva } from "../types/database";
import type { DemoHorario } from "./demoStore";

/** Horas mínimas de anticipación para que el turista cancele por su cuenta. */
export const HORAS_LIMITE_CANCELACION = 24;

const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = [
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

/** Formato manual (sin ICU) para evitar diferencias servidor/navegador. */
function formatearHora12(hora: number, minutos: number): string {
  const horaNormalizada = hora % 12 === 0 ? 12 : hora % 12;
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  const minutosTexto =
    minutos === 0 ? "" : `:${String(minutos).padStart(2, "0")}`;
  return `${horaNormalizada}${minutosTexto} ${sufijo}`;
}

/** Etiqueta de día: "Hoy", "Mañana" o "lun 12 oct". */
export function etiquetaDia(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86_400_000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Mañana";
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
}

/** Etiqueta legible: "Hoy 9 a.m.", "Mañana 2 p.m." o "lun 12 oct 9 a.m.". */
export function etiquetaHorario(fechaIso: string): string {
  const fecha = new Date(fechaIso);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const dia = new Date(fecha);
  dia.setHours(0, 0, 0, 0);
  const diff = Math.round((dia.getTime() - hoy.getTime()) / 86_400_000);
  const hora = formatearHora12(fecha.getHours(), fecha.getMinutes());
  if (diff === 0) return `Hoy ${hora}`;
  if (diff === 1) return `Mañana ${hora}`;
  return `${DIAS[fecha.getDay()]} ${fecha.getDate()} ${MESES[fecha.getMonth()]} ${hora}`;
}

/** Indica si una fecha/hora cae dentro de algún bloqueo de la agenda. */
export function estaBloqueado(
  fechaIso: string,
  bloqueos: Pick<BloqueoExcepcion, "fecha_inicio" | "fecha_fin">[],
): boolean {
  const t = new Date(fechaIso).getTime();
  return bloqueos.some(
    (b) =>
      t >= new Date(b.fecha_inicio).getTime() &&
      t <= new Date(b.fecha_fin).getTime(),
  );
}

/** Reserva mínima necesaria para calcular ocupación de cupos. */
export type ReservaCupo = Pick<Reserva, "servicio_id" | "fecha_hora"> &
  Partial<Pick<Reserva, "cupos" | "estado">>;

/** Cupos ya ocupados por reservas (no canceladas) en un servicio y fecha/hora exactas. */
export function cuposOcupados(
  reservas: ReservaCupo[],
  servicioId: string,
  fechaIso: string,
): number {
  const t = new Date(fechaIso).getTime();
  return reservas
    .filter(
      (r) =>
        r.estado !== "cancelada" &&
        r.servicio_id === servicioId &&
        new Date(r.fecha_hora).getTime() === t,
    )
    .reduce((suma, r) => suma + (r.cupos ?? 1), 0);
}

/**
 * Convierte los horarios de la base de datos en horarios con cupos
 * disponibles (según reservas existentes). Con `soloReservables` descarta
 * los pasados y los que caen en un bloqueo de la agenda (perfil público).
 */
export function construirHorarios(
  horarios: Horario[],
  reservas: ReservaCupo[],
  bloqueos: Pick<BloqueoExcepcion, "fecha_inicio" | "fecha_fin">[],
  soloReservables = false,
): DemoHorario[] {
  const ahora = Date.now();
  return horarios
    .filter(
      (h) =>
        !soloReservables ||
        (new Date(h.fecha_hora).getTime() > ahora &&
          !estaBloqueado(h.fecha_hora, bloqueos)),
    )
    .sort(
      (a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    )
    .map((h) => ({
      id: h.id,
      servicioId: h.servicio_id,
      label: etiquetaHorario(h.fecha_hora),
      fechaHora: h.fecha_hora,
      cuposTotales: h.cupos_totales,
      cuposDisponibles: Math.max(
        0,
        h.cupos_totales - cuposOcupados(reservas, h.servicio_id, h.fecha_hora),
      ),
    }));
}
