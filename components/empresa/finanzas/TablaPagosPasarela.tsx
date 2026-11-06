"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileText, Users } from "lucide-react";
import { ItemLista, Lista } from "../../EmpresaPage";
import { etiquetaTipoIdentificacion } from "@/lib/finanzas";
import { esTransaccionSimulada } from "@/lib/formato";
import { fechaHoraCR } from "@/lib/zona-horaria";
import type { FinancialTransaction } from "@/types/finanzas";
import { formatoMonedaFiscal } from "./ModalComprobanteHacienda";

interface TablaPagosPasarelaProps {
  ultimos: FinancialTransaction[];
  claveLista: string;
  modoDemo?: boolean;
  onAbrirModalFactura: (pago: FinancialTransaction) => void;
}

export default function TablaPagosPasarela({
  ultimos,
  claveLista,
  modoDemo = false,
  onAbrirModalFactura,
}: TablaPagosPasarelaProps) {
  const [receptorAbiertoId, setReceptorAbiertoId] = useState<string | null>(
    null,
  );

  return (
    <>
      {/* Tabla en pantallas amplias (xl+) */}
      <div
        role="region"
        aria-label="Pagos procesados"
        tabIndex={0}
        className="vuki-focus hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm xl:block"
      >
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3.5 whitespace-nowrap">
                Fecha del servicio
              </th>
              <th scope="col" className="min-w-[160px] px-4 py-3.5">
                Servicio
              </th>
              <th scope="col" className="px-4 py-3.5">
                Cliente
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right whitespace-nowrap"
              >
                Impuestos
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right whitespace-nowrap"
              >
                Bruto
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right whitespace-nowrap"
              >
                Comisión (4.25%)
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right whitespace-nowrap"
              >
                Neto
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right whitespace-nowrap"
              >
                {modoDemo ? "Hacienda (demo)" : "Hacienda / Factura"}
              </th>
            </tr>
          </thead>
          <Lista key={claveLista} as="tbody">
            {ultimos.map((pago) => {
              const esFE = pago.voucher_type === "FE";
              const receptorExpandido = receptorAbiertoId === pago.id;
              const mostrarDetalleReceptor = esFE || receptorExpandido;
              const esFacturado = pago.invoice_status === "issued";
              const tituloComprobante = esFE
                ? `Factura Electrónica (FE) · Receptor: ${pago.client_name ?? "Sin nombre"} (${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id ?? "—"})`
                : `Tiquete Electrónico (TE) · Receptor: ${pago.client_name ?? "Consumidor final / Turista"} (${pago.client_tax_id ?? "sin cédula requerida"}). Clic para ver detalle.`;

              return (
                <ItemLista
                  as="tr"
                  key={pago.id}
                  className="border-b border-slate-100 align-top last:border-0"
                >
                  <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                    <p className="font-medium">
                      {fechaHoraCR(pago.service_date)}
                    </p>
                    {pago.transaction_ref && (
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[11px] text-slate-400">
                          {pago.transaction_ref}
                        </span>
                        {esTransaccionSimulada(pago.transaction_ref) && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            Simulado (demo)
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="min-w-[160px] px-4 py-3.5">
                    <p className="font-medium text-slate-800">
                      {pago.service_name}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {pago.cupos !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-slate-600">
                          <Users className="h-3 w-3" aria-hidden="true" />
                          {pago.cupos}{" "}
                          {pago.cupos === 1 ? "persona" : "personas"}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-900">
                        {pago.client_email}
                      </span>
                      <button
                        type="button"
                        title={tituloComprobante}
                        aria-expanded={receptorExpandido}
                        onClick={() =>
                          setReceptorAbiertoId((prev) =>
                            prev === pago.id ? null : pago.id,
                          )
                        }
                        className={`vuki-focus inline-flex cursor-pointer items-center rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold tracking-wide transition ${
                          esFE
                            ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200 hover:bg-sky-100"
                            : "bg-slate-100 text-slate-700 ring-1 ring-slate-200/90 hover:bg-slate-200/70"
                        }`}
                      >
                        {pago.voucher_type}
                      </button>
                    </div>

                    {mostrarDetalleReceptor && (
                      <div className="mt-1.5 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 text-xs text-slate-600">
                        <p className="font-medium text-slate-800">
                          {pago.client_name || "Consumidor final (Turista)"}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {pago.client_tax_id
                            ? `${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id}`
                            : "Tiquete Electrónico · Sin cédula requerida"}
                        </p>
                        {receptorExpandido && (
                          <button
                            type="button"
                            onClick={() => onAbrirModalFactura(pago)}
                            className="vuki-focus mt-1 text-[11px] font-semibold text-sky-700 hover:underline"
                          >
                            {esFE
                              ? "Editar receptor fiscal"
                              : "Configurar receptor (FE)"}
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <p className="text-xs font-medium text-slate-700">
                      Sub:{" "}
                      {formatoMonedaFiscal(pago.subtotal_amount, pago.currency)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      IVA ({Math.round(pago.iva_rate * 100)}%):{" "}
                      {formatoMonedaFiscal(pago.iva_amount, pago.currency)}
                    </p>
                  </td>

                  <td className="px-4 py-3.5 text-right font-medium whitespace-nowrap text-slate-800">
                    <span className="whitespace-nowrap">
                      {formatoMonedaFiscal(pago.gross_amount, pago.currency)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right text-xs whitespace-nowrap text-slate-500">
                    <span className="whitespace-nowrap">
                      −
                      {formatoMonedaFiscal(
                        pago.gateway_fee_amount,
                        pago.currency,
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right font-display font-bold whitespace-nowrap text-emerald-800">
                    <span className="whitespace-nowrap">
                      {formatoMonedaFiscal(pago.net_amount, pago.currency)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onAbrirModalFactura(pago)}
                      title={
                        esFacturado
                          ? "Comprobante registrado (no emite ante Hacienda) · Clic para ver o editar consecutivo"
                          : "Clic para registrar comprobante o consecutivo de prueba (no emite ante Hacienda)"
                      }
                      className={`vuki-focus group inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition active:scale-[0.98] ${
                        esFacturado
                          ? "border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/70"
                          : "border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-50/80"
                      }`}
                    >
                      {esFacturado ? (
                        <CheckCircle2
                          className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                          aria-hidden="true"
                        />
                      ) : (
                        <FileText
                          className="h-3.5 w-3.5 shrink-0 text-amber-600"
                          aria-hidden="true"
                        />
                      )}
                      <span>{esFacturado ? "Facturado" : "Pendiente"}</span>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold transition ${
                          esFacturado
                            ? "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
                            : "bg-amber-100/90 text-amber-900 group-hover:bg-amber-200/80"
                        }`}
                      >
                        {esFacturado
                          ? "Ver"
                          : modoDemo
                            ? "Facturar (demo)"
                            : "Facturar"}
                        <ArrowRight
                          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </span>
                    </button>
                    {esFacturado && pago.invoice_consecutive && (
                      <p
                        title="Consecutivo Ministerio de Hacienda"
                        className="mt-1 font-mono text-[11px] text-slate-500"
                      >
                        {pago.invoice_consecutive}
                      </p>
                    )}
                  </td>
                </ItemLista>
              );
            })}
          </Lista>
        </table>
      </div>

      {/* Tarjetas responsivas en móvil y pantallas medianas (< xl) */}
      <Lista
        key={`movil-${claveLista}`}
        as="ul"
        className="space-y-3 xl:hidden"
      >
        {ultimos.map((pago) => {
          const esFE = pago.voucher_type === "FE";
          const esFacturado = pago.invoice_status === "issued";
          const receptorExpandido = receptorAbiertoId === pago.id;

          return (
            <ItemLista
              as="li"
              key={pago.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold text-vuki-ink">
                    {pago.service_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {fechaHoraCR(pago.service_date)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 font-display text-sm font-bold text-emerald-800">
                  {formatoMonedaFiscal(pago.net_amount, pago.currency)}
                </span>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-slate-800">
                    {pago.client_email}
                  </span>
                  <button
                    type="button"
                    aria-expanded={receptorExpandido}
                    aria-label={`Ver detalle fiscal ${pago.voucher_type} de ${pago.client_email}`}
                    onClick={() =>
                      setReceptorAbiertoId((prev) =>
                        prev === pago.id ? null : pago.id,
                      )
                    }
                    className={`vuki-focus shrink-0 cursor-pointer rounded-md px-1.5 py-0.5 font-mono text-[11px] font-bold ${
                      esFE
                        ? "bg-sky-50 text-sky-800 ring-1 ring-sky-200"
                        : "bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                    }`}
                  >
                    {pago.voucher_type}
                  </button>
                </div>

                {pago.cupos !== undefined && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] whitespace-nowrap">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    {pago.cupos} {pago.cupos === 1 ? "persona" : "personas"}
                  </span>
                )}
              </div>

              {(esFE || receptorExpandido) && (
                <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                  <p className="font-medium text-slate-800">
                    {pago.client_name || "Consumidor final (Turista)"}
                  </p>
                  <p className="font-mono text-[11px] text-slate-500">
                    {pago.client_tax_id
                      ? `${etiquetaTipoIdentificacion(pago.client_id_type)}: ${pago.client_tax_id}`
                      : "Tiquete Electrónico · Sin cédula requerida"}
                  </p>
                </div>
              )}

              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                <div className="flex items-center justify-between">
                  <span>
                    Sub: {formatoMonedaFiscal(pago.subtotal_amount, pago.currency)}{" "}
                    + IVA ({Math.round(pago.iva_rate * 100)}%):{" "}
                    {formatoMonedaFiscal(pago.iva_amount, pago.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>
                    Bruto: {formatoMonedaFiscal(pago.gross_amount, pago.currency)}
                  </span>
                  <span>
                    Comisión 4.25%: −
                    {formatoMonedaFiscal(
                      pago.gateway_fee_amount,
                      pago.currency,
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-mono text-[11px] text-slate-400">
                    {pago.invoice_consecutive || pago.transaction_ref}
                  </span>
                  {esTransaccionSimulada(pago.transaction_ref) && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                      Simulado (demo)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onAbrirModalFactura(pago)}
                  className={`vuki-focus group inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition active:scale-[0.98] ${
                    esFacturado
                      ? "border-emerald-200 bg-white text-emerald-900 hover:border-emerald-300 hover:bg-emerald-50/70"
                      : "border-amber-300 bg-white text-amber-900 hover:border-amber-400 hover:bg-amber-50/80"
                  }`}
                >
                  {esFacturado ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                  ) : (
                    <FileText
                      className="h-3.5 w-3.5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                  )}
                  <span>{esFacturado ? "Facturado" : "Pendiente"}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold transition ${
                      esFacturado
                        ? "bg-emerald-50 text-emerald-800 group-hover:bg-emerald-100"
                        : "bg-amber-100/90 text-amber-900 group-hover:bg-amber-200/80"
                    }`}
                  >
                    {esFacturado
                      ? "Ver"
                      : modoDemo
                        ? "Facturar (demo)"
                        : "Facturar"}
                    <ArrowRight
                      className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </button>
              </div>
            </ItemLista>
          );
        })}
      </Lista>
    </>
  );
}

