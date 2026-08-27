"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ServerCrash } from "lucide-react";

/**
 * Error Boundary específico de la vista pública del negocio (`/[slug]`).
 * Captura fallos al consultar Supabase (o al iniciar el pago) sin tumbar
 * el resto de la aplicación, mostrando un mensaje amigable y la opción de
 * reintentar o volver al inicio.
 */
export default function NegocioError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error al cargar el perfil del negocio:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ServerCrash className="h-7 w-7 text-amber-600" />
        </div>
        <h1 className="text-lg font-semibold text-slate-900">
          No pudimos cargar este negocio
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Tuvimos un problema al obtener la información o procesar el pago.
          Puede ser temporal.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
