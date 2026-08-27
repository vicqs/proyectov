import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buscarNegocioPorSlug } from "../../../lib/mockData";
import NegocioProfileClient from "./NegocioProfileClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Perfil público de DEMO (100% datos simulados, sin Supabase ni pasarela
 * real). Pensado para mostrar el prototipo a clientes potenciales.
 * Ej: /demo/surf-tamarindo
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const negocio = buscarNegocioPorSlug(slug);

  if (!negocio) {
    return {
      title: "Negocio no encontrado — Proyecto V",
      description: "Este negocio turístico no está disponible.",
    };
  }

  const titulo = `${negocio.nombre} — Reserva y paga en línea`;

  return {
    title: titulo,
    description: negocio.descripcion,
    openGraph: {
      title: titulo,
      description: negocio.descripcion,
      images: [{ url: negocio.logoUrl }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: negocio.descripcion,
      images: [negocio.logoUrl],
    },
  };
}

export default async function NegocioDemoPage({ params }: PageProps) {
  const { slug } = await params;
  const negocio = buscarNegocioPorSlug(slug);

  if (!negocio) {
    notFound();
  }

  return <NegocioProfileClient negocio={negocio} />;
}
