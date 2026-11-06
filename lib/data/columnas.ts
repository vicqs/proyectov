/**
 * Proyecciones de columnas para lecturas masivas. Evitan `select *` y mantienen
 * fuera del servidor/navegador datos sensibles que cada vista no necesita
 * (IBAN, cliente Stripe, tokens de gestión, datos fiscales del turista).
 *
 * Sin dependencias de servidor: los tipos se pueden importar desde componentes cliente.
 */
import type { Negocio, Reserva, Servicio } from "@/types/database";

/** Lo mínimo que necesita el listado de negocios (también viaja al navegador). */
export const COLUMNAS_NEGOCIO_LISTADO = [
  "id", "nombre", "slug", "estado_suscripcion", "prueba_hasta",
  "suspendido", "eliminado_en", "creado_en",
] as const satisfies readonly (keyof Negocio)[];
export type NegocioListado = Pick<Negocio, (typeof COLUMNAS_NEGOCIO_LISTADO)[number]>;

/** Negocios para tableros administrativos (solo servidor): añade plan, descuento y próximo cobro. */
export const COLUMNAS_NEGOCIO_ADMIN = [
  ...COLUMNAS_NEGOCIO_LISTADO, "plan_id", "descuento_pct", "proximo_cobro",
] as const satisfies readonly (keyof Negocio)[];
export type NegocioAdmin = Pick<Negocio, (typeof COLUMNAS_NEGOCIO_ADMIN)[number]>;

export const COLUMNAS_SERVICIO_ADMIN = [
  "id", "negocio_id", "nombre", "precio_usd",
] as const satisfies readonly (keyof Servicio)[];
export type ServicioAdmin = Pick<Servicio, (typeof COLUMNAS_SERVICIO_ADMIN)[number]>;

/** Reservas para tableros administrativos: sin token de gestión ni datos fiscales del turista. */
export const COLUMNAS_RESERVA_ADMIN = [
  "id", "servicio_id", "negocio_id", "fecha_hora", "email_cliente", "cupos",
  "estado", "trx_id", "monto_usd",
] as const satisfies readonly (keyof Reserva)[];
export type ReservaAdmin = Pick<Reserva, (typeof COLUMNAS_RESERVA_ADMIN)[number]>;

/** Reservas para las pantallas operativas de empresa (inicio, reservas, calendario, agenda). */
export const COLUMNAS_RESERVA_PANEL = [
  "id", "servicio_id", "fecha_hora", "email_cliente", "nombre_cliente", "cupos",
  "estado", "trx_id", "monto_usd",
] as const satisfies readonly (keyof Reserva)[];
export type ReservaPanel = Pick<Reserva, (typeof COLUMNAS_RESERVA_PANEL)[number]>;

