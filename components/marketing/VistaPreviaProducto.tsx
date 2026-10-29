"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  Clock,
  LayoutDashboard,
  Link2,
  Plus,
  Smartphone,
} from "lucide-react";
import MarcaReserva from "../MarcaReserva";
import { useMovimientoMarca } from "./MovimientoMarca";

const HORAS = ["09:00", "11:00", "14:00"];

const IMAGEN_PORTADA =
  "https://images.unsplash.com/photo-1502933691298-84fc14542831?auto=format&fit=crop&w=900&q=85";

const DIAS_SEMANA = [
  { corto: "Lun", num: 12, items: 2, critico: false, pasado: true },
  { corto: "Mar", num: 13, items: 2, critico: false, pasado: true },
  { corto: "Mié", num: 14, items: 2, critico: true, esHoy: true },
  { corto: "Jue", num: 15, items: 2, critico: false, pasado: false },
  { corto: "Vie", num: 16, items: 3, critico: true, pasado: false },
];

const SLOTS_EJEMPLO = [
  {
    id: "slot-1",
    hora: "9:00 a.m.",
    servicio: "Tu primera ola",
    pct: 83,
    badge: "Últimos 1 · 5/6",
    badgeClase: "bg-amber-100 text-amber-800",
    barraClase: "bg-amber-500",
    cliente: "Sofía Vargas · 3 cupos",
  },
  {
    id: "slot-2",
    hora: "2:00 p.m.",
    servicio: "Surf al atardecer",
    pct: 50,
    badge: "2/4 cupos",
    badgeClase: "bg-emerald-100 text-emerald-800",
    barraClase: "bg-emerald-500",
    cliente: "Laura Solís · 2 cupos",
  },
];

