/**
 * Usuarios del modo simulado. Vive aparte de `data.ts` para que el middleware
 * pueda importar los identificadores sin cargar el resto de los datos.
 * Todos los identificadores comienzan con `MOCK_USER_PREFIX`.
 *
 * Las credenciales NO están en el código: se leen de las variables de entorno
 * MOCK_C1..MOCK_C6 (formato `correo:clave`, ver `.env.local`). Si una falta,
 * esa cuenta queda con una clave aleatoria que nadie conoce (inutilizable).
 */
export const MOCK_USER_PREFIX = "mock-user-id-";

export const MOCK_USER_ID = "mock-user-id-0001";
export const MOCK_USER_ID_2 = "mock-user-id-0002";
export const MOCK_USER_ID_3 = "mock-user-id-0003";

export const MOCK_ADMIN_ID = "mock-user-id-0101";
export const MOCK_FINANZAS_ID = "mock-user-id-0102";
export const MOCK_SOPORTE_ID = "mock-user-id-0103";

function cuenta(ranura: number): { correo: string; clave: string } {
  const valor = process.env[`MOCK_C${ranura}`] ?? "";
  const i = valor.indexOf(":");
  if (i > 0 && i < valor.length - 1) {
    return { correo: valor.slice(0, i), clave: valor.slice(i + 1) };
  }
  return {
    correo: `sin-configurar-${ranura}@invalid.local`,
    clave: crypto.randomUUID(),
  };
}

const C1 = cuenta(1);
const C2 = cuenta(2);
const C3 = cuenta(3);
const C4 = cuenta(4);
const C5 = cuenta(5);
const C6 = cuenta(6);

export const MOCK_USER_EMAIL = C1.correo;
export const MOCK_USER_EMAIL_2 = C2.correo;
export const MOCK_USER_EMAIL_3 = C3.correo;
export const MOCK_ADMIN_EMAIL = C4.correo;
export const MOCK_FINANZAS_EMAIL = C5.correo;
export const MOCK_SOPORTE_EMAIL = C6.correo;

export interface MockUsuario {
  id: string;
  email: string;
  password: string;
  created_at: string;
  /** Instante del último inicio de sesión (invalida sesiones revocadas). */
  last_sign_in_at: string;
}

const ARRANQUE = new Date().toISOString();

function usuario(
  id: string,
  c: { correo: string; clave: string },
): MockUsuario {
  return {
    id,
    email: c.correo,
    password: c.clave,
    created_at: "2026-01-15T12:00:00.000Z",
    last_sign_in_at: ARRANQUE,
  };
}

/** Mutable: el administrador global puede invitar usuarios nuevos. */
export const mockUsuarios: MockUsuario[] = [
  usuario(MOCK_USER_ID, C1),
  usuario(MOCK_USER_ID_2, C2),
  usuario(MOCK_USER_ID_3, C3),
  usuario(MOCK_ADMIN_ID, C4),
  usuario(MOCK_FINANZAS_ID, C5),
  usuario(MOCK_SOPORTE_ID, C6),
];
