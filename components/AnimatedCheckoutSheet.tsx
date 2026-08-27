"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  Clock,
  CreditCard,
  Loader2,
  Mail,
  User,
  X,
} from "lucide-react";
import type { DemoHorario, DemoReserva, DemoServicio } from "../lib/demoStore";
import { cn } from "../lib/cn";
import { useTranslations } from "../lib/i18n";
import AnimatedIconButton from "./AnimatedIconButton";

type Paso = "horario" | "datos" | "pago" | "cargando" | "exito";

const ORDEN_PASOS: Paso[] = ["horario", "datos", "pago", "cargando", "exito"];

/** Formato básico de correo: algo@algo.algo, sin espacios. */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

interface AnimatedCheckoutSheetProps {
  servicio: DemoServicio;
  negocioNombre: string;
  colorTema: string;
  onClose: () => void;
  /** Horarios disponibles del servicio (editables en /demo/admin/horarios), con cupos. */
  horariosDisponibles: DemoHorario[];
  /** Reservas ya existentes para este mismo servicio (para validar duplicados por correo). */
  reservasExistentes?: DemoReserva[];
  /** Se llama al confirmar el pago simulado, con los datos para registrar la reserva. */
  onReservaConfirmada: (
    horarioId: string,
    nombreCliente: string,
    emailCliente: string,
  ) => void;
}

const variantesPaso = {
  entra: (direccion: number) => ({
    x: direccion > 0 ? 40 : -40,
    opacity: 0,
  }),
  centro: { x: 0, opacity: 1 },
  sale: (direccion: number) => ({
    x: direccion > 0 ? -40 : 40,
    opacity: 0,
  }),
};

/** Selector de elementos enfocables dentro de la trampa de foco del sheet. */
const SELECTOR_ENFOCABLES =
  'button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Bottom sheet premium (estilo iOS) para el checkout simulado. Se desliza
 * desde abajo con física de resorte y anima cada paso del flujo
 * (horario → datos → pago → cargando → éxito) con transiciones laterales.
 * Implementa trampa de foco, cierre con Escape y atributos ARIA para
 * cumplir con navegación por teclado y lectores de pantalla.
 */
