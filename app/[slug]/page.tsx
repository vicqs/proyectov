import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { supabaseAdmin } from "../../lib/supabase";
import { construirHorarios } from "../../lib/horarios";
import { mockNegocio } from "../../lib/mockData";
import type { DemoServicio } from "../../lib/demoStore";
import type { Negocio, Reserva, Servicio } from "../../types/database";
import type { BloqueoExcepcion, Horario } from "../../types/database";
import NegocioProfileClient from "./NegocioProfileClient";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pago?: string }>;
}

const COLOR_TEMA_DEFAULT = "#0284c7";
const DESCRIPCION_DEFAULT =
  "Reserva y paga tu experiencia turística en línea de forma segura.";
const IMAGEN_SERVICIO_DEFAULT =
  "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=1200&auto=format&fit=crop";

/** Metadatos dinámicos (título, descripción y Open Graph) por negocio. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const { data } = await supabaseAdmin
    .from("negocios")
    .select("nombre, descripcion, logo_url")
    .eq("slug", slug)
    .single();

  if (!data) {
    return {
      title: "Negocio no encontrado — Turismo Link",
      description: "Este negocio turístico no está disponible.",
    };
  }

  const negocio = data as Pick<Negocio, "nombre" | "descripcion" | "logo_url">;
  const titulo = `${negocio.nombre} — Reserva y paga en línea`;
  const descripcion = negocio.descripcion ?? DESCRIPCION_DEFAULT;
  const logo = negocio.logo_url ?? mockNegocio.logoUrl;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: [{ url: logo }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: [logo],
    },
  };
}

/**
 * Perfil público real: obtiene negocio, servicios, reservas y bloqueos en
 * el servidor, calcula los horarios con cupos y delega la experiencia
 * interactiva (idéntica al demo) al componente cliente.
 */
export default async function NegocioPublicPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { pago } = await searchParams;

  const { data: negocioData, error: negocioError } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("slug", slug)
    .single();

  if (negocioError || !negocioData) {
    notFound();
  }

  const negocio = negocioData as Negocio;

  const [serviciosRes, reservasRes, bloqueosRes, horariosRes] =
    await Promise.all([
      supabaseAdmin.from("servicios").select("*").eq("negocio_id", negocio.id),
      supabaseAdmin.from("reservas").select("*").eq("negocio_id", negocio.id),
      supabaseAdmin
        .from("bloqueos_excepcion")
        .select("*")
        .eq("negocio_id", negocio.id),
      supabaseAdmin.from("horarios").select("*").eq("negocio_id", negocio.id),
    ]);

  if (serviciosRes.error) {
    console.error(
      `Error al cargar los servicios del negocio "${slug}":`,
      serviciosRes.error,
    );
    throw new Error("Ocurrió un error al cargar la información del negocio.");
  }

  const serviciosDb = (serviciosRes.data ?? []) as Servicio[];
  const reservas = (reservasRes.data ?? []) as Reserva[];
  const bloqueos = (bloqueosRes.data ?? []) as BloqueoExcepcion[];

  const servicios: DemoServicio[] = serviciosDb.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion ?? "",
    precioUsd: s.precio_usd,
    duracionMin: s.duracion_min,
    imagenUrl: s.imagen_url ?? IMAGEN_SERVICIO_DEFAULT,
  }));

  const horarios = construirHorarios(
    (horariosRes.data ?? []) as Horario[],
    reservas,
    bloqueos,
    true,
  );

  return (
    <NegocioProfileClient
      negocio={{
        nombre: negocio.nombre,
        descripcion: negocio.descripcion ?? DESCRIPCION_DEFAULT,
        portadaUrl: negocio.imagen_portada_url ?? mockNegocio.portadaUrl,
        logoUrl: negocio.logo_url ?? mockNegocio.logoUrl,
        colorTema: negocio.color_tema ?? COLOR_TEMA_DEFAULT,
        whatsapp: negocio.whatsapp ?? undefined,
      }}
      servicios={servicios}
      horarios={horarios}
      suscripcionActiva={negocio.estado_suscripcion !== "inactiva"}
      pago={pago}
    />
  );
}
