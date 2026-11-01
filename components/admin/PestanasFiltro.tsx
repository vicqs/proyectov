"use client";

import React from "react";

/** Pestañas de filtrado rápido idénticas a las del panel de empresa. */
export function PestanasFiltro<T extends string>({
  pestanas,
  activa,
  onChange,
  ariaLabel = "Filtrar por estado",
}: {
  pestanas: { id: T; etiqueta: string; conteo?: number }[];
  activa: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex flex-wrap items-center gap-1.5"
    >
      {pestanas.map((tab) => {
        const on = activa === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(tab.id)}
            className={`vuki-tab-pill ${on ? "vuki-tab-pill-active" : ""}`}
          >
            <span>{tab.etiqueta}</span>
            {tab.conteo !== undefined && (
              <span
                className={
                  on ? "vuki-tab-pill-badge-active" : "vuki-tab-pill-badge"
                }
              >
                {tab.conteo}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

