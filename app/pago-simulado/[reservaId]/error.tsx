"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import VLogo from "../../../components/VLogo";
import { mensajeErrorUsuario } from "../../../lib/errores";

export default function PagoSimuladoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en la pasarela de pago simulada:", error);
  }, [error]);

  const detalle = mensajeErrorUsuario(error, "");

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
        <div className="mx-auto mb-4 mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
          <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="font-display text-lg font-bold text-vuki-ink">
          No se pudo procesar el pago
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Ocurrió un problema al confirmar o cancelar la reserva.
        </p>
        {detalle && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 break-words"
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
            Intentar de nuevo
          </button>
          <Link
            href="/"
            className="vuki-btn-secondary w-full py-2.5"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