/** Vista ilustrativa local: no consulta negocios, crea reservas ni procesa pagos. */
export default function VistaPreviaProducto() {
  const { activo } = useMovimientoMarca();
  const [vista, setVista] = useState<"cliente" | "empresa">("cliente");
  const [hora, setHora] = useState("09:00");

  return (
    <div className="relative mx-auto w-full max-w-[440px] lg:ml-auto lg:mr-0">
      <div className="mb-6 flex justify-center">
        <div
          role="group"
          aria-label="Seleccionar vista ilustrativa del producto"
          className="inline-flex rounded-full border border-white/15 bg-white/5 p-1 text-xs font-medium backdrop-blur-md"
        >
          {(
            [
              ["cliente", "Vista del cliente", Smartphone],
              ["empresa", "Tu panel", LayoutDashboard],
            ] as const
          ).map(([valor, etiqueta, Icono]) => {
            const seleccionada = vista === valor;
            return (
              <button
                key={valor}
                type="button"
                aria-pressed={seleccionada}
                onClick={() => setVista(valor)}
                className={`relative flex min-h-11 items-center gap-2 rounded-full px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 ${
                  seleccionada
                    ? "text-slate-900"
                    : "text-slate-300 hover:text-white"
                }`}
              >
                {seleccionada && (
                  <motion.span
                    layoutId={activo ? "vista-previa-tab" : undefined}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-white shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
                <Icono
                  className="relative z-10 h-3.5 w-3.5"
                  aria-hidden="true"
                />
                <span className="relative z-10">{etiqueta}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative rounded-[2rem] border border-white/20 bg-white/10 p-2.5 shadow-2xl shadow-black/25 backdrop-blur-sm transition-shadow duration-500 hover:border-white/30 hover:shadow-sky-950/40 sm:rounded-[2.5rem] sm:p-3">
        <div className="overflow-hidden rounded-[1.4rem] bg-white text-slate-900 sm:rounded-[1.8rem]">
          <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-5 py-3">
            <span aria-hidden="true" className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              <span className="h-2 w-2 rounded-full bg-slate-300" />
            </span>
            <span className="mx-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
              <Link2 className="h-3 w-3" aria-hidden="true" />
              {vista === "cliente"
                ? "Tu enlace de reservas"
                : "Tu espacio de trabajo"}
            </span>
          </div>

          <motion.div
            key={vista}
            initial={activo ? { opacity: 0, y: 6 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: activo ? 0.26 : 0,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {vista === "cliente" ? (
              <section aria-label="Ejemplo de perfil público de un negocio">
                <div className="relative h-36 w-full sm:h-40">
                  <Image
                    src={IMAGEN_PORTADA}
                    alt="Surf en una playa tropical, imagen ilustrativa de un servicio"
                    fill
                    sizes="(max-width: 640px) 90vw, 420px"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/15 to-black/25" />

                  <span className="absolute left-4 top-3.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-slate-700 shadow-xs backdrop-blur-sm">
                    Ejemplo de negocio
                  </span>

                  <div
                    aria-hidden="true"
                    className="absolute right-4 top-3.5 flex overflow-hidden rounded-full border border-white/50 bg-white/85 text-[10px] font-semibold shadow-xs backdrop-blur-sm"
                  >
                    <span className="bg-slate-900 px-2.5 py-1 text-white">
                      ES
                    </span>
                    <span className="px-2.5 py-1 text-slate-700">EN</span>
                  </div>
                </div>

                <div className="relative -mt-11 px-5 pb-2 sm:px-6">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-sky-100 shadow-lg">
                    <Image
                      src={IMAGEN_PORTADA}
                      alt=""
                      aria-hidden="true"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>

                  <div className="mt-3">
                    <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                      Pura Vida Surf
                    </h2>
                    <div
                      aria-hidden="true"
                      className="mt-1.5 h-1 w-12 rounded-full bg-gradient-to-r from-sky-600 to-emerald-500"
                    />
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">
                      Clases de surf frente al mar en Tamarindo.
                    </p>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      Servicios disponibles
                    </p>

                    <div className="group relative h-32 w-full overflow-hidden rounded-2xl shadow-sm sm:h-36">
                      <Image
                        src={IMAGEN_PORTADA}
                        alt=""
                        aria-hidden="true"
                        fill
                        sizes="(max-width: 640px) 90vw, 400px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4">
                        <p className="text-base font-semibold tracking-tight text-white">
                          Tu primera ola
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-xs font-medium text-white/90">
                            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                            90 min
                          </span>
                          <span className="rounded-full bg-gradient-to-br from-sky-600 to-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                            $45.00
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3">
                      <div
                        role="group"
                        aria-label="Horarios ilustrativos"
                        className="flex gap-2"
                      >
                        {HORAS.map((valor) => {
                          const activa = hora === valor;
                          return (
                            <button
                              key={valor}
                              type="button"
                              aria-pressed={activa}
                              onClick={() => setHora(valor)}
                              className={`vuki-focus relative min-h-9 flex-1 rounded-xl border px-2 text-xs font-semibold transition active:scale-[0.98] motion-reduce:transform-none ${
                                activa
                                  ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                              }`}
                            >
                              {valor}
                            </button>
                          );
                        })}
                      </div>
                      <p
                        aria-live="polite"
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-800"
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                          aria-hidden="true"
                        />
                        {hora} · Así verían tus clientes la disponibilidad
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section
                aria-label="Ejemplo del panel de empresa"
                className="min-h-[438px] bg-slate-50/50 p-5 sm:min-h-[454px] sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-display text-xl font-bold tracking-tight text-slate-900">
                        Calendario
                      </h2>
                      <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 rounded-full bg-sky-600"
                        />
                        Esta semana
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Pura Vida Surf · 7/10 cupos reservados
                    </p>
                  </div>

                  <span
                    aria-hidden="true"
                    className="inline-flex h-8 items-center gap-1 rounded-xl bg-slate-900 px-3 text-[11px] font-semibold text-white shadow-2xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Horario
                  </span>
                </div>

                {/* Tira de días */}
                <div
                  aria-hidden="true"
                  className="mt-4 grid grid-cols-5 gap-1.5 rounded-2xl border border-sky-100 bg-white p-2 text-center shadow-2xs"
                >
                  {DIAS_SEMANA.map((d) => (
                    <div
                      key={d.corto}
                      className={`flex flex-col items-center justify-center rounded-xl py-2 ${
                        d.esHoy
                          ? "bg-sky-600 text-white shadow-xs"
                          : d.pasado
                            ? "text-slate-400"
                            : "text-slate-700"
                      }`}
                    >
                      <span className="text-[10px] font-semibold uppercase">
                        {d.corto}
                      </span>
                      <span className="mt-0.5 font-display text-sm font-bold leading-none">
                        {d.num}
                      </span>
                      {d.esHoy ? (
                        <span className="mt-1 rounded-full bg-black/20 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                          Hoy
                        </span>
                      ) : (
                        <span
                          className={`mt-1.5 h-1.5 w-1.5 rounded-full ${
                            d.critico ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Tarjeta del día de Hoy */}
                <div className="relative mt-4 overflow-hidden rounded-2xl border-2 border-sky-600 bg-gradient-to-br from-sky-50/70 via-white to-white p-3.5 shadow-xs">
                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 to-emerald-500"
                  />

                  <div className="flex items-center justify-between">
                    <p className="font-display text-xs font-bold text-slate-900 sm:text-sm">
                      Miércoles 14 de agosto
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-900">
                      Hoy · 2 horarios
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    {SLOTS_EJEMPLO.map((s) => (
                      <div
                        key={s.id}
                        className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                            <Clock
                              className="h-3.5 w-3.5 text-slate-400"
                              aria-hidden="true"
                            />
                            {s.hora} · {s.servicio}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${s.badgeClase}`}
                          >
                            {s.badge}
                          </span>
                        </div>

                        <div
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/75"
                        >
                          <div
                            style={{ width: `${s.pct}%` }}
                            className={`h-full rounded-full ${s.barraClase}`}
                          />
                        </div>

                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600">
                          <span>{s.cliente}</span>
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                            Pagado
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}
          </motion.div>
          <div className="flex justify-center pb-2 pt-1">
            <MarcaReserva />
          </div>
        </div>
      </div>

      <motion.div
        aria-hidden="true"
        initial={false}
        animate={activo ? { y: [0, -5, 0] } : { y: 0 }}
        transition={
          activo
            ? { duration: 6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0 }
        }
        className="pointer-events-none absolute -right-8 top-48 hidden items-center gap-3 rounded-2xl border border-white/15 bg-slate-800/90 px-4 py-3 shadow-xl backdrop-blur-lg xl:flex"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
          <Check className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs font-semibold text-white">
            Todo en un mismo lugar
          </p>
          <p className="mt-0.5 text-[10px] text-slate-300">
            Tu marca. Tus experiencias.
          </p>
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-400" />
      </motion.div>
      <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
        Vista previa ilustrativa. Datos de ejemplo; no crea reservas ni cobros.
      </p>
    </div>
  );
}
