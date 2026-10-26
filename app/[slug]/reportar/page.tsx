import Link from "next/link";
import { notFound } from "next/navigation";
import { Flag } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { AccionForm } from "@/components/admin/AccionForm";
import { reportarPerfilAction } from "@/actions/reportar";
import { funcionActivaNegocio } from "@/lib/plataforma";
import PaginaPublica from "@/components/PaginaPublica";

const INPUT =
  "min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-vuki-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vuki-ocean/20";

export const metadata = { title: "Reportar perfil", robots: { index: false } };

export default async function ReportarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data: negocio } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .maybeSingle();
  if (!negocio || negocio.eliminado_en) notFound();
  if (!(await funcionActivaNegocio(negocio, "reportes_publicos"))) notFound();

  return (
    <PaginaPublica
      titulo={`Reportar ${negocio.nombre}`}
      etiqueta="Ayúdanos a cuidar la comunidad"
      icono={<Flag className="h-4 w-4" />}
      descripcion="Cuéntanos qué te preocupa de este perfil. Lo revisará nuestro equipo."
      pie={
        <Link
          href={`/${encodeURIComponent(slug)}`}
          className="vuki-focus inline-flex min-h-11 items-center rounded-lg text-sm font-semibold text-sky-800 hover:underline"
        >
          Volver al perfil
        </Link>
      }
    >
      <div>
        <AccionForm
          accion={reportarPerfilAction.bind(null, slug)}
          boton="Enviar reporte"
          limpiarAlOk
        >
          <label
            htmlFor="reporte-motivo"
            className="block text-sm font-medium text-slate-700"
          >
            Motivo del reporte
          </label>
          <select
            id="reporte-motivo"
            name="motivo"
            required
            className={INPUT}
            defaultValue="contenido"
          >
            <option value="contenido">Contenido inapropiado</option>
            <option value="fraude">Posible fraude</option>
            <option value="suplantacion">Suplantación</option>
            <option value="otro">Otro</option>
          </select>
          <label
            htmlFor="reporte-detalle"
            className="block text-sm font-medium text-slate-700"
          >
            Detalles (opcional)
          </label>
          <textarea
            id="reporte-detalle"
            name="detalle"
            rows={4}
            maxLength={1000}
            placeholder="Detalles (opcional)"
            className={INPUT}
          />
          <label
            htmlFor="reporte-email"
            className="block text-sm font-medium text-slate-700"
          >
            Tu correo (opcional)
          </label>
          <input
            id="reporte-email"
            name="email"
            type="email"
            placeholder="Tu correo (opcional)"
            className={INPUT}
          />
        </AccionForm>
      </div>
    </PaginaPublica>
  );
}
