"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, DollarSign, Pencil, Plus, Trash2 } from "lucide-react";
import { mockNegocio } from "../../../../lib/mockData";
import {
  crearServicio,
  editarServicio,
  eliminarServicio,
  useDemoStore,
  type DemoServicio,
} from "../../../../lib/demoStore";
import Drawer from "../../../../components/Drawer";
import ConfirmDialog from "../../../../components/ConfirmDialog";
import { toast } from "../../../../components/Toast";

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop";

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

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemLista = {
  oculto: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Gestión premium de servicios: tarjetas con menú de tres puntos y el
 * formulario de crear/editar vive en un Drawer lateral (no incrustado en
 * la página). Equivalente demo de `/admin/servicios`, respaldado por
 * `lib/demoStore.ts` (localStorage).
 */
export default function AdminDemoServiciosPage() {
  const { servicios } = useDemoStore(mockNegocio.slug);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [form, setForm] = useState<FormValues>(FORM_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<DemoServicio | null>(null);

  function abrirNuevo() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setDrawerAbierto(true);
  }

  function abrirEdicion(servicio: DemoServicio) {
    setEditandoId(servicio.id);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      precioUsd: String(servicio.precioUsd),
      duracionMin: String(servicio.duracionMin),
      imagenUrl: servicio.imagenUrl,
    });
    setDrawerAbierto(true);
  }

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!form.nombre || !form.precioUsd || !form.duracionMin) return;
    setGuardando(true);

    const datos = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precioUsd: Number(form.precioUsd),
      duracionMin: Number(form.duracionMin),
      imagenUrl: form.imagenUrl || IMAGEN_POR_DEFECTO,
    };

    if (editandoId) {
      editarServicio(mockNegocio.slug, editandoId, datos);
      toast.success("Servicio actualizado con éxito");
    } else {
      crearServicio(mockNegocio.slug, datos);
      toast.success("Servicio creado con éxito");
    }

    setGuardando(false);
    setDrawerAbierto(false);
  }

  function handleEliminar(servicio: DemoServicio) {
    eliminarServicio(mockNegocio.slug, servicio.id);
    toast.success(`"${servicio.nombre}" eliminado`);
    setPorEliminar(null);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Mis Servicios
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Los cambios se reflejan de inmediato en tu enlace público.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={abrirNuevo}
          whileTap={{ scale: 0.96 }}
          className="flex w-full flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo servicio
        </motion.button>
      </div>

      <motion.section
        variants={contenedorLista}
        initial="oculto"
        animate="visible"
        className="mt-8 grid gap-4 sm:grid-cols-2"
      >
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has creado servicios.</p>
        ) : (
          servicios.map((servicio) => (
            <motion.article
              key={servicio.id}
              variants={itemLista}
              role="button"
              tabIndex={0}
              onClick={() => abrirEdicion(servicio)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  abrirEdicion(servicio);
                }
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-colors hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-slate-800">
                  {servicio.nombre}
                </h2>
                <div className="flex flex-shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPorEliminar(servicio);
                    }}
                    aria-label={`Quitar ${servicio.nombre}`}
                    className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Quitar
                  </button>
                </div>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                {servicio.descripcion}
              </p>
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
            </motion.article>
          ))
        )}
      </motion.section>

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
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Clase de surf 1h"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

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
                min="0"
                required
                value={form.precioUsd}
                onChange={(e) =>
                  setForm({ ...form, precioUsd: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
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
                required
                value={form.duracionMin}
                onChange={(e) =>
                  setForm({ ...form, duracionMin: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

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
              onChange={(e) => setForm({ ...form, imagenUrl: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <motion.button
            type="submit"
            disabled={guardando}
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {editandoId ? (
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
            ? `"${porEliminar.nombre}" se eliminará junto con sus horarios asociados. Esta acción no se puede deshacer.`
            : ""
        }
        onConfirmar={() => porEliminar && handleEliminar(porEliminar)}
        onCancelar={() => setPorEliminar(null)}
      />
    </main>
  );
}
