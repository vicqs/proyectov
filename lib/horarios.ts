import type { BloqueoExcepcion, Horario, Reserva, Servicio } from "../types/database";
import type { HorarioPublico } from "./tipos-publicos";
import {
  aClaveFecha,
  desplazarClave,
  DIAS_CORTOS,
  DIAS_LARGOS,
  DIAS_MIN,
  formatoHora12,
  formatoHoraCR,
  formatoRangoHoraCR,
  hoyClaveCR,
  MESES_CORTOS,
  MESES_LARGOS,
  partesCR,
} from "./zona-horaria";

/** Horas mínimas de anticipación para que el turista cancele por su cuenta. */
export const HORAS_LIMITE_CANCELACION = 24;

/** Minutos que se reserva temporalmente un cupo durante un checkout público sin pagar. */
export const MINUTOS_EXPIRACION_CHECKOUT = 30;

/** Etiqueta de día en Costa Rica (`UTC-6`): "Hoy", "Mañana" o "lun 12 oct". */
export function etiquetaDia(fechaIso: string, ahoraMs = Date.now()): string {
  const hoyClave = hoyClaveCR(ahoraMs);
  const { clave, diaSemana, dia, mes } = partesCR(fechaIso);
  if (clave === hoyClave) return "Hoy";
  if (clave === desplazarClave(hoyClave, 1)) return "Mañana";
  return `${DIAS_MIN[diaSemana]} ${dia} ${MESES_CORTOS[mes]}`;
}

/** Etiqueta legible en Costa Rica (`UTC-6`): "Hoy 9 a.m.", "Mañana 2 p.m." o "lun 12 oct 9 a.m.". */
export function etiquetaHorario(fechaIso: string, ahoraMs = Date.now()): string {
  const hoyClave = hoyClaveCR(ahoraMs);
  const { clave, diaSemana, dia, mes, hora, minuto } = partesCR(fechaIso);
  const horaTexto = formatoHora12(hora, minuto, true);
  if (clave === hoyClave) return `Hoy ${horaTexto}`;
  if (clave === desplazarClave(hoyClave, 1)) return `Mañana ${horaTexto}`;
  return `${DIAS_MIN[diaSemana]} ${dia} ${MESES_CORTOS[mes]} ${horaTexto}`;
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
  Partial<Pick<Reserva, "cupos" | "estado" | "trx_id" | "creado_en">>;

/**
 * Indica si una reserva mantiene ocupados sus cupos (pagada, pendiente con
 * referencia manual o checkout público iniciado hace menos de 30 minutos).
 */
export function reservaOcupaCupo(
  reserva: Partial<Pick<Reserva, "estado" | "trx_id" | "creado_en">>,
  ahoraMs = Date.now(),
): boolean {
  if (reserva.estado === "cancelada") return false;
  if (reserva.estado === "pendiente" && !reserva.trx_id && reserva.creado_en) {
    const creadoMs = new Date(reserva.creado_en).getTime();
    if (
      Number.isFinite(creadoMs) &&
      ahoraMs - creadoMs > MINUTOS_EXPIRACION_CHECKOUT * 60_000
    ) {
      return false;
    }
  }
  return true;
}

/** Cupos ya ocupados por reservas activas en un servicio y fecha/hora exactas. */
export function cuposOcupados(
  reservas: ReservaCupo[],
  servicioId: string,
  fechaIso: string,
): number {
  const t = new Date(fechaIso).getTime();
  const ahoraMs = Date.now();
  return reservas
    .filter(
      (r) =>
        reservaOcupaCupo(r, ahoraMs) &&
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
): HorarioPublico[] {
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
      label: etiquetaHorario(h.fecha_hora, ahora),
      fechaHora: h.fecha_hora,
      cuposTotales: h.cupos_totales,
      cuposDisponibles: Math.max(
        0,
        h.cupos_totales - cuposOcupados(reservas, h.servicio_id, h.fecha_hora),
      ),
    }));
}

