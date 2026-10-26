import { MARCA } from "./marca";

/** Los colores guardados por cada negocio siempre prevalecen sobre estos defaults. */

export const COLOR_PRIMARIO_DEFECTO = MARCA.colores.azul;
export const COLOR_SECUNDARIO_DEFECTO = MARCA.colores.esmeralda;

export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function esHex(valor: unknown): valor is string {
  return typeof valor === "string" && HEX_COLOR.test(valor);
}

/** Pares sugeridos (primario + secundario) que combinan bien entre sí. */
export const PARES_MARCA: {
  nombre: string;
  primario: string;
  secundario: string;
}[] = [
  {
    nombre: "Océano",
    primario: MARCA.colores.azul,
    secundario: MARCA.colores.esmeralda,
  },
  { nombre: "Selva", primario: "#059669", secundario: "#0d9488" },
  { nombre: "Atardecer", primario: "#ea580c", secundario: "#db2777" },
  { nombre: "Café", primario: "#b45309", secundario: "#65a30d" },
  { nombre: "Orquídea", primario: "#9333ea", secundario: "#e11d48" },
  { nombre: "Noche", primario: "#1e293b", secundario: "#0ea5e9" },
];

function luminancia(hex: string): number {
  const canal = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(1) + 0.7152 * canal(3) + 0.0722 * canal(5);
}

function ratio(l1: number, l2: number): number {
  const [a, b] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/** Color de texto (blanco u oscuro) con mejor contraste sobre `hex`. */
export function textoSobre(hex: string): "#ffffff" | "#0f172a" {
  if (!esHex(hex)) return "#ffffff";
  const l = luminancia(hex);
  return ratio(l, 1) >= ratio(l, luminancia("#0f172a")) ? "#ffffff" : "#0f172a";
}

/** Mejor ratio de contraste (1–21) alcanzable con texto blanco u oscuro sobre `hex`. */
export function mejorContraste(hex: string): number {
  if (!esHex(hex)) return 21;
  const l = luminancia(hex);
  return Math.max(ratio(l, 1), ratio(l, luminancia("#0f172a")));
}
