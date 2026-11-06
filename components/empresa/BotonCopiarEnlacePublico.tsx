"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "../Toast";

export function BotonCopiarEnlacePublico({
  rutaPublica,
}: {
  rutaPublica: string;
}) {
  const [copiado, setCopiado] = useState(false);

  async function copiarEnlacePublico() {
    if (!rutaPublica || typeof window === "undefined") return;
    const url = `${window.location.origin}${rutaPublica}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Enlace público copiado para compartir");
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar el enlace automáticamente.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copiarEnlacePublico()}
      className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 sm:flex-none"
    >
      {copiado ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ¡Enlace copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copiar enlace
        </>
      )}
    </button>
  );
}

