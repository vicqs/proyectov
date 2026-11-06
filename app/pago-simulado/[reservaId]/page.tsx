import { notFound } from "next/navigation";
import { CreditCard, ShieldCheck, XCircle } from "lucide-react";
import PaginaPublica from "../../../components/PaginaPublica";
import MarcaReserva from "../../../components/MarcaReserva";
import { z } from "zod";
import { obtenerReservaPorToken } from "../../../lib/data/public";
import { formatearMoneda } from "../../../lib/formato";
import { convertirMoneda, normalizarMoneda } from "../../../lib/monedas";
import { obtenerConfiguracion } from "../../../lib/plataforma";
import BotonesPagoSimulado from "./BotonesPagoSimulado";

interface PageProps {
  params: Promise<{ reservaId: string }>;
  searchParams: Promise<{ token?: string }>;
}

/**
 * Pantalla de pago simulada (reemplaza a la pasarela real, ej. Tilopay,
 * mientras no haya integración en producción). Muestra el resumen de la
 * reserva y permite "pagar" o "cancelar", ambos vía Server Actions que
 * actualizan el estado real de la reserva en la base de datos (o el mock).
 */
export default async function PagoSimuladoPage({ params, searchParams }: PageProps) {
  const [{ reservaId }, { token }] = await Promise.all([params, searchParams]);
  if (!token || !z.string().uuid().safeParse(token).success) notFound();
  const [reserva, config] = await Promise.all([
    obtenerReservaPorToken(token),
    obtenerConfiguracion(),
  ]);
  if (!reserva || reserva.id !== reservaId) notFound();
  const servicio = { nombre: reserva.servicio_nombre, precio_usd: reserva.servicio_precio_usd };
  const negocio = { nombre: reserva.negocio_nombre };
  const monedaServicio = normalizarMoneda(
    reserva.servicio_currency ?? reserva.negocio_moneda,
    "USD",
  );
  const monedaReserva = normalizarMoneda(reserva.currency, monedaServicio);
  const totalPagar =
    reserva.gross_amount ??
    convertirMoneda(
      servicio.precio_usd * (reserva.cupos ?? 1),
      monedaServicio,
      monedaReserva,
    );

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

  if (config.modo_mantenimiento || !config.pagos_simulados) {
    return (
      <PaginaPublica
        titulo={
          config.modo_mantenimiento
            ? "Plataforma en mantenimiento"
            : "Pagos simulados deshabilitados"
        }
        etiqueta="Estado de la pasarela"
        icono={<XCircle className="h-4 w-4" />}
        pie={
          <div className="flex justify-center">
            <MarcaReserva />
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-slate-600">
          {config.modo_mantenimiento
            ? config.mensaje_mantenimiento ||
              "Estamos realizando tareas de mantenimiento. Vuelve a intentarlo en unos minutos."
            : "Los pagos simulados están deshabilitados temporalmente."}
        </p>
      </PaginaPublica>
    );
  }

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
          {formatearMoneda(totalPagar, monedaReserva)}
        </p>
      </div>

      <p className="mb-5 text-xs leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
        Reserva #{reserva.id.slice(0, 8)} · {reserva.email_cliente}
      </p>

      <BotonesPagoSimulado reservaId={reserva.id} token={token} />
    </PaginaPublica>
  );
}
