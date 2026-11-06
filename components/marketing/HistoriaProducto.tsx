"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import {
  ArrowDown,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Compass,
  Link2,
  MousePointer2,
  Waves,
} from "lucide-react";
import VLogo from "../VLogo";
import { TRAZOS_VUKI } from "../../lib/marca";
import { FondoMarca, useMovimientoMarca } from "./MovimientoMarca";

const ESCENAS = [
  {
    numero: "01",
    icono: Link2,
    etiqueta: "Todo empieza con tu enlace",
    titulo: "Tu mundo.",
    acento: "Un solo link.",
    texto:
      "Tu nombre, tus fotos y tus experiencias. Un espacio propio que puedes compartir donde ya están tus clientes.",
    detalle: "De tu bio a todas tus experiencias.",
    color: "text-sky-300",
  },
  {
    numero: "02",
    icono: Compass,
    etiqueta: "Menos mensajes de ida y vuelta",
    titulo: "Ellos eligen.",
    acento: "Todo fluye.",
    texto:
      "Tus clientes exploran tus servicios y encuentran un horario disponible. La próxima aventura empieza con una decisión sencilla.",
    detalle: "Servicios, horarios y cupos más claros.",
    color: "text-cyan-200",
  },
  {
    numero: "03",
    icono: CalendarCheck,
    etiqueta: "Tu operación, conectada",
    titulo: "Más claridad.",
    acento: "Más aventura.",
    texto:
      "Al otro lado del enlace está tu panel. Consulta tus reservas y organiza tu agenda sin perder de vista lo que importa: tus experiencias.",
    detalle: "Tú llevas el control de tu día.",
    color: "text-emerald-300",
  },
] as const;

