import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { BloqueoExcepcion } from "@/types/database";
import AgendaEmpresaClient from "./AgendaEmpresaClient";

/**
 * Gestión de la Agenda: lista los bloqueos futuros activos del negocio del
 * usuario autenticado. La carga inicial ocurre en el servidor; crear y
 * eliminar se hacen desde el cliente vía Server Actions.
 */
export default async function AgendaPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { supabase, negocio } = await requerirEmpresa(slug);

  let bloqueos: BloqueoExcepcion[] = [];

  if (negocio) {
    const { data, error } = await supabase
      .from("bloqueos_excepcion")
      .select("*")
      .eq("negocio_id", negocio.id)
      .gte("fecha_fin", new Date().toISOString())
      .order("fecha_inicio", { ascending: true });

    if (!error) {
      bloqueos = (data ?? []) as BloqueoExcepcion[];
    }
  }

  return (
    <AgendaEmpresaClient
      slug={negocio.slug}
      bloqueos={bloqueos.map((b) => ({
        id: b.id,
        inicioIso: b.fecha_inicio,
        finIso: b.fecha_fin,
        motivo: b.motivo,
      }))}
    />
  );
}
