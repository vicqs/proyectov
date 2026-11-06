"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, Package, Users, XCircle } from "lucide-react";
import { ItemLista, Lista } from "../../EmpresaPage";
import { toast } from "../../Toast";
import { esPagoManual, esTrxPasarela } from "@/lib/pagos";
import { esTransaccionSimulada, formatearMoneda } from "@/lib/formato";
import type { CodigoMoneda } from "@/lib/monedas";
import { desplazarClave, diaCR, fechaHoraCR } from "@/lib/zona-horaria";
import type { VistaReserva } from "../ReservasView";

const CLASE_ESTADO: Record<VistaReserva["estado"], string> = {
  pagada: "bg-emerald-50 text-emerald-800 border-emerald-200",
  pendiente: "bg-amber-50 text-amber-800 border-amber-200",
  cancelada: "bg-red-50 text-red-700 border-red-200",
};

const PUNTO_ESTADO: Record<VistaReserva["estado"], string> = {
  pagada: "bg-emerald-500",
  pendiente: "bg-amber-500",
  cancelada: "bg-red-500",
};

const TEXTO_ESTADO: Record<VistaReserva["estado"], string> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
};

export function contextoTemporal(
  fechaIso: string,
  hoyClave: string,
  ahoraMs: number,
): { etiqueta: string; clase: string; esPasada: boolean } {
  const clave = diaCR(fechaIso);
  if (!clave || !hoyClave) {
    return { etiqueta: "", clase: "", esPasada: false };
  }
  const ms = new Date(fechaIso).getTime();
  const mananaClave = desplazarClave(hoyClave, 1);

  if (clave === hoyClave) {
    if (ahoraMs && Number.isFinite(ms) && ms < ahoraMs) {
      return {
        etiqueta: "Hoy · realizada",
        clase: "bg-slate-100 text-slate-600 border-slate-200",
        esPasada: false,
      };
    }
    return {
      etiqueta: "Hoy",
      clase: "bg-emerald-50 text-emerald-800 border-emerald-200",
      esPasada: false,
    };
  }
  if (clave === mananaClave) {
    return {
      etiqueta: "Mañana",
      clase: "bg-sky-50 text-sky-800 border-sky-200",
      esPasada: false,
    };
  }
  if (clave < hoyClave) {
    return {
      etiqueta: "Pasada",
      clase: "bg-slate-100 text-slate-500 border-slate-200",
      esPasada: true,
    };
  }
  return {
    etiqueta: "Próxima",
    clase: "bg-indigo-50/70 text-indigo-700 border-indigo-200/80",
    esPasada: false,
  };
}

/** Contexto temporal de una reserva; las ventas de ítems no tienen salida programada. */
function contextoReserva(
  reserva: VistaReserva,
  hoyClave: string,
  ahoraMs: number,
): { etiqueta: string; clase: string; esPasada: boolean } {
  if (reserva.esItem) {
    return {
      etiqueta: "Venta directa",
      clase: "bg-sky-50 text-sky-800 border-sky-200",
      esPasada: false,
    };
  }
  return contextoTemporal(reserva.fechaIso, hoyClave, ahoraMs);
}

/** Texto de cantidad: ítems en ventas directas, personas en reservas por cupo. */
function textoCantidad(reserva: VistaReserva): string {
  const n = reserva.cupos ?? 1;
  if (reserva.esItem) return `${n} ${n === 1 ? "ítem" : "ítems"}`;
  return `${n} ${n === 1 ? "persona" : "personas"}`;
}

