"use client";

import { useState } from "react";
import { CLASE_CHECKBOX, CLASE_INPUT } from "./ui";

interface BloqueMantenimientoProps {
  modoMantenimientoInicial: boolean;
  mensajeInicial?: string | null;
}

export function BloqueMantenimiento({
  modoMantenimientoInicial,
  mensajeInicial = "",
}: BloqueMantenimientoProps) {
  const [activo, setActivo] = useState(modoMantenimientoInicial);

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-3 transition-colors">
      <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
        <input
          type="checkbox"
          name="modo_mantenimiento"
          checked={activo}
          onChange={(e) => setActivo(e.target.checked)}
          className={CLASE_CHECKBOX}
        />
        <span className="font-semibold text-amber-950">
          Modo mantenimiento: Bloquear reservas y paneles de empresa (el área admin sigue disponible)
        </span>
      </label>

      {/* Input deshabilitado u oculto mientras el checkbox no esté marcado */}
      <div className={activo ? "block pt-1" : "hidden"}>
        <label htmlFor="mensaje_mantenimiento" className="sr-only">
          Mensaje explicativo para los usuarios
        </label>
        <input
          id="mensaje_mantenimiento"
          name="mensaje_mantenimiento"
          maxLength={300}
          defaultValue={mensajeInicial ?? ""}
          disabled={!activo}
          aria-label="Mensaje explicativo para los usuarios"
          placeholder="Mensaje explicativo para los usuarios..."
          className={CLASE_INPUT}
        />
      </div>
    </div>
  );
}

