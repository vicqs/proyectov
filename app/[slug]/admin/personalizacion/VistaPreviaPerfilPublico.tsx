"use client";

import { useRef } from "react";
import {
  CheckCircle2,
  ImageIcon,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "@/components/Toast";
import { textoSobre } from "@/lib/color";
import { formatearMoneda } from "@/lib/formato";
import { obtenerInfoMoneda, type CodigoMoneda } from "@/lib/monedas";

export interface ImagePickerProps {
  label: string;
  description: string;
  name: "logo" | "portada";
  aspect?: "square" | "wide";
  maxImagenMb: number;
  previewUrl: string;
  tienePersonalizadaGuardada: boolean;
  selectedFile: File | null;
  markedForRemoval: boolean;
  onSelectFile: (file: File | null) => void;
  onToggleRemoval: (remove: boolean) => void;
}

/**
 * Selector de imagen con validación inmediata de peso, vista previa y opción
 * para restaurar la imagen por defecto del enlace público.
 */
export function ImagePicker({
  label,
  description,
  name,
  aspect = "square",
  maxImagenMb,
  previewUrl,
  tienePersonalizadaGuardada,
  selectedFile,
  markedForRemoval,
  onSelectFile,
  onToggleRemoval,
}: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const mostrandoNueva = Boolean(selectedFile);
  const mostrandoPersonalizada =
    !mostrandoNueva && tienePersonalizadaGuardada && !markedForRemoval;
  const usandoDefecto = !mostrandoNueva && !mostrandoPersonalizada;

  function limpiarInputArchivo() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (file.size > maxImagenMb * 1024 * 1024) {
      toast.error(
        `El archivo supera el tamaño máximo permitido (${maxImagenMb} MB).`,
      );
      limpiarInputArchivo();
      return;
    }
    onToggleRemoval(false);
    onSelectFile(file);
  }

  function handleDescartarSeleccion() {
    limpiarInputArchivo();
    onSelectFile(null);
  }

  function handleQuitarPersonalizada() {
    limpiarInputArchivo();
    onSelectFile(null);
    onToggleRemoval(true);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-slate-800">{label}</p>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>

        {mostrandoNueva ? (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Nueva imagen (sin guardar)
          </span>
        ) : markedForRemoval ? (
          <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800">
            Se restaurará por defecto
          </span>
        ) : mostrandoPersonalizada ? (
          <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
            Personalizada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Por defecto
          </span>
        )}
      </div>

      <input
        type="hidden"
        name={`eliminar_${name}`}
        value={markedForRemoval ? "true" : "false"}
      />

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div
          className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
            aspect === "wide" ? "h-24 w-40" : "h-24 w-24"
          }`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={label}
              className={`h-full w-full object-cover transition ${
                usandoDefecto ? "opacity-80" : ""
              }`}
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-slate-300" aria-hidden="true" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <label className="vuki-focus inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50">
              <UploadCloud
                className="h-4 w-4 text-sky-600"
                aria-hidden="true"
              />
              {mostrandoNueva || mostrandoPersonalizada
                ? "Cambiar imagen"
                : "Subir imagen"}
              <input
                ref={inputRef}
                type="file"
                name={name}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            {mostrandoNueva && (
              <button
                type="button"
                onClick={handleDescartarSeleccion}
                className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Quitar selección
              </button>
            )}

            {mostrandoPersonalizada && (
              <button
                type="button"
                onClick={handleQuitarPersonalizada}
                className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Usar por defecto
              </button>
            )}

            {markedForRemoval && tienePersonalizadaGuardada && (
              <button
                type="button"
                onClick={() => onToggleRemoval(false)}
                className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Mantener actual
              </button>
            )}
          </div>

          {mostrandoNueva && selectedFile ? (
            <p className="text-xs text-slate-600">
              Seleccionado:{" "}
              <strong className="font-medium text-slate-800">
                {selectedFile.name}
              </strong>{" "}
              ({(selectedFile.size / 1024).toFixed(0)} KB). Pulsa{" "}
              <strong>Guardar cambios</strong> para aplicarlo.
            </p>
          ) : markedForRemoval ? (
            <p className="text-xs text-amber-700">
              Al guardar se volverá a mostrar la fotografía por defecto.
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Formatos: PNG, JPG o WEBP · Tamaño máximo: {maxImagenMb} MB.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface VistaPreviaPerfilPublicoProps {
  pasosCompletos: number;
  portadaPreview: string;
  logoPreview: string;
  degradadoPreview: string;
  colorPrimario: string;
  nombre: string;
  descripcion: string;
  moneda?: CodigoMoneda;
  tieneWhatsApp: boolean;
  codigoPaisWhatsApp: string;
}

export default function VistaPreviaPerfilPublico({
  pasosCompletos,
  portadaPreview,
  logoPreview,
  degradadoPreview,
  colorPrimario,
  nombre,
  descripcion,
  moneda = "USD",
  tieneWhatsApp,
  codigoPaisWhatsApp,
}: VistaPreviaPerfilPublicoProps) {
  const ejemploMonto = Number(obtenerInfoMoneda(moneda).ejemploPrecio) || 35;
  return (
    <section
      aria-label="Vista previa en vivo de tu perfil público"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 text-xs">
        <span className="font-semibold text-slate-700">
          Vista previa en vivo
        </span>
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          {pasosCompletos}/4 completados
        </span>
      </div>

      <div className="relative h-28 w-full bg-slate-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={portadaPreview}
          alt="Vista previa de portada"
          className="h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-35"
          style={{ background: degradadoPreview }}
        />
      </div>

      <div className="px-5 pb-5">
        <div className="-mt-8 flex items-end justify-between gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoPreview}
              alt="Vista previa de logotipo"
              className="h-full w-full object-cover"
            />
          </div>

          {tieneWhatsApp && (
            <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
              WhatsApp +{codigoPaisWhatsApp}
            </span>
          )}
        </div>

        <h3 className="mt-3 break-words font-display text-base font-bold text-vuki-ink">
          {nombre.trim() || "Nombre de tu negocio"}
        </h3>
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-600">
          {descripcion.trim() ||
            "Agrega una biografía breve para contarles a tus visitantes de qué trata tu experiencia."}
        </p>

        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 p-3">
          <div>
            <p className="text-xs font-semibold text-slate-800">
              Experiencia de ejemplo (demo)
            </p>
            <p className="text-[11px] text-slate-500">
              2 horas · {formatearMoneda(ejemploMonto, moneda)}
            </p>
          </div>
          <span
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm ${
              textoSobre(colorPrimario) === "#ffffff"
                ? "text-white"
                : "text-slate-900"
            }`}
            style={{
              background: degradadoPreview,
              color: textoSobre(colorPrimario),
            }}
          >
            Reservar
          </span>
        </div>
      </div>
    </section>
  );
}

