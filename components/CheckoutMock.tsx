"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import type { MockServicio } from "../lib/mockData";

interface CheckoutMockProps {
  servicio: MockServicio;
  negocioNombre: string;
  onClose: () => void;
}

/**
 * Modal de checkout simulado para el perfil público de demo (`/[slug]`).
 * No procesa pagos reales: simula una confirmación tras un breve retraso.
 */
export default function CheckoutMock({
  servicio,
  negocioNombre,
  onClose,
}: CheckoutMockProps) {
  const [confirmando, setConfirmando] = useState(false);
  const [confirmado, setConfirmado] = useState(false);

  const handleConfirmar = () => {
    setConfirmando(true);
    setTimeout(() => {
      setConfirmando(false);
      setConfirmado(true);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 sm:items-center">
      <div className="w-full max-w-md rounded-b-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {confirmado ? "¡Reserva confirmada!" : "Confirmar reserva"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {confirmado ? (
          <div className="mt-6 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500" />
            <p className="text-sm text-slate-600">
              Tu reserva de <strong>{servicio.nombre}</strong> con{" "}
              {negocioNombre} fue registrada (simulación de demo).
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              Listo
            </button>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-slate-500">
              {servicio.nombre} · {negocioNombre}
            </p>
            <p className="mt-4 text-2xl font-bold text-slate-900">
              ${servicio.precioUsd.toFixed(2)}
            </p>

            <button
              type="button"
              onClick={handleConfirmar}
              disabled={confirmando}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white disabled:opacity-70"
            >
              {confirmando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Confirmar y pagar (simulado)"
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
