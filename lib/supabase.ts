import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { createMockSupabaseClient, isMockMode } from "./mock/client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isMockMode && (!supabaseUrl || !supabaseServiceRoleKey)) {
  throw new Error(
    "Faltan variables de entorno de Supabase: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridas.",
  );
}

if (isMockMode) {
  console.warn(
    "⚠ Ejecutando en modo SIMULADO (sin Supabase real). Los datos se guardan solo en memoria y se pierden al reiniciar. Define credenciales reales en .env.local y USE_MOCK_DB=false para desactivarlo.",
  );
}

/**
 * Cliente de Supabase para uso exclusivo en el servidor (Server Components,
 * Route Handlers). Usa la Service Role Key, por lo que NUNCA debe importarse
 * en un componente cliente ("use client"). Si no hay credenciales reales
 * configuradas, se usa un cliente simulado (`isMockMode`) con datos en
 * memoria para poder probar la aplicación completa localmente.
 */
export const supabaseAdmin: SupabaseClient<Database> = isMockMode
  ? (createMockSupabaseClient() as unknown as SupabaseClient<Database>)
  : createClient<Database>(supabaseUrl!, supabaseServiceRoleKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
