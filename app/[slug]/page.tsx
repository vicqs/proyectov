import { notFound } from "next/navigation";
import { cache } from "react";
import type { Metadata } from "next";
import { supabaseAdmin } from "../../lib/supabase";
import { construirHorarios } from "../../lib/horarios";
import {
  LOGO_POR_DEFECTO,
  PORTADA_POR_DEFECTO,
} from "../../lib/tipos-publicos";
import type { ServicioPublico } from "../../lib/tipos-publicos";
import type { Negocio, Reserva, Servicio } from "../../types/database";
import type { BloqueoExcepcion, Horario } from "../../types/database";
import NegocioProfileClient from "./NegocioProfileClient";
import Link from "next/link";
import { motivoNoOperativo } from "../../lib/negocio-estado";
import {
  funcionActivaNegocio,
  obtenerConfiguracion,
  flagActiva,
} from "../../lib/plataforma";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pago?: string }>;
}

const COLOR_TEMA_DEFAULT = "#0284c7";
const DESCRIPCION_DEFAULT =
  "Reserva y paga tu experiencia turística en línea de forma segura.";
const IMAGEN_SERVICIO_DEFAULT =
  "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=1200&auto=format&fit=crop";

/** Un solo viaje a la BD por petición (lo comparten metadatos y página). */
const obtenerNegocioPorSlug = cache(async (slug: string) => {
  const { data, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .single();
  return error || !data ? null : (data as Negocio);
});

/** Metadatos dinámicos (título, descripción y Open Graph) por negocio. */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await obtenerNegocioPorSlug(slug);

  if (!data || data.eliminado_en || data.suspendido) {
    return {
      title: "Negocio no disponible — Turismo Link",
      description: "Este negocio turístico no está disponible.",
      robots: { index: false, follow: false },
    };
  }

  const negocio = data;
  const titulo = `${negocio.nombre} — Reserva y paga en línea`;
  const descripcion = negocio.descripcion ?? DESCRIPCION_DEFAULT;
  const logo = negocio.logo_url ?? LOGO_POR_DEFECTO;

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
 * interactiva al componente cliente.
 */
export default async function NegocioPublicPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { pago } = await searchParams;

  const negocio = await obtenerNegocioPorSlug(slug);
  if (!negocio || negocio.eliminado_en) notFound();
  const config = await obtenerConfiguracion();

  if (negocio.suspendido) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Perfil no disponible
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Este negocio no está disponible en este momento.
        </p>
      </main>
    );
  }

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

  const servicios: ServicioPublico[] = serviciosDb.map((s) => ({
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
    <>
      {config.modo_mantenimiento && (
        <div className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-800">
          {config.mensaje_mantenimiento ??
            "La plataforma está en mantenimiento: las reservas están pausadas."}
        </div>
      )}
      <NegocioProfileClient
        negocio={{
          nombre: negocio.nombre,
          descripcion: negocio.descripcion ?? DESCRIPCION_DEFAULT,
          portadaUrl: negocio.imagen_portada_url ?? PORTADA_POR_DEFECTO,
          logoUrl: negocio.logo_url ?? LOGO_POR_DEFECTO,
          colorTema: negocio.color_tema ?? COLOR_TEMA_DEFAULT,
          colorSecundario:
            negocio.color_secundario ??
            negocio.color_tema ??
            COLOR_TEMA_DEFAULT,
          whatsapp: negocio.whatsapp ?? undefined,
        }}
        servicios={servicios}
        horarios={horarios}
        suscripcionActiva={
          motivoNoOperativo(negocio) === null &&
          !config.modo_mantenimiento &&
          flagActiva(config, "reservas_publicas")
        }
        pago={pago}
      />
      {(await funcionActivaNegocio(negocio, "reportes_publicos")) && (
        <p className="pb-6 text-center text-xs text-slate-600">
          <Link
            href={`/${encodeURIComponent(slug)}/reportar`}
            className="inline-block px-2 py-2 hover:underline focus-visible:underline"
          >
            Reportar este perfil
          </Link>
        </p>
      )}
    </>
  );
}
