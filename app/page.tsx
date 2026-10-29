import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CalendarOff,
  Check,
  ClipboardList,
  Clock,
  Compass,
  Download,
  Globe2,
  Home,
  LifeBuoy,
  LineChart,
  Link2,
  ListChecks,
  Palette,
  Plus,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import VLogo from "../components/VLogo";
import VistaPreviaProducto from "../components/marketing/VistaPreviaProducto";
import HistoriaProducto from "../components/marketing/HistoriaProducto";
import {
  Aparecer,
  FondoMarca,
  MovimientoMarca,
  ProgresoPagina,
} from "../components/marketing/MovimientoMarca";

const VENTAJAS = [
  {
    icono: Link2,
    numero: "01",
    titulo: "Un link. Todas tus experiencias.",
    texto:
      "Tu perfil bilingüe (ES/EN) con fotos, precios y botón de WhatsApp, listo para compartir en Instagram o por chat.",
    etiqueta: "Tu nuevo link en bio",
    estilo: "bg-sky-50 text-sky-700",
  },
  {
    icono: CalendarDays,
    numero: "02",
    titulo: "Una agenda que sí se entiende.",
    texto:
      "Calendario semanal con cupos en tiempo real, bloqueos por fecha y registro de reservas en línea o manuales.",
    etiqueta: "Menos trabajo manual",
    estilo: "bg-emerald-50 text-emerald-800",
  },
  {
    icono: LineChart,
    numero: "03",
    titulo: "Finanzas listas para Hacienda.",
    texto:
      "0% comisión de vuki, código CABYS e IVA por servicio, control de facturas (FE/TE) y exportación CSV para la D-104.",
    etiqueta: "Contabilidad al día",
    estilo: "bg-slate-100 text-slate-700",
  },
];

const SECCIONES_PANEL = [
  { icono: Home, etiqueta: "Inicio" },
  { icono: ListChecks, etiqueta: "Mis Servicios" },
  { icono: Clock, etiqueta: "Horarios" },
  { icono: CalendarDays, etiqueta: "Calendario" },
  { icono: CalendarOff, etiqueta: "Agenda / Bloqueos" },
  { icono: ClipboardList, etiqueta: "Reservas" },
  { icono: LineChart, etiqueta: "Finanzas y Hacienda" },
  { icono: Palette, etiqueta: "Personalización" },
  { icono: LifeBuoy, etiqueta: "Soporte" },
];

const PREGUNTAS = [
  {
    pregunta: "¿Para qué negocios está pensado vuki?",
    respuesta:
      "Para pymes turísticas de Costa Rica: escuelas de surf, guías, operadores de tours y experiencias que buscan organizar servicios, agenda y finanzas en un solo lugar.",
  },
  {
    pregunta: "¿Cómo me ayuda con el Ministerio de Hacienda?",
    respuesta:
      "Configuras CABYS e IVA por servicio, registras el consecutivo de Factura o Tiquete Electrónico (FE/TE) y descargas el CSV con tipo de cambio BCCR listo para tu Declaración D-104.",
  },
  {
    pregunta: "¿vuki cobra comisión por reserva?",
    respuesta:
      "No. vuki cobra 0% de comisión por reserva y también te permite registrar pagos manuales (SINPE Móvil, efectivo o transferencia) sin costo adicional.",
  },
  {
    pregunta: "¿Puedo personalizar mi marca y bloquear fechas?",
    respuesta:
      "Sí. Conservas tu logo, portada y colores en un enlace bilingüe (ES/EN), y puedes bloquear días u horas por clima o descanso sin borrar tus horarios.",
  },
];

