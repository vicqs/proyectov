"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";

interface ToastItem {
  id: number;
  mensaje: string;
  tipo: "exito" | "error";
}

let toasts: ToastItem[] = [];
let siguienteId = 1;
const listeners = new Set<() => void>();
const TOASTS_VACIOS: ToastItem[] = [];

function emitir() {
  listeners.forEach((callback) => callback());
}

function agregarToast(mensaje: string, tipo: ToastItem["tipo"]) {
  const id = siguienteId++;
  toasts = [...toasts, { id, mensaje, tipo }];
  emitir();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emitir();
  }, 3200);
}

/** API pública para disparar notificaciones tipo toast desde cualquier componente. */
export const toast = {
  success: (mensaje: string) => agregarToast(mensaje, "exito"),
  error: (mensaje: string) => agregarToast(mensaje, "error"),
};

function suscribirse(callback: () => void) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Contenedor de toasts. Debe montarse una sola vez (ej. en el layout del
 * admin) para mostrar las notificaciones de crear/editar/eliminar.
 */
export function ToastViewport() {
  const items = useSyncExternalStore(
    suscribirse,
    () => toasts,
    () => TOASTS_VACIOS,
  );

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      <AnimatePresence>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-slate-900/95 px-4 py-3 text-sm font-medium text-white shadow-xl backdrop-blur-sm"
          >
            {item.tipo === "exito" ? (
              <CheckCircle2
                className="h-4 w-4 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
            ) : (
              <XCircle
                className="h-4 w-4 shrink-0 text-red-400"
                aria-hidden="true"
              />
            )}
            {item.mensaje}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
