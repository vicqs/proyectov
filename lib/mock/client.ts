import { createMockAuth } from "./auth";
import { mockDbClient } from "./query-builder";
import { mockStorage } from "./storage";

/**
 * Determina si la aplicación debe operar en modo simulado (sin Supabase
 * real). Se activa automáticamente si faltan las variables de entorno o si
 * contienen los valores de placeholder de `.env.local`, o explícitamente
 * con `USE_MOCK_DB=true`.
 */
export const isMockMode: boolean =
  process.env.USE_MOCK_DB === "true" ||
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder") ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY.includes("placeholder");

interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  remove(name: string, options?: Record<string, unknown>): void;
}

const cookieAdapterNoop: CookieAdapter = {
  get: () => undefined,
  set: () => {},
  remove: () => {},
};

/**
 * Crea un cliente "tipo Supabase" respaldado 100% por datos en memoria.
 * Implementa el subconjunto de la API (`from`, `auth`, `storage`) que usa
 * este proyecto, para poder navegar y probar la app completa sin tener un
 * proyecto Supabase real todavía.
 */
export function createMockSupabaseClient(
  cookies: CookieAdapter = cookieAdapterNoop,
) {
  return {
    from: mockDbClient.from,
    auth: createMockAuth(cookies),
    storage: mockStorage,
  };
}
