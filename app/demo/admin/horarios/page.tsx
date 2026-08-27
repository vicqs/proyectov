"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Info, Plus, Trash2 } from "lucide-react";
import { mockNegocio } from "../../../../lib/mockData";
import {
  crearHorario,
  eliminarHorario,
  useDemoStore,
} from "../../../../lib/demoStore";
import Drawer from "../../../../components/Drawer";
import { toast } from "../../../../components/Toast";

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemLista = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Gestión premium de horarios/agenda: cada horario está ligado a un
 * servicio y tiene cupos totales/disponibles con una barra de progreso de
 * ocupación. El formulario vive en un Drawer lateral. Equivalente demo
 * simplificado de `/admin/agenda`, respaldado por `lib/demoStore.ts`.
 */
export default function AdminDemoHorariosPage() {
  const { horarios, servicios } = useDemoStore(mockNegocio.slug);
  const [drawerAbierto, setDrawerAbierto] = useState(false);
  const [servicioId, setServicioId] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [cupos, setCupos] = useState("6");

  function abrirNuevo() {
    setServicioId(servicios[0]?.id ?? "");
    setFechaHora("");
    setCupos("6");
    setDrawerAbierto(true);
  }

  function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!fechaHora || !servicioId || !cupos) return;
    crearHorario(mockNegocio.slug, {
      servicioId,
      fechaHoraIso: new Date(fechaHora).toISOString(),
      cuposTotales: Number(cupos),
    });
    toast.success("Horario agregado con éxito");
    setDrawerAbierto(false);
  }

  function handleEliminar(horarioId: string, label: string) {
    eliminarHorario(mockNegocio.slug, horarioId);
    toast.success(`Horario "${label}" eliminado`);
  }

  function nombreServicio(servicioId: string) {
    return (
      servicios.find((s) => s.id === servicioId)?.nombre ?? "Servicio eliminado"
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Horarios disponibles
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Agrega franjas horarias con cupos por servicio para tu agenda.
          </p>
        </div>
        <motion.button
          type="button"
          onClick={abrirNuevo}
          disabled={servicios.length === 0}
          whileTap={{ scale: 0.96 }}
          className="flex w-full flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo horario
        </motion.button>
      </div>

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        Los horarios no se pueden editar una vez creados, para evitar
        inconsistencias con reservas ya confirmadas. Si necesitas cambiar la
        fecha, hora o cupos, quita el horario y crea uno nuevo.
      </p>

      <motion.section
        variants={contenedorLista}
        initial="oculto"
        animate="visible"
        className="mt-8"
      >
        {horarios.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tienes horarios disponibles configurados.
          </p>
        ) : (
          <ul className="space-y-3">
            {horarios.map((horario) => {
              const ocupados = horario.cuposTotales - horario.cuposDisponibles;
              const porcentaje = Math.round(
                (ocupados / horario.cuposTotales) * 100,
              );
              const lleno = horario.cuposDisponibles === 0;
              const colorBarra = lleno
                ? "bg-red-500"
                : porcentaje >= 50
                  ? "bg-amber-500"
                  : "bg-emerald-500";

              return (
                <motion.li
                  key={horario.id}
                  variants={itemLista}
                  className="rounded-xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock
                        className="h-4 w-4 text-slate-400"
                        aria-hidden="true"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {horario.label}
                        </p>
                        <p className="text-xs text-slate-500">
                          {nombreServicio(horario.servicioId)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleEliminar(horario.id, horario.label)}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Quitar
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
                      <span>
                        {ocupados} de {horario.cuposTotales} cupos reservados
                      </span>
                      {lleno && (
                        <span className="font-semibold text-red-600">
                          Completo
                        </span>
                      )}
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${porcentaje}%` }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className={`h-full rounded-full ${colorBarra}`}
                      />
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.section>

      <Drawer
        abierto={drawerAbierto}
        onClose={() => setDrawerAbierto(false)}
        titulo="Nuevo horario"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="servicio"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Servicio
            </label>
            <select
              id="servicio"
              required
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            >
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="fecha_hora"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Fecha y hora
            </label>
            <input
              id="fecha_hora"
              type="datetime-local"
              required
              value={fechaHora}
              onChange={(e) => setFechaHora(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="cupos"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Cantidad de cupos
            </label>
            <input
              id="cupos"
              type="number"
              min="1"
              required
              value={cupos}
              onChange={(e) => setCupos(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Plus className="h-4 w-4" />
            Agregar horario
          </motion.button>
        </form>
      </Drawer>
    </main>
  );
}
