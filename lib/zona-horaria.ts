/** Zona horaria operativa de la plataforma (Costa Rica, UTC-6 sin horario de verano). */
export const ZONA_HORARIA = "America/Costa_Rica";
const OFFSET_CR = "-06:00";

const LOCAL_SIN_ZONA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

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
