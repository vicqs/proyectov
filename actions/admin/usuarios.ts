"use server";

import {
  accionAdmin,
  puedeActuarSobre,
  rolEfectivo,
  type ResultadoAccion,
} from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, authAdmin, insertar, leerUno } from "../../lib/admin/db";
import { generarContrasena, revalidarAdmin } from "../../lib/admin/util";
import type { Perfil } from "../../types/database";

/** Perfil existente o uno nuevo sin rol para poder guardar bloqueo/sesiones. */
async function asegurarPerfil(userId: string): Promise<Perfil> {
  const existente = await leerUno("perfiles", { eq: { user_id: userId } });
  if (existente) return existente;
  const { data } = await authAdmin.getUserById(userId);
  if (!data.user) throw new Error("Usuario no encontrado.");
  return insertar("perfiles", {
    user_id: userId,
    email: data.user.email ?? "",
  });
}

type Contexto = Parameters<Parameters<typeof accionAdmin>[1]>[0];

/** Valida que el actor pueda operar sobre el usuario objetivo. */
async function objetivo(
  admin: Contexto,
  userId: string,
): Promise<Perfil | ResultadoAccion> {
  if (userId === admin.user.id) {
    return { error: "No puedes aplicar esta acción sobre tu propia cuenta." };
  }
  const perfil = await asegurarPerfil(userId);
  const { data } = await authAdmin.getUserById(userId);
  const rol = rolEfectivo(data.user?.email, perfil.rol_admin);
  if (!puedeActuarSobre(admin, rol)) {
    return {
      error:
        "Solo un superadministrador puede actuar sobre cuentas del equipo.",
    };
  }
  return perfil;
}

function esError(v: Perfil | ResultadoAccion): v is ResultadoAccion {
  return "error" in v;
}

export async function bloquearUsuarioAction(
  userId: string,
  bloquear: boolean,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("usuarios", async (admin) => {
    const perfil = await objetivo(admin, userId);
    if (esError(perfil)) return perfil;
    await actualizar(
      "perfiles",
      {
        bloqueado: bloquear,
        // Al bloquear también se invalidan las sesiones abiertas.
        ...(bloquear
          ? { sesiones_revocadas_desde: new Date().toISOString() }
          : {}),
      },
      { user_id: userId },
    );
    // Con Supabase real, además se veta el inicio de sesión en Auth.
    await authAdmin
      .updateUserById(userId, { ban_duration: bloquear ? "876000h" : "none" })
      .catch(() => null);
    await registrarAuditoria(admin, {
      accion: bloquear ? "usuario.bloquear" : "usuario.desbloquear",
      entidad: "usuario",
      entidad_id: userId,
      detalle: { email: perfil.email },
    });
    revalidarAdmin();
    return { ok: bloquear ? "Usuario bloqueado." : "Usuario desbloqueado." };
  });
}

export async function cerrarSesionesAction(
  userId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("usuarios", async (admin) => {
    const perfil = await objetivo(admin, userId);
    if (esError(perfil)) return perfil;
    await actualizar(
      "perfiles",
      { sesiones_revocadas_desde: new Date().toISOString() },
      { user_id: userId },
    );
    await registrarAuditoria(admin, {
      accion: "usuario.cerrar_sesiones",
      entidad: "usuario",
      entidad_id: userId,
      detalle: { email: perfil.email },
    });
    revalidarAdmin();
    return { ok: "Sesiones cerradas: deberá iniciar sesión de nuevo." };
  });
}

export async function restablecerContrasenaAction(
  userId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("usuarios", async (admin) => {
    const perfil = await objetivo(admin, userId);
    if (esError(perfil)) return perfil;
    const temporal = generarContrasena();
    const { error } = await authAdmin.updateUserById(userId, {
      password: temporal,
    });
    if (error) return { error: error.message };
    await actualizar(
      "perfiles",
      { sesiones_revocadas_desde: new Date().toISOString() },
      { user_id: userId },
    );
    await registrarAuditoria(admin, {
      accion: "usuario.restablecer_contrasena",
      entidad: "usuario",
      entidad_id: userId,
      detalle: { email: perfil.email },
    });
    revalidarAdmin();
    return {
      ok: `Contraseña temporal para ${perfil.email}: ${temporal} (compártela de forma segura; no se volverá a mostrar).`,
    };
  });
}
