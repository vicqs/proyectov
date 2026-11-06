/** Zona horaria operativa de la plataforma (Costa Rica, UTC-6 sin horario de verano). */
export const ZONA_HORARIA = "America/Costa_Rica";
export const CR_OFFSET_MS = -6 * 3_600_000;
export const DIA_MS = 86_400_000;
const OFFSET_CR = "-06:00";

export const DIAS_SEMANA_LETRA = ["D", "L", "M", "X", "J", "V", "S"] as const;
export const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;
export const DIAS_MIN = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"] as const;
export const DIAS_LARGOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
] as const;

export const MESES_CORTOS = [
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
] as const;

export const MESES_LARGOS = [
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
] as const;

const LOCAL_SIN_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Convierte el valor de un `<input type="datetime-local">` (sin zona) a ISO UTC
 * interpretándolo en hora de Costa Rica, sin depender de la zona del servidor.
 * Si ya trae zona (ISO completo), solo lo normaliza. Devuelve "" si es inválido.
 */
export function localCRaIso(valor: string): string {
  const texto = valor.trim();
  const fecha = new Date(
    LOCAL_SIN_ZONA.test(texto) ? texto + OFFSET_CR : texto,
  );
  return Number.isNaN(fecha.getTime()) ? "" : fecha.toISOString();
}

/** Normaliza una cadena ISO o `datetime-local` asumiendo UTC-6 si carece de zona. */
export function normalizarIsoCR(valor: string): string {
  if (!valor) return "";
  const texto = valor.trim();
  if (LOCAL_SIN_ZONA.test(texto)) return localCRaIso(texto);
  return texto;
}

/** Descompone un instante ISO en componentes de calendario para Costa Rica (`UTC-06:00`). */
export function partesCR(iso: string) {
  const normalizado = normalizarIsoCR(iso);
  const cr = new Date(new Date(normalizado).getTime() + CR_OFFSET_MS);
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
    clave: `${anio}-${pad2(mes + 1)}-${pad2(dia)}`,
  };
}

/** Fecha `YYYY-MM-DD` de un timestamp ISO en zona horaria de Costa Rica (`UTC-06:00`). */
export function diaCR(iso: string): string {
  return partesCR(iso).clave;
}

/** Clave `YYYY-MM-DD` del día actual (o de `ahoraMs`) en Costa Rica (`UTC-06:00`). */
export function hoyClaveCR(ahoraMs = Date.now()): string {
  const cr = new Date(ahoraMs + CR_OFFSET_MS);
  return `${cr.getUTCFullYear()}-${pad2(cr.getUTCMonth() + 1)}-${pad2(cr.getUTCDate())}`;
}

/** Formatea hora/minuto en reloj de 12 horas (`9:00 a.m.` o `9 a.m.` si `omitirMinutosCero`). */
export function formatoHora12(
  hora: number,
  minuto: number,
  omitirMinutosCero = false,
): string {
  const h12 = hora % 12 === 0 ? 12 : hora % 12;
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  if (omitirMinutosCero && minuto === 0) {
    return `${h12} ${sufijo}`;
  }
  return `${h12}:${pad2(minuto)} ${sufijo}`;
}

/** Hora de un timestamp ISO en formato de 12 horas en Costa Rica (`9:00 a.m.`). */
export function formatoHoraCR(iso: string): string {
  const { hora, minuto } = partesCR(iso);
  return formatoHora12(hora, minuto);
}

/** Rango horario en Costa Rica a partir de un ISO y su duración en minutos (`9:00 a.m. – 10:30 a.m.`). */
export function formatoRangoHoraCR(iso: string, duracionMin?: number): string {
  const { hora, minuto } = partesCR(iso);
  const textoIni = formatoHora12(hora, minuto);
  if (!duracionMin || duracionMin <= 0) {
    return textoIni;
  }
  const minutosTotales = hora * 60 + minuto + duracionMin;
  const finHora = Math.floor(minutosTotales / 60) % 24;
  const finMin = minutosTotales % 60;
  return `${textoIni} – ${formatoHora12(finHora, finMin)}`;
}

/** Fecha y hora legible determinista en Costa Rica (`Dom 1 nov 2026 · 6:00 a.m.`). */
export function fechaHoraCR(iso: string): string {
  const { anio, mes, dia, diaSemana, hora, minuto } = partesCR(iso);
  return `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes]} ${anio} · ${formatoHora12(hora, minuto)}`;
}

/** Formato detallado de fecha y rango horario (`Lun 2 nov · 9:00 a.m. – 10:00 a.m.`). */
export function formatearDetalleHorarioCR(
  fechaIso?: string,
  duracionMin?: number,
  labelFallback?: string,
): string {
  if (!fechaIso) return labelFallback ?? "";
  const ms = new Date(fechaIso).getTime();
  if (Number.isNaN(ms)) return labelFallback ?? "";

  const { diaSemana, dia, mes } = partesCR(fechaIso);
  const diaTexto = `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes]}`;
  return `${diaTexto} · ${formatoRangoHoraCR(fechaIso, duracionMin)}`;
}

/** Suma o resta días a una clave `YYYY-MM-DD`. */
export function desplazarClave(clave: string, dias: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return "";
  const [y, m, d] = clave.split("-").map(Number);
  const f = new Date(y, m - 1, d + dias);
  return `${f.getFullYear()}-${pad2(f.getMonth() + 1)}-${pad2(f.getDate())}`;
}

/** Primer y último día (`YYYY-MM-DD`) del mes correspondiente a `clave`. */
export function rangoMesActual(clave: string): { desde: string; hasta: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return { desde: "", hasta: "" };
  const [y, m] = clave.split("-").map(Number);
  const ultimoDia = new Date(y, m, 0).getDate();
  return {
    desde: `${y}-${pad2(m)}-01`,
    hasta: `${y}-${pad2(m)}-${pad2(ultimoDia)}`,
  };
}

/** Etiqueta relativa para listas de inicio (`Hoy · 9:00 a.m.`, `Mañana · 9:00 a.m.` o `Dom 1 nov · 9:00 a.m.`). */
export function formatearFechaReservaCR(iso: string, hoyClave?: string): string {
  const { clave, diaSemana, dia, mes, hora, minuto } = partesCR(iso);
  const horaTexto = formatoHora12(hora, minuto);
  if (hoyClave) {
    if (clave === hoyClave) return `Hoy · ${horaTexto}`;
    if (clave === desplazarClave(hoyClave, 1)) return `Mañana · ${horaTexto}`;
  }
  return `${DIAS_CORTOS[diaSemana]} ${dia} ${MESES_CORTOS[mes]} · ${horaTexto}`;
}

/** Convierte un objeto `Date` local en clave `YYYY-MM-DD`. */
export function aClaveFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

/** Parsea una clave `YYYY-MM-DD` en un `Date` local a medianoche, o `null` si no es válida. */
export function parseClaveFecha(clave: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clave)) return null;
  const [y, m, d] = clave.split("-").map(Number);
  return new Date(y, m - 1, d);
}
