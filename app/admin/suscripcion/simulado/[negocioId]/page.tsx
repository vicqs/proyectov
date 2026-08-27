import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import { supabaseAdmin } from "../../../../../lib/supabase";
import type { Negocio } from "../../../../../types/database";
import { isStripeMockMode } from "../../../../../lib/stripe";
import {
  cancelarSuscripcionSimuladaAction,
  confirmarSuscripcionSimuladaAction,
} from "../../../../../actions/billing";

interface PageProps {
  params: Promise<{ negocioId: string }>;
}

/**
 * Pantalla de checkout simulada (reemplaza a Stripe Checkout mientras no
 * haya credenciales reales). Al confirmar, activa `estado_suscripcion` del
 * negocio igual que lo haría el webhook real de Stripe.
 */
export default async function SuscripcionSimuladaPage({ params }: PageProps) {
  if (!isStripeMockMode) {
    notFound();
  }

  const { negocioId } = await params;

  const { data: negocioData, error } = await supabaseAdmin
    .from("negocios")
    .select("*")
    .eq("id", negocioId)
    .single();

  if (error || !negocioData) {
    notFound();
  }

  const negocio = negocioData as Negocio;
  const confirmar = confirmarSuscripcionSimuladaAction.bind(null, negocio.id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-400">
          <CreditCard className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Stripe Checkout (simulado)
          </span>
        </div>

        <h1 className="text-lg font-semibold text-slate-900">
          Suscripción Turismo Link
        </h1>
        <p className="mt-1 text-sm text-slate-500">{negocio.nombre}</p>

        <div className="my-4 rounded-lg bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Total a pagar (mensual)</p>
          <p className="text-2xl font-bold text-slate-900">$15.00</p>
        </div>

        <form action={confirmar}>
          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Confirmar suscripción (simulado)
          </button>
        </form>
        <form action={cancelarSuscripcionSimuladaAction} className="mt-2">
          <button
            type="submit"
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cancelar
          </button>
        </form>
      </div>
    </main>
  );
}
