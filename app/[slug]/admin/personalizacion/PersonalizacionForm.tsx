"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Globe2,
  Loader2,
  Palette,
  RotateCcw,
  Save,
  X,
} from "lucide-react";
import {
  actualizarPersonalizacionAction,
  type PersonalizacionActionState,
} from "@/actions/personalizacion";
import type { Negocio } from "@/types/database";
import { toast } from "@/components/Toast";
import ParColoresMarca from "@/components/empresa/ParColoresMarca";
import { COLOR_PRIMARIO_DEFECTO, esHex } from "@/lib/color";
import { conResilienciaRed } from "@/lib/errores";
import {
  LISTA_MONEDAS,
  normalizarMoneda,
  type CodigoMoneda,
} from "@/lib/monedas";
import { LOGO_POR_DEFECTO, PORTADA_POR_DEFECTO } from "@/lib/tipos-publicos";
import {
  PAISES_TELEFONO,
  descomponerTelefono,
  extraerDigitosLocales,
  formatearNumeroLocal,
  obtenerPaisPorIso,
  totalDigitosPais,
} from "@/lib/telefono";
import CambiarContrasenaCard from "./CambiarContrasenaCard";
import VistaPreviaPerfilPublico, {
  ImagePicker,
} from "./VistaPreviaPerfilPublico";

const initialState: PersonalizacionActionState = {};

const INPUT = "vuki-input min-h-11";

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

export type NegocioPersonalizacion = Pick<
  Negocio,
  | "slug"
  | "nombre"
  | "descripcion"
  | "cuenta_iban"
  | "moneda"
  | "whatsapp"
  | "color_tema"
  | "color_secundario"
  | "logo_url"
  | "imagen_portada_url"
  | "email_contacto"
>;

export default function PersonalizacionForm({
  negocio,
  emailCuenta = "",
  maxImagenMb = 2,
}: {
  negocio: NegocioPersonalizacion;
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

  const monedaInicial = normalizarMoneda(negocio.moneda, "USD");
  const [nombre, setNombre] = useState(negocio.nombre);
  const [descripcion, setDescripcion] = useState(negocio.descripcion ?? "");
  const [ibanLimpio, setIbanLimpio] = useState(
    limpiarIban(negocio.cuenta_iban ?? ""),
  );
  const [moneda, setMoneda] = useState<CodigoMoneda>(monedaInicial);
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
    moneda: monedaInicial,
    whatsapp: negocio.whatsapp ?? "",
    primario: colorPrimarioBase,
    secundario: colorSecundarioBase,
  });
  const ultimoEnvioRef = useRef(baseGuardada);

  const [state, formAction, isPending] = useActionState(
    conResilienciaRed(
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
          moneda: normalizarMoneda(formData.get("moneda"), moneda),
          whatsapp: String(formData.get("whatsapp") ?? "").trim(),
          primario: String(formData.get("color_tema") ?? colores.primario),
          secundario: String(
            formData.get("color_secundario") ?? colores.secundario,
          ),
        };

        return actualizarPersonalizacionAction(
          negocio.slug,
          prevState,
          formData,
        );
      },
    ),
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
    setMoneda(baseGuardada.moneda);
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
    moneda !== baseGuardada.moneda ||
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
    <div className={`space-y-6 ${hayCambios ? "pb-24" : ""}`}>
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
          {hayCambios && (
            <button
              type="submit"
              form="form-personalizacion"
              disabled={isPending}
              className="vuki-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-vuki-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              {isPending ? "Guardando..." : "Guardar cambios"}
            </button>
          )}
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
        <form
          id="form-personalizacion"
          action={formAction}
          className="space-y-6"
        >
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
                className="vuki-textarea"
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
                  className="vuki-select min-h-11 w-full sm:w-64 sm:shrink-0"
                >
                  {PAISES_TELEFONO.map((pais) => (
                    <option key={pais.iso} value={pais.iso}>
                      {pais.bandera} {pais.nombre} (+{pais.codigo})
                    </option>
                  ))}
                </select>
                <div className="relative min-w-0 flex-1">
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
                <Palette
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
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
              moneda={moneda}
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

          {/* Bloque 3: Moneda operativa y datos bancarios (IBAN) */}
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
                Moneda operativa y datos bancarios
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Elige la moneda principal de tu negocio y registra tu cuenta IBAN
                para control financiero y liquidaciones.
              </p>
            </div>

            <div>
              <label
                htmlFor="moneda"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Moneda predeterminada del negocio
              </label>
              <select
                id="moneda"
                name="moneda"
                value={moneda}
                onChange={(e) => setMoneda(normalizarMoneda(e.target.value, "USD"))}
                className="vuki-select min-h-11 w-full"
              >
                {LISTA_MONEDAS.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} ({m.simbolo}) — {m.nombreEs}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-xs text-slate-500">
                Se usará por defecto al crear servicios, resumir métricas del panel
                y mostrar precios iniciales en tu enlace público (donde tus clientes
                también pueden cambiar entre USD, CRC, CAD, EUR y GBP).
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
                En Costa Rica consta de{" "}
                <code className="rounded bg-slate-100 px-1">CR</code> seguido de
                20 dígitos (22 caracteres en total).
              </p>
            </div>
          </section>

          <SubmitButton hayCambios={hayCambios} onDescartar={descartarCambios} />
        </form>

        {/* Columna derecha: vista previa en vivo + seguridad de cuenta */}
        <div className="space-y-5 lg:sticky lg:top-6">
          <VistaPreviaPerfilPublico
            pasosCompletos={pasosCompletos}
            portadaPreview={portadaPreview}
            logoPreview={logoPreview}
            degradadoPreview={degradadoPreview}
            colorPrimario={colores.primario}
            nombre={nombre}
            descripcion={descripcion}
            moneda={moneda}
            tieneWhatsApp={digitosWhatsApp.length > 0}
            codigoPaisWhatsApp={paisActual.codigo}
          />

          <CambiarContrasenaCard
            slug={negocio.slug}
            emailCuenta={emailCuenta}
          />
        </div>
      </div>

      {/* Barra inferior fija (sticky) para guardar cambios */}
      {hayCambios && (
        <aside
          aria-label="Barra de guardado de cambios"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(15,23,42,0.08)] backdrop-blur-md sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <span
                aria-hidden="true"
                className="h-2 w-2 animate-pulse rounded-full bg-amber-500"
              />
              <span className="font-semibold text-slate-800">
                Tienes cambios sin guardar
              </span>
              <span className="hidden text-slate-500 md:inline">
                · Se reflejarán de inmediato en tu enlace público al guardar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={descartarCambios}
                disabled={isPending}
                className="vuki-focus inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                Descartar
              </button>

              <button
                type="submit"
                form="form-personalizacion"
                disabled={isPending}
                className="vuki-focus inline-flex min-h-10 items-center gap-2 rounded-xl bg-vuki-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                {isPending ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Save className="h-4 w-4" aria-hidden="true" />
                )}
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
