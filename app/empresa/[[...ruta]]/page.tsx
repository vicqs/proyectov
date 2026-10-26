import { notFound, redirect } from "next/navigation";
import { requerirEmpresa } from "@/lib/empresa";
import { conservarBusqueda, rutaPanelEmpresa, seccionPanelAnterior } from "@/lib/rutas-empresa";

/** Compatibilidad con /empresa: el destino siempre procede de la sesión. */
export default async function EmpresaAnteriorPage({
  params,
  searchParams,
}: {
  params: Promise<{ ruta?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ ruta }, busqueda] = await Promise.all([params, searchParams]);
  const { negocio } = await requerirEmpresa();
  const seccion = seccionPanelAnterior(ruta, negocio.id);
  if (seccion === null) notFound();
  redirect(conservarBusqueda(rutaPanelEmpresa(negocio.slug, seccion), busqueda));
}