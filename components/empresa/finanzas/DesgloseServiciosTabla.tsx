"use client";

import { etiquetaTarifaIva } from "@/lib/finanzas";
import { formatearMoneda } from "@/lib/formato";
import type { ServiceFiscalSummary } from "@/types/finanzas";

interface DesgloseServiciosTablaProps {
  desgloseServicios: ServiceFiscalSummary[];
  brutoTotal: number;
}

export default function DesgloseServiciosTabla({
  desgloseServicios,
  brutoTotal,
}: DesgloseServiciosTablaProps) {
  if (desgloseServicios.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
        Ingresos por servicio
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {desgloseServicios.map((item) => {
          const mostrarParticipacion =
            desgloseServicios.length > 1 && brutoTotal > 0;
          const pct = mostrarParticipacion
            ? Math.round((item.gross_amount / brutoTotal) * 100)
            : 0;
          return (
            <div
              key={`${item.servicio_id ?? item.service_name}-${item.cabys_code}`}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold text-vuki-ink">
                    {item.service_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {item.transactions_count}{" "}
                    {item.transactions_count === 1 ? "pago" : "pagos"} ·{" "}
                    {item.total_cupos}{" "}
                    {item.total_cupos === 1 ? "cupo" : "cupos"}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-display text-sm font-bold text-vuki-ink">
                    {formatearMoneda(item.gross_amount, item.currency)}
                  </p>
                  <p className="text-[11px] font-medium text-emerald-700">
                    Neto {formatearMoneda(item.net_amount, item.currency)}
                  </p>
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <span
                  title="Código del Catálogo de Bienes y Servicios (BCCR / Hacienda)"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-600"
                >
                  CABYS: {item.cabys_code}
                </span>
                <span
                  title="Tarifa del Impuesto al Valor Agregado configurada para el servicio"
                  className="inline-flex items-center rounded-lg border border-sky-200/80 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-800"
                >
                  {etiquetaTarifaIva(item.iva_rate)}
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                Subtotal {formatearMoneda(item.subtotal_amount, item.currency)} +
                IVA {formatearMoneda(item.iva_amount, item.currency)}
              </p>

              {mostrarParticipacion && (
                <div className="mt-3 flex items-center gap-2">
                  <div
                    aria-hidden="true"
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100"
                  >
                    <div
                      style={{ width: `${Math.max(6, pct)}%` }}
                      className="h-full rounded-full bg-(--marca)"
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {pct}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

