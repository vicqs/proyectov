import { getSupabasePublicConfig } from "./lib/supabase/config";

/**
 * Se ejecuta una sola vez al arrancar el servidor (no en cada recarga de
 * módulos ni en cada ruta).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const config = getSupabasePublicConfig();
  if (!config) {
    console.error(
      "⚠ Falta la configuración de Supabase. Revisa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local.",
    );
  }
}
