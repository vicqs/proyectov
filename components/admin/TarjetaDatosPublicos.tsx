"use client";

import { useState } from "react";
import {
  cambiarSlugAction,
  editarDatosNegocioAction,
} from "../../actions/admin/negocios";
import { AccionForm } from "./AccionForm";
import { CLASE_INPUT, Campo, Tarjeta, TextareaConContador } from "./ui";

interface Props {
  negocioId: string;
  nombre: string;
  slug: string;
  descripcion: string;
}

export function TarjetaDatosPublicos({
  negocioId,
  nombre,
  slug,
  descripcion,
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

        {/* Debajo: Descripción y botón Guardar datos */}
        <AccionForm
          id="form-datos-publicos"
          accion={editarDatosNegocioAction.bind(null, negocioId)}
          boton="Guardar datos"
        >
          <input type="hidden" name="nombre" value={nombreVal} />
          <Campo etiqueta="Descripción">
            <TextareaConContador
              name="descripcion"
              defaultValue={descripcion}
              maxLength={600}
              rows={3}
            />
          </Campo>
        </AccionForm>
      </div>
    </Tarjeta>
  );
}