/** Ilustraciones originales: nunca consultan disponibilidad ni generan transacciones. */
function VistaEscena({ indice }: { indice: number }) {
  return (
    <div className="overflow-hidden rounded-[1.4rem] border border-white/30 bg-white text-slate-900 shadow-2xl shadow-black/20 sm:rounded-[2rem]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5 sm:px-6 sm:py-4">
        <VLogo
          showText
          className="h-5 w-5 sm:h-6 sm:w-6"
          wordmarkClassName="text-lg sm:text-xl"
        />
        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
          {indice === 2 ? (
            <CalendarDays className="h-3 w-3" />
          ) : (
            <Link2 className="h-3 w-3" />
          )}
          {indice === 2 ? "Tu panel" : "Tu enlace de reservas"}
        </span>
      </div>

      {indice === 0 ? (
        <div className="min-h-[250px] sm:min-h-[310px] lg:min-h-[370px]">
          <div className="relative h-16 overflow-hidden bg-gradient-to-br from-sky-400 via-cyan-500 to-emerald-400 sm:h-24 lg:h-28">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/15 to-black/15" />
            <span className="absolute left-4 top-2.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs sm:left-5 sm:top-3">
              Ejemplo de negocio
            </span>
            <div className="absolute right-4 top-2.5 flex overflow-hidden rounded-full border border-white/50 bg-white/85 text-[9px] font-semibold shadow-xs sm:right-5 sm:top-3">
              <span className="bg-slate-900 px-2 py-0.5 text-white">ES</span>
              <span className="px-2 py-0.5 text-slate-700">EN</span>
            </div>
          </div>
          <div className="relative -mt-7 px-4 pb-3.5 sm:-mt-9 sm:px-6 sm:pb-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md sm:h-14 sm:w-14">
              <Waves className="h-5 w-5 sm:h-7 sm:w-7" />
            </div>
            <p className="mt-1.5 font-display text-lg font-bold tracking-tight text-slate-900 sm:mt-2.5 sm:text-xl">
              Pura Vida Surf
            </p>
            <div className="mt-1 h-1 w-10 rounded-full bg-gradient-to-r from-sky-600 to-emerald-500 sm:mt-1.5" />
            <p className="mt-1 text-[11px] text-slate-500 sm:mt-1.5 sm:text-xs">
              Clases de surf y experiencias frente al mar en Tamarindo.
            </p>
            <p className="mb-1.5 mt-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500 sm:mb-2 sm:mt-4">
              Servicios disponibles
            </p>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-emerald-950 p-3 text-white shadow-sm sm:p-4">
              <Waves
                className="pointer-events-none absolute -right-3 -top-3 h-20 w-20 text-sky-400/15 sm:h-24 sm:w-24"
                strokeWidth={1.2}
              />
              <p className="relative text-xs font-semibold sm:text-sm">
                Tu primera ola
              </p>
              <div className="relative mt-2 flex items-center justify-between sm:mt-3">
                <span className="flex items-center gap-1 text-[11px] font-medium text-white/85">
                  <Clock className="h-3 w-3" /> 90 min
                </span>
                <span className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm sm:px-3 sm:py-1 sm:text-xs">
                  $45.00
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : indice === 1 ? (
        <div className="min-h-[250px] p-3.5 sm:min-h-[310px] sm:p-5 lg:min-h-[370px] lg:p-6">
          <p className="text-[11px] font-medium text-sky-700 sm:text-xs">
            Tu primera ola
          </p>
          <p className="mt-1 font-display text-lg font-bold tracking-tight sm:mt-2 sm:text-2xl">
            Encuentra tu momento.
          </p>
          <div className="mt-3 grid grid-cols-5 gap-1.5 text-center sm:mt-5 sm:gap-2">
            {["Lun", "Mar", "Mié", "Jue", "Vie"].map((dia, i) => (
              <div
                key={dia}
                className={`rounded-xl py-2 text-[10px] sm:py-3 ${i === 2 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"}`}
              >
                {dia}
                <span className="mt-0.5 block text-sm font-semibold sm:mt-1 sm:text-lg">
                  {12 + i}
                </span>
              </div>
            ))}
          </div>
          <p className="mb-1.5 mt-3 text-[11px] font-medium text-slate-600 sm:mb-2 sm:mt-5 sm:text-xs">
            Horarios de ejemplo
          </p>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {["09:00", "11:00", "14:00"].map((hora, i) => (
              <span
                key={hora}
                className={`rounded-xl border py-2 text-center text-xs font-semibold sm:py-3 ${i === 1 ? "border-sky-700 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600"}`}
              >
                {hora}
              </span>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-medium text-emerald-800 sm:mt-5 sm:py-3 sm:text-xs">
            <Check className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Una forma
            más clara de elegir.
          </p>
        </div>
      ) : (
        <div className="min-h-[250px] bg-slate-50/60 p-3 sm:min-h-[310px] sm:p-4 lg:min-h-[370px] lg:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                Pura Vida Surf · Calendario
              </p>
              <div className="mt-0.5 flex flex-wrap items-center gap-1.5 sm:mt-1">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                  Esta semana
                </span>
                <span className="text-[10px] font-medium text-slate-600 sm:text-[11px]">
                  7/10 cupos (70%)
                </span>
              </div>
            </div>
            <CalendarDays className="h-4 w-4 text-sky-700 sm:h-5 sm:w-5" />
          </div>

          <div className="mt-2 rounded-2xl border border-sky-100 bg-white p-1.5 shadow-2xs sm:mt-3 sm:p-2">
            <div className="grid grid-cols-5 gap-1 text-center">
              {[
                { d: "Lun", n: 12, c: 2 },
                { d: "Mar", n: 13, c: 2 },
                { d: "Mié", n: 14, c: 2, hoy: true },
                { d: "Jue", n: 15, c: 2 },
                { d: "Vie", n: 16, c: 3 },
              ].map((item) => (
                <div
                  key={item.d}
                  className={`flex flex-col items-center rounded-xl py-1 text-[9px] sm:py-1.5 ${
                    item.hoy
                      ? "bg-sky-600 text-white shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  <span className="font-semibold uppercase">{item.d}</span>
                  <span className="mt-0.5 font-display text-xs font-bold">
                    {item.n}
                  </span>
                  {item.hoy ? (
                    <span className="mt-0.5 rounded-full bg-black/20 px-1.5 py-0.5 text-[8px] font-bold uppercase">
                      Hoy
                    </span>
                  ) : (
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="relative mt-2 overflow-hidden rounded-2xl border-2 border-sky-600 bg-gradient-to-br from-sky-50/70 via-white to-white p-2.5 shadow-2xs sm:mt-3 sm:p-3">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 to-emerald-500" />
            <div className="flex items-center justify-between">
              <p className="font-display text-[11px] font-bold text-slate-900 sm:text-xs">
                Miércoles 14 · Hoy
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 sm:text-[10px]">
                2 horarios
              </span>
            </div>
            <div className="mt-1.5 space-y-1.5 sm:mt-2.5 sm:space-y-2">
              {[
                {
                  hora: "9:00 a.m.",
                  servicio: "Tu primera ola",
                  badge: "Últimos 1 · 5/6",
                  badgeClase: "bg-amber-100 text-amber-800",
                  barraClase: "bg-amber-500",
                  pct: "83%",
                  cliente: "Sofía Vargas · 3 cupos",
                },
                {
                  hora: "2:00 p.m.",
                  servicio: "Surf al atardecer",
                  badge: "2/4 cupos",
                  badgeClase: "bg-emerald-100 text-emerald-800",
                  barraClase: "bg-emerald-500",
                  pct: "50%",
                  cliente: "Laura Solís · 2 cupos",
                },
              ].map((s) => (
                <div
                  key={s.hora}
                  className="rounded-xl border border-slate-200/90 bg-white p-2 sm:p-2.5"
                >
                  <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px]">
                    <span className="font-semibold text-slate-900">
                      {s.hora} · {s.servicio}
                    </span>
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold sm:px-2 ${s.badgeClase}`}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/75 sm:mt-1.5">
                    <div
                      style={{ width: s.pct }}
                      className={`h-full rounded-full ${s.barraClase}`}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[9px] text-slate-600 sm:mt-1.5 sm:text-[10px]">
                    <span>{s.cliente}</span>
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                      Pagado
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TextoEscena({ indice }: { indice: number }) {
  const escena = ESCENAS[indice];
  return (
    <div>
      <p
        className={`flex items-center gap-2 text-[11px] font-medium sm:gap-2.5 sm:text-xs ${escena.color}`}
      >
        <escena.icono className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
        {escena.etiqueta}
      </p>
      <h3 className="mt-1.5 font-display text-2xl font-bold leading-[1.08] tracking-[-0.045em] sm:mt-4 sm:text-4xl lg:mt-5 lg:text-[clamp(2.5rem,4.2vw,4.25rem)]">
        {escena.titulo}{" "}
        <br className="hidden sm:block" />
        <span className={escena.color}>{escena.acento}</span>
      </h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-200 sm:mt-3.5 sm:text-sm lg:mt-5 lg:text-base">
        {escena.texto}
      </p>
      <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-white sm:mt-4 sm:gap-2 sm:text-xs lg:mt-6">
        <Check
          className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${escena.color}`}
          aria-hidden="true"
        />
        {escena.detalle}
      </p>
    </div>
  );
}

function PlanoProducto({
  indice,
  progreso,
}: {
  indice: number;
  progreso: MotionValue<number>;
}) {
  const inicio = indice === 0 ? 0 : indice === 1 ? 0.27 : 0.64;
  const centro = indice === 0 ? 0.12 : indice === 1 ? 0.44 : 0.8;
  const fin = indice === 0 ? 0.39 : indice === 1 ? 0.76 : 1;
  const opacity = useTransform(
    progreso,
    [inicio, inicio + 0.08, fin - 0.08, fin],
    indice === 0 ? [1, 1, 1, 0] : indice === 2 ? [0, 1, 1, 1] : [0, 1, 1, 0],
  );
  const y = useTransform(
    progreso,
    [inicio, centro, fin],
    indice === 0 ? [0, 0, -40] : [45, 0, indice === 2 ? 0 : -40],
  );
  const rotate = useTransform(
    progreso,
    [inicio, centro, fin],
    [indice === 0 ? -2 : 4, 0, indice === 2 ? -1 : -3],
  );
  const scale = useTransform(
    progreso,
    [inicio, centro, fin],
    [0.94, 1, indice === 2 ? 1 : 0.96],
  );

  return (
    <motion.div
      data-plano-producto={indice}
      className="absolute inset-0"
      style={{ opacity, y, rotate, scale }}
    >
      <VistaEscena indice={indice} />
    </motion.div>
  );
}

/** Tres escenas ligadas al scroll en desktop, tablet y móvil; movimiento reducido y sin JS usan tarjetas normales. */
export default function HistoriaProducto() {
  const { activo } = useMovimientoMarca();
  const ref = useRef<HTMLElement>(null);
  const [amplio, setAmplio] = useState(false);
  const [escena, setEscena] = useState(0);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 80px", "end end"],
  });
  const fondo = useTransform(
    scrollYProgress,
    [0, 0.48, 1],
    ["#0f172a", "#083344", "#052e2b"],
  );
  const orbita = useTransform(scrollYProgress, [0, 1], [-28, 72]);
  const giroOrbita = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const anclado = activo && amplio;

  useEffect(() => {
    const media = window.matchMedia("(min-height: 540px)");
    const actualizar = () => setAmplio(media.matches);
    actualizar();
    media.addEventListener("change", actualizar);
    return () => media.removeEventListener("change", actualizar);
  }, []);

  useMotionValueEvent(scrollYProgress, "change", (valor) => {
    const siguiente = valor < 0.34 ? 0 : valor < 0.71 ? 1 : 2;
    setEscena((actual) => (actual === siguiente ? actual : siguiente));
  });

  function irAEscena(indice: number) {
    if (!ref.current) return;
    const rango = ref.current.offsetHeight - window.innerHeight + 80;
    const posiciones = [0.12, 0.5, 0.88];
    window.scrollTo({
      top:
        ref.current.getBoundingClientRect().top +
        window.scrollY -
        80 +
        rango * posiciones[indice],
      behavior: activo ? "smooth" : "auto",
    });
  }

  return (
    <motion.section
      ref={ref}
      id="como-funciona"
      aria-labelledby="pasos-titulo"
      data-historia-producto
      data-modo={anclado ? "anclado" : "lectura"}
      className="relative isolate scroll-mt-20 bg-slate-900 text-white"
      style={{
        backgroundColor: activo ? fondo : "#0f172a",
        height: anclado ? "290svh" : "auto",
      }}
    >
      <div
        className={`pointer-events-none overflow-hidden ${
          anclado
            ? "sticky top-20 -mb-[calc(100svh-80px)] h-[calc(100svh-80px)] w-full"
            : "absolute inset-0"
        }`}
        aria-hidden="true"
      >
        <FondoMarca />
        <motion.svg
          viewBox="0 0 540 540"
          fill="none"
          className="absolute -left-48 top-1/4 h-[520px] w-[520px] opacity-25"
          style={{
            rotate: activo ? giroOrbita : 0,
            x: activo ? orbita : 0,
          }}
        >
          <circle
            cx="290"
            cy="310"
            r="210"
            stroke="#38bdf8"
            strokeOpacity="0.18"
            strokeWidth="0.8"
          />
          <g transform="translate(88 85) scale(0.58)">
            <path
              d={TRAZOS_VUKI.izquierdo}
              stroke="#38bdf8"
              strokeOpacity="0.22"
              strokeWidth="1.5"
            />
            <path
              d={TRAZOS_VUKI.derecho}
              stroke="#38bdf8"
              strokeOpacity="0.25"
              strokeWidth="1.5"
            />
            <path
              d={TRAZOS_VUKI.arco}
              stroke="#10b981"
              strokeOpacity="0.3"
              strokeWidth="1.6"
            />
          </g>
          <circle cx="442" cy="196" r="4" fill="#10b981" fillOpacity="0.75" />
        </motion.svg>
      </div>
      <div
        className={`relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 ${
          anclado
            ? "sticky top-20 flex h-[calc(100svh-80px)] flex-col justify-center overflow-hidden py-3 sm:py-6 lg:py-8"
            : "overflow-hidden py-16 sm:py-24"
        }`}
      >
        <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2 sm:mb-6 sm:gap-4 lg:mb-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200 sm:text-xs">
              Del primer clic a tu próximo día
            </p>
            <h2
              id="pasos-titulo"
              className="mt-1 font-display text-lg font-semibold tracking-tight sm:mt-2 sm:text-2xl"
            >
              De tu bio a tu agenda.
            </h2>
          </div>
          {activo && (
            <p className="flex items-center gap-1.5 text-[11px] text-slate-300 sm:gap-2 sm:text-xs">
              <motion.span
                aria-hidden="true"
                initial={false}
                animate={activo ? { y: [0, 3, 0] } : { y: 0 }}
                transition={
                  activo
                    ? { duration: 2.2, repeat: Infinity, ease: "easeInOut" }
                    : { duration: 0 }
                }
                className="inline-flex"
              >
                <ArrowDown className="h-3.5 w-3.5 text-emerald-300" />
              </motion.span>{" "}
              Sigue bajando. Todo se conecta.
            </p>
          )}
        </div>

        {anclado ? (
          <div className="grid items-center gap-3 sm:gap-6 md:grid-cols-[0.95fr_1.05fr] md:gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14 xl:gap-24">
            <div className="min-w-0">
              <div className="mb-2.5 flex items-center justify-between gap-4 sm:mb-4 md:mb-6 md:block">
                <div
                  className="flex gap-2"
                  role="group"
                  aria-label="Escenas de cómo funciona vuki"
                >
                  {ESCENAS.map(({ numero, titulo, acento }, indice) => {
                    const activa = escena === indice;
                    return (
                      <button
                        key={numero}
                        type="button"
                        onClick={() => irAEscena(indice)}
                        aria-label={`${numero}: ${titulo} ${acento}`}
                        aria-pressed={activa}
                        className={`vuki-focus relative inline-flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors sm:min-h-11 sm:min-w-11 ${
                          activa
                            ? "border-white text-slate-900"
                            : "border-white/25 text-slate-300 hover:border-white/45 hover:bg-white/10"
                        }`}
                      >
                        {activa && (
                          <motion.span
                            layoutId={
                              activo ? "historia-escena-pill" : undefined
                            }
                            aria-hidden="true"
                            className="absolute inset-0 rounded-full bg-white shadow-sm"
                            transition={{
                              type: "spring",
                              stiffness: 360,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative z-10">{numero}</span>
                      </button>
                    );
                  })}
                </div>
                <div
                  className="h-0.5 w-28 overflow-hidden rounded-full bg-white/15 sm:w-36 md:hidden"
                  aria-hidden="true"
                >
                  <motion.div
                    className="h-full origin-left bg-gradient-to-r from-sky-300 to-emerald-300"
                    style={{ scaleX: scrollYProgress }}
                  />
                </div>
              </div>
              <motion.div
                key={escena}
                initial={activo ? { opacity: 0, y: 12 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: activo ? 0.35 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <TextoEscena indice={escena} />
              </motion.div>
              <div
                className="mt-7 hidden h-0.5 w-40 overflow-hidden rounded-full bg-white/15 md:block"
                aria-hidden="true"
              >
                <motion.div
                  className="h-full origin-left bg-gradient-to-r from-sky-300 to-emerald-300"
                  style={{ scaleX: scrollYProgress }}
                />
              </div>
            </div>
            <div>
              <div
                className="relative mx-auto h-[290px] w-full max-w-[460px] [perspective:1400px] sm:h-[345px] md:h-[385px] lg:h-[430px]"
                aria-hidden="true"
              >
                {ESCENAS.map((_, indice) => (
                  <PlanoProducto
                    key={indice}
                    indice={indice}
                    progreso={scrollYProgress}
                  />
                ))}
                <div className="absolute right-2 -top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-900 px-3 py-1.5 text-[10px] text-slate-200 shadow-xl sm:-right-3 sm:-top-5 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-xs lg:-right-5 lg:-top-6 lg:py-3">
                  <MousePointer2 className="h-3 w-3 text-emerald-300 sm:h-3.5 sm:w-3.5" />{" "}
                  Tu marca. A cada paso.
                </div>
              </div>
              <p className="mx-auto mt-2 max-w-sm text-center text-[10px] leading-relaxed text-slate-300 sm:mt-4 sm:text-[11px] lg:mt-5">
                Recorrido ilustrativo. Datos de ejemplo; no crea reservas ni
                cobros.
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-16 sm:space-y-20">
            {ESCENAS.map(({ numero }, indice) => (
              <motion.li
                key={numero}
                initial={false}
                whileInView={
                  activo ? { y: [24, 0], opacity: [0.3, 1] } : { y: 0, opacity: 1 }
                }
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: activo ? 0.65 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid items-center gap-7 md:grid-cols-2 md:gap-12"
              >
                <div>
                  <span className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-xs font-semibold text-slate-200">
                    {numero}
                  </span>
                  <TextoEscena indice={indice} />
                </div>
                <motion.div
                  className="mx-auto w-full max-w-[460px]"
                  aria-hidden="true"
                  initial={false}
                  whileInView={
                    activo
                      ? { scale: [0.95, 1], rotate: [indice % 2 === 0 ? -2 : 2, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{
                    duration: activo ? 0.65 : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <VistaEscena indice={indice} />
                </motion.div>
              </motion.li>
            ))}
          </ol>
        )}
        {!anclado && (
          <p className="mt-10 text-center text-[11px] leading-relaxed text-slate-300">
            Recorrido ilustrativo. Datos de ejemplo; no crea reservas ni cobros.
          </p>
        )}
      </div>
    </motion.section>
  );
}