export default function HomePage() {
  return (
    <MovimientoMarca>
      <a
        href="#contenido"
        className="sr-only z-50 rounded-xl bg-white px-4 py-3 font-medium text-slate-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-900/95 text-white backdrop-blur-xl">
        <nav
          aria-label="Navegación principal"
          className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-12"
        >
          <Link
            href="/"
            aria-label="vuki · inicio"
            className="vuki-focus rounded-xl transition-opacity hover:opacity-90"
          >
            <VLogo
              showText
              tone="light"
              className="h-9 w-9"
              wordmarkClassName="text-3xl"
            />
          </Link>
          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a
              className="vuki-focus relative rounded py-3 transition hover:text-white after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-400 after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
              href="#caracteristicas"
            >
              Características
            </a>
            <a
              className="vuki-focus relative rounded py-3 transition hover:text-white after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-400 after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
              href="#como-funciona"
            >
              Cómo funciona
            </a>
            <a
              className="vuki-focus relative rounded py-3 transition hover:text-white after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-400 after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
              href="#planes"
            >
              Suscripción
            </a>
          </div>
          <Link
            href="/login"
            className="vuki-focus group inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-sky-50 sm:px-5"
          >
            Iniciar sesión
            <ArrowUpRight
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
              aria-hidden="true"
            />
          </Link>
        </nav>
        <ProgresoPagina />
      </header>

      <main id="contenido">
        <section
          aria-labelledby="hero-titulo"
          className="relative isolate overflow-hidden bg-slate-900 text-white"
        >
          <FondoMarca className="-z-10" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-16 pt-14 sm:px-8 sm:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:px-12 lg:pb-24 lg:pt-20">
            <Aparecer className="max-w-xl">
              <p className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/20 bg-emerald-400/5 px-3.5 py-2 text-[11px] font-medium text-emerald-200 backdrop-blur-sm sm:text-xs">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Creado para el turismo de Costa Rica
              </p>
              <h1
                id="hero-titulo"
                className="mt-7 font-display text-[2.85rem] font-bold leading-[1.06] tracking-[-0.05em] sm:text-6xl lg:text-[clamp(3.5rem,5.1vw,4.6rem)]"
              >
                Tu agenda y tus reservas,
                <br className="hidden sm:block" />{" "}
                <span className="text-emerald-400">en un solo link.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-slate-300 sm:text-lg">
                Convierte el «info, porfa» en una experiencia organizada.
                Comparte tus servicios, controla tus cupos y lleva tus finanzas
                al día. Sin enredos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="group inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition duration-200 hover:-translate-y-0.5 hover:bg-sky-50 hover:shadow-xl hover:shadow-sky-500/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 motion-reduce:transform-none"
                >
                  Entrar a vuki
                  <ArrowUpRight
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </Link>
                <a
                  href="#como-funciona"
                  className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                >
                  Ver cómo funciona
                  <ArrowDown
                    className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:transform-none"
                    aria-hidden="true"
                  />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  Enlace propio (ES/EN)
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  0% comisión vuki
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  Listo para Hacienda
                </span>
              </div>
            </Aparecer>
            <Aparecer retraso={0.12}>
              <VistaPreviaProducto />
            </Aparecer>
          </div>
          <div className="border-t border-white/10 bg-slate-950/15">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-8 gap-y-4 px-5 py-6 text-xs text-slate-300 sm:gap-x-12 sm:px-8 lg:justify-between lg:px-12">
              <span className="text-slate-400">
                Grandes experiencias. Negocios locales.
              </span>
              <span className="flex items-center gap-2 transition-colors hover:text-white">
                <Waves className="h-4 w-4 text-sky-300" aria-hidden="true" />
                Escuelas de surf
              </span>
              <span className="flex items-center gap-2 transition-colors hover:text-white">
                <Compass className="h-4 w-4 text-sky-300" aria-hidden="true" />
                Tours y aventura
              </span>
              <span className="flex items-center gap-2 transition-colors hover:text-white">
                <Globe2 className="h-4 w-4 text-sky-300" aria-hidden="true" />
                Guías y anfitriones
              </span>
            </div>
          </div>
        </section>

        <HistoriaProducto />

        <section
          id="caracteristicas"
          aria-labelledby="ventajas-titulo"
          className="relative isolate overflow-hidden scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <FondoMarca tono="claro" className="-z-10" />
          <div className="mx-auto max-w-6xl">
            <Aparecer className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Menos fricción, más vuki
              </p>
              <h2
                id="ventajas-titulo"
                className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
              >
                Tu día ya tiene suficiente aventura.
                <span className="text-slate-500">
                  {" "}
                  Organizarlo no debería ser otra.
                </span>
              </h2>
            </Aparecer>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {VENTAJAS.map(
                (
                  { icono: Icono, numero, titulo, texto, etiqueta, estilo },
                  indice,
                ) => (
                  <Aparecer
                    key={numero}
                    retraso={indice * 0.09}
                    className="h-full"
                  >
                    <article className="group flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-sky-900/[0.03] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl hover:shadow-sky-900/[0.06] motion-reduce:transform-none motion-reduce:transition-none sm:p-7">
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none ${estilo}`}
                        >
                          <Icono className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <span
                          aria-hidden="true"
                          className="font-display text-sm font-semibold text-slate-400 transition-colors group-hover:text-sky-600"
                        >
                          {numero}
                        </span>
                      </div>
                      <h3 className="mt-7 font-display text-xl font-bold leading-snug tracking-tight text-slate-900">
                        {titulo}
                      </h3>
                      <p className="mb-7 mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                        {texto}
                      </p>
                      <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                        <Check
                          className="h-3.5 w-3.5 text-emerald-600"
                          aria-hidden="true"
                        />
                        {etiqueta}
                      </p>
                    </article>
                  </Aparecer>
                ),
              )}
            </div>

            {/* Tira minimalista con todas las secciones del menú de empresa */}
            <Aparecer retraso={0.18} className="mt-12">
              <div className="rounded-3xl border border-slate-200/80 bg-slate-50/70 px-5 py-5 sm:px-7">
                <p className="text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Todo incluido en tu menú de empresa
                </p>
                <ul className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
                  {SECCIONES_PANEL.map(({ icono: Icono, etiqueta }) => (
                    <li
                      key={etiqueta}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-sky-200 hover:text-slate-900"
                    >
                      <Icono
                        className="h-3.5 w-3.5 text-sky-600"
                        aria-hidden="true"
                      />
                      {etiqueta}
                    </li>
                  ))}
                </ul>
              </div>
            </Aparecer>
          </div>
        </section>

        <section
          aria-labelledby="confianza-titulo"
          className="relative isolate overflow-hidden bg-slate-900 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12"
        >
          <FondoMarca className="-z-10" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Aparecer className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.04] p-8 text-white shadow-2xl shadow-black/10 backdrop-blur-sm transition-colors duration-300 hover:border-white/25 sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <ShieldCheck
                    className="h-9 w-9 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    CSV D-104 · Hacienda
                  </span>
                </div>
                <p className="mt-7 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Tu negocio al frente.
                  <br />
                  <span className="text-sky-300">Tus cuentas en orden.</span>
                </p>
                <p className="mt-4 text-sm leading-relaxed text-slate-300">
                  Tu marca es la protagonista ante tus clientes, y por dentro
                  tienes tus reservas y números listos para declarar sin estrés.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {[
                    "0% comisión vuki",
                    "CABYS e IVA",
                    "Control FE / TE",
                    "Tipo de cambio BCCR",
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-7 flex items-center gap-3 border-t border-white/10 pt-6">
                  <VLogo className="h-10 w-10" />
                  <span className="text-xs leading-relaxed text-slate-300">
                    Tecnología para acompañarte.
                    <br />
                    <span className="font-medium text-white">
                      El protagonismo sigue siendo tuyo.
                    </span>
                  </span>
                </div>
              </div>
            </Aparecer>

            <Aparecer retraso={0.12}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                Diseñado para tu día a día
              </p>
              <h2
                id="confianza-titulo"
                className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                El control se queda contigo.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-slate-300">
                Una plataforma directa para operar tu negocio turístico en Costa
                Rica.
              </p>
              <ul className="mt-7 space-y-5">
                {[
                  [
                    "Tu identidad intacta",
                    "Logo, portada, colores, WhatsApp y perfil público en español e inglés.",
                  ],
                  [
                    "Agenda y reservas sin fricción",
                    "Horarios, cupos, bloqueos por fecha y registro de pagos por SINPE o efectivo.",
                  ],
                  [
                    "Finanzas listas para Hacienda",
                    "Desglose de IVA, código CABYS, consecutivos FE/TE y exportación CSV para la D-104.",
                  ],
                ].map(([titulo, texto]) => (
                  <li key={titulo} className="flex gap-3.5">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-300/15">
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {titulo}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-300">
                        {texto}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </Aparecer>
          </div>
        </section>

        <section
          id="planes"
          aria-labelledby="planes-titulo"
          className="relative isolate overflow-hidden scroll-mt-20 bg-slate-50 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
        >
          <FondoMarca tono="claro" className="-z-10" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_0.85fr] lg:gap-20">
            <Aparecer className="max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
                Una suscripción para tu negocio
              </p>
              <h2
                id="planes-titulo"
                className="mt-4 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl"
              >
                Herramientas claras.
                <br />
                Menos enredos.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                Opera con una suscripción mensual fija y 0% de comisión por
                reserva. Consulta las condiciones vigentes desde tu cuenta.
              </p>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Más tiempo para tus clientes y tus experiencias.
              </p>
            </Aparecer>
            <Aparecer
              retraso={0.12}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/[0.03] transition duration-300 hover:border-sky-200/80 hover:shadow-2xl hover:shadow-sky-900/[0.06] sm:p-9"
            >
              <VLogo showText className="h-8 w-8" />
              <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900">
                Tu centro de operaciones.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Todo incluido en un mismo panel:
              </p>
              <ul className="my-7 space-y-3">
                {[
                  "Perfil público bilingüe (ES/EN) con tu marca",
                  "Servicios, horarios, calendario y bloqueos",
                  "Reservas en línea y manuales (SINPE / efectivo)",
                  "Finanzas con CABYS, IVA y CSV para Hacienda",
                  "Soporte directo integrado en tu cuenta",
                ].map((texto) => (
                  <li
                    key={texto}
                    className="flex items-center gap-2.5 text-sm text-slate-700"
                  >
                    <Check
                      className="h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    {texto}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="vuki-focus group flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition hover:bg-slate-800"
              >
                Acceder a mi cuenta
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
                  aria-hidden="true"
                />
              </Link>
              <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">
                Las condiciones y funciones dependen de tu plan vigente.
              </p>
            </Aparecer>
          </div>
        </section>

        <section
          aria-labelledby="faq-titulo"
          className="relative isolate overflow-hidden bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12"
        >
          <FondoMarca className="-z-10" />
          <div className="mx-auto max-w-3xl">
            <Aparecer>
              <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
                Sin vueltas
              </p>
              <h2
                id="faq-titulo"
                className="mt-4 text-center font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
              >
                Por si te lo estabas preguntando.
              </h2>
            </Aparecer>
            <div className="mt-10 divide-y divide-white/15">
              {PREGUNTAS.map(({ pregunta, respuesta }, indice) => (
                <Aparecer key={pregunta} retraso={indice * 0.06}>
                  <details className="group rounded-2xl px-3 py-1 transition-colors hover:bg-white/[0.02] open:bg-white/[0.03] sm:px-4">
                    <summary className="vuki-focus flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-lg py-5 text-left text-sm font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden">
                      {pregunta}
                      <span
                        aria-hidden="true"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-emerald-300 transition group-hover:bg-emerald-400/15 group-open:rotate-45 group-open:bg-emerald-400/20 motion-reduce:transition-none"
                      >
                        <Plus className="h-4 w-4" />
                      </span>
                    </summary>
                    <p className="max-w-2xl pb-6 pr-8 text-sm leading-relaxed text-slate-300">
                      {respuesta}
                    </p>
                  </details>
                </Aparecer>
              ))}
            </div>
          </div>
        </section>

        <section
          aria-labelledby="cta-titulo"
          className="relative isolate overflow-hidden bg-white px-5 py-20 text-center text-slate-900 sm:px-8 sm:py-24"
        >
          <FondoMarca tono="claro" className="-z-10" />
          <Aparecer className="mx-auto max-w-2xl">
            <div className="relative mx-auto inline-flex">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-sky-200/50 to-emerald-200/50 blur-xl"
              />
              <VLogo className="relative mx-auto h-14 w-14 shadow-lg shadow-slate-900/10" />
            </div>
            <h2
              id="cta-titulo"
              className="mt-6 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            >
              Que la próxima reserva
              <br />
              te encuentre listo.
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate-600">
              Tú creas las experiencias. Dale a tu negocio un lugar para
              organizarlas.
            </p>
            <Link
              href="/login"
              className="vuki-focus group mt-8 inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/15 motion-reduce:transform-none"
            >
              Nos vemos en vuki
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
            </Link>
          </Aparecer>
        </section>
      </main>
    </MovimientoMarca>
  );
}
