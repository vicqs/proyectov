"use server";

import { z } from "zod";
import {
  accionAdmin,
  rolEfectivo,
  type ResultadoAccion,
} from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import {
  actualizar,
  authAdmin,
  insertar,
  leer,
  leerUno,
  listarUsuariosAuth,
} from "../../lib/admin/db";
import { campo, generarContrasena, revalidarAdmin } from "../../lib/admin/util";

const ROLES = ["superadmin", "finanzas", "soporte"] as const;

export async function asignarRolAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("equipo", async (admin) => {
    const parsed = z
      .object({
        email: z.string().email("Correo no válido."),
        rol: z.enum(ROLES),
      })
      .safeParse({
        email: campo(datos, "email").toLowerCase(),
        rol: campo(datos, "rol"),
      });
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const existente = (await listarUsuariosAuth()).find(
      (u) => (u.email ?? "").toLowerCase() === parsed.data.email,
    );
    let userId = existente?.id;
    let temporal: string | null = null;
    if (!userId) {
      temporal = generarContrasena();
      const { data, error } = await authAdmin.createUser({
        email: parsed.data.email,
        password: temporal,
        email_confirm: true,
      });
      if (error || !data.user)
        return { error: error?.message ?? "No se pudo crear la cuenta." };
      userId = data.user.id;
    }
    if (userId === admin.user.id)
      return { error: "No puedes cambiar tu propio rol." };

    const perfil = await leerUno("perfiles", { eq: { user_id: userId } });
    if (perfil)
      await actualizar(
        "perfiles",
        { rol_admin: parsed.data.rol },
        { user_id: userId },
      );
    else
      await insertar("perfiles", {
        user_id: userId,
        email: parsed.data.email,
        rol_admin: parsed.data.rol,
      });

    await registrarAuditoria(admin, {
      accion: "equipo.asignar_rol",
      entidad: "usuario",
      entidad_id: userId,
      detalle: {
        email: parsed.data.email,
        rol: parsed.data.rol,
        cuenta_nueva: !!temporal,
      },
    });
    revalidarAdmin();
    return {
      ok: temporal
        ? `Cuenta creada para ${parsed.data.email}. Contraseña temporal: ${temporal} (no se volverá a mostrar).`
        : `Rol «${parsed.data.rol}» asignado a ${parsed.data.email}.`,
    };
  });
}

export async function quitarRolAction(
  userId: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("equipo", async (admin) => {
    if (userId === admin.user.id)
      return { error: "No puedes quitarte el rol a ti mismo." };
    const perfil = await leerUno("perfiles", { eq: { user_id: userId } });
    if (!perfil?.rol_admin)
      return {
        error: "Este usuario no tiene rol asignado en la base de datos.",
      };
    if (perfil.rol_admin === "superadmin") {
      const perfiles = await leer("perfiles");
      const otros = perfiles.filter(
        (p) => p.rol_admin === "superadmin" && p.user_id !== userId,
      );
      if (otros.length === 0)
        return { error: "Debe quedar al menos un superadministrador." };
    }
    await actualizar("perfiles", { rol_admin: null }, { user_id: userId });
    await registrarAuditoria(admin, {
      accion: "equipo.quitar_rol",
      entidad: "usuario",
      entidad_id: userId,
      detalle: { email: perfil.email, rol: perfil.rol_admin },
    });
    revalidarAdmin();
    // Si aún conserva rol por el entorno, se lo advertimos.
    const sigue = rolEfectivo(perfil.email, null);
    return {
      ok: sigue
        ? "Rol quitado, pero sigue siendo superadmin por ADMIN_GLOBAL_EMAILS."
        : "Rol quitado.",
    };
  });
}
