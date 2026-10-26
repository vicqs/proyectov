"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import VLogo from "../components/VLogo";

/**
 * Error Boundary raíz de toda la aplicación. Next.js lo usa cuando un error
 * fatal ocurre incluso en `app/layout.tsx`, por eso debe definir su propio
 * `<html>`/`<body>` (reemplaza completamente al layout raíz mientras se
 * muestra este boundary).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error fatal de la aplicación:", error);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
            <div className="mx-auto mb-4 mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertTriangle
                className="h-7 w-7 text-red-600"
                aria-hidden="true"
              />
            </div>
            <h1 className="text-lg font-semibold text-slate-900">
              Algo salió mal
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Ocurrió un error inesperado. Puedes intentar de nuevo o volver más
              tarde.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-slate-400">
                Código: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              className="vuki-focus mt-6 min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Intentar de nuevo
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
