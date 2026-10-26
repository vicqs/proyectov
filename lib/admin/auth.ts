import "server-only";

import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { RolAdmin } from "../../types/database";
import { obtenerSesionValida } from "../sesion";
import { tienePermiso, type Permiso } from "../roles";

export type Admin = { user: User; email: string; rol: RolAdmin };

export type ResultadoAccion = { ok?: string; error?: string };

/** Correos con acceso de superadministrador desde el entorno (bootstrap inicial). */
function correosGlobales(): string[] {
  return (process.env.ADMIN_GLOBAL_EMAILS ?? "")
    .split(",")
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);
}

/** Rol interno efectivo: el del perfil o, en su defecto, el del entorno. */
export function rolEfectivo(
  email: string | undefined,
  rolPerfil: RolAdmin | null | undefined,
): RolAdmin | null {
  if (rolPerfil) return rolPerfil;
  if (email && correosGlobales().includes(email.toLowerCase())) {
    return "superadmin";
  }
  return null;
}

/** Administrador con sesión válida, o `null` si el usuario no es del equipo. */
export const obtenerAdminAutenticado = cache(
  async (): Promise<Admin | null> => {
    const sesion = await obtenerSesionValida();
    if (!sesion) return null;
    const email = (sesion.user.email ?? "").toLowerCase();
    const rol = rolEfectivo(email, sesion.perfil?.rol_admin);
    if (!rol) return null;
    return { user: sesion.user, email, rol };
  },
);

/**
 * Se invoca en cada página y layout del área `/admin`. Un usuario sin rol
 * interno recibe 404 para no revelar la existencia del área.
 */
export async function requerirAdmin(permiso?: Permiso): Promise<Admin> {
  const sesion = await obtenerSesionValida();
  if (!sesion) redirect("/login");
  const admin = await obtenerAdminAutenticado();
  if (!admin) notFound();
  if (permiso && !tienePermiso(admin.rol, permiso)) {
    redirect("/admin/sin-permiso");
  }
  return admin;
}

function esErrorDeNext(e: unknown): boolean {
  const digest = (e as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_");
}

/**
 * Envoltorio de Server Actions de administración: valida sesión y permiso,
 * convierte excepciones en `{ error }` y deja pasar redirecciones de Next.
 */
export async function accionAdmin(
  permiso: Permiso,
  fn: (admin: Admin) => Promise<ResultadoAccion | void>,
): Promise<ResultadoAccion> {
  const admin = await obtenerAdminAutenticado();
  if (!admin || !tienePermiso(admin.rol, permiso)) {
    return { error: "No tienes permiso para realizar esta acción." };
  }
  try {
    return (await fn(admin)) ?? { ok: "Cambios guardados." };
  } catch (e) {
    if (esErrorDeNext(e)) throw e;
    console.error("[admin] Error en acción:", e);
    return {
      error:
        e instanceof Error && e.message
          ? e.message
          : "No se pudo completar la acción.",
    };
  }
}

/** Solo el superadministrador puede operar sobre cuentas con rol interno. */
export function puedeActuarSobre(
  admin: Admin,
  rolObjetivo: RolAdmin | null | undefined,
): boolean {
  return !rolObjetivo || admin.rol === "superadmin";
}
