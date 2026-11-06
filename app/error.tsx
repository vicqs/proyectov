"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import VLogo from "../components/VLogo";
import { mensajeErrorUsuario } from "../lib/errores";

/**
 * Error Boundary de nivel raíz (dentro de `app/layout.tsx`).
 * Captura fallos en páginas públicas (`/`, `/login`, `/recuperar`, `/restablecer`,
 * `/terminos`, `/privacidad`, `/empresa`) o en layouts secundarios sin desmontar
 * las fuentes tipográficas ni el `ToastHost` global.
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error en la aplicación:", error);
  }, [error]);

  const detalle = mensajeErrorUsuario(error, "");

  return (
    <main className="flex min-h-[85svh] items-center justify-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-xl shadow-slate-900/5 sm:px-9">
        <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
        <div className="mx-auto mb-4 mt-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
          <AlertTriangle
            className="h-7 w-7 text-amber-700"
            aria-hidden="true"
          />
        </div>
        <h1 className="font-display text-xl font-bold tracking-tight text-vuki-ink">
          Ocurrió un problema inesperado
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          No pudimos completar la carga de esta página. Puede tratarse de una
          interrupción temporal de conexión.
        </p>
        {detalle && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 break-words"
          >
            {detalle}
          </p>
        )}
        {error.digest && (
          <p className="mt-2 font-mono text-[11px] text-slate-400">
            Código: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="vuki-btn-primary min-h-11 px-5 py-2.5"
          >
            Reintentar
          </button>
          <Link href="/" className="vuki-btn-secondary min-h-11 px-5 py-2.5">
            Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}

