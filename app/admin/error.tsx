"use client";

import { useEffect } from "react";
import Link from "next/link";
import { mensajeErrorUsuario } from "../../lib/errores";

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

  const detalle = mensajeErrorUsuario(error, "");

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="font-display text-xl font-bold text-vuki-ink">
        No se pudo cargar esta sección
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        Ocurrió un error al consultar los datos. Intenta de nuevo o vuelve al
        panel.
      </p>
      {detalle && (
        <p
          role="alert"
          className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 break-words"
        >
          {detalle}
        </p>
      )}
      {error.digest && (
        <p className="mt-2 font-mono text-[11px] text-slate-400">
          Código: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="vuki-btn-primary min-h-11 px-4 py-2.5"
        >
          Reintentar
        </button>
        <Link
          href="/admin"
          className="vuki-btn-secondary min-h-11 px-4 py-2.5"
        >
          Ir al panel
        </Link>
      </div>
    </div>
  );
}
