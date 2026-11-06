"use client";

import { useId, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, CreditCard } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

/** Formatea el número de tarjeta agrupando en bloques de 4 dígitos. */
function formatearNumeroTarjeta(valor: string): string {
  const soloDigitos = valor.replace(/\D/g, "").slice(0, 16);
  return soloDigitos.replace(/(.{4})/g, "$1 ").trim();
}

/** Formatea el vencimiento como MM/AA, insertando la barra automáticamente. */
function formatearVencimiento(valor: string): string {
  const soloDigitos = valor.replace(/\D/g, "").slice(0, 4);
  if (soloDigitos.length <= 2) return soloDigitos;
  return `${soloDigitos.slice(0, 2)}/${soloDigitos.slice(2)}`;
}

/** Valida que el vencimiento tenga formato MM/AA con mes entre 01 y 12. */
function vencimientoValido(valor: string): boolean {
  const coincidencia = valor.match(/^(\d{2})\/(\d{2})$/);
  if (!coincidencia) return false;
  const mes = Number(coincidencia[1]);
  return mes >= 1 && mes <= 12;
}

interface PasoPagoSimuladoProps {
  idTitulo: string;
  direccion: number;
  variantesPaso: {
    entra: (dir: number) => { x: number; opacity: number };
    centro: { x: number; opacity: number };
    sale: (dir: number) => { x: number; opacity: number };
  };
  totalUsd: number;
  errorPago: string | null;
  onVolver: () => void;
  onConfirmarPago: () => void;
}

export default function PasoPagoSimulado({
  idTitulo,
  direccion,
  variantesPaso,
  totalUsd,
  errorPago,
  onVolver,
  onConfirmarPago,
}: PasoPagoSimuladoProps) {
  const { t } = useTranslations();
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvc, setCvc] = useState("");

  const idTarjeta = useId();
  const idVencimiento = useId();
  const idCvc = useId();

  const numeroTarjetaValido = numeroTarjeta.replace(/\D/g, "").length >= 13;
  const cvcValido = /^\d{3,4}$/.test(cvc);
  const pagoValido =
    numeroTarjetaValido && vencimientoValido(vencimiento) && cvcValido;

  return (
    <motion.div
      key="pago"
      custom={direccion}
      variants={variantesPaso}
      initial="entra"
      animate="centro"
      exit="sale"
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <h2 id={idTitulo} className="sr-only">
        {t("pago_demo")}
      </h2>
      <button
        type="button"
        onClick={onVolver}
        className="vuki-focus -ml-1 mb-4 inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        {t("volver")}
      </button>
      <div className="mb-5 flex items-center gap-2 text-slate-400">
        <CreditCard className="h-5 w-5" aria-hidden="true" />
        <span className="text-xs font-semibold uppercase tracking-wide">
          {t("pago_demo")}
        </span>
      </div>
      <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        {t("aviso_pago_demo")}
      </p>

      <div className="mb-6 rounded-2xl bg-slate-50 p-5">
        <p className="text-xs text-slate-500">{t("total_a_pagar")}</p>
        <p className="font-display text-3xl font-bold tracking-tight text-vuki-ink">
          ${totalUsd.toFixed(2)}
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor={idTarjeta}
            className="mb-2 block text-xs font-medium text-slate-500"
          >
            {t("numero_tarjeta")}
          </label>
          <input
            id={idTarjeta}
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={19}
            value={numeroTarjeta}
            onChange={(e) =>
              setNumeroTarjeta(formatearNumeroTarjeta(e.target.value))
            }
            placeholder="4242 4242 4242 4242"
            className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label
              htmlFor={idVencimiento}
              className="mb-2 block text-xs font-medium text-slate-500"
            >
              {t("vencimiento")}
            </label>
            <input
              id={idVencimiento}
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              maxLength={5}
              value={vencimiento}
              onChange={(e) =>
                setVencimiento(formatearVencimiento(e.target.value))
              }
              placeholder="MM/AA"
              className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor={idCvc}
              className="mb-2 block text-xs font-medium text-slate-500"
            >
              {t("cvc")}
            </label>
            <input
              id={idCvc}
              type="text"
              inputMode="numeric"
              autoComplete="cc-csc"
              maxLength={4}
              value={cvc}
              onChange={(e) =>
                setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="123"
              className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
            />
          </div>
        </div>
      </div>

      {errorPago && (
        <p role="alert" className="mt-5 text-sm text-red-600">
          {errorPago}
        </p>
      )}

      <motion.button
        type="button"
        disabled={!pagoValido}
        onClick={onConfirmarPago}
        whileTap={{ scale: 0.97 }}
        className="mt-10 h-14 w-full rounded-2xl bg-emerald-700 text-base font-semibold text-white shadow-sm outline-none transition-colors hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
      >
        {t("pagar")} ${totalUsd.toFixed(2)}
      </motion.button>
    </motion.div>
  );
}

