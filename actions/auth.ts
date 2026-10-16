"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { isMockMode } from "../lib/mock/client";
import { MOCK_USER_EMAIL, MOCK_USER_PASSWORD } from "../lib/mock/data";

const loginSchema = z.object({
  email: z.string().email("Correo inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export interface LoginActionState {
  error?: string;
}

/**
 * Server Action invocada por el formulario de `/login` (vía `useActionState`).
 * Autentica contra Supabase Auth y, si tiene éxito, redirige a `/admin`.
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

  redirect("/admin");
}

/**
 * Inicio rápido SOLO para desarrollo/demo: inicia la sesión simulada sin
 * pasar por el formulario. Se rechaza fuera del modo simulado o en
 * producción, para que nunca exista un acceso sin credenciales reales.
 */
export async function inicioRapidoAction() {
  if (!isMockMode || process.env.NODE_ENV === "production") {
    redirect("/login");
  }
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({
    email: MOCK_USER_EMAIL,
    password: MOCK_USER_PASSWORD,
  });
  redirect("/admin");
}

/** Server Action para cerrar sesión desde el layout del dashboard. */
export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
