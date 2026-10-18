"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isMockMode } from "../lib/mock/client";
import { mockUsuarios } from "../lib/mock/usuarios";
import { obtenerEmpresaAutenticada } from "../lib/empresa";
import { rutaPanelEmpresa } from "../lib/rutas-empresa";
import { obtenerPerfil } from "../lib/sesion";
import { rolEfectivo } from "../lib/admin/auth";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export interface LoginActionState {
  error?: string;
}

/**
 * Server Action invocada por el formulario de `/login` (vía `useActionState`).
 * Autentica contra Supabase Auth y redirige al `/{slug}/admin` del usuario.
 */
export async function loginAction(
  _prevState: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const perfil = user ? await obtenerPerfil(user.id) : null;
  if (perfil?.bloqueado) {
    await supabase.auth.signOut();
    return {
      error: "Tu cuenta está bloqueada. Contacta a soporte de Turismo Link.",
    };
  }
  if (rolEfectivo(user?.email, perfil?.rol_admin)) redirect("/admin");

  const contexto = await obtenerEmpresaAutenticada();
  if ("error" in contexto) return { error: contexto.error };
  redirect(rutaPanelEmpresa(contexto.negocio.slug));
}

/** Server Action para cerrar sesión desde el layout del dashboard. */
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export interface RecuperacionState {
  error?: string;
  ok?: boolean;
  /** Solo en modo simulado y desarrollo: enlace directo en lugar del correo. */
  enlaceDev?: string;
}

/**
 * Paso 1 de "Olvidé mi contraseña". Siempre responde lo mismo exista o no el
 * correo, para no revelar qué cuentas están registradas.
 */
export async function solicitarRecuperacionAction(
  _previo: RecuperacionState,
  formData: FormData,
): Promise<RecuperacionState> {
  const parsed = z
    .string()
    .trim()
    .toLowerCase()
    .email("Correo inválido")
    .safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Correo inválido" };
  }
  const email = parsed.data;

  if (isMockMode) {
    const existe = mockUsuarios.some((u) => u.email === email);
    const dev = process.env.NODE_ENV !== "production" && existe;
    return {
      ok: true,
      enlaceDev: dev
        ? `/auth/callback?mock_recovery=${encodeURIComponent(email)}`
        : undefined,
    };
  }

  const base = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${base}/auth/callback`,
  });
  if (error) console.error("Error al solicitar recuperación:", error.message);
  return { ok: true };
}

export interface NuevaContrasenaState {
  error?: string;
  ok?: boolean;
}

const nuevaContrasenaSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .max(72, "La contraseña es demasiado larga"),
    confirmar: z.string(),
  })
  .refine((v) => v.password === v.confirmar, {
    message: "Las contraseñas no coinciden",
    path: ["confirmar"],
  });

/** Paso 2: con la sesión de recuperación abierta por el enlace del correo. */
export async function actualizarContrasenaAction(
  _previo: NuevaContrasenaState,
  formData: FormData,
): Promise<NuevaContrasenaState> {
  const parsed = nuevaContrasenaSchema.safeParse({
    password: formData.get("password"),
    confirmar: formData.get("confirmar"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error:
        "El enlace venció. Solicita uno nuevo desde «Olvidé mi contraseña».",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "No se pudo actualizar la contraseña. Intenta de nuevo." };
  }
  await supabase.auth.signOut();
  return { ok: true };
}
