import type { EstadoSuscripcion, Negocio } from "../types/database";

type CamposEstado = Pick<
  Negocio,
  "estado_suscripcion" | "prueba_hasta" | "suspendido" | "eliminado_en"
>;

/** Una prueba vencida equivale a una suscripción inactiva. */
export function estadoEfectivo(
  negocio: Pick<Negocio, "estado_suscripcion" | "prueba_hasta">,
  ahora: number = Date.now(),
): EstadoSuscripcion {
  if (
    negocio.estado_suscripcion === "prueba" &&
    negocio.prueba_hasta &&
    new Date(negocio.prueba_hasta).getTime() < ahora
  ) {
    return "inactiva";
  }
  return negocio.estado_suscripcion;
}

export type MotivoNoOperativo = "eliminado" | "suspendido" | "inactiva";

/** `null` si el negocio puede operar y recibir reservas. */
export function motivoNoOperativo(
  negocio: CamposEstado,
): MotivoNoOperativo | null {
  if (negocio.eliminado_en) return "eliminado";
  if (negocio.suspendido) return "suspendido";
  if (estadoEfectivo(negocio) === "inactiva") return "inactiva";
  return null;
}

export function negocioOperativo(negocio: CamposEstado): boolean {
  return motivoNoOperativo(negocio) === null;
}