/** Sugiere la próxima fecha (`YYYY-MM-DD`) y hora (`HH:mm`) hábil (09:00 a 18:00) en Costa Rica. */
export function sugerirProximoHorario(
  ahora: Date,
  hoyClave: string,
  fechaParam?: string,
): { fechaSugerida: string; horaSugerida: string } {
  const { hora: horaActualCR } = partesCR(ahora.toISOString());
  let fechaSugerida = hoyClave;
  let sigHora = horaActualCR + 1;

  if (sigHora >= 18) {
    fechaSugerida = desplazarClave(hoyClave, 1);
    sigHora = 9;
  } else if (sigHora < 6) {
    sigHora = 9;
  }
  let horaSugerida = `${String(sigHora).padStart(2, "0")}:00`;

  if (fechaParam && /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) && fechaParam >= hoyClave) {
    if (fechaParam === hoyClave) {
      const proxima = horaActualCR + 1;
      if (proxima <= 9) {
        fechaSugerida = fechaParam;
        horaSugerida = "09:00";
      } else if (proxima <= 22) {
        fechaSugerida = fechaParam;
        horaSugerida = `${String(proxima).padStart(2, "0")}:00`;
      } else {
        fechaSugerida = desplazarClave(hoyClave, 1);
        horaSugerida = "09:00";
      }
    } else {
      fechaSugerida = fechaParam;
      horaSugerida = "09:00";
    }
  }

  return { fechaSugerida, horaSugerida };
}

/** Genera las fechas (formato `datetime-local`) de una repetición semanal. */
export function generarFechasRepeticion(
  inicio: string,
  hora: string,
  dias: number[],
  semanas: number,
  maxLote = 100,
): string[] {
  if (!inicio || !hora || dias.length === 0 || semanas < 1) return [];
  const [y, m, d] = inicio.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const ahora = Date.now();
  const fechas: string[] = [];
  const p = (n: number) => String(n).padStart(2, "0");

  for (let i = 0; i < semanas * 7; i++) {
    const f = new Date(y, m - 1, d + i, hh, mm);
    if (dias.includes(f.getDay()) && f.getTime() > ahora) {
      fechas.push(
        `${aClaveFecha(f)}T${p(f.getHours())}:${p(f.getMinutes())}`,
      );
      if (fechas.length >= maxLote) break;
    }
  }
  return fechas;
}

export function obtenerEtiquetaPeriodoSemana(offset: number): string {
  if (offset === 0) return "Esta semana";
  if (offset === 1) return "Próxima semana";
  if (offset === -1) return "Semana pasada";
  return offset > 1
    ? `En ${offset} semanas`
    : `Hace ${Math.abs(offset)} semanas`;
}

function formatoHorarioBloqueo(
  b: BloqueoExcepcion,
  iniDia: number,
  finDia: number,
): string {
  const iniB = new Date(b.fecha_inicio).getTime();
  const finB = new Date(b.fecha_fin).getTime();
  if (iniB <= iniDia && finB >= finDia - 60_000) {
    return "Todo el día";
  }
  if (iniB > iniDia && finB < finDia - 60_000) {
    return `${formatoHoraCR(b.fecha_inicio)} – ${formatoHoraCR(b.fecha_fin)}`;
  }
  if (iniB > iniDia) {
    return `Desde ${formatoHoraCR(b.fecha_inicio)}`;
  }
  return `Hasta ${formatoHoraCR(b.fecha_fin)}`;
}

