import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  etiquetaHorario,
  HORAS_LIMITE_CANCELACION,
} from "../../../lib/horarios";
import type { Negocio, Reserva, Servicio } from "../../../types/database";
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
  if (token.length < 8 || token.length > 100) notFound();

  const { data } = await supabaseAdmin
    .from("reservas")
    .select("*")
    .eq("token_gestion", token)
    .single();
  if (!data) notFound();
  const reserva = data as Reserva;

  const [{ data: servicioData }, { data: negocioData }] = await Promise.all([
    supabaseAdmin
      .from("servicios")
      .select("nombre, precio_usd")
      .eq("id", reserva.servicio_id)
      .single(),
    supabaseAdmin
      .from("negocios")
      .select("nombre, slug, whatsapp")
      .eq("id", reserva.negocio_id)
      .single(),
  ]);
  const servicio = servicioData as Pick<
    Servicio,
    "nombre" | "precio_usd"
  > | null;
  const negocio = negocioData as Pick<
    Negocio,
    "nombre" | "slug" | "whatsapp"
  > | null;

  const cupos = reserva.cupos ?? 1;
  const puedeCancelar =
    reserva.estado !== "cancelada" &&
    new Date(reserva.fecha_hora).getTime() - Date.now() >=
      HORAS_LIMITE_CANCELACION * 3_600_000;

  const filas: [string, string][] = [
    ["Negocio", negocio?.nombre ?? "—"],
    ["Servicio", servicio?.nombre ?? "—"],
    ["Fecha y hora", etiquetaHorario(reserva.fecha_hora)],
    ["Personas", String(cupos)],
    ["Estado", ESTADO_LABEL[reserva.estado]],
  ];
  if (servicio) {
    filas.push(["Total", `$${(servicio.precio_usd * cupos).toFixed(2)} USD`]);
  }
  if (reserva.trx_id) filas.push(["ID de transacción", reserva.trx_id]);

  return (
    <PaginaPublica
      titulo="Tu reserva"
      etiqueta="Gestiona tu experiencia"
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
          Ya no es posible cancelar en línea (se requieren{" "}
          {HORAS_LIMITE_CANCELACION} horas de anticipación). Contacta al
          negocio.
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
