"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Info, Loader2, Plus, Trash2 } from "lucide-react";
import AdminPage, { ItemLista, Lista } from "../AdminPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { etiquetaDia } from "../../lib/horarios";

export interface VistaHorario {
  id: string;
  servicioId: string;
  label: string;
  /** ISO de la franja; habilita el agrupado por día. */
  fechaHora?: string;
  cuposTotales: number;
  cuposDisponibles: number;
}

type Resultado = string | void | Promise<string | void>;

const DIAS_SEMANA = ["D", "L", "M", "X", "J", "V", "S"];
const MAX_LOTE = 100;

function aLocalInput(fecha: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}`;
}

/** Genera las fechas (formato `datetime-local`) de una repetición semanal. */
function generarFechas(
  inicio: string,
  hora: string,
  dias: number[],
  semanas: number,
): string[] {
  if (!inicio || !hora || dias.length === 0 || semanas < 1) return [];
  const [y, m, d] = inicio.split("-").map(Number);
  const [hh, mm] = hora.split(":").map(Number);
  const ahora = Date.now();
  const fechas: string[] = [];
  for (let i = 0; i < semanas * 7; i++) {
    const f = new Date(y, m - 1, d + i, hh, mm);
    if (dias.includes(f.getDay()) && f.getTime() > ahora) {
      fechas.push(aLocalInput(f));
    }
  }
  return fechas;
}

interface HorariosViewProps {
  horarios: VistaHorario[];
  servicios: { id: string; nombre: string }[];
  /** `fechaHora` viene en formato `datetime-local` (sin zona horaria). */
  onCrear: (datos: {
    servicioId: string;
    fechaHora: string;
    cupos: number;
  }) => Resultado;
  /** Alta en lote atómica; si no se define, se llama a `onCrear` por fecha. */
  onCrearLote?: (datos: {
    servicioId: string;
    fechasHora: string[];
    cupos: number;
  }) => Resultado;
  onEliminar: (id: string) => Resultado;
}

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";

/** Gestión de horarios y cupos compartida por `/admin` y `/demo/admin`. */
export default function HorariosView({
  horarios,
  servicios,
  onCrear,
  onCrearLote,
  onEliminar,
}: HorariosViewProps) {
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState<"uno" | "repetir">("uno");
  const [servicioId, setServicioId] = useState("");
  const [fechaHora, setFechaHora] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [hora, setHora] = useState("09:00");
  const [dias, setDias] = useState<number[]>([]);
  const [semanas, setSemanas] = useState(4);
  const [cupos, setCupos] = useState("6");
  const [guardando, setGuardando] = useState(false);
  const [porEliminar, setPorEliminar] = useState<VistaHorario | null>(null);

  const fechasLote = generarFechas(fechaInicio, hora, dias, semanas);

  function abrirNuevo() {
    setServicioId(servicios[0]?.id ?? "");
    setFechaHora("");
    setFechaInicio("");
    setHora("09:00");
    setDias([]);
    setSemanas(4);
    setModo("uno");
    setCupos("6");
    setAbierto(true);
  }

  function alternarDia(dia: number) {
    setDias((actual) =>
      actual.includes(dia) ? actual.filter((d) => d !== dia) : [...actual, dia],
    );
  }

  async function handleSubmit(evento: React.FormEvent) {
    evento.preventDefault();
    if (!servicioId || !cupos) return;
    if (modo === "uno" && !fechaHora) return;
    if (modo === "repetir") {
      if (fechasLote.length === 0) {
        toast.error("Elige días y una fecha de inicio futura.");
        return;
      }
      if (fechasLote.length > MAX_LOTE) {
        toast.error(`Máximo ${MAX_LOTE} horarios por lote.`);
        return;
      }
    }
    setGuardando(true);
    let error: string | void = undefined;
    if (modo === "uno") {
      error = await onCrear({ servicioId, fechaHora, cupos: Number(cupos) });
    } else if (onCrearLote) {
      error = await onCrearLote({
        servicioId,
        fechasHora: fechasLote,
        cupos: Number(cupos),
      });
    } else {
      for (const f of fechasLote) {
        error = await onCrear({
          servicioId,
          fechaHora: f,
          cupos: Number(cupos),
        });
        if (error) break;
      }
    }
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success(
      modo === "uno"
        ? "Horario agregado con éxito"
        : `${fechasLote.length} horarios agregados`,
    );
    setAbierto(false);
  }

  async function handleEliminar() {
    if (!porEliminar) return;
    const error = await onEliminar(porEliminar.id);
    if (error) toast.error(error);
    else toast.success(`Horario "${porEliminar.label}" eliminado`);
    setPorEliminar(null);
  }

  function nombreServicio(id: string) {
    return servicios.find((s) => s.id === id)?.nombre ?? "Servicio eliminado";
  }

  const grupos: [string, VistaHorario[]][] = [];
  for (const h of horarios) {
    const titulo = h.fechaHora ? etiquetaDia(h.fechaHora) : "";
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo[0] === titulo) ultimo[1].push(h);
    else grupos.push([titulo, [h]]);
  }

  return (
    <AdminPage
      titulo="Horarios disponibles"
      descripcion="Agrega franjas horarias con cupos por servicio para tu agenda."
      accion={
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
      }
    >
      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        Los horarios no se pueden editar una vez creados, para evitar
        inconsistencias con reservas ya confirmadas. Si necesitas cambiar la
        fecha, hora o cupos, quita el horario y crea uno nuevo.
      </p>

      <div className="mt-8">
        {horarios.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tienes horarios disponibles configurados.
          </p>
        ) : (
          grupos.map(([titulo, items]) => (
            <section key={titulo + items[0].id} className="mb-6">
              {titulo && (
                <h3
                  suppressHydrationWarning
                  className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
                >
                  {titulo}
                </h3>
              )}
              <Lista as="ul" className="space-y-3">
                {items.map((horario) => {
                  const ocupados =
                    horario.cuposTotales - horario.cuposDisponibles;
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
                    <ItemLista
                      as="li"
                      key={horario.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
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
                          onClick={() => setPorEliminar(horario)}
                          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          Quitar
                        </button>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>
                            {ocupados} de {horario.cuposTotales} cupos
                            reservados
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
                    </ItemLista>
                  );
                })}
              </Lista>
            </section>
          ))
        )}
      </div>

      <Drawer
        abierto={abierto}
        onClose={() => setAbierto(false)}
        titulo="Nuevo horario"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <div
              role="group"
              aria-label="Modo de creación"
              className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-medium"
            >
              {(
                [
                  ["uno", "Un horario"],
                  ["repetir", "Repetir cada semana"],
                ] as const
              ).map(([valor, texto]) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={modo === valor}
                  onClick={() => setModo(valor)}
                  className={`rounded-lg px-3 py-2 transition ${modo === valor ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
                >
                  {texto}
                </button>
              ))}
            </div>
          </div>

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
              className={INPUT}
            >
              {servicios.map((servicio) => (
                <option key={servicio.id} value={servicio.id}>
                  {servicio.nombre}
                </option>
              ))}
            </select>
          </div>

          {modo === "uno" ? (
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
                className={INPUT}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="fecha_inicio"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Desde el
                  </label>
                  <input
                    id="fecha_inicio"
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className={INPUT}
                  />
                </div>
                <div>
                  <label
                    htmlFor="hora_lote"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Hora
                  </label>
                  <input
                    id="hora_lote"
                    type="time"
                    required
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className={INPUT}
                  />
                </div>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-700">
                  Días de la semana
                </p>
                <div className="flex gap-1.5">
                  {DIAS_SEMANA.map((letra, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={dias.includes(i)}
                      aria-label={
                        [
                          "domingo",
                          "lunes",
                          "martes",
                          "miércoles",
                          "jueves",
                          "viernes",
                          "sábado",
                        ][i]
                      }
                      onClick={() => alternarDia(i)}
                      className={`h-9 w-9 rounded-full text-sm font-semibold transition ${dias.includes(i) ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"}`}
                    >
                      {letra}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label
                  htmlFor="semanas"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Durante cuántas semanas
                </label>
                <input
                  id="semanas"
                  type="number"
                  min={1}
                  max={12}
                  value={semanas}
                  onChange={(e) =>
                    setSemanas(
                      Math.min(12, Math.max(1, Number(e.target.value) || 1)),
                    )
                  }
                  className={INPUT}
                />
              </div>
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
                {fechasLote.length === 0
                  ? "Elige fecha de inicio y al menos un día para ver cuántos horarios se crearán."
                  : `Se crearán ${fechasLote.length} horarios${fechasLote.length > MAX_LOTE ? ` (máximo ${MAX_LOTE})` : ""}.`}
              </p>
            </>
          )}

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
            Agregar horario{modo === "repetir" ? "s" : ""}
          </motion.button>
        </form>
      </Drawer>

      <ConfirmDialog
        abierto={porEliminar !== null}
        titulo="¿Quitar este horario?"
        descripcion="Dejará de estar disponible para reservar en tu enlace público."
        onConfirmar={() => void handleEliminar()}
        onCancelar={() => setPorEliminar(null)}
      />
    </AdminPage>
  );
}