function formatoFechaCorta(d: Date, incluirAnio = false): string {
  const base = `${DIAS_MIN[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  return incluirAnio ? `${base} ${d.getFullYear()}` : base;
}

/** Construye la estructura semanal de 7 días para `CalendarioPage` / `CalendarioView`. */
export function construirSemanaCalendario({
  inicio,
  fin,
  hoy,
  ahoraMs,
  servicios,
  horarios,
  reservas,
  bloqueos,
}: {
  inicio: Date;
  fin: Date;
  hoy: Date;
  ahoraMs: number;
  servicios: Servicio[];
  horarios: Horario[];
  reservas: (ReservaCupo & {
    id: string;
    email_cliente: string;
    nombre_cliente?: string | null;
    estado: "pendiente" | "pagada" | "cancelada";
  })[];
  bloqueos: BloqueoExcepcion[];
}) {
  const hoyMs = hoy.getTime();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const mananaMs = manana.getTime();

  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
  const nombreServicio = (id: string) =>
    servicioPorId.get(id)?.nombre ?? "Servicio";

  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();

  const slotsSemana = construirHorarios(
    horarios.filter((h) => {
      const t = new Date(h.fecha_hora).getTime();
      return t >= inicioMs && t < finMs;
    }),
    reservas,
    [],
  );

  const reservasActivas = reservas
    .filter((r) => {
      const t = new Date(r.fecha_hora).getTime();
      return reservaOcupaCupo(r, ahoraMs) && t >= inicioMs && t < finMs;
    })
    .sort(
      (a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    );

  const fechasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const sig = new Date(d);
    sig.setDate(d.getDate() + 1);
    return { fecha: d, ini: d.getTime(), finDia: sig.getTime() };
  });

  const reservasAsignadas = new Set<string>();

  const dias = fechasSemana.map(({ fecha, ini, finDia }) => {
    const slotsDia = slotsSemana
      .filter((s) => {
        const t = new Date(s.fechaHora).getTime();
        return t >= ini && t < finDia;
      })
      .map((s) => {
        const slotMs = new Date(s.fechaHora).getTime();
        const srv = servicioPorId.get(s.servicioId);
        const reservasSlot = reservasActivas
          .filter(
            (r) =>
              r.servicio_id === s.servicioId &&
              new Date(r.fecha_hora).getTime() === slotMs,
          )
          .map((r) => {
            reservasAsignadas.add(r.id);
            const nombre = r.nombre_cliente?.trim();
            const estadoSlot: "pendiente" | "pagada" =
              r.estado === "pagada" ? "pagada" : "pendiente";
            return {
              id: r.id,
              cliente: nombre || r.email_cliente,
              email: nombre ? r.email_cliente : undefined,
              cupos: r.cupos ?? 1,
              estado: estadoSlot,
            };
          });

        return {
          id: s.id,
          servicioId: s.servicioId,
          servicioNombre: srv?.nombre ?? "Servicio",
          duracionMin: srv?.duracion_min,
          hora: formatoRangoHoraCR(s.fechaHora, srv?.duracion_min),
          cuposTotales: s.cuposTotales,
          cuposDisponibles: s.cuposDisponibles,
          bloqueado: estaBloqueado(s.fechaHora, bloqueos),
          yaPaso: slotMs < ahoraMs,
          reservas: reservasSlot,
        };
      });

    const reservasSueltas = reservasActivas
      .filter((r) => {
        const t = new Date(r.fecha_hora).getTime();
        return t >= ini && t < finDia && !reservasAsignadas.has(r.id);
      })
      .map((r) => {
        const nombre = r.nombre_cliente?.trim();
        const estadoSuelta: "pendiente" | "pagada" =
          r.estado === "pagada" ? "pagada" : "pendiente";
        return {
          id: r.id,
          servicioId: r.servicio_id,
          servicioNombre: nombreServicio(r.servicio_id),
          hora: formatoHoraCR(r.fecha_hora),
          cliente: nombre || r.email_cliente,
          email: nombre ? r.email_cliente : undefined,
          cupos: r.cupos ?? 1,
          estado: estadoSuelta,
        };
      });

    const bloqueosDia = bloqueos
      .filter((b) => {
        const iniB = new Date(b.fecha_inicio).getTime();
        const finB = new Date(b.fecha_fin).getTime();
        return iniB < finDia && (finB > ini || iniB === ini);
      })
      .map((b) => ({
        id: b.id,
        motivo: b.motivo,
        horarioTexto: formatoHorarioBloqueo(b, ini, finDia),
      }));

    return {
      clave: aClaveFecha(fecha),
      iso: fecha.toISOString(),
      diaNumero: fecha.getDate(),
      diaSemanaCorto: DIAS_CORTOS[fecha.getDay()],
      diaSemanaLargo: DIAS_LARGOS[fecha.getDay()],
      mesCorto: MESES_CORTOS[fecha.getMonth()],
      mesLargo: MESES_LARGOS[fecha.getMonth()],
      esHoy: ini === hoyMs,
      esManana: ini === mananaMs,
      esPasado: finDia <= hoyMs,
      slots: slotsDia,
      reservasSueltas,
      bloqueos: bloqueosDia,
    };
  });

  const primerDia = fechasSemana[0].fecha;
  const ultimoDia = fechasSemana[6].fecha;
  const distintoAnio =
    primerDia.getFullYear() !== ultimoDia.getFullYear() ||
    primerDia.getFullYear() !== hoy.getFullYear();
  const rangoSemana = `${formatoFechaCorta(primerDia, distintoAnio)} – ${formatoFechaCorta(ultimoDia, distintoAnio)}`;

  return { dias, rangoSemana };
}
