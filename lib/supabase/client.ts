"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getSupabasePublicConfig } from "./config";

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createSupabaseBrowserClient() {
  const config = getSupabasePublicConfig();
  if (!config) throw new Error("Supabase no esta configurado para el navegador.");
  client ??= createBrowserClient<Database>(config.url, config.anonKey);
  return client;
}

export { createSupabaseBrowserClient as createClient };
