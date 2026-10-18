import "server-only";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Negocio } from "../types/database";
import { createSupabaseServerClient } from "./supabase/server";
import { obtenerSesionValida } from "./sesion";
import { rutaPanelEmpresa } from "./rutas-empresa";

export type EmpresaPageProps = { params: Promise<{ slug: string }> };

type ContextoEmpresa = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  negocio: Negocio;
};

type ErrorEmpresa = { error: string; sinSesion: boolean };

/** La identidad procede de la sesión; el slug solo restringe el negocio propio. */
export const obtenerEmpresaAutenticada = cache(
  async (slug?: string): Promise<ContextoEmpresa | ErrorEmpresa> => {
    const supabase = await createSupabaseServerClient();
    const sesion = await obtenerSesionValida();
    const user = sesion?.user;
    if (!user) {
      return {
        error: "Sesión expirada, vuelve a iniciar sesión.",
        sinSesion: true,
      };
    }
    if (
      slug !== undefined &&
      (typeof slug !== "string" || !/^[a-z0-9][a-z0-9_-]*$/i.test(slug))
    ) {
      return { error: "No tienes acceso a este negocio.", sinSesion: false };
    }

    let consulta = supabase.from("negocios").select("*").eq("user_id", user.id);
    if (slug !== undefined) consulta = consulta.eq("slug", slug);
    const { data: negocio, error } = await consulta.single();
    if (error || !negocio || negocio.eliminado_en) {
      return {
        error: "No se encontró el negocio asociado a tu cuenta.",
        sinSesion: false,
      };
    }
    return { supabase, user, negocio };
  },
);

const MENSAJE_NO_OPERATIVO = {
  eliminado: "Este negocio ya no está disponible.",
  suspendido:
    "Tu cuenta está suspendida. Contacta con la administración para resolverlo.",
} as const;

/**
 * Como `obtenerEmpresaAutenticada`, pero rechaza los negocios suspendidos o
 * eliminados. Una suscripción inactiva NO bloquea el panel (solo desactiva el
 * enlace público). Úsala en las acciones que modifican datos, para que el
 * bloqueo no dependa solo de la interfaz.
 */
export async function obtenerEmpresaOperativa(
  slug?: string,
): Promise<ContextoEmpresa | ErrorEmpresa> {
  const contexto = await obtenerEmpresaAutenticada(slug);
  if ("error" in contexto) return contexto;
  const motivo = contexto.negocio.eliminado_en
    ? "eliminado"
    : contexto.negocio.suspendido
      ? "suspendido"
      : null;
  if (motivo) {
    return { error: MENSAJE_NO_OPERATIVO[motivo], sinSesion: false };
  }
  return contexto;
}
/** Se invoca en cada página, además del layout: evita renderizados sin validar. */
export async function requerirEmpresa(slug?: string): Promise<ContextoEmpresa> {
  const contexto = await obtenerEmpresaAutenticada(slug);
  if ("error" in contexto) {
    if (contexto.sinSesion) redirect("/login");
    notFound();
  }
  return contexto;
}

/** Invalida únicamente el panel y el perfil público del negocio modificado. */
export function revalidarEmpresa(slug: string): void {
  revalidatePath(rutaPanelEmpresa(slug), "layout");
  revalidatePath(`/${encodeURIComponent(slug)}`);
}
