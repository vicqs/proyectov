import "server-only";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { Perfil } from "../types/database";
import { createSupabaseServerClient } from "./supabase/server";
import { leerUno } from "./data/server";

export type SesionValida = { user: User; perfil: Perfil | null };

/** Una falla de consulta no puede ocultar bloqueos ni conceder roles de respaldo. */
export const obtenerPerfil = cache(
  async (userId: string): Promise<Perfil | null> => {
    return leerUno("perfiles", { eq: { user_id: userId } });
  },
);

/**
 * Obtiene y memoriza por request el cliente SSR de Supabase y el usuario de Auth.
 * Permite disparar en paralelo la lectura de `perfiles` y otras consultas por `user.id`.
 */
export const obtenerUsuarioServidor = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
});

/**
 * Usuario autenticado cuya cuenta no está bloqueada y cuya sesión no fue
 * revocada por la administración. Devuelve `null` en cualquier otro caso.
 * Se cachea por request: lo comparten el panel de empresa y el de admin.
 */
export const obtenerSesionValida = cache(
  async (): Promise<SesionValida | null> => {
    const { user } = await obtenerUsuarioServidor();
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
