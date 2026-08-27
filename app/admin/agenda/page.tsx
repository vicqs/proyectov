import { CalendarOff } from "lucide-react";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { BloqueoExcepcion } from "../../../types/database";
import NuevoBloqueoForm from "./NuevoBloqueoForm";

/**
 * Página de gestión de la Agenda: lista los bloqueos futuros activos del
 * negocio del usuario autenticado y permite crear nuevos. Server Component:
 * la carga inicial de datos ocurre en el servidor y se pasa como props al
 * formulario (Client Component).
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
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Agenda / Bloqueos
      </h1>

      <NuevoBloqueoForm />

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          Bloqueos futuros activos
        </h2>

        {bloqueos.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tienes bloqueos de horario programados.
          </p>
        ) : (
          <ul className="space-y-3">
            {bloqueos.map((bloqueo) => (
              <li
                key={bloqueo.id}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
              >
                <CalendarOff className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {formatRango(bloqueo.fecha_inicio, bloqueo.fecha_fin)}
                  </p>
                  <p className="text-sm text-slate-500">{bloqueo.motivo}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function formatRango(inicio: string, fin: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  };
  const inicioFmt = new Date(inicio).toLocaleString("es-CR", opts);
  const finFmt = new Date(fin).toLocaleString("es-CR", opts);
  return `${inicioFmt} — ${finFmt}`;
}
