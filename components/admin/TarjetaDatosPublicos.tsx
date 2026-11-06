"use client";

import { useState } from "react";
import {
  cambiarSlugAction,
  editarDatosNegocioAction,
} from "../../actions/admin/negocios";
import { AccionForm } from "./AccionForm";
import { LISTA_MONEDAS, normalizarMoneda } from "../../lib/monedas";
import { CLASE_INPUT, CLASE_SELECT, Campo, Tarjeta, TextareaConContador } from "./ui";

interface Props {
  negocioId: string;
  nombre: string;
  slug: string;
  descripcion: string;
  moneda?: string | null;
}

export function TarjetaDatosPublicos({
  negocioId,
  nombre,
  slug,
  descripcion,
  moneda,
}: Props) {
  const [nombreVal, setNombreVal] = useState(nombre);

  return (
    <Tarjeta
      titulo="Datos públicos"
      descripcion="Información visible en el perfil público y enlaces de la plataforma."
    >
      <div className="space-y-6">
        {/* Grid de 2 columnas superior: Nombre a la izquierda, Slug a la derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Columna 1: Nombre */}
          <Campo etiqueta="Nombre">
            <input
              name="nombre"
              value={nombreVal}
              onChange={(e) => setNombreVal(e.target.value)}
              form="form-datos-publicos"
              required
              maxLength={80}
              className={CLASE_INPUT}
              placeholder="Nombre del negocio"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const form = document.getElementById(
                    "form-datos-publicos",
                  ) as HTMLFormElement | null;
                  form?.requestSubmit();
                }
              }}
            />
          </Campo>

          {/* Columna 2: Slug con su input y botón Cambiar slug alineados en fila */}
          <div>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Slug</span>
              <AccionForm
                accion={cambiarSlugAction.bind(null, negocioId)}
                boton="Cambiar slug"
                variante="neutro"
                confirmar="¿Cambiar el slug? El enlace anterior dejará de funcionar."
                enLinea
                className="w-full flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  name="slug"
                  defaultValue={slug}
                  required
                  className={`${CLASE_INPUT} flex-1 min-w-0`}
                  aria-label="Slug"
                />
              </AccionForm>
              <span className="mt-1.5 block text-xs text-slate-500">
                Cambiarlo rompe los enlaces públicos existentes.
              </span>
            </label>
          </div>
        </div>

        {/* Debajo: Moneda operativa, Descripción y botón Guardar datos */}
        <AccionForm
          id="form-datos-publicos"
          accion={editarDatosNegocioAction.bind(null, negocioId)}
          boton="Guardar datos"
        >
          <input type="hidden" name="nombre" value={nombreVal} />
          <div className="space-y-4">
            <Campo etiqueta="Moneda operativa por defecto">
              <select
                name="moneda"
                defaultValue={normalizarMoneda(moneda, "USD")}
                className={`${CLASE_SELECT} sm:max-w-sm`}
              >
                {LISTA_MONEDAS.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} ({m.simbolo}) — {m.nombreEs}
                  </option>
                ))}
              </select>
            </Campo>
            <Campo etiqueta="Descripción">
              <TextareaConContador
                name="descripcion"
                defaultValue={descripcion}
                maxLength={600}
                rows={3}
              />
            </Campo>
          </div>
        </AccionForm>
      </div>
    </Tarjeta>
  );
}

