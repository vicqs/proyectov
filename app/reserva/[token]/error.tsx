"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import VLogo from "../../../components/VLogo";
import { mensajeErrorUsuario } from "../../../lib/errores";

export default function ReservaPublicaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error al consultar la reserva:", error);
  }, [error]);

  const detalle = mensajeErrorUsuario(error, "");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
        <div className="mx-auto mb-4 mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle className="h-7 w-7 text-amber-700" aria-hidden="true" />
        </div>
        <h1 className="font-display text-lg font-bold text-vuki-ink">
          No pudimos cargar tu reserva
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ocurrió un problema temporal al consultar la base de datos. Intenta
          de nuevo en unos segundos.
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
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => reset()}
            className="vuki-btn-primary min-h-12 w-full py-3"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="vuki-btn-secondary w-full py-2.5"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

