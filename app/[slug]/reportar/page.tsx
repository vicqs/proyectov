import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { AccionForm } from "@/components/admin/AccionForm";
import { reportarPerfilAction } from "@/actions/reportar";
import { funcionActivaNegocio } from "@/lib/plataforma";

const INPUT =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none";

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
    <main className="mx-auto max-w-lg px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">
        Reportar {negocio.nombre}
      </h1>
      <p className="mt-1 text-sm text-slate-600">
        Cuéntanos qué te preocupa de este perfil. Lo revisará nuestro equipo.
      </p>
      <div className="mt-6">
        <AccionForm
          accion={reportarPerfilAction.bind(null, slug)}
          boton="Enviar reporte"
          limpiarAlOk
        >
          <select
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
          <textarea
            name="detalle"
            rows={4}
            maxLength={1000}
            placeholder="Detalles (opcional)"
            className={INPUT}
          />
          <input
            name="email"
            type="email"
            placeholder="Tu correo (opcional)"
            className={INPUT}
          />
        </AccionForm>
      </div>
      <Link
        href={`/${encodeURIComponent(slug)}`}
        className="mt-6 inline-block py-2 text-sm text-sky-700 hover:underline"
      >
        Volver al perfil
      </Link>
    </main>
  );
}
