"use client";

import { useActionState, useEffect, useRef } from "react";
import { DollarSign, Loader2 } from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import { CLASE_INPUT, TextareaConContador } from "./ui";
import { usd } from "../../lib/admin/formato";
import type { ResultadoAccion } from "../../lib/admin/auth";

export interface ReservaParaReembolso {
  id: string;
  fechaHora: string;
  emailCliente: string;
  trxId?: string | null;
  negocioNombre: string;
  servicioNombre: string;
  montoUsd: number;
}

const ESTADO_INICIAL: ResultadoAccion = {};

export function ReembolsoDrawer({
  reserva,
  onClose,
  accion,
}: {
  reserva: ReservaParaReembolso | null;
  onClose: () => void;
  accion: (
    reservaId: string,
    previo: ResultadoAccion,
    datos: FormData,
  ) => Promise<ResultadoAccion>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  async function accionConId(
    previo: ResultadoAccion,
    datos: FormData,
  ): Promise<ResultadoAccion> {
    if (!reserva) return {};
    return accion(reserva.id, previo, datos);
  }

  const [estado, enviar, pendiente] = useActionState(
    accionConId,
    ESTADO_INICIAL,
  );

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.ok);
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose]);

  return (
    <Drawer
      abierto={!!reserva}
      titulo="Reembolsar reserva"
      onClose={onClose}
    >
      {reserva && (
        <div className="flex flex-1 flex-col justify-between overflow-y-auto p-6">
          <div className="space-y-5">
            {/* Ficha resumen de la reserva */}
            <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-4 text-xs">
              <p className="font-semibold uppercase tracking-wider text-sky-900">
                Reserva seleccionada
              </p>
              <div className="mt-3 space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-500">Negocio:</span>
                  <span className="font-semibold text-slate-900">
                    {reserva.negocioNombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Servicio:</span>
                  <span className="font-medium text-slate-800">
                    {reserva.servicioNombre}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-medium text-slate-800">
                    {reserva.emailCliente}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha:</span>
                  <span>{reserva.fechaHora}</span>
                </div>
                {reserva.trxId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transacción:</span>
                    <span className="font-mono text-[11px] text-slate-700">
                      {reserva.trxId}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-sky-200/60 pt-2 text-sm">
                  <span className="font-semibold text-slate-700">Total cobrado:</span>
                  <span className="font-bold text-emerald-800 font-display">
                    {usd(reserva.montoUsd)}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form ref={formRef} action={enviar} className="space-y-4">
              <div>
                <label
                  htmlFor="monto_usd"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Monto a devolver (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <input
                    id="monto_usd"
                    name="monto_usd"
                    type="number"
                    step="0.01"
                    min={0.01}
                    max={reserva.montoUsd}
                    defaultValue={reserva.montoUsd}
                    required
                    className={`${CLASE_INPUT} !pl-9`}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Puedes reembolsar el total o una parte (hasta {usd(reserva.montoUsd)}).
                </p>
              </div>

              <div>
                <label
                  htmlFor="motivo"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Motivo del reembolso
                </label>
                <TextareaConContador
                  id="motivo"
                  name="motivo"
                  required
                  rows={3}
                  maxLength={500}
                  placeholder="Ej. Cancelación justificada por solicitud del cliente..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  Quedará registrado en la auditoría y en el historial de la pasarela.
                </p>
              </div>

              <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
                ⚠️ Se registrará la orden de reembolso. Esta acción no se puede deshacer.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={pendiente}
                  className="vuki-focus flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={pendiente || !!estado.ok}
                  className="vuki-focus inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-red-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {pendiente && (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  )}
                  Confirmar reembolso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Drawer>
  );
}
