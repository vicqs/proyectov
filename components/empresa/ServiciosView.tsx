"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarCheck,
  Clock,
  DollarSign,
  ExternalLink,
  ImageIcon,
  ListChecks,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { esImagenOptimizable } from "../../lib/tipos-publicos";
import { formatearMoneda } from "@/lib/formato";
import {
  LISTA_MONEDAS,
  normalizarMoneda,
  obtenerInfoMoneda,
  type CodigoMoneda,
} from "@/lib/monedas";
import { mensajeErrorUsuario } from "../../lib/errores";
import type { TipoUnidadServicio } from "@/types/database";

export interface VistaServicio {
  id: string;
  nombre: string;
  precioUsd: number;
  moneda?: CodigoMoneda;
  duracionMin: number;
  /** `cupo` (por defecto, con horarios) o `item` (venta directa que descuenta stock). */
  tipoUnidad?: TipoUnidadServicio;
  /** Unidades disponibles cuando `tipoUnidad === "item"`. */
  stock?: number | null;
  descripcion?: string;
  imagenUrl?: string;
  /** Horarios futuros publicados para este servicio. */
  horariosActivos?: number;
  /** Total de reservas asociadas (si > 0, el historial impide eliminarlo). */
  reservasTotales?: number;
}

export interface DatosServicio {
  nombre: string;
  precioUsd: number;
  moneda: CodigoMoneda;
  duracionMin: number;
  tipoUnidad: TipoUnidadServicio;
  stock: number | null;
  descripcion: string;
  imagenUrl: string;
}

/** Devuelve un mensaje de error, o nada si la operación fue exitosa. */
type Resultado = string | void | Promise<string | void>;

interface ServiciosViewProps {
  servicios: VistaServicio[];
  /** Moneda operativa predeterminada del negocio para nuevos servicios. */
  monedaNegocio?: CodigoMoneda;
  /** Muestra los campos descripción e imagen. */
  conDetalle?: boolean;
  descripcionPagina?: string;
  /** Abre automáticamente el formulario de nuevo servicio al cargar (`?nuevo=1`). */
  abrirInicial?: boolean;
  /** Enlaces opcionales para conectar el catálogo con horarios, reservas y perfil público. */
  hrefPublico?: string;
  hrefHorarios?: string;
  hrefReservas?: string;
  onCerrarInicial?: () => void;
  onGuardar: (id: string | null, datos: DatosServicio) => Resultado;
  onEliminar: (id: string) => Resultado;
}

interface FormValues {
  nombre: string;
  descripcion: string;
  precioUsd: string;
  moneda: CodigoMoneda;
  duracionMin: string;
  tipoUnidad: TipoUnidadServicio;
  stock: string;
  imagenUrl: string;
}

function crearFormVacio(moneda: CodigoMoneda): FormValues {
  return {
    nombre: "",
    descripcion: "",
    precioUsd: "",
    moneda,
    duracionMin: "120",
    tipoUnidad: "cupo",
    stock: "10",
    imagenUrl: "",
  };
}

const STOCKS_RAPIDOS = ["5", "10", "20", "50", "100"];

const DURACIONES_RAPIDAS: { valor: string; etiqueta: string }[] = [
  { valor: "30", etiqueta: "30 min" },
  { valor: "60", etiqueta: "1 h" },
  { valor: "90", etiqueta: "1.5 h" },
  { valor: "120", etiqueta: "2 h" },
  { valor: "180", etiqueta: "3 h" },
  { valor: "240", etiqueta: "4 h" },
  { valor: "480", etiqueta: "8 h" },
];

const INPUT = "vuki-input min-h-11";

function formatearDuracion(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return "";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) {
    return `${horas} ${horas === 1 ? "hora" : "horas"} (${minutos} min)`;
  }
  return `${horas} h ${resto} min (${minutos} min)`;
}

