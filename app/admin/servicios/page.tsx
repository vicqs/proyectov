import { Clock, DollarSign } from "lucide-react";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Servicio } from "../../../types/database";
import NuevoServicioForm from "./NuevoServicioForm";

/**
 * Lista los servicios del negocio del usuario autenticado y permite crear
 * uno nuevo. La consulta usa el cliente SSR (respeta RLS): solo puede leer
 * servicios cuyo `negocio_id` pertenece al usuario logueado.
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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Mis Servicios</h1>

      <NuevoServicioForm />

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {servicios.length === 0 ? (
          <p className="text-sm text-slate-500">Aún no has creado servicios.</p>
        ) : (
          servicios.map((servicio) => (
            <article
              key={servicio.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-base font-semibold text-slate-800">
                {servicio.nombre}
              </h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {servicio.duracion_min} min
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {servicio.precio_usd.toFixed(2)} USD
                </span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
