import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Negocio } from "../../../types/database";
import { crearCheckoutSuscripcionAction } from "../../../actions/billing";
import SuscribirseButton from "./SuscribirseButton";

interface PageProps {
  searchParams: Promise<{ estado?: string }>;
}

const BENEFICIOS = [
  "Página de reservas con pagos en línea propia",
  "Panel de administración de servicios y agenda",
  "Notificaciones automáticas por correo",
  "Dashboard financiero con cálculo de comisiones",
  "Soporte prioritario por correo",
];

const ESTADO_LABELS: Record<Negocio["estado_suscripcion"], string> = {
  activa: "Activa",
  inactiva: "Inactiva",
  prueba: "En período de prueba",
};

const ESTADO_STYLES: Record<Negocio["estado_suscripcion"], string> = {
  activa: "bg-emerald-100 text-emerald-700",
  inactiva: "bg-red-100 text-red-700",
  prueba: "bg-amber-100 text-amber-700",
};

/**
 * Gestión de la suscripción SaaS ($15 USD/mes). Muestra el estado actual
 * de la cuenta y, si no está activa, un "Pricing Card" con el botón para
 * iniciar el checkout de Stripe (o el flujo simulado en modo mock).
 */
export default async function SuscripcionPage({ searchParams }: PageProps) {
  const { estado: estadoQuery } = await searchParams;

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocioData, error } = await supabase
    .from("negocios")
    .select("*")
    .eq("user_id", user!.id)
    .single();

  if (error || !negocioData) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se encontró el negocio asociado a este usuario.
      </div>
    );
  }

  const negocio = negocioData as Negocio;
  const activa = negocio.estado_suscripcion === "activa";

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Suscripción</h1>

      {estadoQuery === "cancelado" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando
          quieras.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Estado de la cuenta
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {negocio.nombre}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLES[negocio.estado_suscripcion]}`}
        >
          {ESTADO_LABELS[negocio.estado_suscripcion]}
        </span>
      </div>

      {activa ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <p className="text-sm">
            Tu suscripción está activa. Tienes acceso completo a todas las
            funciones de la plataforma.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {negocio.estado_suscripcion === "inactiva" && (
            <div className="mb-4 flex items-center gap-2 text-sm text-red-600">
              <ShieldAlert className="h-4 w-4" />
              Tu suscripción está inactiva. Actívala para seguir usando la
              plataforma sin interrupciones.
            </div>
          )}

          <p className="text-xs font-medium uppercase tracking-wide text-sky-600">
            Plan Turismo Link
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            $15{" "}
            <span className="text-base font-medium text-slate-400">/ mes</span>
          </p>

          <ul className="my-5 space-y-2">
            {BENEFICIOS.map((beneficio) => (
              <li
                key={beneficio}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <Circle className="mt-1 h-2 w-2 shrink-0 fill-sky-500 text-sky-500" />
                {beneficio}
              </li>
            ))}
          </ul>

          <form action={crearCheckoutSuscripcionAction}>
            <SuscribirseButton />
          </form>
        </div>
      )}
    </div>
  );
}
