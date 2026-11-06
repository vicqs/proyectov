"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelarReservaPublicaAction } from "../../../actions/reserva-publica";
import { mensajeErrorUsuario } from "../../../lib/errores";

/** Botón de cancelación con confirmación en dos pasos. */
export default function CancelarReservaButton({ token }: { token: string }) {
  const router = useRouter();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function cancelar() {
    if (pendiente) return;
    setError(null);
    iniciar(async () => {
      try {
        const { error: actionError } = await cancelarReservaPublicaAction(token);
        if (actionError) {
          setError(actionError);
          setConfirmando(false);
          return;
        }
        router.refresh();
      } catch (e) {
        setError(
          mensajeErrorUsuario(
            e,
            "No se pudo cancelar la reserva. Intenta de nuevo.",
          ),
        );
        setConfirmando(false);
      }
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
          className="vuki-btn-danger-outline min-h-12 w-full rounded-2xl text-sm font-semibold"
        >
          Cancelar mi reserva
        </button>
      ) : (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setConfirmando(false)}
            disabled={pendiente}
            className="vuki-btn-secondary min-h-12 flex-1 rounded-2xl"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={cancelar}
            disabled={pendiente}
            className="vuki-btn-danger min-h-12 flex-1 rounded-2xl"
          >
            {pendiente ? "Cancelando..." : "Sí, cancelar"}
          </button>
        </div>
      )}
    </div>
  );
}
