import { notFound } from "next/navigation";
import { CreditCard, ShieldCheck } from "lucide-react";
import { supabaseAdmin } from "../../../lib/supabase";
import type { Negocio, Reserva, Servicio } from "../../../types/database";
import {
  cancelarPagoSimuladoAction,
  confirmarPagoSimuladoAction,
} from "../../../actions/pago-simulado";

interface PageProps {
  params: Promise<{ reservaId: string }>;
}

/**
 * Pantalla de pago simulada (reemplaza a la pasarela real, ej. Tilopay,
 * mientras no haya integración en producción). Muestra el resumen de la
 * reserva y permite "pagar" o "cancelar", ambos vía Server Actions que
 * actualizan el estado real de la reserva en la base de datos (o el mock).
 */
export default async function PagoSimuladoPage({ params }: PageProps) {
  const { reservaId } = await params;

  const { data: reservaData, error: reservaError } = await supabaseAdmin
    .from("reservas")
    .select("*")
    .eq("id", reservaId)
    .single();

  if (reservaError || !reservaData) {
    notFound();
  }

  const reserva = reservaData as Reserva;

  const [{ data: servicioData }, { data: negocioData }] = await Promise.all([
    supabaseAdmin
      .from("servicios")
      .select("*")
      .eq("id", reserva.servicio_id)
      .single(),
    supabaseAdmin
      .from("negocios")
      .select("*")
      .eq("id", reserva.negocio_id)
      .single(),
  ]);

  const servicio = servicioData as Servicio | null;
  const negocio = negocioData as Negocio | null;

  if (reserva.estado === "pagada") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h1 className="text-lg font-semibold text-slate-900">
            Esta reserva ya fue pagada
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Trx: {reserva.trx_id ?? "N/A"}
          </p>
        </div>
      </main>
    );
  }

  const confirmar = confirmarPagoSimuladoAction.bind(null, reserva.id);
  const cancelar = cancelarPagoSimuladoAction.bind(null, reserva.id);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-slate-400">
          <CreditCard className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wide">
            Pasarela de pagos (simulada)
          </span>
        </div>

        <h1 className="text-lg font-semibold text-slate-900">
          {negocio?.nombre ?? "Negocio"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{servicio?.nombre}</p>

        <div className="my-4 rounded-lg bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Total a pagar</p>
          <p className="text-2xl font-bold text-slate-900">
            ${servicio?.precio_usd.toFixed(2) ?? "0.00"}
          </p>
        </div>

        <p className="mb-4 text-xs text-slate-400">
          Reserva #{reserva.id.slice(0, 8)} · {reserva.email_cliente}
        </p>

        <form action={confirmar}>
          <button
            type="submit"
            className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
          >
            Confirmar pago (simulado)
          </button>
        </form>
        <form action={cancelar} className="mt-2">
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
