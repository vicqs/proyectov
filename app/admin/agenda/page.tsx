import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { BloqueoExcepcion } from "../../../types/database";
import AgendaAdminClient from "./AgendaAdminClient";

/**
 * Gestión de la Agenda: lista los bloqueos futuros activos del negocio del
 * usuario autenticado. La carga inicial ocurre en el servidor; crear y
 * eliminar se hacen desde el cliente vía Server Actions.
 */
export default async function AgendaPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

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
    <AgendaAdminClient
      bloqueos={bloqueos.map((b) => ({
        id: b.id,
        inicioIso: b.fecha_inicio,
        finIso: b.fecha_fin,
        motivo: b.motivo,
      }))}
    />
  );
}
