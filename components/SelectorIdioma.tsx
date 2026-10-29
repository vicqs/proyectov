"use client";

import { motion } from "framer-motion";
import { cn } from "../lib/cn";
import { useTranslations } from "../lib/i18n";

/** Píldora ES / EN compartida por el perfil público y las páginas públicas. */
export default function SelectorIdioma({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslations();

  return (
    <div
      role="group"
      aria-label="Language / Idioma"
      className={cn(
        "flex overflow-hidden rounded-full border border-white/40 bg-white/85 p-0.5 text-xs font-semibold shadow-sm backdrop-blur-md",
        className,
      )}
    >
      {(["es", "en"] as const).map((idioma) => {
        const activo = locale === idioma;
        return (
          <button
            key={idioma}
            type="button"
            aria-pressed={activo}
            onClick={() => setLocale(idioma)}
            className={`relative rounded-full px-3 py-1.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-slate-900 ${
              activo ? "text-white" : "text-slate-700 hover:text-slate-900"
            }`}
          >
            {activo && (
              <motion.span
                layoutId="idioma-publico"
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-slate-900 shadow-xs"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{idioma.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

