"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Loader2 } from "lucide-react";

interface ConfirmDialogProps {
  abierto: boolean;
  titulo: string;
  descripcion: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  cargando?: boolean;
  textoCargando?: string;
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
  cargando = false,
  textoCargando,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const baseId = useId();
  const tituloId = `${baseId}-titulo`;
  const descripcionId = `${baseId}-descripcion`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCancelarRef = useRef(onCancelar);
  const cargandoRef = useRef(cargando);
  useEffect(() => {
    onCancelarRef.current = onCancelar;
    cargandoRef.current = cargando;
  });

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !cargandoRef.current) {
        onCancelarRef.current();
        return;
      }
      if (evento.key === "Tab" && dialogRef.current) {
        const botones = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            "button:not([disabled])",
          ),
        );
        if (botones.length === 0) return;
        const primero = botones[0];
        const ultimo = botones[botones.length - 1];
        if (evento.shiftKey && document.activeElement === primero) {
          evento.preventDefault();
          ultimo.focus();
        } else if (!evento.shiftKey && document.activeElement === ultimo) {
          evento.preventDefault();
          primero.focus();
        }
      }
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
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => {
              if (!cargando) onCancelar();
            }}
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-busy={cargando}
            aria-labelledby={tituloId}
            aria-describedby={descripcionId}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[70] w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-left whitespace-normal"
          >
            <div className="flex items-start gap-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2
                  id={tituloId}
                  className="font-display text-base font-bold text-vuki-ink break-words whitespace-normal"
                >
                  {titulo}
                </h2>
                <p
                  id={descripcionId}
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
                disabled={cargando}
                onClick={onCancelar}
                whileTap={{ scale: 0.96 }}
                className="vuki-btn-secondary transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              >
                {textoCancelar}
              </motion.button>
              <motion.button
                type="button"
                disabled={cargando}
                onClick={onConfirmar}
                whileTap={{ scale: 0.96 }}
                className="vuki-btn-danger inline-flex items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {cargando && (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                )}
                {cargando
                  ? (textoCargando ?? `${textoConfirmar}...`)
                  : textoConfirmar}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
