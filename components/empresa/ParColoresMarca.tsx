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
}

/**
 * Selector del par de colores de marca (primario + secundario) con pares
 * sugeridos y vista previa. Envía `color_tema` y `color_secundario`.
 */
export default function ParColoresMarca({
  primarioInicial,
  secundarioInicial,
}: ParColoresMarcaProps) {
  const [primario, setPrimario] = useState(
    esHex(primarioInicial) ? primarioInicial : COLOR_PRIMARIO_DEFECTO,
  );
  const [secundario, setSecundario] = useState(
    esHex(secundarioInicial) ? secundarioInicial : primario,
  );

  const degradado = `linear-gradient(135deg, ${primario}, ${secundario})`;

  return (
    <fieldset>
      <legend className="mb-1 block text-sm font-medium text-slate-700">
        Colores de marca
      </legend>
      <p className="mb-3 text-xs text-slate-600">
        Se aplican a tu panel de empresa y a tu enlace público.
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
              onClick={() => {
                setPrimario(par.primario);
                setSecundario(par.secundario);
              }}
              className={`flex min-h-10 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                activo
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-300 hover:bg-slate-50"
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
            etiqueta: "Principal",
            valor: primario,
            set: setPrimario,
          },
          {
            id: "color_secundario",
            etiqueta: "Secundario",
            valor: secundario,
            set: setSecundario,
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
                onChange={(e) => c.set(e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-slate-300 bg-white p-1"
              />
              <span className="font-mono text-sm uppercase text-slate-700">
                {c.valor}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div
        aria-label="Vista previa"
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
            Panel: enlace activo
          </span>
          <span
            className="rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm"
            style={{ background: degradado, color: textoSobre(primario) }}
          >
            Enlace público · $25.00
          </span>
        </div>
      </div>
    </fieldset>
  );
}
