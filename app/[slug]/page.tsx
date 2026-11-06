import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  obtenerNegocioPublico,
  listarServiciosPublicos,
  listarHorariosPublicos,
} from "../../lib/data/public";
import {
  LOGO_POR_DEFECTO,
  PORTADA_POR_DEFECTO,
} from "../../lib/tipos-publicos";
import type { ServicioPublico } from "../../lib/tipos-publicos";
import NegocioProfileClient from "./NegocioProfileClient";
import { normalizarMoneda } from "../../lib/monedas";
import { motivoNoOperativo } from "../../lib/negocio-estado";
import {
  funcionActiva,
  listarPlanes,
  obtenerConfiguracion,
  flagActiva,
} from "../../lib/plataforma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const data = await obtenerNegocioPublico(slug);

  if (!data || data.eliminado_en || data.suspendido) {
    return {
      title: "Negocio no disponible",
      description: "Este negocio turístico no está disponible.",
      robots: { index: false, follow: false },
    };
  }

  const negocio = data;
  const titulo = `${negocio.nombre} — Reserva y paga en línea`;
  const descripcion = negocio.descripcion ?? DESCRIPCION_DEFAULT;
  const logo =
    negocio.logo_url && !negocio.logo_url.startsWith("data:")
      ? negocio.logo_url
      : LOGO_POR_DEFECTO;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      siteName: "vuki",
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

  const negocioConDatosPromise = obtenerNegocioPublico(slug).then(
    async (negocio) => {
      if (!negocio || negocio.eliminado_en || negocio.suspendido) {
        return { negocio, serviciosDb: [], horarios: [] };
      }
      const [serviciosDb, horarios] = await Promise.all([
        listarServiciosPublicos(negocio.id),
        listarHorariosPublicos(negocio.id),
      ]);
      return { negocio, serviciosDb, horarios };
    },
  );

  const [{ negocio, serviciosDb, horarios }, config, planes] =
    await Promise.all([
      negocioConDatosPromise,
      obtenerConfiguracion(),
      listarPlanes(),
    ]);
  if (!negocio || negocio.eliminado_en) notFound();

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

  const monedaNegocio = normalizarMoneda(negocio.moneda, "USD");

  const servicios: ServicioPublico[] = serviciosDb.map((s) => ({
    id: s.id,
    nombre: s.nombre,
    descripcion: s.descripcion ?? "",
    precioUsd: s.precio_usd,
    moneda: normalizarMoneda(s.currency, monedaNegocio),
    duracionMin: s.duracion_min,
    tipoUnidad: s.unit_type ?? "cupo",
    stockDisponible: s.stock ?? null,
    imagenUrl: s.imagen_url ?? negocio.logo_url ?? IMAGEN_SERVICIO_DEFAULT,
  }));

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
          moneda: monedaNegocio,
          whatsapp: negocio.whatsapp?.trim() || undefined,
        }}
        servicios={servicios}
        horarios={horarios}
        suscripcionActiva={
          motivoNoOperativo(negocio) === null &&
          !config.modo_mantenimiento &&
          flagActiva(config, "reservas_publicas")
        }
        pago={pago}
        modoPagosSimulados={config.pagos_simulados}
        hrefReportar={
          funcionActiva(config, negocio, planes, "reportes_publicos")
            ? `/${encodeURIComponent(slug)}/reportar`
            : undefined
        }
      />
    </>
  );
}
