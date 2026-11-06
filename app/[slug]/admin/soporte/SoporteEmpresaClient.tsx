"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  Loader2,
  MessageSquare,
  Plus,
  ShieldCheck,
} from "lucide-react";
import Drawer from "@/components/Drawer";
import EmpresaPage from "@/components/EmpresaPage";
import { toast } from "@/components/Toast";
import { AccionForm } from "@/components/admin/AccionForm";
import { TextareaConContador } from "@/components/TextareaConContador";
import { fechaHora } from "@/lib/admin/formato";
import { crearTicketAction, responderTicketAction } from "@/actions/soporte";
import type { Ticket, TicketMensaje } from "@/types/database";

export type FiltroEstado = "todos" | "activos" | "resueltos";

export interface TicketConMensajes {
  ticket: Ticket;
  mensajes: TicketMensaje[];
  ultimo?: TicketMensaje;
}

export const TEMAS_RAPIDOS = [
  {
    clave: "imagenes",
    etiqueta: "Logo o imágenes",
    asunto: "Problema con logo o imágenes",
    placeholder:
      "Indica qué imagen intentaste subir, su formato (PNG, JPG o WEBP) y qué mensaje apareció...",
  },
  {
    clave: "horarios",
    etiqueta: "Horarios o bloqueos",
    asunto: "Duda con horarios o bloqueos de agenda",
    placeholder:
      "Cuéntanos qué servicio, horario o bloqueo temporal necesitas ajustar...",
  },
  {
    clave: "pagos",
    etiqueta: "Pagos y finanzas",
    asunto: "Consulta sobre pagos o finanzas",
    placeholder:
      "Si se trata de una reserva específica, incluye la fecha o nombre del cliente...",
  },
  {
    clave: "suscripcion",
    etiqueta: "Suscripción",
    asunto: "Consulta sobre mi suscripción",
    placeholder:
      "Cuéntanos en qué podemos ayudarte respecto a tu plan mensual o facturación...",
  },
] as const;

const INPUT = "vuki-input min-h-11";

function esTicketActivo(ticket: Ticket): boolean {
  return ticket.estado === "abierto" || ticket.estado === "en_curso";
}

function obtenerInsigniaTicket(
  ticket: Ticket,
  ultimoMensaje: TicketMensaje | undefined,
): { texto: string; clases: string; punto: string } {
  const activo = esTicketActivo(ticket);
  if (activo && ultimoMensaje?.autor_tipo === "admin") {
    return {
      texto: "Respondido por soporte",
      clases: "border-sky-200 bg-sky-50 text-sky-800",
      punto: "bg-sky-500",
    };
  }
  if (ticket.estado === "en_curso") {
    return {
      texto: "En revisión",
      clases: "border-sky-200 bg-sky-50 text-sky-800",
      punto: "bg-sky-500",
    };
  }
  if (ticket.estado === "abierto") {
    return {
      texto: "Abierto · En espera",
      clases: "border-amber-200 bg-amber-50 text-amber-800",
      punto: "bg-amber-500",
    };
  }
  if (ticket.estado === "resuelto") {
    return {
      texto: "Resuelto",
      clases: "border-emerald-200 bg-emerald-50 text-emerald-800",
      punto: "bg-emerald-500",
    };
  }
  return {
    texto: "Cerrado",
    clases: "border-slate-200 bg-slate-100 text-slate-600",
    punto: "bg-slate-400",
  };
}

interface SoporteEmpresaClientProps {
  slug: string;
  maxImagenMb: number;
  ticketsConMensajes: TicketConMensajes[];
  filtroInicial?: FiltroEstado;
  temaInicial?: string;
  abrirInicial?: boolean;
}

