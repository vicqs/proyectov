"use client";

import { ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { useTranslations } from "../lib/i18n";
import {
  LISTA_MONEDAS,
  normalizarMoneda,
  type CodigoMoneda,
} from "../lib/monedas";

interface SelectorMonedaProps {
  valor: CodigoMoneda;
  onChange: (moneda: CodigoMoneda) => void;
  variante?: "portada" | "superficie";
  className?: string;
}

/**
 * Selector compacto de moneda (USD, CRC, CAD, EUR, GBP) para el perfil público
 * y el checkout del turista.
 */
export default function SelectorMoneda({
  valor,
  onChange,
  variante = "portada",
  className,
}: SelectorMonedaProps) {
  const { t } = useTranslations();

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full text-xs font-semibold transition",
        variante === "portada"
          ? "border border-white/40 bg-white/85 text-slate-800 shadow-sm backdrop-blur-md hover:bg-white/95"
          : "border border-slate-200 bg-white text-slate-700 shadow-2xs hover:border-slate-300",
        className,
      )}
    >
      <select
        aria-label={t("moneda_selector")}
        title={t("moneda_selector")}
        value={valor}
        onChange={(e) => onChange(normalizarMoneda(e.target.value, valor))}
        className="vuki-focus cursor-pointer appearance-none rounded-full bg-transparent py-2 pl-3 pr-7 text-xs font-semibold text-inherit outline-none"
      >
        {LISTA_MONEDAS.map((m) => (
          <option key={m.codigo} value={m.codigo} className="text-slate-900">
            {m.codigo} ({m.simbolo})
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-slate-500"
        aria-hidden="true"
      />
    </div>
  );
}
