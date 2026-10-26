import "server-only";

import { supabaseAdmin } from "../supabase";
import type { Database } from "../../types/database";

type Tablas = Database["public"]["Tables"];
export type NombreTabla = keyof Tablas;
export type FilaDe<T extends NombreTabla> = Tablas[T]["Row"];
export type InsertDe<T extends NombreTabla> = Tablas[T]["Insert"];

/**
 * Acceso con service role usado únicamente por la administración global
 * (siempre detrás de `requerirAdmin`/`accionAdmin`). El cliente se tipa de
 * forma laxa porque las consultas se componen dinámicamente; las filas se
 * devuelven tipadas con `FilaDe<tabla>`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabaseAdmin as any;

export interface Consulta {
  eq?: Record<string, unknown>;
  neq?: Record<string, unknown>;
  /** `{ col: [a, b] }` -> `col IN (a, b)`. */
  en?: Record<string, unknown[]>;
  /** Columnas que deben ser NULL. */
  nulas?: string[];
  gte?: Record<string, unknown>;
  lt?: Record<string, unknown>;
  orden?: [columna: string, ascendente?: boolean];
  limite?: number;
}

function falla(tabla: string, mensaje: string): never {
  throw new Error(`[${tabla}] ${mensaje}`);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function aplicar(q: any, o: Consulta) {
  for (const [c, v] of Object.entries(o.eq ?? {})) q = q.eq(c, v);
  for (const [c, v] of Object.entries(o.neq ?? {})) q = q.neq(c, v);
  for (const [c, v] of Object.entries(o.en ?? {})) q = q.in(c, v);
  for (const c of o.nulas ?? []) q = q.is(c, null);
  for (const [c, v] of Object.entries(o.gte ?? {})) q = q.gte(c, v);
  for (const [c, v] of Object.entries(o.lt ?? {})) q = q.lt(c, v);
  if (o.orden) q = q.order(o.orden[0], { ascending: o.orden[1] ?? true });
  if (o.limite) q = q.limit(o.limite);
  return q;
}

const LOTE = 1000;

/** Lee todas las filas paginando: Supabase limita a 1000 filas por consulta. */
export async function leer<T extends NombreTabla>(
  tabla: T,
  o: Consulta = {},
): Promise<FilaDe<T>[]> {
  if (o.limite) {
    const { data, error } = await aplicar(db.from(tabla).select("*"), o);
    if (error) falla(tabla, error.message);
    return (data ?? []) as FilaDe<T>[];
  }
  const filas: FilaDe<T>[] = [];
  const orden = o.orden ?? [tabla === "perfiles" ? "user_id" : "id", true];
  for (let desde = 0; ; desde += LOTE) {
    const { data, error } = await aplicar(db.from(tabla).select("*"), {
      ...o,
      orden,
    }).range(desde, desde + LOTE - 1);
    if (error) falla(tabla, error.message);
    const lote = (data ?? []) as FilaDe<T>[];
    filas.push(...lote);
    if (lote.length < LOTE) break;
  }
  return filas;
}

export async function leerUno<T extends NombreTabla>(
  tabla: T,
  o: Consulta,
): Promise<FilaDe<T> | null> {
  const { data, error } = await aplicar(db.from(tabla).select("*"), {
    ...o,
    limite: 1,
  });
  if (error) falla(tabla, error.message);
  return ((data ?? [])[0] as FilaDe<T> | undefined) ?? null;
}

export async function insertar<T extends NombreTabla>(
  tabla: T,
  fila: InsertDe<T>,
): Promise<FilaDe<T>> {
  const { data, error } = await db.from(tabla).insert(fila).select("*");
  if (error) falla(tabla, error.message);
  return (data as FilaDe<T>[])[0];
}

export async function actualizar<T extends NombreTabla>(
  tabla: T,
  valores: Partial<FilaDe<T>>,
  eq: Record<string, unknown>,
): Promise<void> {
  const { error } = await aplicar(db.from(tabla).update(valores), { eq });
  if (error) falla(tabla, error.message);
}

export async function eliminar<T extends NombreTabla>(
  tabla: T,
  eq: Record<string, unknown>,
): Promise<void> {
  const { error } = await aplicar(db.from(tabla).delete(), { eq });
  if (error) falla(tabla, error.message);
}

export async function upsertar<T extends NombreTabla>(
  tabla: T,
  fila: InsertDe<T>,
  onConflict: string,
): Promise<void> {
  const { error } = await db.from(tabla).upsert(fila, { onConflict });
  if (error) falla(tabla, error.message);
}

/** API de Auth con privilegios de servicio (usuarios, invitaciones). */
export const authAdmin = db.auth.admin as {
  getUserById(id: string): Promise<{
    data: { user: UsuarioAuth | null };
    error: { message: string } | null;
  }>;
  listUsers(opts?: { page?: number; perPage?: number }): Promise<{
    data: { users: UsuarioAuth[] };
    error: { message: string } | null;
  }>;
  createUser(attrs: {
    email: string;
    password?: string;
    email_confirm?: boolean;
  }): Promise<{
    data: { user: UsuarioAuth | null };
    error: { message: string } | null;
  }>;
  inviteUserByEmail(
    email: string,
    opts?: { redirectTo?: string },
  ): Promise<{
    data: { user: UsuarioAuth | null };
    error: { message: string } | null;
  }>;
  updateUserById(
    id: string,
    attrs: Record<string, unknown>,
  ): Promise<{
    data: { user: UsuarioAuth | null };
    error: { message: string } | null;
  }>;
};

export interface UsuarioAuth {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
}

/** Todos los usuarios de Auth (paginado). */
export async function listarUsuariosAuth(): Promise<UsuarioAuth[]> {
  const todos: UsuarioAuth[] = [];
  const porPagina = 200;
  for (let pagina = 1; pagina <= 50; pagina++) {
    const { data, error } = await authAdmin.listUsers({
      page: pagina,
      perPage: porPagina,
    });
    if (error) falla("auth", error.message);
    todos.push(...data.users);
    if (data.users.length < porPagina) break;
  }
  return todos;
}
