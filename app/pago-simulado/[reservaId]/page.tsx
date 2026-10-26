import { notFound } from "next/navigation";
import { CreditCard, ShieldCheck, XCircle } from "lucide-react";
import PaginaPublica from "../../../components/PaginaPublica";
import MarcaReserva from "../../../components/MarcaReserva";
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
      <PaginaPublica
        titulo="Esta reserva ya fue pagada"
        etiqueta="Estado de la reserva"
        icono={<ShieldCheck className="h-4 w-4" />}
        pie={
          <div className="flex justify-center">
            <MarcaReserva />
          </div>
        }
      >
        <p className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 [overflow-wrap:anywhere]">
          Trx: {reserva.trx_id ?? "N/A"}
        </p>
      </PaginaPublica>
    );
  }

  if (reserva.estado === "cancelada") {
    return (
      <PaginaPublica
        titulo="Esta reserva fue cancelada"
        etiqueta="Estado de la reserva"
        icono={<XCircle className="h-4 w-4" />}
        pie={
          <div className="flex justify-center">
            <MarcaReserva />
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          Ya no es posible pagarla. Crea una nueva reserva desde el enlace del
          negocio.
        </p>
      </PaginaPublica>
    );
  }

  const confirmar = confirmarPagoSimuladoAction.bind(null, reserva.id);
  const cancelar = cancelarPagoSimuladoAction.bind(null, reserva.id);

  return (
    <PaginaPublica
      titulo={negocio?.nombre ?? "Negocio"}
      descripcion={servicio?.nombre}
      etiqueta="Pasarela de pagos (simulada)"
      icono={<CreditCard className="h-4 w-4" />}
    >
      <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <p className="text-xs font-medium text-emerald-800">Total a pagar</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight text-vuki-ink">
          ${((servicio?.precio_usd ?? 0) * (reserva.cupos ?? 1)).toFixed(2)}
        </p>
      </div>

      <p className="mb-5 text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
        Reserva #{reserva.id.slice(0, 8)} · {reserva.email_cliente}
      </p>

      <form action={confirmar}>
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Confirmar pago (simulado)
        </button>
      </form>
      <form action={cancelar} className="mt-2">
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      </form>
    </PaginaPublica>
  );
}
