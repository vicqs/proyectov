import "server-only";

import type { Negocio, Reserva, Servicio, Plan } from "../../types/database";
import { leer } from "./db";
import { calcularPrecio } from "../plataforma";
import { estadoEfectivo, negocioOperativo } from "../negocio-estado";

export interface DatosPlataforma {
  negocios: Negocio[];
  servicios: Servicio[];
  reservas: Reserva[];
  planes: Plan[];
}

export async function cargarPlataforma(): Promise<DatosPlataforma> {
  const [negocios, servicios, reservas, planes] = await Promise.all([
    leer("negocios"),
    leer("servicios"),
    leer("reservas"),
    leer("planes").catch(() => [] as Plan[]),
  ]);
  return { negocios, servicios, reservas, planes };
}

/** Monto cobrado de una reserva (precio × cupos si no se guardó el monto). */
export function montoReserva(
  r: Reserva,
  servicios: Map<string, Servicio>,
): number {
  return (
    r.monto_usd ??
    (servicios.get(r.servicio_id)?.precio_usd ?? 0) * (r.cupos ?? 1)
  );
}

export function indexar<T extends { id: string }>(filas: T[]): Map<string, T> {
  return new Map(filas.map((f) => [f.id, f]));
}

/** Ingreso recurrente mensual: negocios activos y operativos × su precio con descuento. */
export function calcularMrr(negocios: Negocio[], planes: Plan[]): number {
  return negocios
    .filter((n) => negocioOperativo(n) && estadoEfectivo(n) === "activa")
    .reduce((acc, n) => acc + calcularPrecio(n, planes).precio, 0);
}

export const ETIQUETA_ESTADO: Record<string, string> = {
  activa: "Activa",
  prueba: "En prueba",
  inactiva: "Inactiva",
};
