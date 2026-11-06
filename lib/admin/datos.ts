import "server-only";

import { cache } from "react";
import type { Negocio, Plan, Reserva, Servicio } from "../../types/database";
import {
  COLUMNAS_NEGOCIO_ADMIN,
  COLUMNAS_RESERVA_ADMIN,
  COLUMNAS_SERVICIO_ADMIN,
  type NegocioAdmin,
  type ReservaAdmin,
  type ServicioAdmin,
} from "../data/columnas";
import { leer } from "./db";
import {
  convertirAUsd,
  convertirMoneda,
  normalizarMoneda,
  type CodigoMoneda,
} from "../monedas";
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

/** Moneda efectiva de una reserva (cae en la del servicio o negocio si falta). */
export function monedaReserva(
  r: Pick<Reserva, "servicio_id"> & Partial<Pick<Reserva, "currency" | "negocio_id">>,
  servicios: Map<string, Partial<Pick<Servicio, "currency">>>,
  negocios?: Map<string, Partial<Pick<Negocio, "moneda">>>,
): CodigoMoneda {
  const srv = servicios.get(r.servicio_id);
  const neg = r.negocio_id ? negocios?.get(r.negocio_id) : undefined;
  return normalizarMoneda(r.currency ?? srv?.currency ?? neg?.moneda, "USD");
}

/** Monto nominal de una reserva expresado en su propia moneda (`monedaReserva`). */
export function montoReserva(
  r: Pick<Reserva, "monto_usd" | "cupos" | "servicio_id"> &
    Partial<Pick<Reserva, "gross_amount" | "currency" | "negocio_id">>,
  servicios: Map<string, Pick<Servicio, "precio_usd"> & Partial<Pick<Servicio, "currency">>>,
  negocios?: Map<string, Partial<Pick<Negocio, "moneda">>>,
): number {
  if (r.monto_usd !== null && r.monto_usd !== undefined) return r.monto_usd;
  if (r.gross_amount !== null && r.gross_amount !== undefined) return r.gross_amount;
  const srv = servicios.get(r.servicio_id);
  const base = montoEfectivoReserva(r, srv?.precio_usd);
  const monSrv = normalizarMoneda(
    srv?.currency ?? (r.negocio_id ? negocios?.get(r.negocio_id)?.moneda : undefined),
    "USD",
  );
  const monRes = monedaReserva(r, servicios, negocios);
  return convertirMoneda(base, monSrv, monRes);
}

/** Equivalente en USD de una reserva (para KPIs consolidados de plataforma). */
export function montoReservaUsd(
  r: Pick<Reserva, "monto_usd" | "cupos" | "servicio_id"> &
    Partial<Pick<Reserva, "gross_amount" | "currency" | "exchange_rate_bccr" | "negocio_id">>,
  servicios: Map<string, Pick<Servicio, "precio_usd"> & Partial<Pick<Servicio, "currency">>>,
  negocios?: Map<string, Partial<Pick<Negocio, "moneda">>>,
): number {
  const monto = montoReserva(r, servicios, negocios);
  const moneda = monedaReserva(r, servicios, negocios);
  return convertirAUsd(monto, moneda, r.exchange_rate_bccr);
}

/** Monto de una reserva convertido a una moneda objetivo (p. ej. moneda base del negocio). */
export function montoReservaEnMoneda(
  r: Pick<Reserva, "monto_usd" | "cupos" | "servicio_id"> &
    Partial<Pick<Reserva, "gross_amount" | "currency" | "exchange_rate_bccr" | "negocio_id">>,
  destino: CodigoMoneda,
  servicios: Map<string, Pick<Servicio, "precio_usd"> & Partial<Pick<Servicio, "currency">>>,
  negocios?: Map<string, Partial<Pick<Negocio, "moneda">>>,
): number {
  const monto = montoReserva(r, servicios, negocios);
  const moneda = monedaReserva(r, servicios, negocios);
  return convertirMoneda(monto, moneda, destino, r.exchange_rate_bccr);
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
