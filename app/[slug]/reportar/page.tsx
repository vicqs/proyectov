import { notFound } from "next/navigation";
import { obtenerNegocioPublico } from "@/lib/data/public";
import {
  funcionActiva,
  listarPlanes,
  obtenerConfiguracion,
} from "@/lib/plataforma";
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
  const [negocio, config, planes] = await Promise.all([
    obtenerNegocioPublico(slug),
    obtenerConfiguracion(),
    listarPlanes(),
  ]);
  if (
    !negocio ||
    negocio.eliminado_en ||
    negocio.suspendido ||
    config.modo_mantenimiento
  ) {
    notFound();
  }
  if (!funcionActiva(config, negocio, planes, "reportes_publicos")) notFound();

  return <ReportarClient slug={slug} nombre={negocio.nombre} />;
}
