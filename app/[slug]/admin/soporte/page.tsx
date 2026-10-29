import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { leer } from "@/lib/admin/db";
import { fechaHora } from "@/lib/admin/formato";
import { crearTicketAction, responderTicketAction } from "@/actions/soporte";
import { AccionForm } from "@/components/admin/AccionForm";
import EmpresaPage from "@/components/EmpresaPage";
import { funcionActivaNegocio, obtenerConfiguracion } from "@/lib/plataforma";
import type { Ticket, TicketMensaje } from "@/types/database";

interface PageProps extends EmpresaPageProps {
  searchParams: Promise<{ filtro?: string; tema?: string }>;
}

type FiltroEstado = "todos" | "activos" | "resueltos";

const INPUT =
  "vuki-focus w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-500";

const TEMAS_RAPIDOS = [
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

function construirUrlSoporte(
  slug: string,
  opciones: { filtro?: FiltroEstado; tema?: string },
): string {
  const query = new URLSearchParams();
  if (opciones.filtro && opciones.filtro !== "todos") {
    query.set("filtro", opciones.filtro);
  }
  if (opciones.tema) {
    query.set("tema", opciones.tema);
  }
  const qs = query.toString();
  return `/${slug}/admin/soporte${qs ? `?${qs}` : ""}`;
}

export default async function SoportePage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, { filtro: filtroCrudo, tema: temaCrudo }] =
    await Promise.all([params, searchParams]);
  const { negocio } = await requerirEmpresa(slug);

  const [soporteActivo, config] = await Promise.all([
    funcionActivaNegocio(negocio, "soporte_empresas"),
    obtenerConfiguracion(),
  ]);
  if (!soporteActivo) notFound();

  const tickets = (
    await leer("tickets", { eq: { negocio_id: negocio.id } })
  ).sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en));

  const mensajesPorTicket = await Promise.all(
    tickets.map((t) =>
      leer("ticket_mensajes", {
        eq: { ticket_id: t.id },
        orden: ["creado_en", true],
      }),
    ),
  );

  const ticketsConMensajes = tickets.map((ticket, indice) => {
    const lista = mensajesPorTicket[indice] ?? [];
    const ultimo = lista[lista.length - 1];
    return { ticket, mensajes: lista, ultimo };
  });

  const filtroActivo: FiltroEstado =
    filtroCrudo === "activos" || filtroCrudo === "resueltos"
      ? filtroCrudo
      : "todos";

  const temaSeleccionado = TEMAS_RAPIDOS.find((t) => t.clave === temaCrudo);

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

  return (
    <EmpresaPage
      titulo="Soporte"
      descripcion="Resuelve dudas rápidas o conversa directamente con el equipo de vuki."
    >
      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_1.75fr]">
        {/* Columna izquierda: abrir nuevo ticket + respuestas rápidas */}
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-bold text-vuki-ink">
                  <LifeBuoy
                    className="h-4 w-4 text-sky-600"
                    aria-hidden="true"
                  />
                  Nuevo ticket de ayuda
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Elige un tema frecuente o escribe tu consulta libremente.
                </p>
              </div>
              {activosCount >= 8 && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-800">
                  {activosCount}/10 abiertos
                </span>
              )}
            </div>

            {/* Chips de temas frecuentes */}
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Temas rápidos
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TEMAS_RAPIDOS.map((item) => {
                  const seleccionado = temaSeleccionado?.clave === item.clave;
                  return (
                    <Link
                      key={item.clave}
                      scroll={false}
                      href={construirUrlSoporte(slug, {
                        filtro: filtroActivo,
                        tema: seleccionado ? undefined : item.clave,
                      })}
                      className={`vuki-focus rounded-full border px-3 py-1 text-xs font-medium transition ${
                        seleccionado
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {item.etiqueta}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="mt-4">
              <AccionForm
                key={temaSeleccionado?.clave ?? "libre"}
                accion={crearTicketAction.bind(null, slug)}
                boton="Enviar consulta a soporte"
                limpiarAlOk
              >
                <div>
                  <label
                    htmlFor="ticket_asunto"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Asunto
                  </label>
                  <input
                    id="ticket_asunto"
                    name="asunto"
                    required
                    minLength={4}
                    maxLength={150}
                    defaultValue={temaSeleccionado?.asunto ?? ""}
                    placeholder="Ej. Problema al subir logotipo"
                    className={INPUT}
                  />
                </div>

                <div>
                  <label
                    htmlFor="ticket_mensaje"
                    className="mb-1 block text-xs font-medium text-slate-700"
                  >
                    Detalle de tu consulta
                  </label>
                  <textarea
                    id="ticket_mensaje"
                    name="mensaje"
                    required
                    minLength={5}
                    rows={5}
                    maxLength={4000}
                    placeholder={
                      temaSeleccionado?.placeholder ??
                      "Describe qué estabas haciendo y qué ocurrió para poder ayudarte más rápido..."
                    }
                    className={INPUT}
                  />
                </div>
              </AccionForm>
            </div>
          </section>

          {/* Tarjeta de autoservicio para evitar esperas innecesarias */}
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
                  un peso menor a <strong>{config.max_imagen_mb} MB</strong>{" "}
                  desde{" "}
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
        </div>

        {/* Columna derecha: historial de conversaciones con filtros y estado claro */}
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
                  <Link
                    key={tab.id}
                    scroll={false}
                    href={construirUrlSoporte(slug, {
                      filtro: tab.id,
                      tema: temaSeleccionado?.clave,
                    })}
                    className={`vuki-focus rounded-lg px-2.5 py-1.5 font-semibold transition ${
                      activo
                        ? "bg-white text-vuki-ink shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.etiqueta}
                  </Link>
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
                Si tienes alguna dificultad técnica o consulta sobre tu cuenta,
                envíanos un mensaje desde el formulario y te responderemos aquí
                mismo.
              </p>
            </div>
          ) : ticketsFiltrados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <p className="text-sm font-medium text-slate-700">
                {filtroActivo === "activos"
                  ? "No tienes tickets activos pendientes en este momento."
                  : "Aún no tienes tickets marcados como resueltos."}
              </p>
              <Link
                scroll={false}
                href={construirUrlSoporte(slug, {
                  filtro: "todos",
                  tema: temaSeleccionado?.clave,
                })}
                className="vuki-focus mt-2 inline-block text-xs font-semibold text-sky-700 hover:underline"
              >
                Ver todas las conversaciones →
              </Link>
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
                        variante="neutro"
                        limpiarAlOk
                      >
                        <div>
                          <label
                            htmlFor={`respuesta_${ticket.id}`}
                            className="sr-only"
                          >
                            Responder al ticket {ticket.asunto}
                          </label>
                          <textarea
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
                            className={INPUT}
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
      </div>
    </EmpresaPage>
  );
}
