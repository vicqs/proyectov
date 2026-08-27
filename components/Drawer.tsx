"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import AnimatedIconButton from "./AnimatedIconButton";

interface DrawerProps {
  abierto: boolean;
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * Slide-over lateral derecho reutilizable (estilo Apple/Airbnb) para
 * formularios de crear/editar dentro del panel `/demo/admin`. Reemplaza
 * los formularios incrustados en la página por un panel flotante con
 * trampa de foco básica (Escape cierra) y overlay difuminado.
 */
export default function Drawer({
  abierto,
  titulo,
  onClose,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [abierto, onClose]);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div
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
            aria-label={titulo}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 280,
              damping: 32,
              mass: 0.8,
            }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.25, ease: "easeOut" }}
              className="flex items-center justify-between border-b border-slate-100 px-6 py-5"
            >
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                {titulo}
              </h2>
              <AnimatedIconButton
                variante="cerrar"
                onClick={onClose}
                aria-label="Cerrar"
                className="text-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400"
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
