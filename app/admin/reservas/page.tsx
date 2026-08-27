import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { ReservaConServicio } from "../../../types/database";

const ESTADO_STYLES: Record<"pendiente" | "pagada", string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
};

/**
 * Data table de todas las reservas del negocio, con el nombre del servicio
 * traído mediante consulta anidada de Supabase (JOIN implícito por FK).
 * Server Component: la consulta se ejecuta en el servidor y respeta RLS.
 */
export default async function ReservasPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let reservas: ReservaConServicio[] = [];

  if (negocio) {
    const { data, error } = await supabase
      .from("reservas")
      .select("*, servicio:servicios(nombre)")
      .eq("negocio_id", negocio.id)
      .order("fecha_hora", { ascending: false });

    if (!error) {
      reservas = (data ?? []) as unknown as ReservaConServicio[];
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Reservas</h1>

      {reservas.length === 0 ? (
        <p className="text-sm text-slate-500">
          Aún no hay reservas registradas.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Fecha/Hora</th>
                <th className="px-4 py-3 whitespace-nowrap">Cliente</th>
                <th className="px-4 py-3 whitespace-nowrap">Servicio</th>
                <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                <th className="px-4 py-3 whitespace-nowrap">ID Transacción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reservas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {new Date(reserva.fecha_hora).toLocaleString("es-CR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {reserva.email_cliente}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {reserva.servicio?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLES[reserva.estado]}`}
                    >
                      {reserva.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-500">
                    {reserva.trx_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
