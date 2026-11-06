import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, DomainViews } from "@/types/database";

export type DatabaseClient = Pick<SupabaseClient<Database>, "from" | "rpc">;
export type NombreTabla = keyof DomainViews;
export type FilaDe<T extends NombreTabla> = DomainViews[T]["Row"];
type Relation<T extends NombreTabla> = Database["public"]["Views"][T];
export type InsertDe<T extends NombreTabla> = Relation<T> extends { Insert: unknown } ? Relation<T>["Insert"] : never;
export type UpdateDe<T extends NombreTabla> = Relation<T> extends { Update: unknown } ? Relation<T>["Update"] : never;
export type Columna<T extends NombreTabla> = T extends NombreTabla ? Extract<keyof FilaDe<T>, string> : never;

/** Consulta con proyección opcional de columnas (evita `select *` en lecturas masivas). */
export type ConsultaCols<T extends NombreTabla, C extends Columna<T>> = Consulta<T> & {
  columnas?: readonly C[];
};

export interface Consulta<T extends NombreTabla = NombreTabla> {
  eq?: Partial<Record<Columna<T>, unknown>>;
  neq?: Partial<Record<Columna<T>, unknown>>;
  en?: Partial<Record<Columna<T>, unknown[]>>;
  nulas?: Columna<T>[];
  gte?: Partial<Record<Columna<T>, unknown>>;
  gt?: Partial<Record<Columna<T>, unknown>>;
  lt?: Partial<Record<Columna<T>, unknown>>;
  lte?: Partial<Record<Columna<T>, unknown>>;
  orden?: [columna: Columna<T>, ascendente?: boolean];
  limite?: number;
}

export class DataError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = "DataError";
  }
}

interface Filtrable<Q> {
  filter(column: string, operator: "eq" | "neq" | "in" | "is" | "gte" | "gt" | "lt" | "lte", value: unknown): Q;
  order(column: string, options: { ascending: boolean }): Q;
  limit(count: number): Q;
}

function literal(value: unknown): string {
  if (typeof value === "string") return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
  if (typeof value === "boolean" || value === null) return String(value);
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  throw new DataError("Un filtro IN requiere valores escalares validos.");
}

function aplicar<Q extends Filtrable<Q>>(query: Q, options: Consulta): Q {
  for (const operator of ["eq", "neq", "gte", "gt", "lt", "lte"] as const) {
    for (const [column, value] of Object.entries(options[operator] ?? {})) {
      query = query.filter(column, operator, value);
    }
  }
  for (const [column, values] of Object.entries(options.en ?? {})) {
    if (values) query = query.filter(column, "in", `(${values.map(literal).join(",")})`);
  }
  for (const column of options.nulas ?? []) query = query.filter(column, "is", null);
  if (options.orden) query = query.order(options.orden[0], { ascending: options.orden[1] ?? true });
  if (options.limite !== undefined) {
    if (!Number.isInteger(options.limite) || options.limite < 1) throw new DataError("El limite debe ser un entero positivo.");
    query = query.limit(options.limite);
  }
  return query;
}

function falla(table: string, error: { message: string; code?: string }): never {
  throw new DataError(`[${table}] ${error.message}`, error.code);
}

/** Clave primaria de cada vista de dominio (solo `perfiles` usa `user_id`). */
function clavePrimaria(table: NombreTabla): "id" | "user_id" {
  return table === "perfiles" ? "user_id" : "id";
}

/** Lista de columnas para `select`: `*` salvo que se pida una proyección explícita. */
function seleccion(columnas?: readonly string[]): string {
  return columnas && columnas.length > 0 ? columnas.join(",") : "*";
}

export function createDataAccess(client: DatabaseClient) {
  return {
    async leer<T extends NombreTabla, C extends Columna<T> = Columna<T>>(
      table: T, options: ConsultaCols<T, C> = {},
    ): Promise<Pick<FilaDe<T>, C>[]> {
      if (options.limite !== undefined && (!Number.isInteger(options.limite) || options.limite < 1)) {
        throw new DataError("El limite debe ser un entero positivo.");
      }
      const result: Pick<FilaDe<T>, C>[] = [];
      const maximum = options.limite ?? Infinity;
      const primaryKey = clavePrimaria(table);
      const columnas = seleccion(options.columnas);
      for (let offset = 0; offset < maximum; offset += 1000) {
        const size = Math.min(1000, maximum - offset);
        let query = aplicar(client.from(table).select(columnas), options);
        if (!options.orden) query = query.order(primaryKey, { ascending: true });
        else if (options.orden[0] !== primaryKey) query = query.order(primaryKey, { ascending: true });
        const { data, error } = await query.range(offset, offset + size - 1)
          .overrideTypes<Pick<FilaDe<T>, C>[], { merge: false }>();
        if (error) falla(table, error);
        if (!data) falla(table, { message: "La consulta no devolvio una respuesta valida." });
        result.push(...data);
        if (data.length < size) break;
      }
      return result;
    },

    async leerUno<T extends NombreTabla>(table: T, options: Consulta<T>): Promise<FilaDe<T> | null> {
      const { data, error } = await aplicar(client.from(table).select("*"), options)
        .limit(1).maybeSingle<FilaDe<T>>();
      if (error) falla(table, error);
      return data;
    },

    async contar<T extends NombreTabla>(table: T, options: Consulta<T> = {}): Promise<number> {
      const { count, error } = await aplicar(
        client.from(table).select("*", { count: "exact", head: true }),
        options,
      );
      if (error) falla(table, error);
      return count ?? 0;
    },

    async insertar<T extends NombreTabla>(table: T, row: InsertDe<T>): Promise<FilaDe<T>> {
      const { data, error } = await client.from(table).insert<InsertDe<T>>(row).select("*").single<FilaDe<T>>();
      if (error) falla(table, error);
      if (!data) falla(table, { message: "No se pudo insertar el registro." });
      return data;
    },

    async actualizar<T extends NombreTabla>(
      table: T, values: UpdateDe<T>, eq: Consulta<T>["eq"],
    ): Promise<void> {
      if (!eq || Object.keys(eq).length === 0) throw new DataError("Se requiere un filtro para actualizar registros.");
      // Solo se pide la clave primaria: basta para comprobar que la fila existía.
      const { data, error } = await aplicar(client.from(table).update<UpdateDe<T>>(values), { eq }).select(clavePrimaria(table));
      if (error) falla(table, error);
      if (!data?.length) falla(table, { message: "No se encontro el registro a actualizar." });
    },

    async eliminar<T extends NombreTabla>(table: T, eq: Consulta<T>["eq"]): Promise<void> {
      if (!eq || Object.keys(eq).length === 0) throw new DataError("Se requiere un filtro para eliminar registros.");
      const { data, error } = await aplicar(client.from(table).delete(), { eq }).select(clavePrimaria(table));
      if (error) falla(table, error);
      if (!data?.length) falla(table, { message: "No se encontro el registro a eliminar." });
    },
  };
}
