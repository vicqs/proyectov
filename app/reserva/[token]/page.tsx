import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { z } from "zod";
import { obtenerReservaPorToken } from "../../../lib/data/public";
import { esTransaccionSimulada, formatearMoneda } from "../../../lib/formato";
import { convertirMoneda, normalizarMoneda } from "../../../lib/monedas";
import { esPagoManual } from "../../../lib/pagos";
import {
  etiquetaHorario,
  HORAS_LIMITE_CANCELACION,
} from "../../../lib/horarios";
import CancelarReservaButton from "./CancelarReservaButton";
import MarcaReserva from "../../../components/MarcaReserva";
import PaginaPublica from "../../../components/PaginaPublica";

// Enlace privado: no debe indexarse ni compartirse en buscadores.
export const metadata: Metadata = {
  title: "Mi reserva",
  robots: { index: false, follow: false },
};

const ESTADO_LABEL = {
  pendiente: "Pendiente de pago",
  pagada: "Confirmada",
  cancelada: "Cancelada",
} as const;

/** Página privada del turista para ver o cancelar su reserva (por token). */
export default async function ReservaPublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!z.string().uuid().safeParse(token).success) notFound();
  const reserva = await obtenerReservaPorToken(token);
  if (!reserva) notFound();
  const servicio = { nombre: reserva.servicio_nombre, precio_usd: reserva.servicio_precio_usd };
  const negocio = { nombre: reserva.negocio_nombre, slug: reserva.negocio_slug, whatsapp: reserva.negocio_whatsapp };

  const cupos = reserva.cupos ?? 1;
  const monedaServicio = normalizarMoneda(
    reserva.servicio_currency ?? reserva.negocio_moneda,
    "USD",
  );
  const monedaReserva = normalizarMoneda(reserva.currency, monedaServicio);
  const totalReserva =
    reserva.monto_usd ??
    reserva.gross_amount ??
    convertirMoneda(servicio.precio_usd * cupos, monedaServicio, monedaReserva);

  const puedeCancelar =
    reserva.estado !== "cancelada" &&
    (reserva.estado === "pendiente" ||
      new Date(reserva.fecha_hora).getTime() - Date.now() >=
        HORAS_LIMITE_CANCELACION * 3_600_000);

  const pagoEsSimulado = esTransaccionSimulada(reserva.trx_id);
  const esItem = reserva.servicio_tipo_unidad === "item";

  const filas: [string, string][] = [
    ["Negocio", negocio?.nombre ?? "—"],
    ["Servicio", servicio?.nombre ?? "—"],
    [esItem ? "Fecha de compra" : "Fecha y hora", etiquetaHorario(reserva.fecha_hora)],
    [esItem ? "Ítems" : "Personas", String(cupos)],
    [
      "Estado",
      pagoEsSimulado && reserva.estado === "pagada"
        ? "Confirmada (pago simulado · demo)"
        : ESTADO_LABEL[reserva.estado],
    ],
  ];
  if (servicio) {
    filas.push(["Total", formatearMoneda(totalReserva, monedaReserva)]);
  }
  if (reserva.trx_id)
    filas.push([
      "ID de transacción",
      esPagoManual(reserva.trx_id)
        ? "Pago directo al comercio"
        : pagoEsSimulado
          ? `${reserva.trx_id} (demostración · sin cobro real)`
          : reserva.trx_id,
    ]);

  return (
    <PaginaPublica
      titulo={esItem ? "Tu compra" : "Tu reserva"}
      etiqueta={esItem ? "Gestiona tu compra" : "Gestiona tu experiencia"}
      icono={<CalendarCheck className="h-4 w-4" />}
      descripcion={`A nombre de ${reserva.nombre_cliente || reserva.email_cliente}`}
      pie={
        <div className="flex justify-center">
          <MarcaReserva />
        </div>
      }
    >
      <dl className="divide-y divide-sky-100 rounded-2xl border border-sky-100 bg-sky-50/30 px-4">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-slate-600">{etiqueta}</dt>
            <dd className="min-w-0 break-words text-right text-sm font-medium text-slate-900">
              {valor}
            </dd>
          </div>
        ))}
      </dl>

      {puedeCancelar ? (
        <CancelarReservaButton token={token} />
      ) : reserva.estado !== "cancelada" ? (
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {esItem ? (
            <>Las compras de ítems ya pagadas no se cancelan en línea. Contacta al negocio.</>
          ) : (
            <>
              Ya no es posible cancelar en línea (se requieren{" "}
              {HORAS_LIMITE_CANCELACION} horas de anticipación). Contacta al
              negocio.
            </>
          )}
          {negocio?.whatsapp && (
            <>
              {" "}
              <a
                href={`https://wa.me/${negocio.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline"
              >
                Escribir por WhatsApp
              </a>
            </>
          )}
        </p>
      ) : (
        <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Esta reserva fue cancelada. Si ya habías pagado, el reembolso lo
          gestiona directamente el negocio.
        </p>
      )}

      {negocio && (
        <Link
          href={`/${negocio.slug}`}
          className="vuki-focus mt-6 flex min-h-11 items-center justify-center rounded-lg text-center text-sm font-semibold text-sky-800 hover:underline"
        >
          Volver a {negocio.nombre}
        </Link>
      )}
    </PaginaPublica>
  );
}
