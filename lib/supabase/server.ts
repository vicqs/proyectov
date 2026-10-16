import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "../../types/database";
import { createMockSupabaseClient, isMockMode } from "../mock/client";

/**
 * Cliente de Supabase para Server Components / Server Actions que respeta
 * la sesión del usuario (cookies) y por lo tanto las políticas de Row Level
 * Security (RLS). A diferencia de `lib/supabase.ts` (service role), este
 * cliente usa la anon key y solo puede ver/editar lo que el usuario autenticado
 * tiene permitido.
 *
 * Si no hay credenciales reales de Supabase configuradas (`isMockMode`), se
 * devuelve un cliente simulado con datos en memoria, incluyendo autenticación
 * simulada (ver `lib/mock/auth.ts` para las credenciales de prueba).
 */
export const createSupabaseServerClient = cache(crearCliente);

async function crearCliente() {
  const cliente = await crearClienteBase();
  memoizarGetUser(cliente);
  return cliente;
}

/**
 * Dentro de una misma request, layout y página piden el usuario varias
 * veces (cada llamada real es un viaje de red a Supabase Auth). Se memoiza
 * la promesa y se invalida al iniciar/cerrar sesión.
 */
function memoizarGetUser(
  cliente: Awaited<ReturnType<typeof crearClienteBase>>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = cliente.auth as any;
  const original = auth.getUser.bind(auth);
  let pendiente: Promise<unknown> | null = null;
  auth.getUser = (...args: unknown[]) => {
    pendiente ??= original(...args);
    return pendiente;
  };
  for (const metodo of ["signInWithPassword", "signOut"]) {
    if (typeof auth[metodo] !== "function") continue;
    const fn = auth[metodo].bind(auth);
    auth[metodo] = (...args: unknown[]) => {
      pendiente = null;
      return fn(...args);
    };
  }
}

async function crearClienteBase() {
  const cookieStore = await cookies();

  if (isMockMode) {
    return createMockSupabaseClient({
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...(options as CookieOptions) });
        } catch {
          // Ignorable si se llama desde un Server Component sin permiso de escritura.
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: "", ...(options as CookieOptions) });
        } catch {
          // Ver comentario anterior.
        }
      },
    }) as unknown as ReturnType<typeof createServerClient<Database>>;
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Se puede ignorar si se llama desde un Server Component sin
            // posibilidad de escribir cookies (el middleware se encarga
            // de refrescar la sesión en ese caso).
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Ver comentario anterior.
          }
        },
      },
    },
  );
}
