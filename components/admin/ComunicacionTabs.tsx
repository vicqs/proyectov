"use client";

import { useState } from "react";

export function ComunicacionTabs({
  tabInicial = "anuncios",
  conteoAnuncios,
  conteoComunicados,
  anunciosContent,
  comunicadosContent,
}: {
  tabInicial?: "anuncios" | "comunicados";
  conteoAnuncios?: number;
  conteoComunicados?: number;
  anunciosContent: React.ReactNode;
  comunicadosContent: React.ReactNode;
}) {
  const [tab, setTab] = useState<"anuncios" | "comunicados">(tabInicial);

  const cambiarTab = (t: "anuncios" | "comunicados") => {
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
        aria-label="Secciones de comunicación"
        className="flex flex-wrap items-center gap-2 border-b border-sky-100 pb-4"
      >
        <button
          id="tab-anuncios"
          type="button"
          role="tab"
          aria-selected={tab === "anuncios"}
          aria-controls="panel-comunicacion"
          onClick={() => cambiarTab("anuncios")}
          className={`vuki-tab-pill !min-h-10 px-4 py-2 text-sm font-semibold transition ${
            tab === "anuncios" ? "vuki-tab-pill-active" : ""
          }`}
        >
          <span>Anuncios en panel</span>
          {conteoAnuncios !== undefined && (
            <span
              className={
                tab === "anuncios"
                  ? "vuki-tab-pill-badge-active"
                  : "vuki-tab-pill-badge"
              }
            >
              {conteoAnuncios}
            </span>
          )}
        </button>

        <button
          id="tab-comunicados"
          type="button"
          role="tab"
          aria-selected={tab === "comunicados"}
          aria-controls="panel-comunicacion"
          onClick={() => cambiarTab("comunicados")}
          className={`vuki-tab-pill !min-h-10 px-4 py-2 text-sm font-semibold transition ${
            tab === "comunicados" ? "vuki-tab-pill-active" : ""
          }`}
        >
          <span>Comunicados por correo</span>
          {conteoComunicados !== undefined && (
            <span
              className={
                tab === "comunicados"
                  ? "vuki-tab-pill-badge-active"
                  : "vuki-tab-pill-badge"
              }
            >
              {conteoComunicados}
            </span>
          )}
        </button>
      </div>

      <div
        id="panel-comunicacion"
        role="tabpanel"
        aria-labelledby={tab === "anuncios" ? "tab-anuncios" : "tab-comunicados"}
      >
        {tab === "anuncios" ? anunciosContent : comunicadosContent}
      </div>
    </div>
  );
}

