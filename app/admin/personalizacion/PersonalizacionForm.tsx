"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, Loader2, Save, UploadCloud } from "lucide-react";
import {
  actualizarPersonalizacionAction,
  type PersonalizacionActionState,
} from "../../../actions/personalizacion";
import type { Negocio } from "../../../types/database";

const initialState: PersonalizacionActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

interface ImagePickerProps {
  label: string;
  name: string;
  currentUrl: string | null;
}

/** Input de archivo con vista previa (imagen actual o la recién seleccionada). */
function ImagePicker({ label, name, currentUrl }: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" />
          )}
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
          <UploadCloud className="h-4 w-4" />
          Elegir archivo
          <input
            type="file"
            name={name}
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                setPreview(URL.createObjectURL(file));
              }
            }}
          />
        </label>
      </div>
    </div>
  );
}

export default function PersonalizacionForm({ negocio }: { negocio: Negocio }) {
  const [state, formAction] = useActionState(
    actualizarPersonalizacionAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
    >
      <div>
        <label
          htmlFor="descripcion"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Biografía del negocio
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          maxLength={1000}
          defaultValue={negocio.descripcion ?? ""}
          placeholder="Cuéntale al turista qué hace especial a tu negocio..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="color_tema"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Color de marca
        </label>
        <div className="flex items-center gap-3">
          <input
            id="color_tema"
            name="color_tema"
            type="color"
            defaultValue={negocio.color_tema ?? "#0284c7"}
            className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
          />
          <span className="text-sm text-slate-500">
            Este color se usará como acento en tu perfil público.
          </span>
        </div>
      </div>

      <ImagePicker label="Logotipo" name="logo" currentUrl={negocio.logo_url} />
      <ImagePicker
        label="Imagen de portada"
        name="portada"
        currentUrl={negocio.imagen_portada_url}
      />

      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-emerald-600">
          Personalización guardada correctamente.
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
