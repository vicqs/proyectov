"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ServerCrash } from "lucide-react";
import VLogo from "../../components/VLogo";

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
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
        <div className="mx-auto mb-4 mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <ServerCrash className="h-7 w-7 text-amber-700" aria-hidden="true" />
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
            className="vuki-focus min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
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
