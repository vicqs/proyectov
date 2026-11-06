"use client";

import { useEffect } from "react";
import { mensajeErrorUsuario } from "../../../lib/errores";

/**
 * Error Boundary del panel: un fallo en una página no tumba el menú lateral
 * y permite reintentar sin recargar todo el sitio.
 */
export default function EmpresaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el panel de empresa:", error);
  }, [error]);

  const detalle = mensajeErrorUsuario(error, "");

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="font-display text-lg font-bold text-vuki-ink">
        No pudimos cargar esta sección
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Puede ser un problema temporal al consultar la base de datos. Intenta de
        nuevo.
      </p>
      {detalle && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900 break-words"
        >
          {detalle}
        </p>
      )}
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-400">
          Código: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="vuki-btn-primary mt-6 min-h-12 px-5 py-3"
      >
        Reintentar
      </button>
    </main>
  );
}
