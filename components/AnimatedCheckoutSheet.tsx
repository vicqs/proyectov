"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronLeft,
  Clock,
  Loader2,
  Mail,
  User,
  X,
} from "lucide-react";
import type {
  HorarioPublico,
  ReservaPublica,
  ServicioPublico,
} from "../lib/tipos-publicos";
import { cn } from "../lib/cn";
import { textoSobre } from "../lib/color";
import { useTranslations } from "../lib/i18n";
import type { ReservaPublicaResultado } from "../actions/pago-simulado";
import AnimatedIconButton from "./AnimatedIconButton";
import PasoPagoSimulado from "./checkout/PasoPagoSimulado";
import PasoExitoReserva from "./checkout/PasoExitoReserva";

type Paso = "horario" | "datos" | "pago" | "cargando" | "exito";

const ORDEN_PASOS: Paso[] = ["horario", "datos", "pago", "cargando", "exito"];

/** Formato básico de correo: algo@algo.algo, sin espacios. */
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AnimatedCheckoutSheetProps {
  servicio: ServicioPublico;
  negocioNombre: string;
  colorTema: string;
  onClose: () => void;
  /** Horarios disponibles del servicio (editables en /[slug]/admin/horarios), con cupos. */
  horariosDisponibles: HorarioPublico[];
  /** Reservas ya existentes para este mismo servicio (para validar duplicados por correo). */
  reservasExistentes?: ReservaPublica[];
  /** Se llama al confirmar el pago simulado, con los datos para registrar la reserva. */
  onReservaConfirmada: (
    horarioId: string,
    nombreCliente: string,
    emailCliente: string,
    cupos: number,
  ) => void | Promise<ReservaPublicaResultado | void>;
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
  'a[href]:not([tabindex="-1"]), button:not([disabled]):not([tabindex="-1"]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
    useState<HorarioPublico | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cupos, setCupos] = useState(1);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [trxIdSimulado, setTrxIdSimulado] = useState(
    () => `TL-${Date.now().toString().slice(-8)}`,
  );
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [reciboEnviado, setReciboEnviado] = useState(false);

  const idTitulo = useId();
  const idNombre = useId();
  const idEmail = useId();
  const sheetRef = useRef<HTMLDivElement>(null);
  const cerrarBtnRef = useRef<HTMLButtonElement>(null);
  const pasoRef = useRef<Paso>(paso);
  useEffect(() => {
    pasoRef.current = paso;
  }, [paso]);

  useEffect(() => {
    const elementoPrevio = document.activeElement as HTMLElement | null;
    cerrarBtnRef.current?.focus();

    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        if (pasoRef.current !== "cargando") {
          onClose();
        }
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
      setErrorEmail(t("correo_invalido"));
      return;
    }

    const yaReservado = reservasExistentes.some(
      (reserva) =>
        reserva.emailCliente.trim().toLowerCase() === emailNormalizado,
    );
    if (yaReservado) {
      setErrorEmail(t("correo_duplicado"));
      return;
    }
    setErrorEmail(null);
    irA("pago");
  }

  async function handleConfirmarPago() {
    if (paso === "cargando") return;
    setErrorPago(null);
    irA("cargando");
    const espera = new Promise((resolve) => setTimeout(resolve, 3000));
    let resultado: ReservaPublicaResultado | void = undefined;
    if (horarioSeleccionado) {
      try {
        resultado = await onReservaConfirmada(
          horarioSeleccionado.id,
          nombre,
          email.trim().toLowerCase(),
          cupos,
        );
      } catch {
        resultado = { error: t("error_pago") };
      }
    }
    await espera;
    if (resultado && resultado.error) {
      setErrorPago(resultado.error);
      irA("pago");
      return;
    }
    if (resultado && resultado.trxId) setTrxIdSimulado(resultado.trxId);
    setReciboEnviado(resultado?.reciboEnviado === true);
    irA("exito");
  }

  const totalUsd = servicio.precioUsd * cupos;

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
            className="absolute right-5 top-5 z-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </AnimatedIconButton>
        )}

        <div className="relative min-h-0 overflow-y-auto overscroll-contain">
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
                  className="pr-8 font-display text-xl font-bold tracking-tight text-vuki-ink"
                >
                  {servicio.nombre}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{negocioNombre}</p>

                <p className="mt-8 mb-4 text-sm font-medium text-slate-700">
                  {horariosDisponibles.length > 0 ? (
                    t("elige_horario")
                  ) : (
                    <span className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 font-normal text-slate-600">
                      <Clock
                        className="h-4 w-4 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      {t("sin_horarios")}
                    </span>
                  )}
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
                            ? {
                                backgroundColor: colorTema,
                                color: textoSobre(colorTema),
                              }
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
                        {!reservado && horario.cuposDisponibles <= 3 && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold",
                              seleccionado ? "text-inherit" : "text-amber-800",
                            )}
                          >
                            {horario.cuposDisponibles} {t("quedan")}
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
                  className="mt-10 h-14 w-full rounded-2xl text-base font-semibold text-white shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: colorTema,
                    color: textoSobre(colorTema),
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
                <button
                  type="button"
                  onClick={() => irA("horario")}
                  className="vuki-focus -ml-1 mb-5 inline-flex min-h-9 items-center gap-1 rounded-lg px-1 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  {t("volver")}
                </button>
                <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  {horarioSeleccionado?.label}
                </div>

                <h2
                  id={idTitulo}
                  className="font-display text-xl font-bold tracking-tight text-vuki-ink"
                >
                  {t("tus_datos")}
                </h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <label
                      htmlFor={idNombre}
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500"
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
                      className="mb-2 flex items-center gap-1.5 text-xs font-medium text-slate-500"
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

                <div className="mt-5 flex items-center justify-between rounded-2xl bg-slate-100 px-4 py-3">
                  <span className="text-sm font-medium text-slate-700">
                    {t("personas")}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t("quitar_persona")}
                      disabled={cupos <= 1}
                      onClick={() => setCupos((c) => Math.max(1, c - 1))}
                      className="vuki-focus h-11 w-11 rounded-full bg-white text-lg font-semibold text-slate-700 shadow-sm disabled:opacity-30"
                    >
                      −
                    </button>
                    <span className="w-6 text-center text-base font-semibold text-slate-900">
                      {cupos}
                    </span>
                    <button
                      type="button"
                      aria-label={t("agregar_persona")}
                      disabled={
                        cupos >= (horarioSeleccionado?.cuposDisponibles ?? 1)
                      }
                      onClick={() => setCupos((c) => c + 1)}
                      className="vuki-focus h-11 w-11 rounded-full bg-white text-lg font-semibold text-slate-700 shadow-sm disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>

                <motion.button
                  type="button"
                  disabled={!nombre || !email}
                  onClick={handleContinuarAPago}
                  whileTap={{ scale: 0.97 }}
                  className="mt-10 h-14 w-full rounded-2xl text-base font-semibold text-white shadow-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                  style={{
                    backgroundColor: colorTema,
                    color: textoSobre(colorTema),
                    ["--tw-ring-color" as string]: colorTema,
                  }}
                >
                  {t("continuar_pago")}
                </motion.button>
              </motion.div>
            )}

            {/* Paso 3: tarjeta (solo visual) */}
            {paso === "pago" && (
              <PasoPagoSimulado
                idTitulo={idTitulo}
                direccion={direccion}
                variantesPaso={variantesPaso}
                totalUsd={totalUsd}
                errorPago={errorPago}
                onVolver={() => irA("datos")}
                onConfirmarPago={handleConfirmarPago}
              />
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
                  {t("procesando_demo")}
                </h2>
                <Loader2
                  className="h-11 w-11 animate-spin"
                  aria-hidden="true"
                  style={{ color: colorTema }}
                />
                <p className="mt-5 text-sm font-semibold text-slate-700">
                  {t("procesando_demo")}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {t("puede_tardar")}
                </p>
              </motion.div>
            )}

            {/* Paso 5: éxito / recibo digital */}
            {paso === "exito" && (
              <PasoExitoReserva
                idTitulo={idTitulo}
                trxIdSimulado={trxIdSimulado}
                negocioNombre={negocioNombre}
                servicioNombre={servicio.nombre}
                horarioLabel={horarioSeleccionado?.label}
                nombreCliente={nombre}
                emailCliente={email}
                totalUsd={totalUsd}
                reciboEnviado={reciboEnviado}
                onClose={onClose}
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
