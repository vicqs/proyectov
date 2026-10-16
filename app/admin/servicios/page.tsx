import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Servicio } from "../../../types/database";
import ServiciosAdminClient from "./ServiciosAdminClient";

/**
 * Lista los servicios del negocio del usuario autenticado. La consulta usa
 * el cliente SSR (respeta RLS): solo puede leer servicios cuyo `negocio_id`
 * pertenece al usuario logueado. La edición ocurre en el cliente vía
 * Server Actions.
 */
export default async function ServiciosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let servicios: Servicio[] = [];

  if (negocio) {
    const { data, error } = await supabase
      .from("servicios")
      .select("*")
      .eq("negocio_id", negocio.id)
      .order("nombre", { ascending: true });

    if (!error) {
      servicios = (data ?? []) as Servicio[];
    }
  }

  return (
    <ServiciosAdminClient
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precioUsd: s.precio_usd,
        duracionMin: s.duracion_min,
        descripcion: s.descripcion ?? "",
        imagenUrl: s.imagen_url ?? "",
      }))}
    />
  );
}
