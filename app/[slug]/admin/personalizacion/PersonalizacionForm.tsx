"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  ImageIcon,
  Loader2,
  Lock,
  Mail,
  Palette,
  RotateCcw,
  Save,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  actualizarPersonalizacionAction,
  cambiarContrasenaEmpresaAction,
  type CambiarContrasenaEmpresaState,
  type PersonalizacionActionState,
} from "@/actions/personalizacion";
import type { Negocio } from "@/types/database";
import { toast } from "@/components/Toast";
import ParColoresMarca from "@/components/empresa/ParColoresMarca";
import { COLOR_PRIMARIO_DEFECTO, esHex, textoSobre } from "@/lib/color";
import { LOGO_POR_DEFECTO, PORTADA_POR_DEFECTO } from "@/lib/tipos-publicos";
import {
  PAISES_TELEFONO,
  descomponerTelefono,
  extraerDigitosLocales,
  formatearNumeroLocal,
  obtenerPaisPorIso,
  totalDigitosPais,
} from "@/lib/telefono";

const initialState: PersonalizacionActionState = {};
const initialPassState: CambiarContrasenaEmpresaState = {};

const INPUT =
  "vuki-focus min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500";

function limpiarIban(valor: string): string {
  return valor
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 34);
}

function formatearIbanGrupos(limpio: string): string {
  return limpio.replace(/(.{4})/g, "$1 ").trim();
}

