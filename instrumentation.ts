/**
 * Se ejecuta una sola vez al arrancar el servidor (no en cada recarga de
 * módulos ni en cada ruta), por eso el aviso del modo simulado vive aquí.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { isMockMode } = await import("./lib/mock/client");
  if (isMockMode) {
    console.warn(
      "⚠ Ejecutando en modo SIMULADO (sin Supabase real). Los datos se guardan solo en memoria y se pierden al reiniciar. Define credenciales reales en .env.local y USE_MOCK_DB=false para desactivarlo.",
    );
  }
}
