"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, KeyRound, X } from "lucide-react";
import AnimatedIconButton from "../AnimatedIconButton";
import type {
  ContrasenaTemporalInfo,
  ResultadoAccion,
} from "../../lib/admin/auth";

let actual: ContrasenaTemporalInfo | null = null;
const listeners = new Set<() => void>();

function emitir() {
  listeners.forEach((cb) => cb());
}

function suscribirse(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function mostrarContrasenaTemporal(info: ContrasenaTemporalInfo) {
  actual = info;
  emitir();
}

export function cerrarContrasenaTemporal() {
  actual = null;
  emitir();
}

/**
 * Extrae la información de contraseña temporal desde `estado.contrasenaTemporal`
 * o, como respaldo, desde el texto `estado.ok`.
 */
export function extraerContrasenaTemporal(
  estado: ResultadoAccion,
): ContrasenaTemporalInfo | null {
  if (estado.contrasenaTemporal) {
    return estado.contrasenaTemporal;
  }
  if (!estado.ok) return null;
  const matchPassword = estado.ok.match(
    /(?:contraseña temporal:?|temporal:?)\s*([^\s(),.]+)/i,
  );
  if (!matchPassword?.[1]) return null;
  const matchEmail = estado.ok.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  );
  return {
    email: matchEmail?.[0] ?? "el usuario",
    password: matchPassword[1],
  };
}

export function ContrasenaTemporalViewport() {
  const info = useSyncExternalStore(
    suscribirse,
    () => actual,
    () => null,
  );
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setCopiado(false);
    if (!info) return;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape") cerrarContrasenaTemporal();
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = scrollAnterior;
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [info]);

  async function copiar() {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.password);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Si el navegador bloquea el portapapeles, el texto sigue seleccionable.
    }
  }

  return (
    <AnimatePresence>
      {info && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[90] bg-slate-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-contrasena-temporal-titulo"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed left-1/2 top-1/2 z-[100] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
                  <KeyRound className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2
                    id="modal-contrasena-temporal-titulo"
                    className="font-display text-base font-bold text-slate-900"
                  >
                    Contraseña temporal generada
                  </h2>
                  <p className="truncate text-xs font-medium text-slate-500">
                    {info.email}
                  </p>
                </div>
              </div>
              <AnimatedIconButton
                variante="cerrar"
                onClick={cerrarContrasenaTemporal}
                aria-label="Cerrar modal"
                title="Cerrar"
                className="vuki-focus -mr-1 -mt-1 h-9 w-9 shrink-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </AnimatedIconButton>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {info.contexto ??
                "Compártela de forma segura con el usuario. Por seguridad, esta contraseña no se volverá a mostrar al cerrar esta ventana."}
            </p>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-800">
                Nueva contraseña temporal
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <code className="select-all break-all font-mono text-lg font-bold tracking-wide text-slate-900">
                  {info.password}
                </code>
                <button
                  type="button"
                  onClick={copiar}
                  className="vuki-focus inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-800 shadow-2xs transition hover:bg-sky-50 cursor-pointer"
                >
                  {copiado ? (
                    <>
                      <Check
                        className="h-3.5 w-3.5 text-emerald-600"
                        aria-hidden="true"
                      />
                      <span className="text-emerald-700">¡Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={cerrarContrasenaTemporal}
                className="vuki-btn-secondary cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

