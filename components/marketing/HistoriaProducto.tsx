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
    <div className="overflow-hidden rounded-[1.6rem] border border-white/30 bg-white text-slate-900 shadow-2xl shadow-black/20 sm:rounded-[2rem]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">
        <VLogo showText className="h-6 w-6" wordmarkClassName="text-xl" />
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
        <div className="min-h-[330px] sm:min-h-[370px]">
          <div className="relative h-24 overflow-hidden bg-gradient-to-br from-sky-400 via-cyan-500 to-emerald-400 sm:h-28">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/15 to-black/15" />
            <span className="absolute left-5 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-xs">
              Ejemplo de negocio
            </span>
            <div className="absolute right-5 top-3 flex overflow-hidden rounded-full border border-white/50 bg-white/85 text-[9px] font-semibold shadow-xs">
              <span className="bg-slate-900 px-2 py-0.5 text-white">ES</span>
              <span className="px-2 py-0.5 text-slate-700">EN</span>
            </div>
          </div>
          <div className="relative -mt-9 px-5 pb-5 sm:px-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-br from-sky-500 to-emerald-500 text-white shadow-md">
              <Waves className="h-7 w-7" />
            </div>
            <p className="mt-2.5 font-display text-xl font-bold tracking-tight text-slate-900">
              Pura Vida Surf
            </p>
            <div className="mt-1.5 h-1 w-10 rounded-full bg-gradient-to-r from-sky-600 to-emerald-500" />
            <p className="mt-1.5 text-xs text-slate-500">
              Clases de surf y experiencias frente al mar en Tamarindo.
            </p>
            <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Servicios disponibles
            </p>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-sky-950 to-emerald-950 p-4 text-white shadow-sm">
              <Waves
                className="pointer-events-none absolute -right-3 -top-3 h-24 w-24 text-sky-400/15"
                strokeWidth={1.2}
              />
              <p className="relative text-sm font-semibold">Tu primera ola</p>
              <div className="relative mt-3 flex items-center justify-between">
                <span className="flex items-center gap-1 text-[11px] font-medium text-white/85">
                  <Clock className="h-3 w-3" /> 90 min
                </span>
                <span className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  $45.00
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : indice === 1 ? (
        <div className="min-h-[330px] p-5 sm:min-h-[370px] sm:p-6">
          <p className="text-xs font-medium text-sky-700">Tu primera ola</p>
          <p className="mt-2 font-display text-2xl font-bold tracking-tight">
            Encuentra tu momento.
          </p>
          <div className="mt-5 grid grid-cols-5 gap-2 text-center">
            {["Lun", "Mar", "Mié", "Jue", "Vie"].map((dia, i) => (
              <div
                key={dia}
                className={`rounded-xl py-3 text-[10px] ${i === 2 ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-500"}`}
              >
                {dia}
                <span className="mt-1 block text-lg font-semibold">
                  {12 + i}
                </span>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-5 text-xs font-medium text-slate-600">
            Horarios de ejemplo
          </p>
          <div className="grid grid-cols-3 gap-2">
            {["09:00", "11:00", "14:00"].map((hora, i) => (
              <span
                key={hora}
                className={`rounded-xl border py-3 text-center text-xs font-semibold ${i === 1 ? "border-sky-700 bg-sky-50 text-sky-800" : "border-slate-200 text-slate-600"}`}
              >
                {hora}
              </span>
            ))}
          </div>
          <p className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs font-medium text-emerald-800">
            <Check className="h-4 w-4 shrink-0" /> Una forma más clara de
            elegir.
          </p>
        </div>
      ) : (
        <div className="min-h-[330px] bg-slate-50/60 p-4 sm:min-h-[370px] sm:p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                Pura Vida Surf · Calendario
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-600" />
                  Esta semana
                </span>
                <span className="text-[11px] font-medium text-slate-600">
                  7/10 cupos (70%)
                </span>
              </div>
            </div>
            <CalendarDays className="h-5 w-5 text-sky-700" />
          </div>

          <div className="mt-3 rounded-2xl border border-sky-100 bg-white p-2 shadow-2xs">
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
                  className={`flex flex-col items-center rounded-xl py-1.5 text-[9px] ${
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

          <div className="relative mt-3 overflow-hidden rounded-2xl border-2 border-sky-600 bg-gradient-to-br from-sky-50/70 via-white to-white p-3 shadow-2xs">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-600 to-emerald-500" />
            <div className="flex items-center justify-between">
              <p className="font-display text-xs font-bold text-slate-900">
                Miércoles 14 · Hoy
              </p>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                2 horarios
              </span>
            </div>
            <div className="mt-2.5 space-y-2">
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
                  className="rounded-xl border border-slate-200/90 bg-white p-2.5"
                >
                  <div className="flex items-center justify-between gap-1 text-[11px]">
                    <span className="font-semibold text-slate-900">
                      {s.hora} · {s.servicio}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${s.badgeClase}`}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/75">
                    <div
                      style={{ width: s.pct }}
                      className={`h-full rounded-full ${s.barraClase}`}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-600">
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
        className={`flex items-center gap-2.5 text-xs font-medium ${escena.color}`}
      >
        <escena.icono className="h-4 w-4" aria-hidden="true" />
        {escena.etiqueta}
      </p>
      <h3 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-[-0.045em] sm:text-5xl lg:text-[clamp(2.5rem,4.2vw,4.25rem)]">
        {escena.titulo}
        <br />
        <span className={escena.color}>{escena.acento}</span>
      </h3>
      <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-200 sm:text-base">
        {escena.texto}
      </p>
      <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-white">
        <Check className={`h-4 w-4 ${escena.color}`} aria-hidden="true" />
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
    indice === 0 ? [0, 0, -65] : [70, 0, indice === 2 ? 0 : -65],
  );
  const rotate = useTransform(
    progreso,
    [inicio, centro, fin],
    [indice === 0 ? -3 : 5, 0, indice === 2 ? -1 : -4],
  );
  const scale = useTransform(
    progreso,
    [inicio, centro, fin],
    [0.93, 1, indice === 2 ? 1 : 0.95],
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

/** Tres escenas ligadas al scroll; móvil, movimiento reducido y sin JS usan tarjetas normales. */
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
  const orbita = useTransform(scrollYProgress, [0, 1], [-35, 100]);
  const anclado = activo && amplio;

  useEffect(() => {
    const media = window.matchMedia(
      "(min-width: 1024px) and (min-height: 760px)",
    );
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
        backgroundColor: anclado ? fondo : "#0f172a",
        height: anclado ? "310svh" : "auto",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <FondoMarca />
        <motion.div
          className="absolute -left-44 top-1/3 h-[500px] w-[500px] rounded-full border border-white/10"
          style={{ rotate: anclado ? orbita : 0, x: anclado ? orbita : 0 }}
        >
          <div className="absolute right-10 top-12 h-3 w-3 rounded-full bg-emerald-400" />
        </motion.div>
      </div>
      <div
        className={`relative mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 ${anclado ? "sticky top-20 flex h-[calc(100svh-80px)] flex-col justify-center py-8" : "py-16 sm:py-24"}`}
      >
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 lg:mb-12">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-200 sm:text-xs">
              Del primer clic a tu próximo día
            </p>
            <h2
              id="pasos-titulo"
              className="mt-3 font-display text-xl font-semibold tracking-tight sm:text-2xl"
            >
              De tu bio a tu agenda.
            </h2>
          </div>
          {anclado && (
            <p className="flex items-center gap-2 text-xs text-slate-300">
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
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1fr] xl:gap-24">
            <div className="min-w-0">
              <div
                className="mb-7 flex gap-2"
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
                      className={`vuki-focus relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                        activa
                          ? "border-white text-slate-900"
                          : "border-white/25 text-slate-300 hover:border-white/45 hover:bg-white/10"
                      }`}
                    >
                      {activa && (
                        <motion.span
                          layoutId={activo ? "historia-escena-pill" : undefined}
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
                className="mt-8 h-0.5 w-40 overflow-hidden rounded-full bg-white/15"
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
                className="relative mx-auto h-[430px] max-w-[460px] [perspective:1400px]"
                aria-hidden="true"
              >
                {ESCENAS.map((_, indice) => (
                  <PlanoProducto
                    key={indice}
                    indice={indice}
                    progreso={scrollYProgress}
                  />
                ))}
                <div className="absolute -right-5 -top-6 flex items-center gap-2 rounded-full border border-white/20 bg-slate-900 px-4 py-3 text-xs text-slate-200 shadow-xl">
                  <MousePointer2 className="h-3.5 w-3.5 text-emerald-300" /> Tu
                  marca. A cada paso.
                </div>
              </div>
              <p className="mx-auto mt-5 max-w-sm text-center text-[11px] leading-relaxed text-slate-300">
                Recorrido ilustrativo. Datos de ejemplo; no crea reservas ni
                cobros.
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-16 sm:space-y-20">
            {ESCENAS.map(({ numero }, indice) => (
              <li
                key={numero}
                className="grid items-center gap-7 md:grid-cols-2 md:gap-12"
              >
                <div>
                  <span className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-xs font-semibold text-slate-200">
                    {numero}
                  </span>
                  <TextoEscena indice={indice} />
                </div>
                <div
                  className="mx-auto w-full max-w-[460px]"
                  aria-hidden="true"
                >
                  <VistaEscena indice={indice} />
                </div>
              </li>
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
