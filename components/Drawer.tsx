"use client";

import { useEffect, useId, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import AnimatedIconButton from "./AnimatedIconButton";

const SELECTOR_ENFOCABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface DrawerProps {
  abierto: boolean;
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  ancho?: string;
}

/**
 * Slide-over lateral derecho reutilizable (estilo Apple/Airbnb) para
 * formularios de crear/editar dentro del panel de empresa. Reemplaza
 * los formularios incrustados en la página por un panel flotante con
 * trampa de foco completa (Tab/Shift+Tab y Escape) y overlay difuminado.
 */
export default function Drawer({
  abierto,
  titulo,
  onClose,
  children,
  ancho = "max-w-md",
}: DrawerProps) {
  const tituloId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const enfoque = window.setTimeout(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const preferido = panel.querySelector<HTMLElement>(
        "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]):not([aria-label='Cerrar'])",
      );
      const respaldo = panel.querySelector<HTMLElement>(SELECTOR_ENFOCABLES);
      (preferido ?? respaldo)?.focus();
    }, 150);

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (evento.key === "Tab" && panelRef.current) {
        const enfocables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES),
        );
        if (enfocables.length === 0) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
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
      window.clearTimeout(enfoque);
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
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 32,
              mass: 0.8,
            }}
            className={`fixed right-0 top-0 z-50 flex h-full w-full ${ancho} flex-col bg-white shadow-2xl whitespace-normal`}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
              className="flex items-center justify-between border-b border-slate-100 px-6 py-5"
            >
              <h2
                id={tituloId}
                className="font-display text-lg font-bold tracking-tight text-vuki-ink"
              >
                {titulo}
              </h2>
              <AnimatedIconButton
                variante="cerrar"
                onClick={onClose}
                aria-label="Cerrar"
                className="text-slate-500"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </AnimatedIconButton>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25, ease: "easeOut" }}
              className="flex-1 overflow-y-auto px-6 py-6"
            >
              {children}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
