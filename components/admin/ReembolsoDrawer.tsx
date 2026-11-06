"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import Drawer from "../Drawer";
import { toast } from "../Toast";
import { CLASE_INPUT, TextareaConContador } from "./ui";
import { moneda } from "../../lib/admin/formato";
import { esTransaccionSimulada } from "../../lib/formato";
import {
  normalizarMoneda,
  obtenerInfoMoneda,
  redondearMontoMoneda,
  type CodigoMoneda,
} from "../../lib/monedas";
import { conResilienciaRed } from "../../lib/errores";
import type { ResultadoAccion } from "../../lib/admin/auth";

export interface ReservaParaReembolso {
  id: string;
  fechaHora: string;
  emailCliente: string;
  trxId?: string | null;
  negocioNombre: string;
  servicioNombre: string;
  montoUsd: number;
  moneda?: CodigoMoneda;
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
  const [monto, setMonto] = useState<string>("");
  const [motivo, setMotivo] = useState<string>("");

  // Sincronizar monto y limpiar motivo al abrir con una nueva reserva
  useEffect(() => {
    if (reserva) {
      setMonto(reserva.montoUsd.toFixed(2));
      setMotivo("");
    }
  }, [reserva]);

  async function accionConId(
    previo: ResultadoAccion,
    datos: FormData,
  ): Promise<ResultadoAccion> {
    if (!reserva) return {};
    return accion(reserva.id, previo, datos);
  }

  const [estado, enviar, pendiente] = useActionState(
    conResilienciaRed(accionConId),
    ESTADO_INICIAL,
  );

  function handleClose() {
    if (pendiente) return;
    onClose();
  }

  useEffect(() => {
    if (estado.ok) {
      toast.success(estado.ok);
      onClose();
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, onClose]);

  const codMoneda = normalizarMoneda(reserva?.moneda, "USD");
  const infoMoneda = obtenerInfoMoneda(codMoneda);
  const totalCobrado = reserva?.montoUsd ?? 0;
  const mitadCobrado = redondearMontoMoneda(totalCobrado / 2);

  const montoNum = parseFloat(monto);
  const esMontoValido =
    !isNaN(montoNum) && montoNum > 0 && montoNum <= totalCobrado;
  const esMotivoValido = motivo.trim().length > 0;
  const esFormularioValido = esMontoValido && esMotivoValido;
  const deshabilitarBoton = pendiente || !!estado.ok || !esFormularioValido;

  const esTotalSeleccionado =
    !isNaN(montoNum) && Math.abs(montoNum - totalCobrado) < 0.001;
  const esMitadSeleccionada =
    !isNaN(montoNum) && Math.abs(montoNum - mitadCobrado) < 0.001;

  return (
    <Drawer
      abierto={!!reserva}
      titulo="Reembolsar reserva"
      onClose={handleClose}
    >
      {reserva && (
        <form
          ref={formRef}
          action={enviar}
          className="flex flex-col min-h-full gap-5"
        >
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
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">Transacción:</span>
                    <span className="flex flex-wrap items-center justify-end gap-1.5 font-mono text-[11px] text-slate-700">
                      <span>{reserva.trxId}</span>
                      {esTransaccionSimulada(reserva.trxId) && (
                        <span className="rounded bg-amber-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-amber-800">
                          Simulado (demo)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-sky-200/60 pt-2 text-sm">
                  <span className="font-semibold text-slate-700">Total cobrado:</span>
                  <span className="font-bold text-emerald-800 font-display">
                    {moneda(totalCobrado, codMoneda)}
                  </span>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div>
              <label
                htmlFor="monto_usd"
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Monto a devolver ({infoMoneda.codigo})
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  {infoMoneda.simbolo}
                </span>
                <input
                  id="monto_usd"
                  name="monto_usd"
                  type="number"
                  step="0.01"
                  min={0.01}
                  max={totalCobrado}
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  required
                  className={`${CLASE_INPUT} ${
                    infoMoneda.simbolo.length > 1
                      ? "vuki-input-currency-wide"
                      : "vuki-input-currency"
                  }`}
                />
              </div>

              {/* Chips rápidos de cálculo */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMonto(totalCobrado.toFixed(2))}
                  className={`vuki-focus inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    esTotalSeleccionado
                      ? "border-sky-500 bg-sky-50 text-sky-700 font-semibold ring-1 ring-sky-500/20"
                      : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  Total ({moneda(totalCobrado, codMoneda)})
                </button>
                <button
                  type="button"
                  onClick={() => setMonto(mitadCobrado.toFixed(2))}
                  className={`vuki-focus inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition cursor-pointer ${
                    esMitadSeleccionada
                      ? "border-sky-500 bg-sky-50 text-sky-700 font-semibold ring-1 ring-sky-500/20"
                      : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  50% ({moneda(mitadCobrado, codMoneda)})
                </button>
              </div>

              <p className="mt-1.5 text-xs text-slate-500">
                Puedes reembolsar el total o una parte (hasta{" "}
                {moneda(totalCobrado, codMoneda)}).
              </p>

              {monto.length > 0 && !isNaN(montoNum) && montoNum > totalCobrado && (
                <p className="mt-1 text-xs text-red-600">
                  El monto a devolver no puede superar el total cobrado (
                  {moneda(totalCobrado, codMoneda)}).
                </p>
              )}
              {monto.length > 0 && !isNaN(montoNum) && montoNum <= 0 && (
                <p className="mt-1 text-xs text-red-600">
                  El monto a devolver debe ser mayor a 0.
                </p>
              )}
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
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                required
                rows={3}
                maxLength={500}
                placeholder="Ej. Cancelación justificada por solicitud del cliente..."
              />
              <p className="mt-1 text-xs text-slate-500">
                Quedará registrado en la auditoría y en el control interno de
                conciliación (modo demostración / manual; no ejecuta reversos
                bancarios automáticos).
              </p>
            </div>

            <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3 text-xs text-amber-900 leading-relaxed">
              ⚠️ Se registrará la orden de reembolso en el panel (control
              interno / simulación). Esta acción no se puede deshacer.
            </div>
          </div>

          {/* Barra de acciones fijada al pie inferior */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              disabled={pendiente}
              className="vuki-btn-secondary flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={deshabilitarBoton}
              className="vuki-btn-danger flex-1"
            >
              {pendiente && (
                <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
              )}
              Confirmar reembolso
            </button>
          </div>
        </form>
      )}
    </Drawer>
  );
}
