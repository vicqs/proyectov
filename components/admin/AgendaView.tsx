"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarOff, Loader2, Plus, Trash2 } from "lucide-react";
import AdminPage, { ItemLista, Lista } from "../AdminPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";

export interface VistaBloqueo {
  id: string;
  inicioIso: string;
  finIso: string;
  motivo: string;
}

type Resultado = string | void | Promise<string | void>;

interface AgendaViewProps {
  bloqueos: VistaBloqueo[];
  /** Fechas en formato `datetime-local` (sin zona horaria). Devuelve un error o nada. */
  onCrear: (datos: {
    inicio: string;
    fin: string;
    motivo: string;
  }) => Resultado;
  onEliminar: (id: string) => Resultado;
}

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";

function formatRango(inicio: string, fin: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  return `${new Date(inicio).toLocaleString("es-CR", opts)} — ${new Date(fin).toLocaleString("es-CR", opts)}`;
}

/** Gestión de bloqueos de agenda compartida por admin y demo. */
export default function AgendaView({
  bloqueos,
  onCrear,
  onEliminar,
}: AgendaViewProps) {
  const [abierto, setAbierto] = useState(false);
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<VistaBloqueo | null>(null);

  function abrirNuevo() {
    setInicio("");
    setFin("");
    setMotivo("");
    setAbierto(true);
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (new Date(fin) < new Date(inicio)) {
      toast.error("La fecha de fin no puede ser anterior a la de inicio.");
      return;
    }
    setGuardando(true);
    const error = await onCrear({ inicio, fin, motivo });
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Bloqueo guardado con éxito");
    setAbierto(false);
  }

  async function handleEliminar() {
    if (!porEliminar) return;
    const error = await onEliminar(porEliminar.id);
    if (error) toast.error(error);
    else toast.success("Bloqueo eliminado");
    setPorEliminar(null);
  }

  return (
    <AdminPage
      titulo="Agenda / Bloqueos"
      descripcion="Bloquea fechas en las que no atenderás (vacaciones, mantenimiento, etc.)."
      accion={
        <motion.button
          type="button"
          onClick={abrirNuevo}
          whileTap={{ scale: 0.96 }}
          className="flex w-full flex-shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nuevo bloqueo
        </motion.button>
      }
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-gray-400">
        Bloqueos futuros activos
      </h2>

      {bloqueos.length === 0 ? (
        <p className="text-sm text-slate-500">
          No tienes bloqueos de horario programados.
        </p>
      ) : (
        <Lista as="ul" className="space-y-3">
          {bloqueos.map((bloqueo) => (
            <ItemLista
              as="li"
              key={bloqueo.id}
              className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <CalendarOff
                  className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400"
                  aria-hidden="true"
                />
                <div>
                  <p
                    className="text-sm font-medium text-slate-800"
                    suppressHydrationWarning
                  >
                    {formatRango(bloqueo.inicioIso, bloqueo.finIso)}
                  </p>
                  <p className="text-sm text-slate-500">{bloqueo.motivo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPorEliminar(bloqueo)}
                aria-label="Quitar bloqueo"
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                Quitar
              </button>
            </ItemLista>
          ))}
        </Lista>
      )}

      <Drawer
        abierto={abierto}
        onClose={() => setAbierto(false)}
        titulo="Nuevo bloqueo"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="fecha_inicio"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Fecha inicio
            </label>
            <input
              id="fecha_inicio"
              type="datetime-local"
              required
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="fecha_fin"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Fecha fin
            </label>
            <input
              id="fecha_fin"
              type="datetime-local"
              required
              min={inicio || undefined}
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label
              htmlFor="motivo"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Motivo
            </label>
            <input
              id="motivo"
              required
              minLength={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Vacaciones, mantenimiento, etc."
              className={INPUT}
            />
          </div>
          <motion.button
            type="submit"
            disabled={guardando}
            whileTap={{ scale: 0.97 }}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Guardar bloqueo
          </motion.button>
        </form>
      </Drawer>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Quitar este bloqueo?"
        descripcion="Las fechas volverán a estar disponibles para reservar."
        onConfirmar={() => void handleEliminar()}
        onCancelar={() => setPorEliminar(null)}
      />
    </AdminPage>
  );
}
