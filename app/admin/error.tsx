"use client";

import { useEffect } from "react";

/**
 * Error Boundary del panel: un fallo en una página no tumba el menú lateral
 * y permite reintentar sin recargar todo el sitio.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en el panel de administración:", error);
  }, [error]);

  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <h1 className="text-lg font-semibold text-slate-900">
        No pudimos cargar esta sección
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Puede ser un problema temporal. Intenta de nuevo.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-700"
      >
        Reintentar
      </button>
    </main>
  );
}
