"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, FileCheck2, FileText, Sparkles, X } from "lucide-react";
import AnimatedIconButton from "../../AnimatedIconButton";
import { formatearMoneda } from "@/lib/formato";
import type {
  ClientIdType,
  FinancialTransaction,
  FiscalCurrency,
  VoucherType,
} from "@/types/finanzas";

export interface ModalFacturaState {
  trxId: string;
  voucherType: VoucherType;
  clientName: string;
  clientIdType: Exclude<ClientIdType, null>;
  clientTaxId: string;
  consecutive: string;
}

const TIPOS_ID_OPCIONES: {
  valor: Exclude<ClientIdType, null>;
  etiqueta: string;
}[] = [
  { valor: "fisica", etiqueta: "Cédula Física (9 dígitos)" },
  { valor: "juridica", etiqueta: "Cédula Jurídica (10 dígitos)" },
  { valor: "dimex", etiqueta: "DIMEX (11-12 dígitos)" },
  { valor: "nite", etiqueta: "NITE (10 dígitos)" },
  { valor: "extranjero", etiqueta: "Extranjero No Domiciliado" },
];

export function formatoMonedaFiscal(
  monto: number,
  currency: FiscalCurrency,
): string {
  return formatearMoneda(monto, currency);
}

interface ModalComprobanteHaciendaProps {
  modalFactura: ModalFacturaState | null;
  trxEnModal: FinancialTransaction | null;
  guardando: boolean;
  errorModal: string | null;
  modoDemo: boolean;
  onChangeModal: (next: ModalFacturaState) => void;
  onCerrar: () => void;
  onLimpiarError: () => void;
  onAutocompletarConsecutivo: () => void;
  onGuardar: (nuevoEstado: "pending" | "issued") => void;
}

