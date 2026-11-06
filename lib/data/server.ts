import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "../supabase/server";
import {
  createDataAccess,
  type Columna,
  type Consulta,
  type ConsultaCols,
  type InsertDe,
  type UpdateDe,
  type NombreTabla,
} from "./db";

export const getServerData = cache(async () => createDataAccess(await createSupabaseServerClient()));

export async function leer<T extends NombreTabla, C extends Columna<T> = Columna<T>>(
  table: T, options: ConsultaCols<T, C> = {},
) {
  return (await getServerData()).leer<T, C>(table, options);
}
export async function leerUno<T extends NombreTabla>(table: T, options: Consulta<T>) {
  return (await getServerData()).leerUno(table, options);
}
export async function contar<T extends NombreTabla>(table: T, options: Consulta<T> = {}) {
  return (await getServerData()).contar(table, options);
}
export async function insertar<T extends NombreTabla>(table: T, row: InsertDe<T>) {
  return (await getServerData()).insertar(table, row);
}
export async function actualizar<T extends NombreTabla>(table: T, values: UpdateDe<T>, eq: Consulta<T>["eq"]) {
  return (await getServerData()).actualizar(table, values, eq);
}
export async function eliminar<T extends NombreTabla>(table: T, eq: Consulta<T>["eq"]) {
  return (await getServerData()).eliminar(table, eq);
}
