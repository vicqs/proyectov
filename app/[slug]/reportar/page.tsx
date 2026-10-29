import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { funcionActivaNegocio } from "@/lib/plataforma";
import ReportarClient from "./ReportarClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;
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

  return <ReportarClient slug={slug} nombre={negocio.nombre} />;
}
