"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import AdminPage, { ItemLista, Lista } from "../AdminPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";

export interface VistaServicio {
  id: string;
  nombre: string;
  precioUsd: number;
  duracionMin: number;
  descripcion?: string;
  imagenUrl?: string;
}

export interface DatosServicio {
  nombre: string;
  precioUsd: number;
  duracionMin: number;
  descripcion: string;
  imagenUrl: string;
}

/** Devuelve un mensaje de error, o nada si la operación fue exitosa. */
type Resultado = string | void | Promise<string | void>;

interface ServiciosViewProps {
  servicios: VistaServicio[];
  /** Muestra los campos descripción e imagen (solo el demo los persiste). */
  conDetalle?: boolean;
  descripcionPagina?: string;
  onGuardar: (id: string | null, datos: DatosServicio) => Resultado;
  onEliminar: (id: string) => Resultado;
}

interface FormValues {
  nombre: string;
  descripcion: string;
  precioUsd: string;
  duracionMin: string;
  imagenUrl: string;
}

const FORM_VACIO: FormValues = {
  nombre: "",
  descripcion: "",
  precioUsd: "",
  duracionMin: "",
  imagenUrl: "",
};

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";

/**
 * Gestión de servicios compartida por `/admin` y `/demo/admin`: tarjetas
 * con edición en Drawer lateral, confirmación de borrado y toasts.
 */
export default function ServiciosView({
  servicios,
  conDetalle = false,
  descripcionPagina = "Los cambios se reflejan de inmediato en tu enlace público.",
  onGuardar,
  onEliminar,
}: ServiciosViewProps) {
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<VistaServicio | null>(null);
  const [eliminando, setEliminando] = useState(false);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setDrawerAbierto(true);
  }

  function abrirEdicion(servicio: VistaServicio) {
    setEditandoId(servicio.id);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? "",
      precioUsd: String(servicio.precioUsd),
      duracionMin: String(servicio.duracionMin),
      imagenUrl: servicio.imagenUrl ?? "",
    });
    setDrawerAbierto(true);
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.nombre || !form.precioUsd || !form.duracionMin) return;
    setGuardando(true);
    const error = await onGuardar(editandoId, {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precioUsd: Number(form.precioUsd),
      duracionMin: Number(form.duracionMin),
      imagenUrl: form.imagenUrl,
    });
    setGuardando(false);
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
  }

  async function handleEliminar() {
    if (!porEliminar) return;
    setEliminando(true);
    const error = await onEliminar(porEliminar.id);
    setEliminando(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(`"${porEliminar.nombre}" eliminado`);
    }
    setPorEliminar(null);
  }

  return (
    <AdminPage
      titulo="Mis Servicios"
      descripcion={descripcionPagina}
      accion={
        <motion.button
          type="button"
          onClick={abrirNuevo}
          whileTap={{ scale: 0.96 }}
          className="flex w-full flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo servicio
        </motion.button>
      }
    >
      {servicios.length === 0 ? (
        <p className="text-sm text-slate-500">Aún no has creado servicios.</p>
      ) : (
        <Lista as="section" className="grid gap-4 sm:grid-cols-2">
          {servicios.map((servicio) => (
            <ItemLista key={servicio.id} as="article">
              <div
                role="button"
                tabIndex={0}
                onClick={() => abrirEdicion(servicio)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    abrirEdicion(servicio);
                  }
                }}
                className="group relative h-full cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-slate-800">
                    {servicio.nombre}
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPorEliminar(servicio);
                    }}
                    aria-label={`Quitar ${servicio.nombre}`}
                    className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Quitar
                  </button>
                </div>
                {conDetalle && servicio.descripcion && (
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {servicio.descripcion}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {servicio.duracionMin} min
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
                    {servicio.precioUsd.toFixed(2)} USD
                  </span>
                </div>
              </div>
            </ItemLista>
          ))}
        </Lista>
      )}

      <Drawer
        abierto={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        titulo={editandoId ? "Editar servicio" : "Nuevo servicio"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="nombre"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Nombre
            </label>
            <input
              id="nombre"
              required
              minLength={2}
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Clase de surf 1h"
              className={INPUT}
            />
          </div>

          {conDetalle && (
            <div>
              <label
                htmlFor="descripcion"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Descripción
              </label>
              <textarea
                id="descripcion"
                rows={3}
                value={form.descripcion}
                onChange={(e) =>
                  setForm({ ...form, descripcion: e.target.value })
                }
                placeholder="Clase grupal con instructor certificado..."
                className={INPUT}
              />
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="precio_usd"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Precio (USD)
              </label>
              <input
                id="precio_usd"
                type="number"
                step="0.01"
                min="0.01"
                required
                value={form.precioUsd}
                onChange={(e) =>
                  setForm({ ...form, precioUsd: e.target.value })
                }
                className={INPUT}
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="duracion_min"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Duración (min)
              </label>
              <input
                id="duracion_min"
                type="number"
                min="1"
                step="1"
                required
                value={form.duracionMin}
                onChange={(e) =>
                  setForm({ ...form, duracionMin: e.target.value })
                }
                className={INPUT}
              />
            </div>
          </div>

          {conDetalle && (
            <div>
              <label
                htmlFor="imagen_url"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                URL de imagen (opcional)
              </label>
              <input
                id="imagen_url"
                value={form.imagenUrl}
                onChange={(e) =>
                  setForm({ ...form, imagenUrl: e.target.value })
                }
                placeholder="https://..."
                className={INPUT}
              />
            </div>
          )}

          <motion.button
            type="submit"
            disabled={guardando}
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
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
            ? `"${porEliminar.nombre}" se eliminará. Esta acción no se puede deshacer.`
            : ""
        }
        onConfirmar={() => {
          if (!eliminando) void handleEliminar();
        }}
        onCancelar={() => setPorEliminar(null)}
      />
    </AdminPage>
  );
}
