import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, DollarSign } from "lucide-react";
import { supabaseAdmin } from "../../lib/supabase";
import type { Negocio, Servicio } from "../../types/database";
import BookingButton from "./BookingButton";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ pago?: string }>;
}

/**
 * Genera metadatos dinámicos (título, descripción y Open Graph) por
 * negocio, para que al compartir el link (WhatsApp, Instagram, etc.) se
 * vea una vista previa profesional con el nombre, la biografía y el logo
 * del negocio. Se ejecuta en el servidor antes de renderizar la página.
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  const { data: negocioData } = await supabaseAdmin
    .from("negocios")
    .select("nombre, descripcion, logo_url")
    .eq("slug", slug)
    .single();

  if (!negocioData) {
    return {
      title: "Negocio no encontrado — Turismo Link",
      description: "Este negocio turístico no está disponible.",
    };
  }

  const negocio = negocioData as Pick<
    Negocio,
    "nombre" | "descripcion" | "logo_url"
  >;

  const titulo = `${negocio.nombre} — Reserva y paga en línea`;
  const descripcion =
    negocio.descripcion ??
    "Reserva y paga tu experiencia turística en línea de forma segura.";
  const imagenes = negocio.logo_url ? [{ url: negocio.logo_url }] : undefined;

  return {
    title: titulo,
    description: descripcion,
    openGraph: {
      title: titulo,
      description: descripcion,
      images: imagenes,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: titulo,
      description: descripcion,
      images: negocio.logo_url ? [negocio.logo_url] : undefined,
    },
  };
}

/**
 * Server Component: obtiene el negocio y sus servicios en el servidor
 * (SSR) para maximizar SEO y rendimiento. No requiere JS en el cliente
 * salvo por el botón de reserva (ver BookingButton).
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
  let servicios: Servicio[] = [];

  try {
    const { data: serviciosData, error: serviciosError } = await supabaseAdmin
      .from("servicios")
      .select("*")
      .eq("negocio_id", negocio.id);

    if (serviciosError) {
      throw serviciosError;
    }
    servicios = (serviciosData ?? []) as Servicio[];
  } catch (error) {
    console.error(
      `Error al cargar los servicios del negocio "${slug}":`,
      error,
    );
    throw new Error("Ocurrió un error al cargar la información del negocio.");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {pago === "exitoso" && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            ¡Pago confirmado! Revisa tu correo para ver el recibo.
          </div>
        )}
        {pago === "cancelado" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
            El pago fue cancelado. Tu reserva quedó pendiente.
          </div>
        )}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {negocio.nombre}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {negocio.descripcion ||
              "Reserva y paga tu experiencia en línea de forma segura."}
          </p>
        </header>

        <section className="space-y-4">
          {servicios.length === 0 ? (
            <p className="text-center text-slate-500">
              Este negocio aún no tiene servicios disponibles.
            </p>
          ) : (
            servicios.map((servicio) => (
              <article
                key={servicio.id}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {servicio.nombre}
                  </h2>
                  <div className="mt-1 flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {servicio.duracion_min} min
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {servicio.precio_usd.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <BookingButton
                  servicioId={servicio.id}
                  precioUsd={servicio.precio_usd}
                />
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
