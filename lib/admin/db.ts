import "server-only";

import { cache } from "react";
import type { AdminUserAttributes } from "@supabase/supabase-js";
import type { ConfiguracionPlataforma } from "@/types/database";
import { createSupabaseAdminClient } from "../supabase/admin";
import {
  createDataAccess, DataError,
  type Columna, type Consulta, type ConsultaCols, type InsertDe, type UpdateDe, type NombreTabla,
} from "../data/db";

export type { NombreTabla, FilaDe, InsertDe, Consulta } from "../data/db";
const getAdminData = cache(async () => createDataAccess(await createSupabaseAdminClient()));

export async function leer<T extends NombreTabla, C extends Columna<T> = Columna<T>>(
  table: T, options: ConsultaCols<T, C> = {},
) {
  return (await getAdminData()).leer<T, C>(table, options);
}
export async function leerUno<T extends NombreTabla>(table: T, options: Consulta<T>) {
  return (await getAdminData()).leerUno(table, options);
}
export async function contar<T extends NombreTabla>(table: T, options: Consulta<T> = {}) {
  return (await getAdminData()).contar(table, options);
}
export async function insertar<T extends NombreTabla>(table: T, row: InsertDe<T>) {
  return (await getAdminData()).insertar(table, row);
}
export async function actualizar<T extends NombreTabla>(table: T, values: UpdateDe<T>, eq: Consulta<T>["eq"]) {
  return (await getAdminData()).actualizar(table, values, eq);
}
export async function eliminar<T extends NombreTabla>(table: T, eq: Consulta<T>["eq"]) {
  return (await getAdminData()).eliminar(table, eq);
}

// PostgreSQL no admite ON CONFLICT sobre vistas; el singleton se guarda en su tabla.
export async function upsertar(
  table: "configuracion_plataforma", row: ConfiguracionPlataforma, onConflict: "id",
): Promise<void> {
  const client = await createSupabaseAdminClient();
  const result = await client.from("platform_settings").upsert({
    id: row.id, trial_days: row.dias_prueba, reserved_slugs: row.slugs_reservados,
    max_schedule_capacity: row.max_cupos_horario, max_image_mb: row.max_imagen_mb,
    maintenance_mode: row.modo_mantenimiento, maintenance_message: row.mensaje_mantenimiento,
    simulated_payments_enabled: row.pagos_simulados, flags: row.flags,
    email_templates: row.plantillas_correo, terms_text: row.terminos_texto,
    privacy_text: row.privacidad_texto, updated_at: row.actualizado_en,
  }, { onConflict });
  if (result.error) throw new DataError(result.error.message, result.error.code);
}

export const authAdmin = {
  async getUserById(id: string) { return (await createSupabaseAdminClient()).auth.admin.getUserById(id); },
  async listUsers(options?: { page?: number; perPage?: number }) {
    return (await createSupabaseAdminClient()).auth.admin.listUsers(options);
  },
  async createUser(attributes: { email: string; password?: string; email_confirm?: boolean }) {
    return (await createSupabaseAdminClient()).auth.admin.createUser(attributes);
  },
  async inviteUserByEmail(email: string, options?: { redirectTo?: string }) {
    return (await createSupabaseAdminClient()).auth.admin.inviteUserByEmail(email, options);
  },
  async updateUserById(id: string, attributes: AdminUserAttributes) {
    return (await createSupabaseAdminClient()).auth.admin.updateUserById(id, attributes);
  },
};

export interface UsuarioAuth {
  id: string;
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
}

export async function listarUsuariosAuth(): Promise<UsuarioAuth[]> {
  const users: UsuarioAuth[] = [];
  const size = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await authAdmin.listUsers({ page, perPage: size });
    if (error) throw new DataError(`[auth] ${error.message}`);
    users.push(...data.users);
    if (data.users.length < size) return users;
  }
}
