"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarReservaPublicaAction } from "../../../actions/reserva-publica";

/** Botón de cancelación con confirmación en dos pasos. */
export default function CancelarReservaButton({ token }: { token: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function cancelar() {
    setError(null);
    iniciar(async () => {
      const { error } = await cancelarReservaPublicaAction(token);
      if (error) {
        setError(error);
        setConfirmando(false);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="mt-6">
      {error && (
        <p role="alert" className="mb-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {!confirmando ? (
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          className="vuki-focus h-12 w-full rounded-2xl border border-red-200 text-sm font-semibold text-red-600 transition hover:bg-red-50"
        >
          Cancelar mi reserva
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pendiente}
            className="vuki-focus h-12 flex-1 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={pendiente}
            className="vuki-focus h-12 flex-1 rounded-2xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60"
          >
            {pendiente ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}
