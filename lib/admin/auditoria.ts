import "server-only";

import { supabaseAdmin } from "../supabase";
import type { Admin } from "./auth";

export interface EventoAuditoria {
  accion: string;
  entidad: string;
  entidad_id?: string | null;
  negocio_id?: string | null;
  detalle?: Record<string, unknown> | null;
}

/** Registra una acción administrativa. Nunca lanza: la auditoría no debe romper la operación. */
export async function registrarAuditoria(
  admin: Pick<Admin, "user" | "email" | "rol"> | null,
  evento: EventoAuditoria,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("auditoria").insert({
      actor_id: admin?.user.id ?? "sistema",
      actor_email: admin?.email ?? "sistema",
      actor_rol: admin?.rol ?? "sistema",
      accion: evento.accion,
      entidad: evento.entidad,
      entidad_id: evento.entidad_id ?? null,
      negocio_id: evento.negocio_id ?? null,
      detalle: evento.detalle ?? null,
    });
    if (error) console.error("[auditoria]", error.message);
  } catch (e) {
    console.error("[auditoria]", e);
  }
}

/** Evento originado fuera del área de admin (empresa, webhooks): actor "sistema" o la propia empresa. */
export async function registrarEventoNegocio(
  actor: { id: string; email: string } | null,
  evento: EventoAuditoria,
): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("auditoria").insert({
      actor_id: actor?.id ?? "sistema",
      actor_email: actor?.email ?? "sistema",
      actor_rol: actor ? "empresa" : "sistema",
      accion: evento.accion,
      entidad: evento.entidad,
      entidad_id: evento.entidad_id ?? null,
      negocio_id: evento.negocio_id ?? null,
      detalle: evento.detalle ?? null,
    });
    if (error) console.error("[auditoria]", error.message);
  } catch (e) {
    console.error("[auditoria]", e);
  }
}
