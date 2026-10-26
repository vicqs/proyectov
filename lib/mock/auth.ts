import { MOCK_USER_PREFIX, mockUsuarios, type MockUsuario } from "./usuarios";

export const MOCK_SESSION_COOKIE = "ne-mock-session";

interface CookieAdapter {
  get(name: string): string | undefined;
  set(name: string, value: string, options?: Record<string, unknown>): void;
  remove(name: string, options?: Record<string, unknown>): void;
}

interface MockUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string;
}

function publico(u: MockUsuario): MockUser {
  return {
    id: u.id,
    email: u.email,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  };
}

/**
 * Simula el subconjunto de `supabase.auth` usado en la aplicación, guardando
 * la "sesión" en una cookie con el id del usuario. Solo para desarrollo local
 * sin un proyecto Supabase real. Credenciales en `CREDENCIALES_LOCALES.md`.
 */
export function createMockAuth(cookies: CookieAdapter) {
  return {
    async getUser() {
      const sesion = cookies.get(MOCK_SESSION_COOKIE);
      if (sesion?.startsWith(MOCK_USER_PREFIX)) {
        const u = mockUsuarios.find((x) => x.id === sesion);
        if (u) return { data: { user: publico(u) }, error: null };
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
      const u = mockUsuarios.find(
        (x) =>
          x.email === email.trim().toLowerCase() && x.password === password,
      );
      if (u) {
        u.last_sign_in_at = new Date().toISOString();
        cookies.set(MOCK_SESSION_COOKIE, u.id, { path: "/" });
        const user = publico(u);
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

    async resetPasswordForEmail(email: string) {
      console.info(`[mock auth] Correo de recuperación simulado para ${email}`);
      return { data: {}, error: null };
    },

    /** Cambia la contraseña del usuario con sesión activa (flujo de recuperación). */
    async updateUser({ password }: { password?: string }) {
      const sesion = cookies.get(MOCK_SESSION_COOKIE);
      const u = mockUsuarios.find((x) => x.id === sesion);
      if (!u) {
        return {
          data: { user: null },
          error: { message: "Sesión de recuperación no válida." },
        };
      }
      if (password) u.password = password;
      return { data: { user: publico(u) }, error: null };
    },

    /** Solo mock: abre la "sesión de recuperación" de un correo conocido. */
    async iniciarRecuperacionMock(email: string) {
      const u = mockUsuarios.find(
        (x) => x.email === email.trim().toLowerCase(),
      );
      if (!u) return false;
      cookies.set(MOCK_SESSION_COOKIE, u.id, { path: "/" });
      return true;
    },

    admin: {
      async getUserById(id: string) {
        const u = mockUsuarios.find((x) => x.id === id);
        if (u) return { data: { user: publico(u) }, error: null };
        return {
          data: { user: null },
          error: { message: "Usuario no encontrado." },
        };
      },

      async listUsers(opts?: { page?: number; perPage?: number }) {
        const page = opts?.page ?? 1;
        const perPage = opts?.perPage ?? 50;
        const users = mockUsuarios
          .slice((page - 1) * perPage, page * perPage)
          .map(publico);
        return { data: { users }, error: null };
      },

      async createUser({
        email,
        password,
      }: {
        email: string;
        password?: string;
        email_confirm?: boolean;
      }) {
        const correo = email.trim().toLowerCase();
        if (mockUsuarios.some((x) => x.email === correo)) {
          return {
            data: { user: null },
            error: { message: "Ya existe un usuario con ese correo." },
          };
        }
        const ahora = new Date().toISOString();
        const u: MockUsuario = {
          id: `${MOCK_USER_PREFIX}${String(Date.now()).slice(-8)}${Math.floor(Math.random() * 100)}`,
          email: correo,
          password: password ?? "demo1234",
          created_at: ahora,
          last_sign_in_at: ahora,
        };
        mockUsuarios.push(u);
        return { data: { user: publico(u) }, error: null };
      },

      async inviteUserByEmail(email: string) {
        const r = await createMockAuth(cookies).admin.createUser({ email });
        if (!r.error) {
          console.info(`[mock auth] Invitación simulada enviada a ${email}`);
        }
        return r;
      },

      /** El bloqueo real se gestiona con `perfiles.bloqueado`; aquí solo se aplican correo y contraseña. */
      async updateUserById(id: string, atributos: Record<string, unknown>) {
        const u = mockUsuarios.find((x) => x.id === id);
        if (!u) {
          return {
            data: { user: null },
            error: { message: "Usuario no encontrado." },
          };
        }
        if (typeof atributos.password === "string") {
          u.password = atributos.password;
        }
        if (typeof atributos.email === "string") {
          u.email = atributos.email.trim().toLowerCase();
        }
        return { data: { user: publico(u) }, error: null };
      },
    },
  };
}
