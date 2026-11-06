"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock,
  Loader2,
  MessageSquare,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import {
  CLASE_SELECT,
  Insignia,
  TextareaConContador,
  type TonoInsignia,
} from "./ui";
import { fechaHora } from "../../lib/admin/formato";
import { mensajeErrorUsuario } from "../../lib/errores";
import {
  actualizarTicketAction,
  cargarMensajesTicketAction,
  responderTicketAdminAction,
} from "../../actions/admin/soporte";
import type { Ticket, TicketMensaje } from "../../types/database";

const TONO_TICKET: Record<string, TonoInsignia> = {
  abierto: "ambar",
  en_curso: "azul",
  resuelto: "verde",
  cerrado: "gris",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  en_curso: "En curso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const TONO_PRIORIDAD: Record<string, TonoInsignia> = {
  baja: "gris",
  normal: "azul",
  alta: "ambar",
  urgente: "rojo",
};

const ETIQUETAS_PRIORIDAD: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

function esEstadoTicket(valor: string): valor is Ticket["estado"] {
  return (
    valor === "abierto" ||
    valor === "en_curso" ||
    valor === "resuelto" ||
    valor === "cerrado"
  );
}

function esPrioridadTicket(valor: string): valor is Ticket["prioridad"] {
  return valor === "baja" || valor === "normal" || valor === "alta";
}

function formatearTicketId(id: string): string {
  if (!id) return "";
  const base = id.replace(/^(?:ticket|tk)[-_]/i, "");
  const corte = base.includes("-") ? base.split("-")[0] : base.slice(0, 8);
  return corte.toUpperCase();
}

interface TicketDrawerProps {
  ticket: Ticket | null;
  negocioNombre?: string;
  onClose: () => void;
}

