import { Calendar, Mail } from "lucide-react";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import type { Reserva } from "../../types/database";

const ESTADO_STYLES: Record<Reserva["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
};

/**
 * Overview del dashboard: próximas 5 reservas del negocio del usuario
 * autenticado. Gracias a RLS, el filtro por `negocio_id` solo puede
 * devolver filas que le pertenecen al usuario logueado.
 */
export default async function AdminOverviewPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let reservas: Reserva[] = [];

  if (negocio) {
    const { data, error } = await supabase
      .from("reservas")
      .select("*")
      .eq("negocio_id", negocio.id)
      .in("estado", ["pendiente", "pagada"])
      .order("fecha_hora", { ascending: true })
      .limit(5);

    if (!error) {
      reservas = (data ?? []) as Reserva[];
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Inicio</h1>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Próximas reservas
        </h2>

        {reservas.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tienes reservas pendientes o pagadas por ahora.
          </p>
        ) : (
          <ul className="space-y-3">
            {reservas.map((reserva) => (
              <li
                key={reserva.id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-4"
              >
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  {new Date(reserva.fecha_hora).toLocaleString("es-CR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  <Mail className="h-4 w-4 text-slate-400" />
                  {reserva.email_cliente}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLES[reserva.estado]}`}
                >
                  {reserva.estado}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
