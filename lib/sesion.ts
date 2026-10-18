import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { Perfil } from "../types/database";
import { createSupabaseServerClient } from "./supabase/server";
import { supabaseAdmin } from "./supabase";

export type SesionValida = { user: User; perfil: Perfil | null };

/** Perfil de plataforma de un usuario (rol interno, bloqueo). Tolera tabla ausente. */
export async function obtenerPerfil(userId: string): Promise<Perfil | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("perfiles")
      .select("*")
      .eq("user_id", userId)
      .limit(1);
    if (error) return null;
    return ((data ?? [])[0] as Perfil | undefined) ?? null;
  } catch {
    return null;
  }
}

/**
 * Usuario autenticado cuya cuenta no está bloqueada y cuya sesión no fue
 * revocada por la administración. Devuelve `null` en cualquier otro caso.
 * Se cachea por request: lo comparten el panel de empresa y el de admin.
 */
export const obtenerSesionValida = cache(
  async (): Promise<SesionValida | null> => {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const perfil = await obtenerPerfil(user.id);
    if (perfil?.bloqueado) return null;
    if (perfil?.sesiones_revocadas_desde && user.last_sign_in_at) {
      if (
        new Date(user.last_sign_in_at).getTime() <=
        new Date(perfil.sesiones_revocadas_desde).getTime()
      ) {
        return null;
      }
    }
    return { user, perfil };
  },
);