export function TicketDrawer({
  ticket,
  negocioNombre,
  onClose,
}: TicketDrawerProps) {
  const router = useRouter();
  const [mensajes, setMensajes] = useState<TicketMensaje[]>([]);
  const [cargando, setCargando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [respuesta, setRespuesta] = useState("");
  const [estadoActual, setEstadoActual] = useState(ticket?.estado ?? "abierto");
  const [prioridadActual, setPrioridadActual] = useState(
    ticket?.prioridad ?? "normal",
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Sincronizar estado cuando cambia el ticket seleccionado
  useEffect(() => {
    if (!ticket) return;
    setEstadoActual(ticket.estado);
    setPrioridadActual(ticket.prioridad);
    setRespuesta("");
    setCargando(true);

    cargarMensajesTicketAction(ticket.id)
      .then((data) => {
        setMensajes(data ?? []);
      })
      .catch((err) => {
        console.error("Error al cargar mensajes del ticket:", err);
        toast.error("No se pudieron cargar los mensajes.");
      })
      .finally(() => {
        setCargando(false);
      });
  }, [ticket]);

  // Auto-scroll al final del chat al cargar mensajes
  useEffect(() => {
    if (!cargando && mensajes.length > 0) {
      scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mensajes, cargando]);

  if (!ticket) return null;

  function handleClose() {
    if (guardandoEstado || enviando) return;
    onClose();
  }

  async function handleGuardarEstado(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (guardandoEstado || enviando) return;
    setGuardandoEstado(true);
    try {
      const formData = new FormData();
      formData.set("estado", estadoActual);
      formData.set("prioridad", prioridadActual);

      const res = await actualizarTicketAction(ticket!.id, {}, formData);
      if (res.ok) {
        toast.success(res.ok);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error(
        mensajeErrorUsuario(error, "Error al actualizar el estado."),
      );
    } finally {
      setGuardandoEstado(false);
    }
  }

  async function handleEnviarRespuesta(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const textoRespuesta = respuesta.trim();
    if (!textoRespuesta || enviando || guardandoEstado) return;

    setEnviando(true);
    try {
      const formData = new FormData();
      formData.set("mensaje", textoRespuesta);
      formData.set("estado", estadoActual);
      formData.set("prioridad", prioridadActual);

      const res = await responderTicketAdminAction(ticket!.id, {}, formData);
      if (res.ok) {
        toast.success("Respuesta enviada.");
        setRespuesta("");

        // Si estaba abierto y no se cambió explícitamente, pasa a en curso
        if (estadoActual === "abierto") {
          setEstadoActual("en_curso");
        }

        // Recargar mensajes actualizados
        const nuevos = await cargarMensajesTicketAction(ticket!.id);
        setMensajes(nuevos ?? []);
        router.refresh();
      } else if (res.error) {
        toast.error(res.error);
      }
    } catch (error) {
      toast.error(
        mensajeErrorUsuario(error, "Error al enviar la respuesta."),
      );
    } finally {
      setEnviando(false);
    }
  }

  const hayCambiosPendientesEstado =
    Boolean(ticket) &&
    (estadoActual !== ticket!.estado || prioridadActual !== ticket!.prioridad);
  const tieneTexto = respuesta.trim().length > 0;

  const titulo = `Ticket #${formatearTicketId(ticket.id)}`;

  return (
    <Drawer
      abierto={Boolean(ticket)}
      titulo={titulo}
      onClose={handleClose}
      ancho="max-w-xl sm:max-w-2xl"
    >
      <div className="flex flex-col h-full justify-between gap-5 -mx-2">
        {/* Encabezado contextual del ticket */}
        <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {ticket.asunto}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <Insignia tono={TONO_TICKET[estadoActual] ?? "gris"}>
                {ETIQUETAS_ESTADO[estadoActual] ?? estadoActual}
              </Insignia>
              <Insignia tono={TONO_PRIORIDAD[prioridadActual] ?? "gris"}>
                {ETIQUETAS_PRIORIDAD[prioridadActual] ?? prioridadActual}
              </Insignia>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {negocioNombre && (
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-sky-600" />
                <Link
                  href={`/admin/negocios/${ticket.negocio_id}`}
                  className="text-sky-700 hover:underline flex items-center gap-0.5"
                >
                  <span>{negocioNombre}</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-400" />
              <span>{ticket.creado_por}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{fechaHora(ticket.creado_en)}</span>
            </div>
          </div>
        </div>

        {/* Barra de Gestión de Estado y Prioridad */}
        <form
          onSubmit={handleGuardarEstado}
          className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs"
        >
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label
              htmlFor="ticket-estado-select"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Estado:
            </label>
            <select
              id="ticket-estado-select"
              value={estadoActual}
              onChange={(e) => {
                if (esEstadoTicket(e.target.value)) {
                  setEstadoActual(e.target.value);
                }
              }}
              className={`${CLASE_SELECT} text-xs py-1.5`}
            >
              <option value="abierto">Abierto</option>
              <option value="en_curso">En curso</option>
              <option value="resuelto">Resuelto</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <label
              htmlFor="ticket-prioridad-select"
              className="text-xs font-semibold text-slate-500 uppercase tracking-wider"
            >
              Prioridad:
            </label>
            <select
              id="ticket-prioridad-select"
              value={prioridadActual}
              onChange={(e) => {
                if (esPrioridadTicket(e.target.value)) {
                  setPrioridadActual(e.target.value);
                }
              }}
              className={`${CLASE_SELECT} text-xs py-1.5`}
            >
              <option value="baja">Baja</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={guardandoEstado || enviando}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold disabled:opacity-50 cursor-pointer transition shadow-2xs ${
              hayCambiosPendientesEstado
                ? "border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100"
                : "border-slate-300 bg-slate-50 text-slate-700 hover:bg-white hover:border-slate-400"
            }`}
          >
            {guardandoEstado ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            )}
            <span>{hayCambiosPendientesEstado ? "Guardar cambios" : "Guardar estado"}</span>
          </button>
        </form>

        {/* Hilo de conversación */}
        <div className="flex-1 space-y-3 overflow-y-auto max-h-[380px] p-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
            <span>Conversación</span>
          </div>

          {cargando ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-sky-600 mb-2" />
              <p className="text-xs">Cargando mensajes del ticket...</p>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
              No hay mensajes previos en este ticket.
            </div>
          ) : (
            <div className="space-y-3">
              {mensajes.map((m) => {
                const esAdmin = m.autor_tipo === "admin";
                return (
                  <div
                    key={m.id}
                    className={`rounded-2xl p-4 text-xs leading-relaxed transition ${
                      esAdmin
                        ? "ml-6 sm:ml-10 border border-sky-200 bg-sky-50/80 text-sky-950 shadow-2xs"
                        : "mr-6 sm:mr-10 border border-slate-200 bg-white text-slate-800 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200/50 pb-2 mb-2">
                      <span className="font-semibold flex items-center gap-1.5">
                        {esAdmin ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
                            <span className="text-sky-900">Soporte Vuki</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="h-3.5 w-3.5 text-slate-500" />
                            <span className="text-slate-800">
                              {negocioNombre || "Empresa"}
                            </span>
                          </>
                        )}
                        <span className="font-normal text-slate-400">
                          ({m.autor_email})
                        </span>
                      </span>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {fechaHora(m.creado_en)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap font-normal text-slate-800 text-[13px]">
                      {m.mensaje}
                    </p>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          )}
        </div>

        {/* Formulario para enviar respuesta */}
        <form
          onSubmit={handleEnviarRespuesta}
          className="border-t border-slate-200 pt-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <label
              htmlFor="ticket-respuesta-textarea"
              className="text-xs font-semibold text-slate-700"
            >
              Responder a la empresa
            </label>
            <span className="text-[11px] text-slate-400">
              {respuesta.length} / 4000 caracteres
            </span>
          </div>

          <textarea
            id="ticket-respuesta-textarea"
            value={respuesta}
            onChange={(e) => setRespuesta(e.target.value)}
            required
            rows={3}
            maxLength={4000}
            placeholder="Escribe tu respuesta a la empresa..."
            disabled={enviando}
            className="vuki-textarea text-xs"
          />

          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400">
              {hayCambiosPendientesEstado ? (
                <span className="text-sky-700 font-medium">
                  Al enviar también se actualizarán estado y prioridad.
                </span>
              ) : (
                "Presiona Enviar para notificar a la empresa."
              )}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={guardandoEstado || enviando}
                className="vuki-btn-secondary-sm cursor-pointer disabled:opacity-50"
              >
                Cerrar
              </button>

              <button
                type="submit"
                disabled={enviando || guardandoEstado || !tieneTexto}
                className="vuki-btn-primary inline-flex items-center gap-1.5 text-xs cursor-pointer"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 shrink-0" />
                    <span>Enviar respuesta</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Drawer>
  );
}
