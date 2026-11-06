"use client";

import { useState } from "react";
import { crearNegocioAction } from "../../actions/admin/negocios";
import { AccionForm } from "./AccionForm";
import { CLASE_INPUT, Campo } from "./ui";

function aSlug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9]+/g, "-") // guiones para caracteres no alfanuméricos
    .replace(/^-+|-+$/g, "") // quitar guiones extremos
    .slice(0, 40);
}

export function NuevoNegocioForm() {
  const [nombre, setNombre] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditadoManualmente, setSlugEditadoManualmente] = useState(false);

  function alCambiarNombre(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setNombre(val);
    if (!slugEditadoManualmente) {
      setSlug(aSlug(val));
    }
  }

  function alCambiarSlug(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugEditadoManualmente(true);
    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
  }

  return (
    <AccionForm
      accion={crearNegocioAction}
      boton="Crear negocio"
      limpiarAlOk
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Nombre del negocio">
          <input
            name="nombre"
            required
            maxLength={80}
            value={nombre}
            onChange={alCambiarNombre}
            placeholder="Ej. Escuela de Surf Pura Vida"
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo
          etiqueta="Slug (URL pública)"
          ayuda="Se genera automáticamente. Debe tener entre 3 y 40 caracteres."
        >
          <div className="relative">
            <input
              name="slug"
              required
              pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]"
              value={slug}
              onChange={alCambiarSlug}
              placeholder="ej. escuela-surf-pura-vida"
              className={CLASE_INPUT}
            />
            {slug && (
              <span className="mt-1 block text-xs text-sky-700">
                URL: vuki.dev/<b>{slug}</b>
              </span>
            )}
          </div>
        </Campo>
        <Campo
          etiqueta="Correo del dueño"
          ayuda="Si no existe, se crea con una contraseña temporal segura que podrás copiar."
        >
          <input
            name="email"
            type="email"
            required
            placeholder="dueno@ejemplo.com"
            className={CLASE_INPUT}
          />
        </Campo>
        <Campo etiqueta="Cuenta IBAN (opcional)">
          <input
            name="cuenta_iban"
            maxLength={40}
            placeholder="CR05015202001026284066"
            className={CLASE_INPUT}
          />
        </Campo>
      </div>
    </AccionForm>
  );
}

