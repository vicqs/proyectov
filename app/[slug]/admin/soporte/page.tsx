import { notFound } from "next/navigation";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { leer } from "@/lib/admin/db";
import { funcionActivaNegocio, obtenerConfiguracion } from "@/lib/plataforma";
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
  ] = await Promise.all([params, searchParams]);
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

  const ticketsConMensajes: TicketConMensajes[] = tickets.map(
    (ticket, indice) => {
      const lista = mensajesPorTicket[indice] ?? [];
      const ultimo = lista[lista.length - 1];
      return { ticket, mensajes: lista, ultimo };
    },
  );

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
