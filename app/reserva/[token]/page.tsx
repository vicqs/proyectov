import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase";
import {
  etiquetaHorario,
  HORAS_LIMITE_CANCELACION,
} from "../../../lib/horarios";
import type { Negocio, Reserva, Servicio } from "../../../types/database";
import CancelarReservaButton from "./CancelarReservaButton";

// Enlace privado: no debe indexarse ni compartirse en buscadores.
export const metadata: Metadata = {
  title: "Mi reserva — Turismo Link",
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
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Tu reserva
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        A nombre de {reserva.nombre_cliente || reserva.email_cliente}
      </p>

      <dl className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-5 shadow-sm">
        {filas.map(([etiqueta, valor]) => (
          <div key={etiqueta} className="flex justify-between gap-4 py-3">
            <dt className="text-sm text-gray-500">{etiqueta}</dt>
            <dd className="text-right text-sm font-medium text-slate-900">
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
          className="mt-6 text-center text-sm font-semibold text-sky-600 hover:underline"
        >
          Volver a {negocio.nombre}
        </Link>
      )}
    </main>
  );
}
