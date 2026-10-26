import "server-only";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";

/** Texto recortado de un campo de formulario (nunca `null`). */
export function campo(datos: FormData, nombre: string): string {
  const v = datos.get(nombre);
  return typeof v === "string" ? v.trim() : "";
}

/** Contraseña temporal legible de 14 caracteres. */
export function generarContrasena(): string {
  const alfabeto = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(14);
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join("");
}

/** Invalida todo el área de administración tras una mutación. */
export function revalidarAdmin(): void {
  revalidatePath("/admin", "layout");
}

export function fechaEnDias(dias: number, desde: number = Date.now()): string {
  return new Date(desde + dias * 86_400_000).toISOString();
}
