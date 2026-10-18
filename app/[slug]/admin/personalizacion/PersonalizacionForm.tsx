"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { ImageIcon, Loader2, Save, UploadCloud } from "lucide-react";
import {
  actualizarPersonalizacionAction,
  type PersonalizacionActionState,
} from "@/actions/personalizacion";
import type { Negocio } from "@/types/database";
import { toast } from "@/components/Toast";
import ParColoresMarca from "@/components/empresa/ParColoresMarca";
import { LOGO_POR_DEFECTO, PORTADA_POR_DEFECTO } from "@/lib/tipos-publicos";

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
  /** Imagen que el enlace público muestra mientras no se suba una propia. */
  defaultUrl: string;
}

/** Input de archivo con vista previa (imagen actual o la recién seleccionada). */
function ImagePicker({
  label,
  name,
  currentUrl,
  defaultUrl,
}: ImagePickerProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const usandoDefecto = !preview;
  const mostrada = preview ?? defaultUrl;

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {mostrada ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mostrada}
              alt={label}
              className={`h-full w-full object-cover ${usandoDefecto ? "opacity-70" : ""}`}
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
        {usandoDefecto && (
          <span className="text-xs text-slate-400">
            Imagen por defecto. Sube la tuya para reemplazarla.
          </span>
        )}
      </div>
    </div>
  );
}

export default function PersonalizacionForm({ negocio }: { negocio: Negocio }) {
  const [state, formAction] = useActionState(
    actualizarPersonalizacionAction.bind(null, negocio.slug),
    initialState,
  );

  useEffect(() => {
    if (state.success) toast.success("Personalización guardada correctamente.");
    else if (state.error) toast.error(state.error);
  }, [state]);

  return (
    <form
      action={formAction}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label
          htmlFor="nombre"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nombre del negocio
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          minLength={2}
          maxLength={100}
          defaultValue={negocio.nombre}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

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
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="whatsapp"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          WhatsApp de contacto (opcional)
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          maxLength={20}
          defaultValue={negocio.whatsapp ?? ""}
          placeholder="50688887777"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
        <p className="mt-1 text-xs text-slate-500">
          Código de país + número, sin espacios. Aparece como botón en tu enlace
          público.
        </p>
      </div>

      <ParColoresMarca
        primarioInicial={negocio.color_tema}
        secundarioInicial={negocio.color_secundario ?? null}
      />

      <ImagePicker
        label="Logotipo"
        name="logo"
        currentUrl={negocio.logo_url}
        defaultUrl={LOGO_POR_DEFECTO}
      />
      <ImagePicker
        label="Imagen de portada"
        name="portada"
        currentUrl={negocio.imagen_portada_url}
        defaultUrl={PORTADA_POR_DEFECTO}
      />

      <SubmitButton />
    </form>
  );
}