export default function ModalComprobanteHacienda({
  modalFactura,
  trxEnModal,
  guardando,
  errorModal,
  modoDemo,
  onChangeModal,
  onCerrar,
  onLimpiarError,
  onAutocompletarConsecutivo,
  onGuardar,
}: ModalComprobanteHaciendaProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const onCerrarRef = useRef(onCerrar);
  const guardandoRef = useRef(guardando);

  useEffect(() => {
    onCerrarRef.current = onCerrar;
    guardandoRef.current = guardando;
  });

  const abierto = Boolean(modalFactura && trxEnModal);

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const scrollAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const enfoque = window.setTimeout(() => {
      modalRef.current
        ?.querySelector<HTMLElement>(
          "input:not([disabled]), select:not([disabled]), button:not([disabled]):not([aria-label='Cerrar ventana'])",
        )
        ?.focus();
    }, 80);

    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !guardandoRef.current) {
        onCerrarRef.current();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const enfocables = Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (enfocables.length === 0) return;
        const primero = enfocables[0];
        const ultimo = enfocables[enfocables.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    }

    window.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.body.style.overflow = scrollAnterior;
      window.clearTimeout(enfoque);
      window.removeEventListener("keydown", alPresionarTecla);
      anterior?.focus?.();
    };
  }, [abierto]);

  return (
    <AnimatePresence>
      {modalFactura && trxEnModal && (
        <motion.div
          key="modal-hacienda-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-busy={guardando}
          aria-labelledby="titulo-modal-hacienda"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
          onClick={(e) => {
            if (e.target === e.currentTarget && !guardando) {
              onCerrar();
            }
          }}
        >
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-vuki-ocean">
                  <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3
                    id="titulo-modal-hacienda"
                    className="font-display text-base font-bold text-vuki-ink"
                  >
                    Comprobante electrónico
                  </h3>
                  <p className="text-xs text-slate-500">
                    {modoDemo
                      ? "Trazabilidad de demostración"
                      : "Registro de comprobantes externos"}
                    {" · No emite ante Hacienda"}
                  </p>
                </div>
              </div>
              <AnimatedIconButton
                variante="cerrar"
                aria-label="Cerrar ventana"
                disabled={guardando}
                onClick={onCerrar}
                className="vuki-focus h-10 w-10 cursor-pointer text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </AnimatedIconButton>
            </div>

            {/* Resumen fiscal del pago */}
            <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-vuki-ink">
                  {trxEnModal.service_name}
                </span>
                <span className="font-display text-sm font-bold text-vuki-ink">
                  {formatoMonedaFiscal(
                    trxEnModal.gross_amount,
                    trxEnModal.currency,
                  )}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-slate-500">
                <span>
                  Subtotal{" "}
                  {formatoMonedaFiscal(
                    trxEnModal.subtotal_amount,
                    trxEnModal.currency,
                  )}{" "}
                  + IVA ({Math.round(trxEnModal.iva_rate * 100)}%){" "}
                  {formatoMonedaFiscal(
                    trxEnModal.iva_amount,
                    trxEnModal.currency,
                  )}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  CABYS {trxEnModal.cabys_code}
                </span>
              </div>
            </div>

            <fieldset disabled={guardando} className="mt-4 space-y-3.5">
              {/* Selector TE / FE */}
              <div>
                <span className="block text-xs font-semibold text-slate-700">
                  Tipo de comprobante
                </span>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        tipo: "TE" as const,
                        titulo: "TE · Tiquete",
                        sub: "Turista / consumidor final",
                      },
                      {
                        tipo: "FE" as const,
                        titulo: "FE · Factura",
                        sub: "Con cédula del receptor",
                      },
                    ] as const
                  ).map((op) => {
                    const seleccionado = modalFactura.voucherType === op.tipo;
                    return (
                      <button
                        key={op.tipo}
                        type="button"
                        aria-pressed={seleccionado}
                        onClick={() => {
                          onLimpiarError();
                          onChangeModal({
                            ...modalFactura,
                            voucherType: op.tipo,
                          });
                        }}
                        className={`vuki-focus rounded-2xl border p-2.5 text-left transition ${
                          seleccionado
                            ? "border-vuki-ocean bg-sky-50/70 ring-1 ring-vuki-ocean"
                            : "border-slate-200 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <p className="flex items-center gap-1.5 text-xs font-bold text-vuki-ink">
                          <FileText
                            className="h-3.5 w-3.5 text-vuki-ocean"
                            aria-hidden="true"
                          />
                          {op.titulo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {op.sub}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Datos del receptor si se selecciona FE */}
              {modalFactura.voucherType === "FE" && (
                <div className="space-y-2.5 rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Nombre o razón social del receptor
                    <input
                      type="text"
                      value={modalFactura.clientName}
                      onChange={(e) =>
                        onChangeModal({
                          ...modalFactura,
                          clientName: e.target.value,
                        })
                      }
                      placeholder="Ej. Inversiones Arenal S.A."
                      className="vuki-input-sm mt-1"
                    />
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Tipo de ID
                      <select
                        value={modalFactura.clientIdType}
                        onChange={(e) => {
                          const encontrado = TIPOS_ID_OPCIONES.find(
                            (o) => o.valor === e.target.value,
                          );
                          if (encontrado) {
                            onChangeModal({
                              ...modalFactura,
                              clientIdType: encontrado.valor,
                            });
                          }
                        }}
                        className="vuki-select-sm mt-1 w-full"
                      >
                        {TIPOS_ID_OPCIONES.map((op) => (
                          <option key={op.valor} value={op.valor}>
                            {op.etiqueta}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-xs font-medium text-slate-700">
                      Identificación / Cédula
                      <input
                        type="text"
                        value={modalFactura.clientTaxId}
                        onChange={(e) =>
                          onChangeModal({
                            ...modalFactura,
                            clientTaxId: e.target.value,
                          })
                        }
                        placeholder="Ej. 3-101-123456"
                        className="vuki-input-sm mt-1 font-mono"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Consecutivo Hacienda (opcional) */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="input-consecutivo-hacienda"
                    className="text-xs font-semibold text-slate-700"
                  >
                    Consecutivo Hacienda{" "}
                    <span className="font-normal text-slate-400">
                      (opcional)
                    </span>
                  </label>
                  {modoDemo && (
                    <button
                      type="button"
                      onClick={onAutocompletarConsecutivo}
                      className="vuki-focus inline-flex items-center gap-1 text-[11px] font-semibold text-vuki-ocean hover:underline"
                    >
                      <Sparkles className="h-3 w-3" aria-hidden="true" />
                      Generar de prueba
                    </button>
                  )}
                </div>
                <input
                  id="input-consecutivo-hacienda"
                  type="text"
                  maxLength={50}
                  value={modalFactura.consecutive}
                  onChange={(e) =>
                    onChangeModal({
                      ...modalFactura,
                      consecutive: e.target.value,
                    })
                  }
                  placeholder="Ej. 00100001040000000001"
                  className="vuki-input mt-1.5 font-mono text-xs"
                />
              </div>

              {errorModal && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {errorModal}
                </p>
              )}
            </fieldset>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
              {trxEnModal.invoice_status === "issued" && (
                <button
                  type="button"
                  onClick={() => onGuardar("pending")}
                  disabled={guardando}
                  className="vuki-focus mr-auto inline-flex min-h-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 px-3.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-100"
                >
                  Volver a Pendiente
                </button>
              )}
              <button
                type="button"
                disabled={guardando}
                onClick={onCerrar}
                className="vuki-btn-secondary px-4 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => onGuardar("issued")}
                disabled={guardando}
                className="vuki-btn-primary px-4 text-xs"
              >
                <CheckCircle2
                  className="h-4 w-4 text-vuki-emerald"
                  aria-hidden="true"
                />
                {guardando
                  ? "Guardando..."
                  : trxEnModal.invoice_status === "issued"
                    ? "Guardar cambios"
                    : "Marcar como Facturado"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