export default function AnimatedCheckoutSheet({
  servicio,
  negocioNombre,
  colorTema,
  onClose,
  horariosDisponibles,
  reservasExistentes = [],
  onReservaConfirmada,
}: AnimatedCheckoutSheetProps) {
  const { t } = useTranslations();
  const [paso, setPaso] = useState<Paso>("horario");
  const [direccion, setDireccion] = useState(1);
  const [horarioSeleccionado, setHorarioSeleccionado] =
    useState<DemoHorario | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvc, setCvc] = useState("");
  const [trxIdSimulado] = useState(
    () => `TL-${Date.now().toString().slice(-8)}`,
  );

  const idTitulo = useId();
  const idNombre = useId();
  const idEmail = useId();
  const idTarjeta = useId();
  const idVencimiento = useId();
  const idCvc = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);

  // Trampa de foco: al abrir, enfoca el sheet; con Tab/Shift+Tab el foco
  // circula solo dentro del sheet; Escape cierra; al cerrar, se devuelve el
  // foco al elemento que abrió el modal.
  useEffect(() => {
    const elementoPrevio = document.activeElement as HTMLElement | null;
    cerrarBtnRef.current?.focus();

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        onClose();
        return;
      }
      if (evento.key !== "Tab" || !sheetRef.current) return;

      const enfocables = Array.from(
        sheetRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES),
      );
      if (enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (evento.shiftKey && document.activeElement === primero) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("keydown", alPresionarTecla);
      elementoPrevio?.focus();
    };
  }, [onClose]);

  function irA(siguientePaso: Paso) {
    const actual = ORDEN_PASOS.indexOf(paso);
    const siguiente = ORDEN_PASOS.indexOf(siguientePaso);
    setDireccion(siguiente > actual ? 1 : -1);
    setPaso(siguientePaso);
  }

  function handleContinuarAPago() {
    const emailNormalizado = email.trim().toLowerCase();

    if (!REGEX_EMAIL.test(emailNormalizado)) {
      setErrorEmail("Ingresa un correo válido, por ejemplo: ana@email.com");
      return;
    }

    const yaReservado = reservasExistentes.some(
      (reserva) =>
        reserva.emailCliente.trim().toLowerCase() === emailNormalizado,
    );
    if (yaReservado) {
      setErrorEmail(
        "Este correo ya tiene una reserva para esta clase. Usa otro correo o revisa tus reservas existentes.",
      );
      return;
    }
    setErrorEmail(null);
    irA("pago");
  }

  const numeroTarjetaValido = numeroTarjeta.replace(/\D/g, "").length >= 13;
  const cvcValido = /^\d{3,4}$/.test(cvc);
  const pagoValido =
    numeroTarjetaValido && vencimientoValido(vencimiento) && cvcValido;

  function handleConfirmarPago() {
    irA("cargando");
    setTimeout(() => {
      if (horarioSeleccionado) {
        onReservaConfirmada(horarioSeleccionado.id, nombre, email);
      }
      irA("exito");
    }, 3000);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm sm:items-center"
    >
      <motion.div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        exit={{ y: "-100%" }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-b-3xl bg-white p-7 shadow-2xl sm:rounded-3xl"
      >
        {paso !== "cargando" && (
          <AnimatedIconButton
            ref={cerrarBtnRef}
            variante="cerrar"
            onClick={onClose}
            aria-label={t("cerrar")}
            className="absolute right-5 top-5 z-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </AnimatedIconButton>
        )}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direccion}>
            {/* Paso 1: selección de horario */}
            {paso === "horario" && (
              <motion.div
                key="horario"
                custom={direccion}
                variants={variantesPaso}
                initial="entra"
                animate="centro"
                exit="sale"
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h2
                  id={idTitulo}
                  className="pr-8 text-xl font-bold tracking-tight text-slate-900"
                >
                  {servicio.nombre}
                </h2>
                <p className="mt-1 text-sm text-gray-500">{negocioNombre}</p>

                <p className="mt-8 mb-4 text-sm font-medium text-slate-700">
                  {t("elige_horario")}
                </p>
                <div
                  role="group"
                  aria-label={t("elige_horario")}
                  className="flex flex-wrap gap-2.5"
                >
                  {horariosDisponibles.map((horario, i) => {
                    const seleccionado = horarioSeleccionado?.id === horario.id;
                    const reservado = horario.cuposDisponibles === 0;
                    return (
                      <motion.button
                        key={horario.id}
                        type="button"
                        disabled={reservado}
                        aria-pressed={seleccionado}
                        aria-disabled={reservado}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        whileTap={reservado ? undefined : { scale: 0.95 }}
                        onClick={() => setHorarioSeleccionado(horario)}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-4 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2",
                          reservado
                            ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 line-through"
                            : seleccionado
                              ? "border-transparent text-white"
                              : "border-slate-200 text-slate-600 hover:border-slate-300",
                        )}
                        style={{
                          ...(!reservado && seleccionado
                            ? { backgroundColor: colorTema }
                            : undefined),
                          ["--tw-ring-color" as string]: colorTema,
                        }}
                      >
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {horario.label}
                        {reservado && (
                          <span className="text-[10px] font-semibold uppercase tracking-wide">
                            {t("reservado")}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <motion.button
                  type="button"
                  disabled={!horarioSeleccionado}
                  onClick={() => irA("datos")}
                  whileTap={{ scale: 0.97 }}
                  className="mt-10 h-14 w-full rounded-2xl text-base font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: colorTema,
                    ["--tw-ring-color" as string]: colorTema,
                  }}
                >
                  {t("continuar")}
                </motion.button>
              </motion.div>
            )}

            {/* Paso 2: datos del cliente */}
            {paso === "datos" && (
              <motion.div
                key="datos"
                custom={direccion}
                variants={variantesPaso}
                initial="entra"
                animate="centro"
                exit="sale"
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {horarioSeleccionado?.label}
                </div>

                <h2
                  id={idTitulo}
                  className="text-xl font-bold tracking-tight text-slate-900"
                >
                  {t("tus_datos")}
                </h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor={idNombre}
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500"
                    >
                      <User className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                      {t("nombre_completo")}
                    </label>
                    <input
                      id={idNombre}
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ana Pérez"
                      className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-base text-slate-900 outline-none transition focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset"
                      style={{ ["--tw-ring-color" as string]: colorTema }}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={idEmail}
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden="true" />{" "}
                      {t("correo_electronico")}
                    </label>
                    <input
                      id={idEmail}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setErrorEmail(null);
                      }}
                      placeholder="ana@email.com"
                      aria-invalid={errorEmail ? true : undefined}
                      aria-describedby={
                        errorEmail ? `${idEmail}-error` : undefined
                      }
                      className={`h-14 w-full rounded-2xl bg-slate-100 px-4 text-base text-slate-900 outline-none transition focus-visible:bg-slate-50 focus-visible:ring-2 focus-visible:ring-inset ${
                        errorEmail ? "ring-2 ring-inset ring-red-500" : ""
                      }`}
                      style={
                        errorEmail
                          ? undefined
                          : { ["--tw-ring-color" as string]: colorTema }
                      }
                    />
                    {errorEmail && (
                      <p
                        id={`${idEmail}-error`}
                        role="alert"
                        className="mt-2 text-sm text-red-600"
                      >
                        {errorEmail}
                      </p>
                    )}
                  </div>
                </div>

                <motion.button
                  type="button"
                  disabled={!nombre || !email}
                  onClick={handleContinuarAPago}
                  whileTap={{ scale: 0.97 }}
                  className="mt-10 h-14 w-full rounded-2xl text-base font-semibold text-white shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: colorTema,
                    ["--tw-ring-color" as string]: colorTema,
                  }}
                >
                  {t("continuar_pago")}
                </motion.button>
              </motion.div>
            )}

            {/* Paso 3: tarjeta (solo visual) */}
            {paso === "pago" && (
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
                  {t("pago_seguro")}
                </h2>
                <div className="mb-5 flex items-center gap-2 text-slate-400">
                  <CreditCard className="h-5 w-5" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-wide">
                    {t("pago_seguro")}
                  </span>
                </div>

                <div className="mb-6 rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs text-gray-500">{t("total_a_pagar")}</p>
                  <p className="text-3xl font-bold tracking-tight text-slate-900">
                    ${servicio.precioUsd.toFixed(2)}
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor={idTarjeta}
                      className="mb-2 block text-xs font-medium text-gray-500"
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
                        className="mb-2 block text-xs font-medium text-gray-500"
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
                        className="mb-2 block text-xs font-medium text-gray-500"
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

                <motion.button
                  type="button"
                  disabled={!pagoValido}
                  onClick={handleConfirmarPago}
                  whileTap={{ scale: 0.97 }}
                  className="mt-10 h-14 w-full rounded-2xl bg-emerald-600 text-base font-semibold text-white shadow-sm outline-none transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  {t("pagar")} ${servicio.precioUsd.toFixed(2)}
                </motion.button>
              </motion.div>
            )}

            {/* Paso 4: cargando */}
            {paso === "cargando" && (
              <motion.div
                key="cargando"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                aria-live="polite"
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <h2 id={idTitulo} className="sr-only">
                  {t("conectando_banco")}
                </h2>
                <Loader2
                  className="h-11 w-11 animate-spin"
                  aria-hidden="true"
                  style={{ color: colorTema }}
                />
                <p className="mt-5 text-sm font-semibold text-slate-700">
                  {t("conectando_banco")}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {t("puede_tardar")}
                </p>
              </motion.div>
            )}

            {/* Paso 5: éxito / recibo digital */}
            {paso === "exito" && (
              <motion.div
                key="exito"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                role="status"
                aria-live="polite"
              >
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
                    className="mt-5 text-xl font-bold tracking-tight text-slate-900"
                  >
                    {t("pago_exitoso")}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {t("recibo_enviado")} {email}
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
                      <dt className="text-gray-500">{t("negocio")}</dt>
                      <dd className="font-medium text-slate-800">
                        {negocioNombre}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{t("servicio")}</dt>
                      <dd className="font-medium text-slate-800">
                        {servicio.nombre}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{t("fecha_hora")}</dt>
                      <dd className="font-medium text-slate-800">
                        {horarioSeleccionado?.label}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">{t("cliente")}</dt>
                      <dd className="font-medium text-slate-800">{nombre}</dd>
                    </div>
                    <div className="flex justify-between border-t border-emerald-200 pt-2.5">
                      <dt className="text-gray-500">{t("total_pagado")}</dt>
                      <dd className="font-bold text-emerald-700">
                        ${servicio.precioUsd.toFixed(2)}
                      </dd>
                    </div>
                  </dl>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={onClose}
                  whileTap={{ scale: 0.97 }}
                  className="mt-8 h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white shadow-sm outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                  {t("listo")}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
