"use client";

import { useState, useTransition } from "react";
import {
  cancelarPagoSimuladoAction,
  confirmarPagoSimuladoAction,
} from "../../../actions/pago-simulado";
import { esRedireccionNext, mensajeErrorUsuario } from "../../../lib/errores";

export default function BotonesPagoSimulado({
  reservaId,
  token,
}: {
  reservaId: string;
  token: string;
}) {
  const [accionActiva, setAccionActiva] = useState<"confirmar" | "cancelar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendiente, iniciar] = useTransition();

  function ejecutar(tipo: "confirmar" | "cancelar") {
    setError(null);
    setAccionActiva(tipo);
    iniciar(async () => {
      try {
        if (tipo === "confirmar") {
          await confirmarPagoSimuladoAction(reservaId, token);
        } else {
          await cancelarPagoSimuladoAction(reservaId, token);
        }
      } catch (e) {
        if (esRedireccionNext(e)) throw e;
        setAccionActiva(null);
        setError(
          mensajeErrorUsuario(
            e,
            "No se pudo procesar la operación. Intenta de nuevo.",
          ),
        );
      }
    });
  }

  return (
    <div>
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-800"
        >
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={pendiente}
        onClick={() => ejecutar("confirmar")}
        className="vuki-btn-primary min-h-12 w-full py-3"
      >
        {pendiente && accionActiva === "confirmar"
          ? "Confirmando pago..."
          : "Confirmar pago (simulado)"}
      </button>
      <button
        type="button"
        disabled={pendiente}
        onClick={() => ejecutar("cancelar")}
        className="vuki-btn-secondary mt-2 min-h-12 w-full py-2.5"
      >
        {pendiente && accionActiva === "cancelar" ? "Cancelando..." : "Cancelar"}
      </button>
    </div>
  );
}

