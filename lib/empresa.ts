import "server-only";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { Negocio } from "../types/database";
import { createSupabaseServerClient } from "./supabase/server";
import { obtenerSesionValida, obtenerUsuarioServidor } from "./sesion";
import { rutaPanelEmpresa } from "./rutas-empresa";
import { DataError } from "./data/db";
import { obtenerConfiguracion } from "./plataforma";
import { esRedireccionNext, mensajeErrorUsuario } from "./errores";

export type EmpresaPageProps = { params: Promise<{ slug: string }> };

export type ContextoEmpresa = {
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  user: User;
  negocio: Negocio;
};

type ErrorEmpresa = { error: string; sinSesion: boolean };

/** La identidad procede de la sesión; el slug solo restringe el negocio propio. */
export const obtenerEmpresaAutenticada = cache(
  async (slug?: string): Promise<ContextoEmpresa | ErrorEmpresa> => {
    if (
      slug !== undefined &&
      (typeof slug !== "string" || !/^[a-z0-9][a-z0-9_-]*$/i.test(slug))
    ) {
      return { error: "No tienes acceso a este negocio.", sinSesion: false };
    }

    const { supabase, user: authUser } = await obtenerUsuarioServidor();
    if (!authUser) {
      return {
        error: "Sesión expirada, vuelve a iniciar sesión.",
        sinSesion: true,
      };
    }

    let consulta = supabase
      .from("negocios")
      .select("*")
      .eq("user_id", authUser.id);
    if (slug !== undefined) consulta = consulta.eq("slug", slug);

    const [sesion, { data: negocio, error }] = await Promise.all([
      obtenerSesionValida(),
      consulta.maybeSingle(),
    ]);

    const user = sesion?.user;
    if (!user) {
      return {
        error: "Sesión expirada, vuelve a iniciar sesión.",
        sinSesion: true,
      };
    }
    if (error) throw new DataError(error.message, error.code);
    if (!negocio || negocio.eliminado_en) {
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
  const [contexto, config] = await Promise.all([
    obtenerEmpresaAutenticada(slug),
    obtenerConfiguracion(),
  ]);
  if ("error" in contexto) return contexto;
  const motivo = contexto.negocio.eliminado_en
    ? "eliminado"
    : contexto.negocio.suspendido
      ? "suspendido"
      : null;
  if (motivo) {
    return { error: MENSAJE_NO_OPERATIVO[motivo], sinSesion: false };
  }
  if (config.modo_mantenimiento) {
    return {
      error:
        config.mensaje_mantenimiento ||
        "La plataforma está en mantenimiento temporalmente.",
      sinSesion: false,
    };
  }
  return contexto;
}

/**
 * Envoltorio de Server Actions de empresa (equivalente a `accionAdmin`):
 * valida sesión y negocio operativo, convierte excepciones en `{ error }`
 * y deja pasar redirecciones de Next.js.
 */
export async function accionEmpresa<T extends { error?: string }>(
  slug: string,
  mensajeErrorPorDefecto: string,
  fn: (ctx: ContextoEmpresa) => Promise<T | { error: string }>,
): Promise<T | { error: string }> {
  try {
    const ctx = await obtenerEmpresaOperativa(slug);
    if ("error" in ctx) return { error: ctx.error };
    return await fn(ctx);
  } catch (error) {
    if (esRedireccionNext(error)) throw error;
    console.error("[empresa] Error en acción:", error);
    return {
      error: mensajeErrorUsuario(error, mensajeErrorPorDefecto),
    };
  }
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
