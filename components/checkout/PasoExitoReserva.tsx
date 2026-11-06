"use client";

import { motion } from "framer-motion";
import { useTranslations } from "@/lib/i18n";
import MarcaReserva from "../MarcaReserva";
import VLogo from "../VLogo";

interface PasoExitoReservaProps {
  idTitulo: string;
  trxIdSimulado: string;
  negocioNombre: string;
  servicioNombre: string;
  horarioLabel?: string;
  nombreCliente: string;
  emailCliente: string;
  totalUsd: number;
  reciboEnviado: boolean;
  onClose: () => void;
}

export default function PasoExitoReserva({
  idTitulo,
  trxIdSimulado,
  negocioNombre,
  servicioNombre,
  horarioLabel,
  nombreCliente,
  emailCliente,
  totalUsd,
  reciboEnviado,
  onClose,
}: PasoExitoReservaProps) {
  const { t, locale } = useTranslations();

  return (
    <motion.div
      key="exito"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="status"
      aria-live="polite"
    >
      <div className="mb-6 rounded-2xl bg-slate-900 px-4 py-4 pr-10 text-white">
        <VLogo
          showText
          tone="light"
          className="h-6 w-6"
          wordmarkClassName="text-xl"
        />
        <p className="mt-2 text-xs font-medium text-emerald-200">
          {t("reserva_confirmada")}
        </p>
      </div>
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="h-10 w-10 text-emerald-600"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <motion.path
              d="M5 13l4 4L19 7"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            />
          </motion.svg>
        </motion.div>
        <h2
          id={idTitulo}
          className="mt-5 font-display text-xl font-bold tracking-tight text-vuki-ink"
        >
          {t("pago_demo_exitoso")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {reciboEnviado
            ? `${t("recibo_enviado")} ${emailCliente}`
            : t("recibo_no_enviado")}
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
        className="mt-7 rounded-3xl border-2 border-dashed border-emerald-300 bg-emerald-50 p-6"
      >
        <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            {t("recibo_digital")}
          </span>
          <span className="font-mono text-xs text-emerald-600">
            #{trxIdSimulado}
          </span>
        </div>

        <dl className="mt-3 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("negocio")}</dt>
            <dd className="font-medium text-slate-800">{negocioNombre}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("servicio")}</dt>
            <dd className="font-medium text-slate-800">{servicioNombre}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("fecha_hora")}</dt>
            <dd className="font-medium text-slate-800">{horarioLabel}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-500">{t("cliente")}</dt>
            <dd className="font-medium text-slate-800">{nombreCliente}</dd>
          </div>
          <div className="flex justify-between border-t border-emerald-200 pt-2.5">
            <dt className="text-slate-500">{t("total_pagado")}</dt>
            <dd className="font-bold text-emerald-700">
              ${totalUsd.toFixed(2)}
            </dd>
          </div>
        </dl>
      </motion.div>

      <motion.button
        type="button"
        onClick={onClose}
        whileTap={{ scale: 0.97 }}
        className="vuki-focus mt-8 h-14 w-full rounded-2xl bg-vuki-ink text-base font-semibold text-white shadow-sm transition-colors hover:bg-slate-800"
      >
        {t("listo")}
      </motion.button>
      <div className="mt-3 flex justify-center">
        <MarcaReserva idioma={locale} />
      </div>
    </motion.div>
  );
}

