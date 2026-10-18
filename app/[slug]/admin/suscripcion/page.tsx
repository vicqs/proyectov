import Link from "next/link";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";
import { isStripeMockMode } from "@/lib/stripe";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { Negocio } from "@/types/database";
import {
  cancelarSuscripcionActivaAction,
  crearCheckoutSuscripcionAction,
} from "@/actions/billing";
import EmpresaPage from "@/components/EmpresaPage";
import SuscribirseButton from "./SuscribirseButton";

interface PageProps extends EmpresaPageProps {
  searchParams: Promise<{ estado?: string }>;
}

const BENEFICIOS = [
  "Página de reservas con pagos en línea propia",
  "Panel de empresa para gestionar servicios y agenda",
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
export default async function SuscripcionPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, { estado: estadoQuery }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { negocio } = await requerirEmpresa(slug);
  const activa = negocio.estado_suscripcion === "activa";

  return (
    <EmpresaPage
      titulo="Suscripción"
      descripcion="Gestiona el plan SaaS de tu negocio."
    >
      {estadoQuery === "error" && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          No pudimos completar la operación. Inténtalo de nuevo en unos minutos
          o contacta con soporte.
        </div>
      )}

      {estadoQuery === "cancelado" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          El proceso de pago fue cancelado. Puedes intentarlo de nuevo cuando
          quieras.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Estado de la cuenta
          </p>
          <p className="mt-1 text-lg font-semibold text-slate-900">
            {negocio.nombre}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${ESTADO_STYLES[negocio.estado_suscripcion]}`}
        >
          {ESTADO_LABELS[negocio.estado_suscripcion]}
        </span>
      </div>

      {activa ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-700">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 shrink-0" />
            <p className="text-sm">
              Tu suscripción está activa. Tu enlace público{" "}
              <Link
                href={`/${negocio.slug}`}
                className="font-medium underline underline-offset-2"
              >
                /{negocio.slug}
              </Link>{" "}
              está disponible y tus clientes pueden reservar y pagar con
              normalidad.
            </p>
          </div>
          <Link
            href={`/${negocio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ver enlace público ↗
          </Link>
          {isStripeMockMode && (
            <form
              action={cancelarSuscripcionActivaAction.bind(null, negocio.slug)}
            >
              <button
                type="submit"
                className="mt-3 h-12 w-full rounded-2xl border border-red-200 bg-white text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Cancelar suscripción (simular impago)
              </button>
            </form>
          )}
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

          <p className="text-xs font-semibold uppercase tracking-widest text-sky-600">
            Plan Turismo Link
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
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

          <form
            action={crearCheckoutSuscripcionAction.bind(null, negocio.slug)}
          >
            <SuscribirseButton />
          </form>
        </div>
      )}
    </EmpresaPage>
  );
}