function esUrlHttpsValida(valor: string): boolean {
  const limpio = valor.trim();
  if (!limpio) return false;
  try {
    const url = new URL(limpio);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Gestión de servicios compartida por `/[slug]/admin/servicios`: tarjetas
 * con estado operativo (horarios y reservas), edición en Drawer lateral,
 * vista previa de imagen y confirmación de borrado.
 */
export default function ServiciosView({
  servicios,
  monedaNegocio = "USD",
  conDetalle = false,
  descripcionPagina = "Configura tus experiencias, precios y duración. Los cambios se reflejan al instante en tu enlace público.",
  abrirInicial = false,
  hrefPublico,
  hrefHorarios,
  hrefReservas,
  onCerrarInicial,
  onGuardar,
  onEliminar,
}: ServiciosViewProps) {
  const monedaPorDefecto = normalizarMoneda(monedaNegocio, "USD");
  const [drawerAbierto, setDrawerAbierto] = useState<boolean>(abrirInicial);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(() =>
    crearFormVacio(monedaPorDefecto),
  );
  const [guardando, setGuardando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [imagenesFallidas, setImagenesFallidas] = useState<
    Record<string, boolean>
  >({});
  const [porEliminar, setPorEliminar] = useState<VistaServicio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const resumen = useMemo(() => {
    // Los ítems de venta directa no usan horarios: no cuentan como "sin horarios".
    const porCupos = servicios.filter((s) => s.tipoUnidad !== "item");
    const conDatoHorarios = porCupos.some(
      (s) => s.horariosActivos !== undefined,
    );
    const sinHorarios = conDatoHorarios
      ? porCupos.filter((s) => (s.horariosActivos ?? 0) === 0).length
      : 0;
    const conHorarios = conDatoHorarios
      ? porCupos.filter((s) => (s.horariosActivos ?? 0) > 0).length
      : 0;
    const items = servicios.filter((s) => s.tipoUnidad === "item");
    const agotados = items.filter((s) => (s.stock ?? 0) <= 0).length;
    return {
      conDatoHorarios,
      sinHorarios,
      conHorarios,
      totalItems: items.length,
      agotados,
    };
  }, [servicios]);

  const serviciosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return servicios;
    return servicios.filter((s) =>
      `${s.nombre} ${s.descripcion ?? ""}`.toLowerCase().includes(q),
    );
  }, [servicios, busqueda]);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(crearFormVacio(monedaPorDefecto));
    setDrawerAbierto(true);
  }

  function abrirEdicion(servicio: VistaServicio) {
    setEditandoId(servicio.id);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? "",
      precioUsd: String(servicio.precioUsd),
      moneda: normalizarMoneda(servicio.moneda, monedaPorDefecto),
      duracionMin: String(servicio.duracionMin),
      tipoUnidad: servicio.tipoUnidad ?? "cupo",
      stock: String(servicio.stock ?? 0),
      imagenUrl: servicio.imagenUrl ?? "",
    });
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    if (guardando) return;
    setDrawerAbierto(false);
    onCerrarInicial?.();
  }

  function marcarImagenFallida(url: string) {
    setImagenesFallidas((prev) => ({ ...prev, [url]: true }));
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    const nombreLimpio = form.nombre.trim();
    const precio = Number(form.precioUsd);
    const duracion = Number(form.duracionMin);
    const esItemForm = form.tipoUnidad === "item";
    const stockNum = Number(form.stock);

    if (nombreLimpio.length < 2) {
      toast.error("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    const infoMonedaActual = obtenerInfoMoneda(form.moneda);
    if (!Number.isFinite(precio) || precio <= 0) {
      toast.error(`Ingresa un precio mayor a ${infoMonedaActual.simbolo}0.`);
      return;
    }
    if (precio > infoMonedaActual.maxPrecioServicio) {
      toast.error(
        `El precio supera el máximo permitido para ${infoMonedaActual.codigo} (${infoMonedaActual.maxPrecioServicio.toLocaleString("es-CR")}).`,
      );
      return;
    }
    if (esItemForm) {
      if (
        !Number.isInteger(stockNum) ||
        stockNum < 0 ||
        stockNum > 100_000
      ) {
        toast.error("Las unidades disponibles deben ser un entero entre 0 y 100000.");
        return;
      }
    } else if (!Number.isInteger(duracion) || duracion < 1) {
      toast.error("La duración debe ser un número entero de minutos.");
      return;
    }
    const urlLimpia = form.imagenUrl.trim();
    if (urlLimpia) {
      try {
        new URL(urlLimpia);
      } catch {
        toast.error("La URL de la imagen no es válida (ej. https://...).");
        return;
      }
    }

    setGuardando(true);
    try {
      const error = await onGuardar(editandoId, {
        nombre: nombreLimpio,
        descripcion: form.descripcion,
        precioUsd: precio,
        moneda: form.moneda,
        duracionMin: esItemForm ? 0 : duracion,
        tipoUnidad: form.tipoUnidad,
        stock: esItemForm ? stockNum : null,
        imagenUrl: urlLimpia,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(
        editandoId
          ? "Servicio actualizado con éxito"
          : "Servicio creado con éxito",
      );
      setDrawerAbierto(false);
    } catch (e) {
      toast.error(
        mensajeErrorUsuario(
          e,
          "No se pudo guardar el servicio. Intenta de nuevo.",
        ),
      );
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!porEliminar || eliminando) return;
    setEliminando(true);
    try {
      const error = await onEliminar(porEliminar.id);
      if (error) {
        toast.error(error);
      } else {
        toast.success(`"${porEliminar.nombre}" eliminado`);
      }
      setPorEliminar(null);
    } catch (e) {
      toast.error(
        mensajeErrorUsuario(
          e,
          "No se pudo eliminar el servicio. Intenta de nuevo.",
        ),
      );
    } finally {
      setEliminando(false);
    }
  }

  const urlFormLimpia = form.imagenUrl.trim();
  const urlFormEsHttpSinS =
    urlFormLimpia.startsWith("http://") && !urlFormLimpia.startsWith("https://");
  const mostrarPreviewForm =
    esUrlHttpsValida(urlFormLimpia) && !imagenesFallidas[urlFormLimpia];
  const duracionNum = Number(form.duracionMin);

  return (
    <EmpresaPage
      titulo="Mis Servicios"
      descripcion={descripcionPagina}
      accion={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {hrefPublico && servicios.length > 0 && (
            <Link
              href={hrefPublico}
              target="_blank"
              rel="noopener noreferrer"
              className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:flex-none"
            >
              Ver enlace público
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
          <motion.button
            type="button"
            onClick={abrirNuevo}
            whileTap={{ scale: 0.96 }}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo servicio
          </motion.button>
        </div>
      }
    >
      {/* Barra de resumen operativo y buscador */}
      {servicios.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-(--marca-borde) bg-white px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--marca-fondo) px-3 py-1 font-semibold text-(--marca-texto)">
              <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
              {servicios.length}{" "}
              {servicios.length === 1 ? "servicio" : "servicios"}
            </span>

            {resumen.conDatoHorarios && resumen.conHorarios > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
                <Clock className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                {resumen.conHorarios} con horarios activos
              </span>
            )}

            {resumen.conDatoHorarios && resumen.sinHorarios > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 ring-1 ring-amber-200/80">
                <AlertTriangle
                  className="h-3.5 w-3.5 text-amber-600"
                  aria-hidden="true"
                />
                {resumen.sinHorarios} sin horarios publicados
              </span>
            )}

            {resumen.totalItems > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">
                <Package className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                {resumen.totalItems}{" "}
                {resumen.totalItems === 1 ? "ítem de venta directa" : "ítems de venta directa"}
              </span>
            )}

            {resumen.agotados > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 font-medium text-red-700 ring-1 ring-red-200/80">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                {resumen.agotados} {resumen.agotados === 1 ? "agotado" : "agotados"}
              </span>
            )}
          </div>

          {servicios.length > 2 && (
            <div className="relative w-full sm:w-60">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar servicio"
                placeholder="Buscar servicio..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="vuki-input-search-sm pr-3"
              />
            </div>
          )}
        </div>
      )}

      {servicios.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-(--marca-borde) bg-(--marca-fondo) p-6 text-center sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-(--marca-texto) shadow-sm">
            <ListChecks className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-display text-base font-bold text-vuki-ink sm:text-lg">
            Aún no has creado servicios
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-slate-600">
            Agrega los tours, clases o experiencias que ofreces con su precio y
            duración para mostrarlos en tu enlace público y asignarles horarios.
          </p>
          <button
            type="button"
            onClick={abrirNuevo}
            className="vuki-focus mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Crear mi primer servicio
          </button>
        </div>
      ) : serviciosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          <p>Ningún servicio coincide con &ldquo;{busqueda}&rdquo;.</p>
          <button
            type="button"
            onClick={() => setBusqueda("")}
            className="vuki-focus mt-3 inline-flex min-h-9 items-center rounded-xl border border-slate-300 px-3.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <Lista
          key={busqueda}
          as="section"
          className="grid gap-4 sm:grid-cols-2"
        >
          {serviciosFiltrados.map((servicio) => {
            const urlImg = servicio.imagenUrl?.trim() ?? "";
            const tieneImagenPropia =
              conDetalle &&
              esUrlHttpsValida(urlImg) &&
              !imagenesFallidas[urlImg];
            const sinDescripcion =
              conDetalle && !servicio.descripcion?.trim();
            const esItem = servicio.tipoUnidad === "item";
            const stockActual = servicio.stock ?? 0;
            const sinHorarios =
              !esItem &&
              servicio.horariosActivos !== undefined &&
              servicio.horariosActivos === 0;
            const tieneReservas = (servicio.reservasTotales ?? 0) > 0;

            return (
              <ItemLista key={servicio.id} as="article">
                <div className="flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <div>
                    {/* Miniatura opcional cuando el servicio tiene imagen configurada */}
                    {tieneImagenPropia && (
                      <div className="relative h-36 w-full bg-slate-100">
                        <Image
                          src={urlImg}
                          unoptimized={!esImagenOptimizable(urlImg)}
                          alt={`Imagen de ${servicio.nombre}`}
                          fill
                          loading="eager"
                          sizes="(max-width: 640px) 100vw, 480px"
                          onError={() => marcarImagenFallida(urlImg)}
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                      </div>
                    )}

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="min-w-0 break-words font-display text-base font-bold tracking-tight text-vuki-ink sm:text-lg">
                          {servicio.nombre}
                        </h2>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-(--marca-2-fondo) px-3 py-1 font-display text-sm font-bold text-(--marca-2-texto) ring-1 ring-(--marca-2-borde)">
                          {formatearMoneda(
                            servicio.precioUsd,
                            servicio.moneda ?? monedaPorDefecto,
                          )}
                        </span>
                      </div>

                      {/* Metadatos: duración, reservas y estado de horarios/contenido */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        {esItem ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 font-medium text-sky-800">
                            <Package className="h-3.5 w-3.5 text-sky-600" aria-hidden="true" />
                            Venta directa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            <Clock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                            {formatearDuracion(servicio.duracionMin)}
                          </span>
                        )}

                        {hrefReservas && tieneReservas ? (
                          <Link
                            href={hrefReservas}
                            title="Ver reservas de este servicio"
                            className="vuki-focus inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
                          >
                            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                            {servicio.reservasTotales ?? 0}{" "}
                            {(servicio.reservasTotales ?? 0) === 1
                              ? "reserva"
                              : "reservas"}
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                            <CalendarCheck className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                            {servicio.reservasTotales ?? 0}{" "}
                            {(servicio.reservasTotales ?? 0) === 1
                              ? "reserva"
                              : "reservas"}
                          </span>
                        )}

                        {esItem ? (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                              stockActual <= 0
                                ? "bg-red-50 text-red-700 ring-1 ring-red-200/80"
                                : stockActual <= 5
                                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
                                  : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {stockActual <= 0
                              ? "Agotado"
                              : `${stockActual} ${stockActual === 1 ? "unidad disponible" : "unidades disponibles"}`}
                          </span>
                        ) : (
                          servicio.horariosActivos !== undefined && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold ${
                                sinHorarios
                                  ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
                                  : "bg-emerald-50 text-emerald-800"
                              }`}
                            >
                              {sinHorarios
                                ? "Sin horarios publicados"
                                : `${servicio.horariosActivos} ${servicio.horariosActivos === 1 ? "horario activo" : "horarios activos"}`}
                            </span>
                          )
                        )}

                        {conDetalle && !tieneImagenPropia && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-500">
                            <ImageIcon className="h-3 w-3" aria-hidden="true" />
                            Imagen genérica
                          </span>
                        )}
                      </div>

                      {conDetalle &&
                        (servicio.descripcion?.trim() ? (
                          <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">
                            {servicio.descripcion}
                          </p>
                        ) : (
                          sinDescripcion && (
                            <p className="mt-3 text-xs italic text-slate-400">
                              Sin descripción. Agrégala en Editar para contar
                              qué incluye la experiencia.
                            </p>
                          )
                        ))}
                    </div>
                  </div>

                  {/* Barra inferior de acciones explícitas */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => abrirEdicion(servicio)}
                        className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        Editar
                      </button>

                      {esItem
                        ? hrefReservas && (
                            <Link
                              href={`${hrefReservas}?nueva=1`}
                              className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-(--marca-borde) bg-(--marca-fondo) px-3 py-1.5 text-xs font-semibold text-(--marca-texto) transition hover:brightness-95"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              Registrar venta
                            </Link>
                          )
                        : hrefHorarios && (
                            <Link
                              href={`${hrefHorarios}?nuevo=1&servicio=${encodeURIComponent(servicio.id)}`}
                              className={`vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                                sinHorarios
                                  ? "bg-vuki-ink text-white shadow-sm hover:bg-slate-800"
                                  : "border border-(--marca-borde) bg-(--marca-fondo) text-(--marca-texto) hover:brightness-95"
                              }`}
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                              {sinHorarios ? "Publicar horario" : "Horario"}
                            </Link>
                          )}
                    </div>

                    <button
                      type="button"
                      disabled={tieneReservas}
                      onClick={() => !tieneReservas && setPorEliminar(servicio)}
                      title={
                        tieneReservas
                          ? "No se puede eliminar un servicio con reservas registradas"
                          : undefined
                      }
                      aria-label={`Quitar ${servicio.nombre}`}
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition ${
                        tieneReservas
                          ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 opacity-60"
                          : "vuki-focus border-red-200 bg-white text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      Quitar
                    </button>
                  </div>
                </div>
              </ItemLista>
            );
          })}
        </Lista>
      )}

      <Drawer
        abierto={drawerAbierto}
        onClose={cerrarDrawer}
        titulo={editandoId ? "Editar servicio" : "Nuevo servicio"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label
              htmlFor="nombre"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nombre del servicio
            </label>
            <input
              id="nombre"
              required
              minLength={2}
              maxLength={100}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej. Tour en kayak por el manglar"
              className={INPUT}
            />
          </div>

          <fieldset>
            <legend className="mb-1.5 block text-sm font-medium text-slate-700">
              ¿Cómo se vende?
            </legend>
            <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-2">
              {(
                [
                  {
                    valor: "cupo",
                    titulo: "Por cupos y horario",
                    detalle: "Por defecto. Salidas, tours o clases con fecha, hora y cupos.",
                    icono: Clock,
                  },
                  {
                    valor: "item",
                    titulo: "Por ítems (venta rápida)",
                    detalle: "Ferias o stands. Se paga y simplemente se rebaja el stock.",
                    icono: Package,
                  },
                ] as const
              ).map(({ valor, titulo, detalle, icono: Icono }) => {
                const activo = form.tipoUnidad === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setForm({ ...form, tipoUnidad: valor })}
                    className={`vuki-focus flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition ${
                      activo
                        ? "border-(--marca) bg-(--marca-fondo) ring-1 ring-(--marca-borde)"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-bold text-vuki-ink">
                      <Icono className="h-3.5 w-3.5" aria-hidden="true" />
                      {titulo}
                    </span>
                    <span className="text-[11px] leading-snug text-slate-600">
                      {detalle}
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {conDetalle && (
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label
                  htmlFor="descripcion"
                  className="block text-sm font-medium text-slate-700"
                >
                  Descripción
                </label>
                <span className="text-xs text-slate-400">
                  {form.descripcion.length}/500
                </span>
              </div>
              <textarea
                id="descripcion"
                rows={3}
                maxLength={500}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Cuenta qué incluye, nivel requerido o punto de encuentro..."
                className="vuki-textarea"
              />
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label
                htmlFor="moneda_servicio"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Moneda del servicio
              </label>
              <select
                id="moneda_servicio"
                value={form.moneda}
                onChange={(e) =>
                  setForm({
                    ...form,
                    moneda: normalizarMoneda(e.target.value, monedaPorDefecto),
                  })
                }
                className="vuki-select min-h-11 w-full"
              >
                {LISTA_MONEDAS.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} ({m.simbolo}) — {m.nombreEs}
                  </option>
                ))}
              </select>
            </div>

            {(() => {
              const infoMoneda = obtenerInfoMoneda(form.moneda);
              const claseMonedaInput =
                infoMoneda.simbolo.length > 1
                  ? "vuki-input-currency-wide"
                  : "vuki-input-currency";
              return (
                <>
                  <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
                    <div>
                      <label
                        htmlFor="precio_usd"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        Precio por {form.tipoUnidad === "item" ? "ítem" : "cupo"} ({infoMoneda.codigo})
                      </label>
                      <div className="relative">
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 select-none"
                        >
                          {infoMoneda.simbolo}
                        </span>
                        <input
                          id="precio_usd"
                          type="number"
                          step={infoMoneda.stepInput}
                          min={infoMoneda.stepInput}
                          max={infoMoneda.maxPrecioServicio}
                          required
                          value={form.precioUsd}
                          onChange={(e) =>
                            setForm({ ...form, precioUsd: e.target.value })
                          }
                          placeholder={infoMoneda.ejemploPrecio}
                          className={`${INPUT} ${claseMonedaInput}`}
                        />
                      </div>
                    </div>

                    <div>
                      {form.tipoUnidad === "item" ? (
                        <>
                          <label
                            htmlFor="stock_servicio"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                          >
                            Unidades disponibles (stock)
                          </label>
                          <input
                            id="stock_servicio"
                            type="number"
                            min="0"
                            max="100000"
                            step="1"
                            required
                            value={form.stock}
                            onChange={(e) =>
                              setForm({ ...form, stock: e.target.value })
                            }
                            className={INPUT}
                          />
                        </>
                      ) : (
                        <>
                          <label
                            htmlFor="duracion_min"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                          >
                            Duración (min)
                          </label>
                          <input
                            id="duracion_min"
                            type="number"
                            min="1"
                            max="10080"
                            step="1"
                            required
                            value={form.duracionMin}
                            onChange={(e) =>
                              setForm({ ...form, duracionMin: e.target.value })
                            }
                            className={INPUT}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  {/* Atajos rápidos de precio */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-xs text-slate-500">
                      Precio rápido:
                    </span>
                    {infoMoneda.preciosRapidos.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setForm({ ...form, precioUsd: p })}
                        className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                          form.precioUsd === p
                            ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {formatearMoneda(Number(p), infoMoneda.codigo, {
                          decimales: 0,
                        })}
                      </button>
                    ))}
                  </div>
                </>
              );
            })()}

            {/* Atajos rápidos de stock (ítems) o duración (cupos) */}
            {form.tipoUnidad === "item" ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-slate-500">Stock rápido:</span>
                {STOCKS_RAPIDOS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm({ ...form, stock: s })}
                    className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      form.stock === s
                        ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="mr-1 text-xs text-slate-500">Duración:</span>
                {DURACIONES_RAPIDAS.map((d) => (
                  <button
                    key={d.valor}
                    type="button"
                    onClick={() => setForm({ ...form, duracionMin: d.valor })}
                    className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                      form.duracionMin === d.valor
                        ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {d.etiqueta}
                  </button>
                ))}
              </div>
            )}

            {form.tipoUnidad === "item" ? (
              <p className="text-xs text-slate-500">
                Cada compra en línea o venta manual descuenta unidades del stock
                al instante; si se cancela, las unidades regresan.
              </p>
            ) : (
              duracionNum >= 60 && (
                <p className="text-xs text-slate-500">
                  Equivale a{" "}
                  <strong className="font-semibold text-slate-700">
                    {formatearDuracion(duracionNum)}
                  </strong>{" "}
                  en tu tarjeta pública.
                </p>
              )
            )}
          </div>

          {conDetalle && (
            <div>
              <label
                htmlFor="imagen_url"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                URL de imagen{" "}
                <span className="font-normal text-slate-400">(opcional)</span>
              </label>
              <input
                id="imagen_url"
                type="url"
                value={form.imagenUrl}
                onChange={(e) =>
                  setForm({ ...form, imagenUrl: e.target.value })
                }
                placeholder="https://images.unsplash.com/..."
                className={INPUT}
              />
              {urlFormEsHttpSinS ? (
                <p className="mt-1.5 text-xs text-amber-700">
                  Usa un enlace seguro que empiece con{" "}
                  <code className="rounded bg-amber-50 px-1">https://</code>{" "}
                  para previsualizarlo correctamente.
                </p>
              ) : mostrarPreviewForm ? (
                <div className="relative mt-2.5 h-32 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <Image
                    src={urlFormLimpia}
                    unoptimized={!esImagenOptimizable(urlFormLimpia)}
                    alt="Vista previa de imagen del servicio"
                    fill
                    loading="eager"
                    sizes="380px"
                    onError={() => marcarImagenFallida(urlFormLimpia)}
                    className="object-cover"
                  />
                </div>
              ) : urlFormLimpia && imagenesFallidas[urlFormLimpia] ? (
                <p className="mt-1.5 text-xs text-amber-700">
                  No se pudo cargar la vista previa de este enlace. Verifica que
                  apunte directamente a una imagen pública.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">
                  Si lo dejas vacío, se mostrará el logo de tu negocio o una
                  fotografía costera por defecto.
                </p>
              )}
            </div>
          )}

          <motion.button
            type="submit"
            disabled={guardando}
            whileTap={{ scale: 0.97 }}
            className="vuki-focus mt-1 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : editandoId ? (
              <Pencil className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editandoId ? "Guardar cambios" : "Crear servicio"}
          </motion.button>
        </form>
      </Drawer>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Eliminar este servicio?"
        descripcion={
          porEliminar
            ? `"${porEliminar.nombre}" y sus horarios sin reservas dejarán de mostrarse en tu enlace público. Esta acción no se puede deshacer.`
            : ""
        }
        cargando={eliminando}
        textoCargando="Eliminando..."
        onConfirmar={() => {
          if (!eliminando) void handleEliminar();
        }}
        onCancelar={() => {
          if (!eliminando) setPorEliminar(null);
        }}
      />
    </EmpresaPage>
  );
}
