"use client";

import { useState } from "react";

export type TabConfiguracion = "general" | "plantillas" | "legales";

interface ConfiguracionTabsProps {
  tabInicial?: TabConfiguracion;
  generalContent: React.ReactNode;
  plantillasContent: React.ReactNode;
  legalesContent: React.ReactNode;
}

const TABS: { id: TabConfiguracion; etiqueta: string }[] = [
  { id: "general", etiqueta: "General, límites y funciones" },
  { id: "plantillas", etiqueta: "Plantillas de correo" },
  { id: "legales", etiqueta: "Textos legales" },
];

export function ConfiguracionTabs({
  tabInicial = "general",
  generalContent,
  plantillasContent,
  legalesContent,
}: ConfiguracionTabsProps) {
  const [tab, setTab] = useState<TabConfiguracion>(tabInicial);

  const cambiarTab = (t: TabConfiguracion) => {
    setTab(t);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", t);
      window.history.replaceState(null, "", url.toString());
    }
  };

  return (
    <div className="space-y-6">
      <div
        role="tablist"
        aria-label="Secciones de configuración"
        className="flex flex-wrap items-center gap-2 border-b border-sky-100 pb-4"
      >
        {TABS.map((t) => {
          const activa = tab === t.id;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={activa}
              aria-controls={`panel-${t.id}`}
              onClick={() => cambiarTab(t.id)}
              className={`vuki-tab-pill !min-h-10 px-4 py-2 text-sm font-semibold transition ${
                activa ? "vuki-tab-pill-active" : ""
              }`}
            >
              <span>{t.etiqueta}</span>
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="outline-none"
      >
        {tab === "general" && generalContent}
        {tab === "plantillas" && plantillasContent}
        {tab === "legales" && legalesContent}
      </div>
    </div>
  );
}

