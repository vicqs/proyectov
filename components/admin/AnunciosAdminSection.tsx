"use client";

import { useState } from "react";
import { Megaphone, Plus } from "lucide-react";
import {
  Celda,
  Insignia,
  Tabla,
  Tarjeta,
  type TonoInsignia,
} from "./ui";
import { AccionForm } from "./AccionForm";
import { fechaHora } from "../../lib/admin/formato";
import {
  alternarAnuncioAction,
  eliminarAnuncioAction,
} from "../../actions/admin/comunicacion";
import { NuevoAnuncioDrawer } from "./NuevoAnuncioDrawer";
import type { Anuncio } from "../../types/database";

const TONO: Record<string, TonoInsignia> = {
  info: "azul",
  aviso: "ambar",
  critico: "rojo",
};

const ETIQUETAS_SEVERIDAD: Record<string, string> = {
  info: "Informativo",
  aviso: "Aviso",
  critico: "Crítico",
};

interface AnunciosAdminSectionProps {
  anuncios: Anuncio[];
  conteoPorSegmento: {
    todas: number;
    activa: number;
    prueba: number;
    inactiva: number;
  };
}

export function AnunciosAdminSection({
  anuncios,
  conteoPorSegmento,
}: AnunciosAdminSectionProps) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);

  return (
    <>
      <Tarjeta
        titulo="Anuncios en panel"
        descripcion="Mensajes fijados en el panel de control de las empresas según su segmento."
        accion={
          <button
            type="button"
            onClick={() => setDrawerAbierto(true)}
            className="vuki-btn-primary inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo anuncio</span>
          </button>
        }
      >
        <Tabla
          columnas={["Anuncio", "Segmento", "Estado", "Expira", "Acciones"]}
          vacia={anuncios.length === 0}
          vacio="Sin anuncios activos ni programados."
        >
          {anuncios.map((a) => (
            <tr key={a.id}>
              <Celda>
                <div className="flex items-center gap-2">
                  <Insignia tono={TONO[a.severidad] ?? "gris"}>
                    {ETIQUETAS_SEVERIDAD[a.severidad] ?? a.severidad}
                  </Insignia>
                  <p className="font-semibold text-slate-900">{a.titulo}</p>
                </div>
                <p className="mt-1 max-w-xl whitespace-pre-wrap text-xs text-slate-600 leading-relaxed">
                  {a.mensaje}
                </p>
              </Celda>
              <Celda className="capitalize font-medium text-slate-700">
                {a.segmento}
              </Celda>
              <Celda>
                <Insignia tono={a.activo ? "verde" : "gris"}>
                  {a.activo ? "Activo" : "Inactivo"}
                </Insignia>
              </Celda>
              <Celda className="whitespace-nowrap text-slate-500 text-xs">
                {a.expira_en ? fechaHora(a.expira_en) : "Permanente"}
              </Celda>
              <Celda>
                <div className="flex flex-wrap items-center gap-2">
                  <AccionForm
                    accion={alternarAnuncioAction.bind(null, a.id, !a.activo)}
                    boton={a.activo ? "Desactivar" : "Activar"}
                    variante="neutro"
                    tamano="xs"
                  />
                  <AccionForm
                    accion={eliminarAnuncioAction.bind(null, a.id)}
                    boton="Eliminar"
                    variante="peligro_sutil"
                    tamano="xs"
                    confirmar="¿Eliminar este anuncio definitivamente?"
                  />
                </div>
              </Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>

      <NuevoAnuncioDrawer
        abierto={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        conteoPorSegmento={conteoPorSegmento}
      />
    </>
  );
}
