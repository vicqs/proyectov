export const MOCK_SESSION_COOKIE = "ne-mock-session";

import { MOCK_USER_EMAIL, MOCK_USER_ID, MOCK_USER_PASSWORD } from "./data";

interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  remove(name: string, options?: Record<string, unknown>): void;
}

interface MockUser {
  id: string;
  email: string;
}

/**
 * Simula el subconjunto de `supabase.auth` usado en la aplicación
 * (`getUser`, `signInWithPassword`, `signOut`, `admin.getUserById`),
 * guardando la "sesión" en una cookie de texto plano. Solo para desarrollo
 * local sin un proyecto Supabase real.
 *
 * Credenciales de prueba: demo@turismolink.dev / demo1234
 */
export function createMockAuth(cookies: CookieAdapter) {
  return {
    async getUser() {
      const sesion = cookies.get(MOCK_SESSION_COOKIE);
      if (sesion === MOCK_USER_ID) {
        const user: MockUser = { id: MOCK_USER_ID, email: MOCK_USER_EMAIL };
        return { data: { user }, error: null };
      }
      return { data: { user: null }, error: null };
    },

    async signInWithPassword({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) {
      if (email === MOCK_USER_EMAIL && password === MOCK_USER_PASSWORD) {
        cookies.set(MOCK_SESSION_COOKIE, MOCK_USER_ID, { path: "/" });
        const user: MockUser = { id: MOCK_USER_ID, email };
        return { data: { user, session: { user } }, error: null };
      }
      return {
        data: { user: null, session: null },
        error: { message: "Credenciales inválidas (modo simulado)." },
      };
    },

    async signOut() {
      cookies.remove(MOCK_SESSION_COOKIE, { path: "/" });
      return { error: null };
    },

    admin: {
      async getUserById(id: string) {
        if (id === MOCK_USER_ID) {
          return {
            data: { user: { id, email: MOCK_USER_EMAIL } },
            error: null,
          };
        }
        return {
          data: { user: null },
          error: { message: "Usuario no encontrado." },
        };
      },
    },
  };
}
