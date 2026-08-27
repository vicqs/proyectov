import { DollarSign, Percent, Wallet } from "lucide-react";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import type { Reserva, Servicio } from "../../../types/database";

/** Reserva con el precio del servicio embebido, usado solo en este dashboard. */
interface ReservaConMonto extends Reserva {
  servicio: Pick<Servicio, "nombre" | "precio_usd"> | null;
}

const ESTADO_STYLES: Record<Reserva["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
};

// Comisiones aplicadas sobre cada pago procesado (ver docs/fase6 para el
// detalle del cálculo).
const COMISION_PLATAFORMA = 0.015; // 1.5% de la plataforma (Turismo Link)
const COMISION_BANCO = 0.0425; // 4.25% de la pasarela/banco

/**
 * Dashboard Financiero: KPIs de ingresos brutos, comisiones estimadas e
 * ingresos netos a liquidar, calculados sobre las reservas "pagada" del
 * negocio del usuario autenticado. Server Component, respeta RLS.
 */
export default async function FinanzasPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

  let pagos: ReservaConMonto[] = [];
  let errorCarga: string | null = null;

  if (negocio) {
    const { data, error } = await supabase
      .from("reservas")
      .select("*, servicio:servicios(nombre, precio_usd)")
      .eq("negocio_id", negocio.id)
      .eq("estado", "pagada")
      .order("fecha_hora", { ascending: false });

    if (error) {
      errorCarga =
        "No se pudieron cargar los datos financieros. Intenta recargar la página.";
    } else {
      pagos = (data ?? []) as unknown as ReservaConMonto[];
    }
  } else {
    errorCarga = "No se encontró el negocio asociado a este usuario.";
  }

  const ingresoBruto = pagos.reduce(
    (total, pago) => total + (pago.servicio?.precio_usd ?? 0),
    0,
  );
  const comisionPlataforma = ingresoBruto * COMISION_PLATAFORMA;
  const comisionBanco = ingresoBruto * COMISION_BANCO;
  const comisionesEstimadas = comisionPlataforma + comisionBanco;
  const ingresoNeto = ingresoBruto - comisionesEstimadas;

  const formatoUsd = new Intl.NumberFormat("es-CR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  const ultimosPagos = pagos.slice(0, 10);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Dashboard Financiero
      </h1>

      {errorCarga ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorCarga}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <DollarSign className="h-5 w-5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Ingresos brutos totales
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatoUsd.format(ingresoBruto)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {pagos.length} pago{pagos.length === 1 ? "" : "s"} procesado
                {pagos.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Percent className="h-5 w-5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Comisiones estimadas
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">
                {formatoUsd.format(comisionesEstimadas)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                1.5% plataforma + 4.25% banco
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-slate-400">
                <Wallet className="h-5 w-5" />
                <span className="text-xs font-medium uppercase tracking-wide">
                  Ingresos netos a liquidar
                </span>
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {formatoUsd.format(ingresoNeto)}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Después de comisiones
              </p>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">
              Últimos pagos procesados
            </h2>

            {ultimosPagos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay pagos procesados para este negocio.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">
                        Fecha/Hora
                      </th>
                      <th className="px-4 py-3 whitespace-nowrap">Servicio</th>
                      <th className="px-4 py-3 whitespace-nowrap">Cliente</th>
                      <th className="px-4 py-3 whitespace-nowrap">Monto</th>
                      <th className="px-4 py-3 whitespace-nowrap">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ultimosPagos.map((pago) => (
                      <tr key={pago.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {new Date(pago.fecha_hora).toLocaleString("es-CR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {pago.servicio?.nombre ?? "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {pago.email_cliente}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                          {formatoUsd.format(pago.servicio?.precio_usd ?? 0)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${ESTADO_STYLES[pago.estado]}`}
                          >
                            {pago.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
