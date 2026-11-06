import { notFound } from "next/navigation";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { leer } from "@/lib/data/server";
import {
  funcionActiva,
  listarPlanes,
  obtenerConfiguracion,
} from "@/lib/plataforma";
import SoporteEmpresaClient, {
  type FiltroEstado,
  type TicketConMensajes,
} from "./SoporteEmpresaClient";

interface PageProps extends EmpresaPageProps {
  searchParams: Promise<{ filtro?: string; tema?: string; nuevo?: string }>;
}

export default async function SoportePage({
  params,
  searchParams,
}: PageProps) {
  const [
    { slug },
    { filtro: filtroCrudo, tema: temaCrudo, nuevo: nuevoCrudo },
    config,
    planes,
  ] = await Promise.all([
    params,
    searchParams,
    obtenerConfiguracion(),
    listarPlanes(),
  ]);
  const { negocio } = await requerirEmpresa(slug);

  if (!funcionActiva(config, negocio, planes, "soporte_empresas")) notFound();

  const ticketsCrudos = await leer("tickets", {
    eq: { negocio_id: negocio.id },
  });

  const tickets = ticketsCrudos.sort((a, b) =>
    b.actualizado_en.localeCompare(a.actualizado_en),
  );

  const todosMensajes =
    tickets.length > 0
      ? await leer("ticket_mensajes", {
          en: { ticket_id: tickets.map((t) => t.id) },
          orden: ["creado_en", true],
        })
      : [];
  const mensajesMap = new Map<string, typeof todosMensajes>();
  for (const m of todosMensajes) {
    const arr = mensajesMap.get(m.ticket_id);
    if (arr) arr.push(m);
    else mensajesMap.set(m.ticket_id, [m]);
  }

  const ticketsConMensajes: TicketConMensajes[] = tickets.map((ticket) => {
    const lista = mensajesMap.get(ticket.id) ?? [];
    const ultimo = lista[lista.length - 1];
    return { ticket, mensajes: lista, ultimo };
  });

  const filtroInicial: FiltroEstado =
    filtroCrudo === "activos" || filtroCrudo === "resueltos"
      ? filtroCrudo
      : "todos";

  return (
    <SoporteEmpresaClient
      slug={slug}
      maxImagenMb={config.max_imagen_mb}
      ticketsConMensajes={ticketsConMensajes}
      filtroInicial={filtroInicial}
      temaInicial={temaCrudo}
      abrirInicial={nuevoCrudo === "1" || Boolean(temaCrudo)}
    />
  );
}
