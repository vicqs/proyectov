import "server-only";

import type { Negocio } from "../types/database";
import { motivoNoOperativo } from "./negocio-estado";
import { flagActiva, obtenerConfiguracion } from "./plataforma";

/** Columnas de `negocios` necesarias para decidir si acepta reservas. */
export const COLUMNAS_OPERATIVIDAD =
  "id, estado_suscripcion, prueba_hasta, suspendido, eliminado_en";

/** Mensaje de error si no se pueden crear reservas ahora; `null` si todo está bien. */
export async function errorReservaNoPermitida(
  negocio: Pick<
    Negocio,
    "estado_suscripcion" | "prueba_hasta" | "suspendido" | "eliminado_en"
  >,
): Promise<string | null> {
  const config = await obtenerConfiguracion();
  if (config.modo_mantenimiento) {
    return (
      config.mensaje_mantenimiento ??
      "La plataforma está en mantenimiento. Intenta más tarde."
    );
  }
  if (!flagActiva(config, "reservas_publicas")) {
    return "Las reservas están temporalmente deshabilitadas.";
  }
  if (motivoNoOperativo(negocio)) {
    return "Este negocio no acepta reservas por ahora.";
  }
  return null;
}
