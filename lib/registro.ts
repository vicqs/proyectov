import "server-only";

import { supabaseAdmin } from "./supabase";
import type { TipoRegistroSistema } from "../types/database";

/** Registro operativo (webhooks, correos, errores). Nunca lanza ni guarda secretos. */
export async function registrarSistema(evento: {
  tipo: TipoRegistroSistema;
  origen: string;
  estado: "ok" | "error";
  detalle?: string | null;
  payload?: Record<string, unknown> | null;
}): Promise<void> {
  try {
    const { error } = await supabaseAdmin.from("registro_sistema").insert({
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
