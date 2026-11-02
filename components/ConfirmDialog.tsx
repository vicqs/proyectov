"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Diálogo de confirmación genérico (estilo Apple/Airbnb) para acciones
 * destructivas o irreversibles, evitando que un clic accidental elimine
 * datos sin aviso.
 */
export default function ConfirmDialog({
  abierto,
  titulo,
  descripcion,
  textoConfirmar = "Eliminar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const onCancelarRef = useRef(onCancelar);
  useEffect(() => {
    onCancelarRef.current = onCancelar;
  });

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCancelarRef.current();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = scrollAnterior;
      document.removeEventListener("keydown", alPresionarTecla);
      anterior?.focus?.();
    };
  }, [abierto]);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancelar}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-titulo"
            aria-describedby="confirm-dialog-descripcion"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl text-left whitespace-normal"
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id="confirm-dialog-titulo"
                  className="text-base font-bold text-slate-900 break-words whitespace-normal"
                >
                  {titulo}
                </h2>
                <p
                  id="confirm-dialog-descripcion"
                  className="mt-1 text-sm leading-relaxed text-slate-600 break-words whitespace-normal"
                >
                  {descripcion}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <motion.button
                type="button"
                autoFocus
                onClick={onCancelar}
                whileTap={{ scale: 0.96 }}
                className="min-h-10 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 cursor-pointer"
              >
                {textoCancelar}
              </motion.button>
              <motion.button
                type="button"
                onClick={onConfirmar}
                whileTap={{ scale: 0.96 }}
                className="min-h-10 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 cursor-pointer"
              >
                {textoConfirmar}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