function SubmitButton({
  hayCambios,
  onDescartar,
}: {
  hayCambios: boolean;
  onDescartar: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs">
        {hayCambios && !pending ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-800">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-amber-500"
            />
            Tienes cambios pendientes por guardar
          </span>
        ) : (
          <span className="text-slate-500">
            Los cambios guardados se publican al instante en tu enlace público.
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hayCambios && !pending && (
          <button
            type="button"
            onClick={onDescartar}
            className="vuki-focus inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Descartar
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className="vuki-focus inline-flex min-h-11 items-center gap-2 rounded-xl bg-vuki-ink px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          {pending ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}

interface ImagePickerProps {
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
function ImagePicker({
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

function SeccionCuentaAcceso({
  slug,
  emailCuenta,
}: {
  slug: string;
  emailCuenta: string;
}) {
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    cambiarContrasenaEmpresaAction.bind(null, slug),
    initialPassState,
  );

  useEffect(() => {
    if (state.success && state.savedAt) {
      toast.success("Contraseña actualizada correctamente.");
      formRef.current?.reset();
      setAbierto(false);
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <section
      id="acceso"
      className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
            <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
            Cuenta y seguridad
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Credenciales con las que administras este panel.
          </p>
        </div>
        <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((prev) => !prev)}
          className="vuki-focus rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          {abierto ? "Cancelar" : "Cambiar contraseña"}
        </button>
      </div>

      {emailCuenta && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span className="text-slate-500">Sesión:</span>
          <strong className="truncate font-semibold text-slate-800">
            {emailCuenta}
          </strong>
        </div>
      )}

      {abierto && (
        <form ref={formRef} action={action} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div>
            <label
              htmlFor="pass_actual"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Contraseña actual
            </label>
            <input
              id="pass_actual"
              name="actual"
              type="password"
              required
              autoComplete="current-password"
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="pass_nueva"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Nueva contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="pass_nueva"
              name="nueva"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="pass_confirmar"
              className="mb-1 block text-xs font-medium text-slate-700"
            >
              Confirmar nueva contraseña
            </label>
            <input
              id="pass_confirmar"
              name="confirmar"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              className={INPUT}
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="vuki-focus flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            )}
            {pending ? "Actualizando..." : "Actualizar contraseña"}
          </button>
        </form>
      )}
    </section>
  );
}

export default function PersonalizacionForm({
  negocio,
  emailCuenta = "",
  maxImagenMb = 2,
}: {
  negocio: Negocio;
  emailCuenta?: string;
  maxImagenMb?: number;
}) {
  const router = useRouter();

  const colorPrimarioBase = esHex(negocio.color_tema)
    ? negocio.color_tema
    : COLOR_PRIMARIO_DEFECTO;
  const colorSecundarioBase = esHex(negocio.color_secundario)
    ? negocio.color_secundario
    : colorPrimarioBase;

  const inicialTelefono = descomponerTelefono(negocio.whatsapp);

  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion ?? "");
  const [ibanLimpio, setIbanLimpio] = useState(
    limpiarIban(negocio.cuenta_iban ?? ""),
  );
  const [paisIso, setPaisIso] = useState(inicialTelefono.pais.iso);
  const [digitosWhatsApp, setDigitosWhatsApp] = useState(
    inicialTelefono.digitosLocales,
  );
  const [colores, setColores] = useState({
    primario: colorPrimarioBase,
    secundario: colorSecundarioBase,
  });
  const [resetKey, setResetKey] = useState(0);
  const [enlaceCopiado, setEnlaceCopiado] = useState(false);

  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(
    negocio.logo_url,
  );
  const [savedPortadaUrl, setSavedPortadaUrl] = useState<string | null>(
    negocio.imagen_portada_url,
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [portadaFile, setPortadaFile] = useState<File | null>(null);
  const [logoBlobUrl, setLogoBlobUrl] = useState<string | null>(null);
  const [portadaBlobUrl, setPortadaBlobUrl] = useState<string | null>(null);
  const [eliminarLogo, setEliminarLogo] = useState(false);
  const [eliminarPortada, setEliminarPortada] = useState(false);

  useEffect(() => {
    if (!logoFile) {
      setLogoBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setLogoBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    if (!portadaFile) {
      setPortadaBlobUrl(null);
      return;
    }
    const url = URL.createObjectURL(portadaFile);
    setPortadaBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [portadaFile]);

  useEffect(() => {
    setSavedLogoUrl(negocio.logo_url);
  }, [negocio.logo_url]);

  useEffect(() => {
    setSavedPortadaUrl(negocio.imagen_portada_url);
  }, [negocio.imagen_portada_url]);

  const [baseGuardada, setBaseGuardada] = useState({
    nombre: negocio.nombre,
    descripcion: negocio.descripcion ?? "",
    iban: limpiarIban(negocio.cuenta_iban ?? ""),
    whatsapp: negocio.whatsapp ?? "",
    primario: colorPrimarioBase,
    secundario: colorSecundarioBase,
  });
  const ultimoEnvioRef = useRef(baseGuardada);

  const [state, formAction] = useActionState(
    async (prevState: PersonalizacionActionState, formData: FormData) => {
      if (logoFile) {
        formData.set("logo", logoFile);
      }
      if (portadaFile) {
        formData.set("portada", portadaFile);
      }
      formData.set("eliminar_logo", eliminarLogo ? "true" : "false");
      formData.set("eliminar_portada", eliminarPortada ? "true" : "false");

      ultimoEnvioRef.current = {
        nombre: String(formData.get("nombre") ?? "").trim() || nombre,
        descripcion: String(formData.get("descripcion") ?? "").trim(),
        iban: limpiarIban(String(formData.get("cuenta_iban") ?? "")),
        whatsapp: String(formData.get("whatsapp") ?? "").trim(),
        primario: String(formData.get("color_tema") ?? colores.primario),
        secundario: String(
          formData.get("color_secundario") ?? colores.secundario,
        ),
      };

      return actualizarPersonalizacionAction(negocio.slug, prevState, formData);
    },
    initialState,
  );

  const paisActual = obtenerPaisPorIso(paisIso);
  const digitosRequeridos = totalDigitosPais(paisActual);
  const whatsappFormateado = formatearNumeroLocal(digitosWhatsApp, paisActual);
  const whatsappCompleto = digitosWhatsApp
    ? `${paisActual.codigo}${digitosWhatsApp}`
    : "";

  useEffect(() => {
    if (state.success && state.savedAt) {
      if (state.logoUrl !== undefined) setSavedLogoUrl(state.logoUrl);
      if (state.portadaUrl !== undefined) setSavedPortadaUrl(state.portadaUrl);
      setLogoFile(null);
      setPortadaFile(null);
      setEliminarLogo(false);
      setEliminarPortada(false);
      setBaseGuardada(ultimoEnvioRef.current);
      toast.success("Personalización guardada correctamente.");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  function descartarCambios() {
    const tel = descomponerTelefono(baseGuardada.whatsapp || null);
    setNombre(baseGuardada.nombre);
    setDescripcion(baseGuardada.descripcion);
    setIbanLimpio(baseGuardada.iban);
    setPaisIso(tel.pais.iso);
    setDigitosWhatsApp(tel.digitosLocales);
    setColores({
      primario: baseGuardada.primario,
      secundario: baseGuardada.secundario,
    });
    setLogoFile(null);
    setPortadaFile(null);
    setEliminarLogo(false);
    setEliminarPortada(false);
    setResetKey((k) => k + 1);
  }

  async function copiarEnlacePublico() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/${negocio.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setEnlaceCopiado(true);
      toast.success("Enlace público copiado para compartir");
      window.setTimeout(() => setEnlaceCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  const hayCambiosImagen =
    Boolean(logoFile) ||
    Boolean(portadaFile) ||
    eliminarLogo ||
    eliminarPortada;

  const hayCambios =
    hayCambiosImagen ||
    nombre !== baseGuardada.nombre ||
    descripcion !== baseGuardada.descripcion ||
    ibanLimpio !== baseGuardada.iban ||
    whatsappCompleto !== baseGuardada.whatsapp ||
    colores.primario !== baseGuardada.primario ||
    colores.secundario !== baseGuardada.secundario;

  const logoPreview =
    logoBlobUrl ??
    (!eliminarLogo && savedLogoUrl ? savedLogoUrl : LOGO_POR_DEFECTO);
  const portadaPreview =
    portadaBlobUrl ??
    (!eliminarPortada && savedPortadaUrl
      ? savedPortadaUrl
      : PORTADA_POR_DEFECTO);

  const degradadoPreview = `linear-gradient(135deg, ${colores.primario}, ${colores.secundario})`;
  const whatsappCompletoValido =
    digitosWhatsApp.length === 0 ||
    digitosWhatsApp.length === digitosRequeridos;

  const pasosCompletos = [
    Boolean(nombre.trim() && descripcion.trim()),
    digitosWhatsApp.length === digitosRequeridos && digitosRequeridos > 0,
    Boolean(
      (!eliminarLogo && (logoFile || savedLogoUrl)) ||
        (!eliminarPortada && (portadaFile || savedPortadaUrl)),
    ),
    ibanLimpio.length >= 14,
  ].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Barra superior del enlace público del negocio */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-borde) bg-white px-4 py-3.5 shadow-sm">
        <div className="flex min-w-0 items-center gap-2.5 text-sm">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-(--marca-fondo) text-(--marca-texto)">
            <Globe2 className="h-4 w-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500">
              Tu enlace público permanente
            </p>
            <p className="truncate font-mono text-xs font-semibold text-vuki-ink sm:text-sm">
              /{negocio.slug}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void copiarEnlacePublico()}
            className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {enlaceCopiado ? (
              <>
                <Check
                  className="h-3.5 w-3.5 text-emerald-600"
                  aria-hidden="true"
                />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                Copiar enlace
              </>
            )}
          </button>
          <Link
            href={`/${negocio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-vuki-ink px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            Ver perfil público
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.45fr_1fr]">
        {/* Columna izquierda: formulario principal del negocio */}
        <form action={formAction} className="space-y-6">
          {/* Bloque 1: Identidad y contacto */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="font-display text-base font-bold text-vuki-ink">
                Identidad y contacto público
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Información principal que ven tus clientes al abrir tu enlace.
              </p>
            </div>

            <div>
              <label
                htmlFor="nombre"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Nombre del negocio
              </label>
              <input
                id="nombre"
                name="nombre"
                required
                minLength={2}
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Kayak Manglar Tours"
                className={INPUT}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-slate-700"
                >
                  Biografía del negocio
                </label>
                <span className="text-xs text-slate-400">
                  {descripcion.length}/1000
                </span>
              </div>
              <textarea
                id="descripcion"
                name="descripcion"
                rows={4}
                maxLength={1000}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Cuenta dónde están ubicados, qué hace especial su experiencia y qué deben saber los visitantes..."
                className={INPUT}
              />
            </div>

            <div>
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="whatsapp_local"
                  className="block text-sm font-medium text-slate-700"
                >
                  WhatsApp de contacto{" "}
                  <span className="font-normal text-slate-400">(opcional)</span>
                </label>
                {digitosWhatsApp.length > 0 && (
                  <span
                    className={`text-xs font-medium ${
                      whatsappCompletoValido
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {whatsappCompletoValido
                      ? "✓ Número completo"
                      : `${digitosWhatsApp.length}/${digitosRequeridos} dígitos`}
                  </span>
                )}
              </div>
              <input type="hidden" name="whatsapp" value={whatsappCompleto} />
              <input type="hidden" name="whatsapp_pais" value={paisActual.iso} />
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  id="whatsapp_pais"
                  aria-label="Código de país para WhatsApp"
                  value={paisActual.iso}
                  onChange={(event) => {
                    const nuevoPais = obtenerPaisPorIso(event.target.value);
                    setPaisIso(nuevoPais.iso);
                    setDigitosWhatsApp((prev) =>
                      prev.slice(0, totalDigitosPais(nuevoPais)),
                    );
                  }}
                  className="vuki-focus min-h-11 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 focus:border-sky-500 sm:w-56"
                >
                  {PAISES_TELEFONO.map((pais) => (
                    <option key={pais.iso} value={pais.iso}>
                      {pais.bandera} {pais.nombre} (+{pais.codigo})
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <input
                    id="whatsapp_local"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={whatsappFormateado}
                    onChange={(event) => {
                      setDigitosWhatsApp(
                        extraerDigitosLocales(event.target.value, paisActual),
                      );
                    }}
                    placeholder={paisActual.ejemplo}
                    className={`${INPUT} pr-9 font-mono tracking-wide`}
                  />
                  {digitosWhatsApp.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setDigitosWhatsApp("")}
                      aria-label="Limpiar número de WhatsApp"
                      className="vuki-focus absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Muestra un botón directo a tu chat de WhatsApp en tu enlace
                público (ej. +{paisActual.codigo} {paisActual.ejemplo}).
              </p>
            </div>
          </section>

          {/* Bloque 2: Apariencia visual */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-vuki-ink">
                <Palette className="h-4 w-4 text-slate-500" aria-hidden="true" />
                Apariencia visual
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Personaliza tus colores, logotipo y fotografía de portada.
              </p>
            </div>

            <ParColoresMarca
              key={resetKey}
              primarioInicial={baseGuardada.primario}
              secundarioInicial={baseGuardada.secundario}
              onChange={setColores}
            />

            <ImagePicker
              label="Logotipo"
              description="Se muestra en tu perfil público y como respaldo en servicios sin foto propia."
              name="logo"
              aspect="square"
              maxImagenMb={maxImagenMb}
              previewUrl={logoPreview}
              tienePersonalizadaGuardada={Boolean(savedLogoUrl)}
              selectedFile={logoFile}
              markedForRemoval={eliminarLogo}
              onSelectFile={setLogoFile}
              onToggleRemoval={setEliminarLogo}
            />

            <ImagePicker
              label="Imagen de portada"
              description="Fotografía panorámica en la cabecera de tu enlace público."
              name="portada"
              aspect="wide"
              maxImagenMb={maxImagenMb}
              previewUrl={portadaPreview}
              tienePersonalizadaGuardada={Boolean(savedPortadaUrl)}
              selectedFile={portadaFile}
              markedForRemoval={eliminarPortada}
              onSelectFile={setPortadaFile}
              onToggleRemoval={setEliminarPortada}
            />
          </section>

          {/* Bloque 3: Datos bancarios (IBAN) */}
          <section
            id="liquidacion"
            className="scroll-mt-24 space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div>
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-vuki-ink">
                <CreditCard
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                Datos bancarios de referencia
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Cuenta IBAN registrada en tu negocio para control financiero y
                liquidaciones.
              </p>
            </div>

            <div>
              <label
                htmlFor="cuenta_iban"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Cuenta IBAN
              </label>
              <input
                id="cuenta_iban"
                name="cuenta_iban"
                value={formatearIbanGrupos(ibanLimpio)}
                onChange={(e) => setIbanLimpio(limpiarIban(e.target.value))}
                placeholder="CR00 0000 0000 0000 0000 00"
                spellCheck={false}
                autoCapitalize="characters"
                className={`${INPUT} font-mono uppercase tracking-wider`}
              />
              <p className="mt-1.5 text-xs text-slate-500">
                En Costa Rica consta de <code className="rounded bg-slate-100 px-1">CR</code>{" "}
                seguido de 20 dígitos (22 caracteres en total).
              </p>
            </div>
          </section>

          <SubmitButton hayCambios={hayCambios} onDescartar={descartarCambios} />
        </form>

        {/* Columna derecha: vista previa en vivo + seguridad de cuenta */}
        <div className="space-y-5 lg:sticky lg:top-6">
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

                {digitosWhatsApp.length > 0 && (
                  <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    WhatsApp +{paisActual.codigo}
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
                    Experiencia destacada
                  </p>
                  <p className="text-[11px] text-slate-500">2 horas · $35.00</p>
                </div>
                <span
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold shadow-sm"
                  style={{
                    background: degradadoPreview,
                    color: textoSobre(colores.primario),
                  }}
                >
                  Reservar
                </span>
              </div>
            </div>
          </section>

          <SeccionCuentaAcceso slug={negocio.slug} emailCuenta={emailCuenta} />
        </div>
      </div>
    </div>
  );
}
