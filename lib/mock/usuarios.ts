/**
 * Usuarios del modo simulado. Vive aparte de `data.ts` para que el middleware
 * pueda importar los identificadores sin cargar el resto de los datos.
 * Todos los identificadores comienzan con `MOCK_USER_PREFIX`.
 */
export const MOCK_USER_PREFIX = "mock-user-id-";

export const MOCK_USER_ID = "mock-user-id-0001";
export const MOCK_USER_EMAIL = "demo@turismolink.dev";
export const MOCK_USER_PASSWORD = "demo1234";

export const MOCK_USER_ID_2 = "mock-user-id-0002";
export const MOCK_USER_ID_3 = "mock-user-id-0003";

export const MOCK_ADMIN_ID = "mock-user-id-0101";
export const MOCK_FINANZAS_ID = "mock-user-id-0102";
export const MOCK_SOPORTE_ID = "mock-user-id-0103";

export const MOCK_ADMIN_EMAIL = "admin@turismolink.dev";
export const MOCK_ADMIN_PASSWORD = "admin1234";

export interface MockUsuario {
  id: string;
  email: string;
  password: string;
  created_at: string;
  /** Instante del último inicio de sesión (invalida sesiones revocadas). */
  last_sign_in_at: string;
}

const ARRANQUE = new Date().toISOString();

function usuario(id: string, email: string, password: string): MockUsuario {
  return {
    id,
    email,
    password,
    created_at: "2026-01-15T12:00:00.000Z",
    last_sign_in_at: ARRANQUE,
  };
}

/** Mutable: el administrador global puede invitar usuarios nuevos. */
export const mockUsuarios: MockUsuario[] = [
  usuario(MOCK_USER_ID, MOCK_USER_EMAIL, MOCK_USER_PASSWORD),
  usuario(MOCK_USER_ID_2, "kayak@turismolink.dev", "demo1234"),
  usuario(MOCK_USER_ID_3, "cafe@turismolink.dev", "demo1234"),
  usuario(MOCK_ADMIN_ID, MOCK_ADMIN_EMAIL, MOCK_ADMIN_PASSWORD),
  usuario(MOCK_FINANZAS_ID, "finanzas@turismolink.dev", "demo1234"),
  usuario(MOCK_SOPORTE_ID, "soporte@turismolink.dev", "demo1234"),
];
