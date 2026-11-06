import "server-only";

import type { DatabaseClient } from "./data/db";
import type { TipoRegistroSistema } from "../types/database";

/** Registro operativo (webhooks, correos, errores). Nunca lanza ni guarda secretos. */
export async function registrarSistema(evento: {
  tipo: TipoRegistroSistema;
  origen: string;
  estado: "ok" | "error";
  detalle?: string | null;
  payload?: Record<string, unknown> | null;
}, client?: DatabaseClient): Promise<void> {
  try {
    const supabase = client ?? null;
    if (!supabase) {
      console.info("[registro_sistema] Solo log de servidor; no hay un cliente administrativo o webhook verificado.", evento.tipo, evento.origen, evento.estado);
      return;
    }
    const { error } = await supabase.from("registro_sistema").insert({
      tipo: evento.tipo,
      origen: evento.origen,
      estado: evento.estado,
      detalle: evento.detalle ? evento.detalle.slice(0, 500) : null,
      payload: evento.payload ?? null,
      resuelto: evento.estado === "ok",
    });
    if (error) console.error("[registro_sistema]", error.message);
  } catch (e) {
    console.error("[registro_sistema]", e);
  }
}
