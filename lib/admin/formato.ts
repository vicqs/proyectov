import { formatearMoneda, formatearPrecioUsd } from "../formato";
import type { CodigoMoneda } from "../monedas";

export function usd(n: number | null | undefined): string {
  return formatearPrecioUsd(n);
}

export function moneda(
  n: number | null | undefined,
  codigo?: CodigoMoneda | string | null,
): string {
  return formatearMoneda(n, codigo ?? "USD");
}

export function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Costa_Rica",
  });
}

export function fechaHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });
}

/** Pagina un arreglo en memoria (la página llega de la URL y se sanea). */
export function paginar<T>(
  filas: T[],
  paginaCruda: string | undefined,
  porPagina = 25,
): { filas: T[]; pagina: number; total: number; paginas: number } {
  const paginas = Math.max(1, Math.ceil(filas.length / porPagina));
  const n = Number.parseInt(paginaCruda ?? "1", 10);
  const pagina = Number.isFinite(n) ? Math.min(Math.max(n, 1), paginas) : 1;
  return {
    filas: filas.slice((pagina - 1) * porPagina, pagina * porPagina),
    pagina,
    total: filas.length,
    paginas,
  };
}

/** Texto plano de un parámetro de URL (puede llegar como arreglo). */
export function parametro(
  valor: string | string[] | undefined,
): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Neutraliza fórmulas de hoja de cálculo al exportar CSV (CSV injection). */
export function celdaCsv(valor: unknown): string {
  let texto = valor === null || valor === undefined ? "" : String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return `"${texto.replace(/"/g, '""')}"`;
}

/** Retorna la cantidad formateada con la forma singular o plural según el valor. */
export function pluralizar(
  cantidad: number,
  singular: string,
  plural: string,
): string {
  return `${cantidad} ${cantidad === 1 ? singular : plural}`;
}
