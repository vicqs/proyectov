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
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  Check,
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
          <div className="relative flex h-28 items-end justify-between overflow-hidden bg-gradient-to-br from-sky-100 via-cyan-50 to-emerald-100 p-5 sm:h-32 sm:px-6">
            <div className="relative z-10">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-sky-800">
                Ejemplo de negocio
              </span>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-900">
                Pura Vida Surf
              </p>
            </div>
            <Waves className="h-14 w-14 text-sky-600/50" strokeWidth={1.2} />
            <div className="absolute -right-8 -top-14 h-44 w-44 rounded-full border border-sky-300/40" />
          </div>
          <div className="p-5 sm:p-6">
            <p className="text-xs text-slate-500">
              Tamarindo, Costa Rica · Tu marca al frente.
            </p>
            <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <Waves className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Tu primera ola</p>
                <p className="mt-1 text-xs text-slate-500">
                  Clase de surf · 90 min
                </p>
              </div>
              <span className="text-sm font-bold text-sky-800">$45</span>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white">
              Explora las experiencias <ArrowUpRight className="h-4 w-4" />
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
        <div className="min-h-[330px] p-5 sm:min-h-[370px] sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Pura Vida Surf</p>
              <p className="mt-1 font-display text-2xl font-bold tracking-tight">
                Tu agenda, clara.
              </p>
            </div>
            <CalendarDays className="h-6 w-6 text-emerald-700" />
          </div>
          <p className="mb-4 mt-5 text-xs font-medium text-slate-600">
            Un día de experiencias · Ejemplo
          </p>
          <div className="space-y-3">
            {[
              [
                "09:00",
                "Clase de surf",
                "2 personas",
                "border-sky-500 bg-sky-50",
              ],
              [
                "11:00",
                "Surf en grupo",
                "4 personas",
                "border-emerald-500 bg-emerald-50",
              ],
              [
                "14:00",
                "Clase privada",
                "1 persona",
                "border-slate-400 bg-slate-50",
              ],
            ].map(([hora, servicio, personas, color]) => (
              <div
                key={hora}
                className={`flex items-center gap-4 rounded-xl border-l-[3px] px-4 py-3 ${color}`}
              >
                <span className="text-xs font-bold text-slate-700">{hora}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold">{servicio}</p>
                  <p className="mt-1 text-[10px] text-slate-600">{personas}</p>
                </div>
                <Check className="h-4 w-4 text-emerald-700" />
              </div>
            ))}
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
      behavior: "auto",
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
              <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" /> Sigue
              bajando. Todo se conecta.
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
                {ESCENAS.map(({ numero, titulo, acento }, indice) => (
                  <button
                    key={numero}
                    type="button"
                    onClick={() => irAEscena(indice)}
                    aria-label={`${numero}: ${titulo} ${acento}`}
                    aria-pressed={escena === indice}
                    className={`vuki-focus inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${escena === indice ? "border-white bg-white text-slate-900" : "border-white/25 text-slate-300 hover:bg-white/10"}`}
                  >
                    {numero}
                  </button>
                ))}
              </div>
              <TextoEscena indice={escena} />
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
