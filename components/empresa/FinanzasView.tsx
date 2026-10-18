"use client";

import { useState } from "react";
import { DollarSign, Download, Percent, Wallet } from "lucide-react";
import EmpresaPage, { ItemLista, KpiCard, Lista } from "../EmpresaPage";
import { descargarCsv } from "../../lib/csv";

export interface VistaPago {
  id: string;
  fechaIso: string;
  servicio: string;
  cliente: string;
  monto: number;
}

// Comisión de la pasarela/banco sobre cada pago procesado. La plataforma no
// cobra comisión por venta (solo suscripción fija, ver docs/Reglas_Negocio.md).
const COMISION_BANCO = 0.0425; // 4.25% pasarela/banco

const formatoUsd = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** Dashboard financiero compartido por `/[slug]/admin/finanzas`. */
export default function FinanzasView({
  pagos: todosLosPagos,
  error,
  reembolsosPendientes,
}: {
  pagos: VistaPago[];
  error?: string | null;
  /** Reservas pagadas y luego canceladas: dinero que falta devolver al cliente. */
  reembolsosPendientes?: { cantidad: number; monto: number };
}) {
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const dia = (iso: string) => {
    const f = new Date(iso);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${f.getFullYear()}-${p(f.getMonth() + 1)}-${p(f.getDate())}`;
  };
  const filtrando = Boolean(desde || hasta);
  const pagos = todosLosPagos.filter((p) => {
    const d = dia(p.fechaIso);
    return (!desde || d >= desde) && (!hasta || d <= hasta);
  });
  const ingresoBruto = pagos.reduce((total, pago) => total + pago.monto, 0);
  const comisiones = ingresoBruto * COMISION_BANCO;
  const ingresoNeto = ingresoBruto - comisiones;
  const ultimos = filtrando ? pagos : pagos.slice(0, 10);
  const plural = pagos.length === 1 ? "" : "s";

  function exportar() {
    descargarCsv(
      "pagos.csv",
      ["Fecha", "Servicio", "Cliente", "Monto USD", "Comisión USD", "Neto USD"],
      pagos.map((p) => {
        const comision = p.monto * COMISION_BANCO;
        return [
          new Date(p.fechaIso).toLocaleString("es-CR"),
          p.servicio,
          p.cliente,
          p.monto.toFixed(2),
          comision.toFixed(2),
          (p.monto - comision).toFixed(2),
        ];
      }),
    );
  }

  return (
    <EmpresaPage
      titulo="Dashboard Financiero"
      descripcion="Ingresos, comisiones estimadas y monto neto a liquidar."
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <input
              type="date"
              aria-label="Desde"
              value={desde}
              max={hasta || undefined}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            <input
              type="date"
              aria-label="Hasta"
              value={hasta}
              min={desde || undefined}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
            {filtrando && (
              <button
                type="button"
                onClick={() => {
                  setDesde("");
                  setHasta("");
                }}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Limpiar
              </button>
            )}
            <button
              type="button"
              onClick={exportar}
              disabled={pagos.length === 0}
              className="ml-auto flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar CSV
            </button>
          </div>
          <Lista as="section" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              icono={<DollarSign className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Ingresos brutos"
              valor={formatoUsd.format(ingresoBruto)}
              nota={`${pagos.length} pago${plural} procesado${plural}`}
            />
            <KpiCard
              icono={<Percent className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Comisiones estimadas"
              valor={formatoUsd.format(comisiones)}
              nota="4.25% de la pasarela/banco"
            />
            <KpiCard
              icono={<Wallet className="h-3.5 w-3.5" aria-hidden="true" />}
              titulo="Netos a liquidar"
              valor={formatoUsd.format(ingresoNeto)}
              nota="Después de comisiones"
              acento
            />
          </Lista>

          {reembolsosPendientes && reembolsosPendientes.cantidad > 0 && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {reembolsosPendientes.cantidad} reserva
              {reembolsosPendientes.cantidad === 1 ? "" : "s"} pagada
              {reembolsosPendientes.cantidad === 1 ? "" : "s"} fue
              {reembolsosPendientes.cantidad === 1 ? "" : "ron"} cancelada
              {reembolsosPendientes.cantidad === 1 ? "" : "s"}:{" "}
              {formatoUsd.format(reembolsosPendientes.monto)} por reembolsar a
              los clientes. No están incluidos en los ingresos.
            </p>
          )}

          <section className="mt-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-600">
              {filtrando ? "Pagos del período" : "Últimos pagos procesados"}
            </h2>

            {ultimos.length === 0 ? (
              <p className="text-sm text-slate-500">
                Aún no hay pagos procesados para este negocio.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-4 py-3">Servicio</th>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3 text-right">Monto</th>
                    </tr>
                  </thead>
                  <Lista as="tbody">
                    {ultimos.map((pago) => (
                      <ItemLista
                        as="tr"
                        key={pago.id}
                        className="border-b border-slate-50 last:border-0"
                      >
                        <td
                          className="px-4 py-3 whitespace-nowrap text-slate-600"
                          suppressHydrationWarning
                        >
                          {new Date(pago.fechaIso).toLocaleString("es-CR", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pago.servicio}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {pago.cliente}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatoUsd.format(pago.monto)}
                        </td>
                      </ItemLista>
                    ))}
                  </Lista>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </EmpresaPage>
  );
}
