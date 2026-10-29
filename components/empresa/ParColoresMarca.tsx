"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import {
  COLOR_PRIMARIO_DEFECTO,
  PARES_MARCA,
  esHex,
  textoSobre,
} from "@/lib/color";

interface ParColoresMarcaProps {
  primarioInicial: string | null;
  secundarioInicial: string | null;
  onChange?: (colores: { primario: string; secundario: string }) => void;
}

/**
 * Selector del par de colores de marca (primario + secundario) con pares
 * sugeridos y vista previa. Envía `color_tema` y `color_secundario`.
 */
export default function ParColoresMarca({
  primarioInicial,
  secundarioInicial,
  onChange,
}: ParColoresMarcaProps) {
  const [primario, setPrimario] = useState(
    esHex(primarioInicial) ? primarioInicial : COLOR_PRIMARIO_DEFECTO,
  );
  const [secundario, setSecundario] = useState(
    esHex(secundarioInicial) ? secundarioInicial : primario,
  );

  function actualizarColores(nuevoPrimario: string, nuevoSecundario: string) {
    setPrimario(nuevoPrimario);
    setSecundario(nuevoSecundario);
    onChange?.({ primario: nuevoPrimario, secundario: nuevoSecundario });
  }

  const degradado = `linear-gradient(135deg, ${primario}, ${secundario})`;

  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-700">
        Colores de marca
      </legend>
      <p className="mb-3 text-xs text-slate-600">
        Se aplican tanto a este panel de empresa como a los botones y acentos de
        tu enlace público.
      </p>

      <div
        role="group"
        aria-label="Pares sugeridos"
        className="mb-4 flex flex-wrap gap-2"
      >
        {PARES_MARCA.map((par) => {
          const activo =
            par.primario === primario && par.secundario === secundario;
          return (
            <button
              key={par.nombre}
              type="button"
              aria-pressed={activo}
              onClick={() => actualizarColores(par.primario, par.secundario)}
              className={`vuki-focus flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-slate-700 transition ${
                activo
                  ? "border-slate-900 bg-slate-50 font-semibold"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 rounded-full"
                style={{
                  background: `linear-gradient(135deg, ${par.primario} 50%, ${par.secundario} 50%)`,
                }}
              />
              {par.nombre}
              {activo && <Check className="h-3 w-3" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            id: "color_tema",
            etiqueta: "Color principal",
            valor: primario,
            onPick: (nuevo: string) => actualizarColores(nuevo, secundario),
          },
          {
            id: "color_secundario",
            etiqueta: "Color secundario",
            valor: secundario,
            onPick: (nuevo: string) => actualizarColores(primario, nuevo),
          },
        ].map((c) => (
          <div key={c.id}>
            <label
              htmlFor={c.id}
              className="mb-1 block text-xs font-medium text-slate-600"
            >
              {c.etiqueta}
            </label>
            <div className="flex items-center gap-3">
              <input
                id={c.id}
                name={c.id}
                type="color"
                value={c.valor}
                onChange={(e) => c.onPick(e.target.value)}
                className="vuki-focus h-11 w-14 cursor-pointer rounded-xl border border-slate-300 bg-white p-1"
              />
              <span className="font-mono text-sm uppercase text-slate-700">
                {c.valor}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        aria-label="Muestra de colores"
        className="mt-4 overflow-hidden rounded-xl border border-slate-200"
      >
        <div className="h-2" style={{ background: degradado }} />
        <div className="flex flex-wrap items-center gap-3 bg-white p-3">
          <span
            className="rounded-lg px-3 py-1.5 text-xs font-semibold"
            style={{
              background: `color-mix(in srgb, ${primario} 12%, white)`,
              color: `color-mix(in srgb, ${primario} 70%, black)`,
            }}
          >
            Panel: sección activa
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm"
            style={{ background: degradado, color: textoSobre(primario) }}
          >
            Botón reservar · $35.00
          </span>
        </div>
      </div>
    </fieldset>
  );
}
