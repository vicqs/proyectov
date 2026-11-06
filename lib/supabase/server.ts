import "server-only";

import { cache } from "react";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./config";

export const createSupabaseServerClient = cache(async () => {
  const cookieStore = await cookies();
  function setCookie(name: string, value: string, options?: CookieOptions) {
    try {
      cookieStore.set({ name, value, ...options });
    } catch (error) {
      if (error instanceof Error && error.message.includes("Cookies can only be modified")) {
        console.debug("[supabase] Cookies de solo lectura; el middleware refresca la sesion.");
        return;
      }
      throw error;
    }
  }

  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Falta la configuracion publica de Supabase.");
  return createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        for (const { name, value, options } of values) setCookie(name, value, options);
      },
    },
  });
});

export { createSupabaseServerClient as createClient };
export type ServerSupabaseClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;
