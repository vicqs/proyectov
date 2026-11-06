/**
 * Utilidades centralizadas de resiliencia de red y sanitización de errores
 * para garantizar que el usuario nunca vea trazas técnicas de Supabase/Postgres
 * ni pierda su trabajo ante caídas temporales de conexión.
 */

const PATRON_ERROR_TECNICO =
  /^\[[\w_]+\]\s|permission denied|violates row-level security|violates foreign key|violates check constraint|duplicate key value|syntax error|null value in column|relation ".*" does not exist|PGRST\d+|JWT|schema cache|fetch failed|Failed to fetch|NetworkError|Load failed|ECONNRESET|ETIMEDOUT/i;

const PATRON_ERROR_RED =
  /Failed to fetch|fetch failed|NetworkError|Load failed|network request failed|ECONNRESET|ETIMEDOUT|ENOTFOUND|ERR_INTERNET_DISCONNECTED|offline/i;

export const MENSAJE_ERROR_RED =
  "No pudimos conectar con el servidor. Verifica tu conexión a internet e inténtalo de nuevo.";

/**
 * Detecta si una excepción corresponde a una redirección o 404 interno de Next.js
 * (`redirect()` o `notFound()`), los cuales siempre deben relanzarse.
 */
export function esRedireccionNext(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest === "string") {
    return (
      digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")
    );
  }
  const message = (error as { message?: unknown }).message;
  return (
    typeof message === "string" &&
    (message === "NEXT_REDIRECT" || message === "NEXT_NOT_FOUND")
  );
}

/**
 * Detecta si un error fue ocasionado por una caída de red o desconexión.
 */
export function esErrorRed(error: unknown): boolean {
  if (!error) return false;
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  return PATRON_ERROR_RED.test(msg);
}

/**
 * Traduce cualquier error (de red, Supabase/Postgres o inesperado) a un mensaje
 * claro y seguro en español para mostrar en la interfaz de usuario.
 */
export function mensajeErrorUsuario(
  error: unknown,
  porDefecto = "Ocurrió un error inesperado. Intenta de nuevo.",
): string {
  if (esErrorRed(error)) {
    return MENSAJE_ERROR_RED;
  }

  const msg =
    error instanceof Error
      ? error.message.trim()
      : typeof error === "string"
        ? error.trim()
        : "";

  if (!msg) return porDefecto;

  if (/demasiados tickets abiertos/i.test(msg)) {
    return "Tienes demasiados tickets abiertos. Espera la respuesta de soporte.";
  }

  if (PATRON_ERROR_TECNICO.test(msg)) {
    if (/permission denied|violates row-level security/i.test(msg)) {
      return "No tienes permisos para realizar esta operación o tu sesión expiró.";
    }
    if (/duplicate key value/i.test(msg)) {
      return "Ya existe un registro con esos datos. Verifica la información e intenta de nuevo.";
    }
    if (/violates foreign key/i.test(msg)) {
      return "No se puede completar la acción porque el registro está vinculado a otros datos.";
    }
    return porDefecto;
  }

  return msg;
}

/**
 * Envuelve una Server Action utilizada con `useActionState` para interceptar
 * caídas de red en el navegador sin desmontar el formulario hacia `error.tsx`.
 */
export function conResilienciaRed<State, Payload = FormData>(
  accion: (prev: State, payload: Payload) => Promise<State>,
  mensajeRed: string = MENSAJE_ERROR_RED,
): (prev: State, payload: Payload) => Promise<State> {
  return async (prev: State, payload: Payload): Promise<State> => {
    try {
      return await accion(prev, payload);
    } catch (error) {
      if (esRedireccionNext(error)) {
        throw error;
      }
      return {
        error: mensajeErrorUsuario(error, mensajeRed),
      } as unknown as State;
    }
  };
}

