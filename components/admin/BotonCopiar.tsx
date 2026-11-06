"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "../Toast";

export function BotonCopiar({
  texto,
  etiqueta = "Copiar",
  mensajeExito = "Copiado al portapapeles",
  className = "",
  soloIcono = false,
}: {
  texto: string;
  etiqueta?: string;
  mensajeExito?: string;
  className?: string;
  soloIcono?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiar(e: React.MouseEvent) {
    e.stopPropagation();
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success(mensajeExito);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      title={etiqueta}
      aria-label={etiqueta}
      className={`vuki-focus inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 ${className}`}
    >
      {copiado ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          {!soloIcono && <span className="text-emerald-700 font-semibold">Copiado</span>}
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" aria-hidden="true" />
          {!soloIcono && <span>Copiar</span>}
        </>
      )}
    </button>
  );
}

