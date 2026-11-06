import { z } from "zod";

/** Esquema compartido para slugs de negocios en toda la plataforma. */
export const SLUG_SCHEMA = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/,
    "Slug inválido: 3 a 40 caracteres, minúsculas, números y guiones.",
  );

/** Esquema compartido para colores de marca en formato HEX (#RRGGBB). */
export const HEX_COLOR_SCHEMA = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{6})$/,
    "El color debe estar en formato HEX (ej. #0284c7)",
  );

/** Expresión regular estándar para cuentas IBAN (código ISO de 2 letras + 12 a 32 caracteres alfanuméricos). */
export const IBAN_REGEX = /^[A-Z]{2}[0-9A-Z]{12,32}$/;

/** Esquema UUID compartido para validaciones rápidas de identificadores. */
export const UUID_SCHEMA = z.string().uuid();

export function esUuidValido(valor: string): boolean {
  return UUID_SCHEMA.safeParse(valor).success;
}

/**
 * Extrae de forma segura un campo de texto desde un `FormData` sin recurrir
 * a conversiones forzadas (`as string | null`).
 */
export function campoTexto(
  formData: FormData,
  clave: string,
): string | undefined {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor : undefined;
}

/**
 * Extrae de forma segura un archivo (`File`) desde un `FormData` verificando
 * `instanceof File` en tiempo de ejecución en lugar de `as File | null`.
 */
export function campoArchivo(formData: FormData, clave: string): File | null {
  const valor = formData.get(clave);
  return valor instanceof File ? valor : null;
}

