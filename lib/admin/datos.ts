import "server-only";

import { cache } from "react";
import type { Plan, Reserva, Servicio } from "../../types/database";
import {
  COLUMNAS_NEGOCIO_ADMIN,
  COLUMNAS_RESERVA_ADMIN,
  COLUMNAS_SERVICIO_ADMIN,
  type NegocioAdmin,
  type ReservaAdmin,
  type ServicioAdmin,
} from "../data/columnas";
import { leer } from "./db";
import { calcularPrecio } from "../plataforma";
import { estadoEfectivo, negocioOperativo } from "../negocio-estado";
import { montoEfectivoReserva } from "../pagos";

export interface DatosPlataforma {
  negocios: NegocioAdmin[];
  servicios: ServicioAdmin[];
  reservas: ReservaAdmin[];
  planes: Plan[];
}

/**
 * Carga la base mínima de los tableros globales con proyección de columnas:
 * no se descargan IBAN, cliente Stripe, tokens de gestión ni datos fiscales del
 * turista que ningún tablero usa.
 */
export const cargarPlataforma = cache(async (): Promise<DatosPlataforma> => {
  const [negocios, servicios, reservas, planes] = await Promise.all([
    leer("negocios", { columnas: COLUMNAS_NEGOCIO_ADMIN }),
    leer("servicios", { columnas: COLUMNAS_SERVICIO_ADMIN }),
    leer("reservas", { columnas: COLUMNAS_RESERVA_ADMIN }),
    leer("planes"),
  ]);
  return { negocios, servicios, reservas, planes };
});

/** Monto cobrado de una reserva (precio × cupos si no se guardó el monto). */
export function montoReserva(
  r: Pick<Reserva, "monto_usd" | "cupos" | "servicio_id">,
  servicios: Map<string, Pick<Servicio, "precio_usd">>,
): number {
  return montoEfectivoReserva(r, servicios.get(r.servicio_id)?.precio_usd);
}

export function indexar<T extends { id: string }>(filas: T[]): Map<string, T> {
  return new Map(filas.map((f) => [f.id, f]));
}

/** Ingreso recurrente mensual: negocios activos y operativos × su precio con descuento. */
export function calcularMrr(negocios: NegocioAdmin[], planes: Plan[]): number {
  return negocios
    .filter((n) => negocioOperativo(n) && estadoEfectivo(n) === "activa")
    .reduce((acc, n) => acc + calcularPrecio(n, planes).precio, 0);
}

export const ETIQUETA_ESTADO: Record<string, string> = {
  activa: "Activa",
  prueba: "En prueba",
  inactiva: "Inactiva",
};
