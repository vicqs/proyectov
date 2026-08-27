import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../lib/supabase";
import type { Negocio } from "../../types/database";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

const COLOR_TEMA_DEFAULT = "#0284c7";

/**
 * Layout público de `/[slug]`: obtiene el negocio una sola vez (Server
 * Component) e inyecta su `color_tema` como variable CSS (`--color-tema`)
 * y muestra la `imagen_portada_url` en la parte superior. `page.tsx`
 * reutiliza esa misma consulta implícitamente vía el caché de `fetch` de
 * Next.js (ambos usan el mismo cliente/URL de Supabase, que internamente
 * hace `fetch`, permitiendo la deduplicación de requests dentro del mismo
 * árbol de renderizado).
 */
export default async function NegocioPublicLayout({
  children,
  params,
}: LayoutProps) {
  const { slug } = await params;

  const { data: negocioData, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !negocioData) {
    notFound();
  }

  const negocio = negocioData as Negocio;
  const colorTema = negocio.color_tema ?? COLOR_TEMA_DEFAULT;

  return (
    <div
      style={{ "--color-tema": colorTema } as React.CSSProperties}
      className="min-h-screen bg-white"
    >
      {negocio.imagen_portada_url && (
        <div className="h-40 w-full overflow-hidden sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={negocio.imagen_portada_url}
            alt={`Portada de ${negocio.nombre}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      {negocio.logo_url && (
        <div className="mx-auto -mt-10 h-20 w-20 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md sm:-mt-12 sm:h-24 sm:w-24">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={negocio.logo_url}
            alt={`Logo de ${negocio.nombre}`}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div
        style={{ borderTopColor: "var(--color-tema)" }}
        className="border-t-4"
      >
        {children}
      </div>
    </div>
  );
}