function BadgeEstado({ estado }: { estado: VistaReserva["estado"] }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${CLASE_ESTADO[estado]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${PUNTO_ESTADO[estado]}`}
        aria-hidden="true"
      />
      {TEXTO_ESTADO[estado]}
    </span>
  );
}

function etiquetaCanal(
  trxId?: string | null,
  estado?: VistaReserva["estado"],
): {
  etiqueta: string;
  detalle?: string;
  esPasarela: boolean;
} {
  if (esTrxPasarela(trxId)) {
    const simulada = esTransaccionSimulada(trxId);
    return {
      etiqueta: simulada ? "Pasarela simulada (demo)" : "Pasarela Vualá",
      detalle: trxId ?? undefined,
      esPasarela: true,
    };
  }
  if (esPagoManual(trxId)) {
    return { etiqueta: "Cobro directo", esPasarela: false };
  }
  if (estado === "pendiente") {
    return { etiqueta: "Pago directo pendiente", esPasarela: false };
  }
  if (estado === "pagada") {
    return { etiqueta: "Cobro directo", esPasarela: false };
  }
  return { etiqueta: "Sin cargo", esPasarela: false };
}

function CeldaCobro({
  reserva,
  monedaNegocio,
  confirmandoId,
  onMarcarPagada,
}: {
  reserva: VistaReserva;
  monedaNegocio: CodigoMoneda;
  confirmandoId: string | null;
  onMarcarPagada?: (id: string) => void;
}) {
  const canal = etiquetaCanal(reserva.trxId, reserva.estado);
  const monto = reserva.monto ?? reserva.montoEstimado;
  const moneda = reserva.moneda ?? monedaNegocio;
  const esEstimado =
    reserva.monto === undefined && reserva.montoEstimado !== undefined;
  const confirmando = confirmandoId === reserva.id;
  const montoFormateado =
    monto !== undefined
      ? formatearMoneda(monto, moneda, {
          mostrarCodigo: moneda !== monedaNegocio,
        })
      : "—";

  if (reserva.estado === "cancelada") {
    const tuvoPasarela = esTrxPasarela(reserva.trxId);
    return (
      <div className="space-y-0.5">
        <p className="font-mono text-sm font-semibold text-slate-400 line-through">
          {montoFormateado}
        </p>
        <p
          className={`text-[11px] font-medium ${
            tuvoPasarela ? "text-amber-700" : "text-slate-400"
          }`}
        >
          {tuvoPasarela ? "Reembolso en Finanzas" : "Reserva anulada"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-baseline gap-1.5">
        <span
          className={`font-mono text-sm font-semibold ${
            reserva.estado === "pagada" ? "text-vuki-ink" : "text-amber-800"
          }`}
        >
          {montoFormateado}
        </span>
        {esEstimado && reserva.estado === "pendiente" && (
          <span className="text-[11px] font-medium text-amber-700">
            por cobrar
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500">
        {canal.etiqueta}
        {canal.detalle ? (
          <span className="ml-1 font-mono text-[10px] text-slate-400">
            · {canal.detalle}
          </span>
        ) : null}
      </p>

      {reserva.estado === "pendiente" && onMarcarPagada && (
        <button
          type="button"
          disabled={confirmando}
          onClick={() => onMarcarPagada(reserva.id)}
          className="vuki-focus mt-0.5 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {confirmando ? (
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-3 w-3" aria-hidden="true" />
          )}
          Confirmar cobro
        </button>
      )}
    </div>
  );
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

interface TablaReservasEmpresaProps {
  reservasFiltradas: VistaReserva[];
  monedaNegocio?: CodigoMoneda;
  hoyClave: string;
  ahoraMs: number;
  confirmandoPagoId: string | null;
  onMarcarPagada?: (id: string) => void;
  onCancelar?: (id: string) => Promise<string | null> | void;
  onSolicitarCancelar: (reserva: VistaReserva) => void;
}

export default function TablaReservasEmpresa({
  reservasFiltradas,
  monedaNegocio = "USD",
  hoyClave,
  ahoraMs,
  confirmandoPagoId,
  onMarcarPagada,
  onCancelar,
  onSolicitarCancelar,
}: TablaReservasEmpresaProps) {
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  async function copiarContacto(id: string, valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiadoId(id);
      toast.success("Correo copiado al portapapeles");
      setTimeout(() => {
        setCopiadoId((actual) => (actual === id ? null : actual));
      }, 1800);
    } catch {
      toast.error("No se pudo copiar al portapapeles.");
    }
  }

  const botonCancelar = (reserva: VistaReserva) => {
    if (!onCancelar || reserva.estado === "cancelada") return null;

    const ctx = contextoReserva(reserva, hoyClave, ahoraMs);
    const esPasada = ctx.etiqueta === "Pasada";

    if (esPasada) {
      return (
        <span
          className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
          title="La salida ya ocurrió, esta reserva no se puede cancelar"
        >
          <Check className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
          Finalizada
        </span>
      );
    }

    return (
      <button
        type="button"
        onClick={() => onSolicitarCancelar(reserva)}
        aria-label={`Cancelar reserva de ${reserva.cliente}`}
        className="vuki-focus inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Cancelar
      </button>
    );
  };

  return (
    <>
      {/* Tabla en escritorio (lg+) */}
      <div
        role="region"
        aria-label="Tabla de reservas"
        tabIndex={0}
        className="vuki-focus hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm lg:block"
      >
        <table className="w-full min-w-[780px] text-left text-sm">
          <caption className="sr-only">Listado de reservas</caption>
          <thead className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-3">
                Salida
              </th>
              <th scope="col" className="px-4 py-3">
                Cliente
              </th>
              <th scope="col" className="px-4 py-3">
                Servicio
              </th>
              <th scope="col" className="px-4 py-3">
                Cobro
              </th>
              <th scope="col" className="px-4 py-3">
                Estado
              </th>
              {onCancelar && (
                <th scope="col" className="px-4 py-3 text-right">
                  Acción
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {reservasFiltradas.map((reserva) => {
              const ctx = contextoReserva(reserva, hoyClave, ahoraMs);
              const atenuada =
                reserva.estado === "cancelada" || ctx.etiqueta === "Pasada";
              return (
                <tr
                  key={reserva.id}
                  className={`transition hover:bg-slate-50/60 ${
                    atenuada ? "bg-slate-50/40 text-slate-500" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <div className="font-medium text-vuki-ink">
                      {fechaHoraCR(reserva.fechaIso)}
                    </div>
                    {ctx.etiqueta && reserva.estado !== "cancelada" && (
                      <span
                        className={`mt-1 inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${ctx.clase}`}
                      >
                        {ctx.etiqueta}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-start gap-2.5">
                      <span
                        aria-hidden="true"
                        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700"
                      >
                        {iniciales(reserva.cliente)}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-vuki-ink">
                          {reserva.cliente}
                        </div>
                        {reserva.email ? (
                          <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                            <a
                              href={`mailto:${reserva.email}`}
                              className="truncate hover:text-vuki-ink hover:underline"
                            >
                              {reserva.email}
                            </a>
                            <button
                              type="button"
                              onClick={() =>
                                copiarContacto(reserva.id, reserva.email!)
                              }
                              title="Copiar correo"
                              aria-label="Copiar correo"
                              className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              {copiadoId === reserva.id ? (
                                <Check
                                  className="h-3 w-3 text-emerald-600"
                                  aria-hidden="true"
                                />
                              ) : (
                                <Copy className="h-3 w-3" aria-hidden="true" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="mt-0.5 block text-xs italic text-slate-400">
                            Sin correo registrado
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700">
                    <div className="font-medium text-vuki-ink">
                      {reserva.servicio}
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500">
                      {reserva.esItem ? (
                        <Package className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Users className="h-3 w-3" aria-hidden="true" />
                      )}
                      {textoCantidad(reserva)}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    <CeldaCobro
                      reserva={reserva}
                      monedaNegocio={monedaNegocio}
                      confirmandoId={confirmandoPagoId}
                      onMarcarPagada={onMarcarPagada}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <BadgeEstado estado={reserva.estado} />
                  </td>
                  {onCancelar && (
                    <td className="px-4 py-3.5 text-right">
                      {botonCancelar(reserva)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tarjetas en móvil y tablet (< lg) */}
      <Lista className="lg:hidden">
        {reservasFiltradas.map((reserva) => {
          const ctx = contextoReserva(reserva, hoyClave, ahoraMs);
          return (
            <ItemLista key={reserva.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700"
                  >
                    {iniciales(reserva.cliente)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-vuki-ink">
                      {reserva.cliente}
                    </p>
                    {reserva.email ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <a
                          href={`mailto:${reserva.email}`}
                          className="inline-flex items-center gap-1 hover:text-vuki-ink hover:underline"
                        >
                          <Mail className="h-3 w-3" aria-hidden="true" />
                          {reserva.email}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            copiarContacto(reserva.id, reserva.email!)
                          }
                          aria-label="Copiar correo"
                          className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          {copiadoId === reserva.id ? (
                            <Check
                              className="h-3 w-3 text-emerald-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <Copy className="h-3 w-3" aria-hidden="true" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs italic text-slate-400">
                        Sin correo registrado
                      </p>
                    )}
                  </div>
                </div>
                <BadgeEstado estado={reserva.estado} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="font-semibold text-vuki-ink">
                  {reserva.servicio}
                </span>
                <span>· {fechaHoraCR(reserva.fechaIso)}</span>
                <span className="inline-flex items-center gap-1">
                  · {reserva.esItem ? (
                    <Package className="h-3 w-3" aria-hidden="true" />
                  ) : (
                    <Users className="h-3 w-3" aria-hidden="true" />
                  )}
                  {textoCantidad(reserva)}
                </span>
                {ctx.etiqueta && reserva.estado !== "cancelada" && (
                  <span
                    className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${ctx.clase}`}
                  >
                    {ctx.etiqueta}
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                <CeldaCobro
                  reserva={reserva}
                  monedaNegocio={monedaNegocio}
                  confirmandoId={confirmandoPagoId}
                  onMarcarPagada={onMarcarPagada}
                />
                {botonCancelar(reserva)}
              </div>
            </ItemLista>
          );
        })}
      </Lista>
    </>
  );
}