export default function SoporteEmpresaClient({
  slug,
  maxImagenMb,
  ticketsConMensajes,
  filtroInicial = "todos",
  temaInicial,
  abrirInicial = false,
}: SoporteEmpresaClientProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [drawerAbierto, setDrawerAbierto] = useState(abrirInicial);
  const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>(
    filtroInicial === "activos" || filtroInicial === "resueltos"
      ? filtroInicial
      : "todos",
  );

  const temaPorDefecto = TEMAS_RAPIDOS.find((t) => t.clave === temaInicial);
  const [temaClave, setTemaClave] = useState<string | null>(
    temaPorDefecto?.clave ?? null,
  );
  const [asunto, setAsunto] = useState(temaPorDefecto?.asunto ?? "");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const temaSeleccionado = useMemo(
    () => TEMAS_RAPIDOS.find((t) => t.clave === temaClave),
    [temaClave],
  );

  const placeholderActual =
    temaSeleccionado?.placeholder ??
    "Describe qué estabas haciendo y qué ocurrió para poder ayudarte más rápido...";

  const activosCount = ticketsConMensajes.filter(({ ticket }) =>
    esTicketActivo(ticket),
  ).length;
  const resueltosCount = ticketsConMensajes.length - activosCount;
  const respondidosCount = ticketsConMensajes.filter(
    ({ ticket, ultimo }) =>
      esTicketActivo(ticket) && ultimo?.autor_tipo === "admin",
  ).length;

  const ticketsFiltrados = ticketsConMensajes.filter(({ ticket }) => {
    if (filtroActivo === "activos") return esTicketActivo(ticket);
    if (filtroActivo === "resueltos") return !esTicketActivo(ticket);
    return true;
  });

  function abrirNuevo(claveTema?: string) {
    if (claveTema) {
      const encontrado = TEMAS_RAPIDOS.find((t) => t.clave === claveTema);
      if (encontrado) {
        setTemaClave(encontrado.clave);
        setAsunto(encontrado.asunto);
      }
    } else {
      setTemaClave(null);
      setAsunto("");
      setMensaje("");
    }
    setDrawerAbierto(true);
  }

  function cerrarDrawer() {
    setDrawerAbierto(false);
    setAsunto("");
    setMensaje("");
    setTemaClave(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("nuevo") || params.has("tema")) {
        params.delete("nuevo");
        params.delete("tema");
        const qs = params.toString();
        router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
      }
    }
  }

  function seleccionarTema(clave: string) {
    if (temaClave === clave) {
      setTemaClave(null);
    } else {
      setTemaClave(clave);
      const item = TEMAS_RAPIDOS.find((t) => t.clave === clave);
      if (item) {
        setAsunto(item.asunto);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setEnviando(true);
    try {
      const formData = new FormData();
      formData.set("asunto", asunto);
      formData.set("mensaje", mensaje);
      const res = await crearTicketAction(slug, {}, formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(res?.ok ?? "Ticket enviado. Te responderemos pronto.");
        cerrarDrawer();
        router.refresh();
      }
    } catch {
      toast.error("Ocurrió un error al enviar el ticket.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <EmpresaPage
      titulo="Soporte"
      descripcion="Resuelve dudas rápidas o conversa directamente con el equipo de vuki."
      accion={
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          {activosCount >= 8 && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
              {activosCount}/10 abiertos
            </span>
          )}
          <motion.button
            type="button"
            onClick={() => abrirNuevo()}
            disabled={activosCount >= 10}
            whileTap={{ scale: 0.96 }}
            className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nuevo ticket
          </motion.button>
        </div>
      }
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.75fr_1.05fr]">
        {/* Columna principal: historial de conversaciones con filtros y estado claro */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
                <MessageSquare
                  className="h-4 w-4 text-slate-500"
                  aria-hidden="true"
                />
                Tus conversaciones
              </h2>
              {respondidosCount > 0 && (
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                  {respondidosCount}{" "}
                  {respondidosCount === 1
                    ? "respuesta nueva"
                    : "respuestas nuevas"}
                </span>
              )}
            </div>

            <nav
              aria-label="Filtrar tickets por estado"
              className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs"
            >
              {(
                [
                  {
                    id: "todos",
                    etiqueta: `Todos (${ticketsConMensajes.length})`,
                  },
                  { id: "activos", etiqueta: `Activos (${activosCount})` },
                  {
                    id: "resueltos",
                    etiqueta: `Resueltos (${resueltosCount})`,
                  },
                ] as const
              ).map((tab) => {
                const activo = filtroActivo === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltroActivo(tab.id)}
                    className={`vuki-focus rounded-lg px-2.5 py-1.5 font-semibold transition ${
                      activo
                        ? "bg-white text-vuki-ink shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.etiqueta}
                  </button>
                );
              })}
            </nav>
          </div>

          {ticketsConMensajes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-slate-800">
                Aún no has abierto tickets de soporte
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
                Si tienes alguna dificultad técnica o consulta sobre tu cuenta, abre un
                ticket y te responderemos aquí mismo.
              </p>
              <button
                type="button"
                onClick={() => abrirNuevo()}
                className="vuki-focus mt-4 inline-flex items-center gap-1.5 rounded-xl bg-vuki-ink px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                Crear primer ticket
              </button>
            </div>
          ) : ticketsFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                {filtroActivo === "activos"
                  ? "No tienes tickets activos pendientes en este momento."
                  : "Aún no tienes tickets marcados como resueltos."}
              </p>
              <button
                type="button"
                onClick={() => setFiltroActivo("todos")}
                className="vuki-focus mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline"
              >
                Ver todas las conversaciones →
              </button>
            </div>
          ) : (
            ticketsFiltrados.map(({ ticket, mensajes, ultimo }) => {
              const activo = esTicketActivo(ticket);
              const insignia = obtenerInsigniaTicket(ticket, ultimo);
              const abiertoPorDefecto = activo || ticketsFiltrados.length === 1;

              return (
                <details
                  key={ticket.id}
                  open={abiertoPorDefecto}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <summary className="vuki-focus flex cursor-pointer list-none items-start justify-between gap-3 p-5 transition hover:bg-slate-50/70 [&::-webkit-details-marker]:hidden">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          {ticket.asunto}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${insignia.clases}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`h-1.5 w-1.5 rounded-full ${insignia.punto}`}
                          />
                          {insignia.texto}
                        </span>
                        {ticket.prioridad === "alta" && (
                          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                            Prioridad alta
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {mensajes.length}{" "}
                        {mensajes.length === 1 ? "mensaje" : "mensajes"} ·
                        Última actividad: {fechaHora(ticket.actualizado_en)}
                      </p>
                    </div>

                    <ChevronDown
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="border-t border-slate-100 bg-slate-50/40 p-5">
                    {mensajes.length === 0 ? (
                      <p className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-500">
                        Aún no hay mensajes registrados en esta conversación.
                      </p>
                    ) : (
                      <ul className="space-y-3">
                        {mensajes.map((m) => {
                          const esAdmin = m.autor_tipo === "admin";
                          return (
                            <li
                              key={m.id}
                              className={`rounded-2xl border p-3.5 text-sm ${
                                esAdmin
                                  ? "border-sky-200 bg-sky-50/90"
                                  : "border-slate-200 bg-white"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                <span
                                  className={`inline-flex items-center gap-1.5 font-semibold ${
                                    esAdmin ? "text-sky-900" : "text-slate-700"
                                  }`}
                                >
                                  {esAdmin && (
                                    <ShieldCheck
                                      className="h-3.5 w-3.5 text-sky-600"
                                      aria-hidden="true"
                                    />
                                  )}
                                  {esAdmin ? "Equipo vuki · Soporte" : "Tú"}
                                </span>
                                <span className="text-slate-400">
                                  {fechaHora(m.creado_en)}
                                </span>
                              </div>
                              <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-slate-800">
                                {m.mensaje}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}

                    <div className="mt-4 border-t border-slate-200/70 pt-4">
                      {!activo && (
                        <p className="mb-2 text-xs text-slate-500">
                          Este ticket está marcado como{" "}
                          <strong>{ticket.estado}</strong>. Si envías una nueva
                          respuesta, se reabrirá automáticamente.
                        </p>
                      )}
                      <AccionForm
                        accion={responderTicketAction.bind(
                          null,
                          slug,
                          ticket.id,
                        )}
                        boton={
                          activo
                            ? "Enviar respuesta"
                            : "Responder y reabrir ticket"
                        }
                        variante="primario"
                        limpiarAlOk
                      >
                        <div>
                          <label
                            htmlFor={`respuesta_${ticket.id}`}
                            className="sr-only"
                          >
                            Responder al ticket {ticket.asunto}
                          </label>
                          <TextareaConContador
                            id={`respuesta_${ticket.id}`}
                            name="mensaje"
                            required
                            minLength={2}
                            rows={3}
                            maxLength={4000}
                            placeholder={
                              activo
                                ? "Agrega más detalles o responde al equipo de soporte..."
                                : "Escribe aquí si necesitas reabrir esta consulta..."
                            }
                          />
                        </div>
                      </AccionForm>
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </section>

        {/* Columna lateral: autoservicio y preguntas frecuentes */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
              <HelpCircle
                className="h-4 w-4 text-slate-500"
                aria-hidden="true"
              />
              Respuestas rápidas sin esperar
            </h3>
            <ul className="mt-3 space-y-3 text-xs leading-relaxed text-slate-600">
              <li className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="font-semibold text-slate-800">
                  ¿Tu logo o portada da error al subir?
                </p>
                <p className="mt-0.5">
                  Asegúrate de usar formato <strong>PNG, JPG o WEBP</strong> con
                  un peso menor a <strong>{maxImagenMb} MB</strong> desde{" "}
                  <Link
                    href={`/${slug}/admin/personalizacion`}
                    className="font-semibold text-sky-700 hover:underline"
                  >
                    Personalización
                  </Link>
                  .
                </p>
              </li>
              <li className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="font-semibold text-slate-800">
                  ¿Necesitas cerrar un día sin borrar tus horarios?
                </p>
                <p className="mt-0.5">
                  Crea un bloqueo temporal por fecha o rango horario en{" "}
                  <Link
                    href={`/${slug}/admin/agenda`}
                    className="font-semibold text-sky-700 hover:underline"
                  >
                    Agenda y bloqueos
                  </Link>
                  .
                </p>
              </li>
              <li className="rounded-xl border border-slate-200/80 bg-white p-3">
                <p className="font-semibold text-slate-800">
                  ¿Cómo actualizar tu IBAN o revisar comisiones?
                </p>
                <p className="mt-0.5">
                  vuki cobra <strong>0% de comisión</strong>. Edita tu cuenta
                  IBAN en{" "}
                  <Link
                    href={`/${slug}/admin/personalizacion#liquidacion`}
                    className="font-semibold text-sky-700 hover:underline"
                  >
                    Personalización
                  </Link>{" "}
                  o exporta tus movimientos en{" "}
                  <Link
                    href={`/${slug}/admin/finanzas`}
                    className="font-semibold text-sky-700 hover:underline"
                  >
                    Finanzas
                  </Link>
                  .
                </p>
              </li>
            </ul>
          </section>

          {/* Tarjeta informativa de soporte con acción rápida */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
              <LifeBuoy className="h-4 w-4 text-sky-600" aria-hidden="true" />
              ¿Tienes otra duda o consulta?
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
              Nuestro equipo revisa las consultas de forma continua para brindarte
              asistencia técnica y operativa en todo momento.
            </p>
            <button
              type="button"
              onClick={() => abrirNuevo()}
              disabled={activosCount >= 10}
              className="vuki-focus mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              Abrir ticket de ayuda
            </button>
          </section>
        </div>
      </div>

      <Drawer
        abierto={drawerAbierto}
        onClose={cerrarDrawer}
        titulo="Nuevo ticket de ayuda"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {activosCount >= 10 ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <p className="font-semibold">Límite de tickets alcanzado</p>
              <p className="mt-1 text-amber-800">
                Tienes 10 tickets abiertos simultáneamente. Espera la respuesta
                de soporte antes de abrir una nueva consulta.
              </p>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500">
                  Elige un tema frecuente o escribe tu consulta libremente. Te
                  responderemos directamente en este panel.
                </p>

                {/* Chips de temas frecuentes */}
                <div className="mt-3">
                  <p className="mb-2 text-xs font-medium text-slate-600">
                    Temas rápidos
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {TEMAS_RAPIDOS.map((item) => {
                      const seleccionado = temaClave === item.clave;
                      return (
                        <button
                          key={item.clave}
                          type="button"
                          aria-pressed={seleccionado}
                          onClick={() => seleccionarTema(item.clave)}
                          className={`vuki-focus rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                            seleccionado
                              ? "border-(--marca) bg-(--marca-fondo) font-semibold text-(--marca-texto)"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {item.etiqueta}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ticket_asunto"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Asunto
                </label>
                <input
                  id="ticket_asunto"
                  name="asunto"
                  required
                  minLength={4}
                  maxLength={150}
                  value={asunto}
                  onChange={(e) => {
                    setAsunto(e.target.value);
                    if (temaClave) setTemaClave(null);
                  }}
                  placeholder="Ej. Problema al subir logotipo"
                  className={INPUT}
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label
                    htmlFor="ticket_mensaje"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Detalle de tu consulta
                  </label>
                  <span className="text-xs text-slate-400">
                    {mensaje.length}/4000
                  </span>
                </div>
                <textarea
                  id="ticket_mensaje"
                  name="mensaje"
                  required
                  minLength={5}
                  rows={6}
                  maxLength={4000}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder={placeholderActual}
                  className="vuki-textarea"
                />
              </div>

              <motion.button
                type="submit"
                disabled={enviando || activosCount >= 10}
                whileTap={{ scale: 0.97 }}
                className="vuki-focus flex min-h-12 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {enviando ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <LifeBuoy className="h-4 w-4" aria-hidden="true" />
                )}
                {enviando ? "Enviando consulta..." : "Enviar consulta a soporte"}
              </motion.button>
            </>
          )}
        </form>
      </Drawer>
    </EmpresaPage>
  );
}

