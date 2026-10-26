import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Compass,
  Globe2,
  Link2,
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
      "Deja de enviar el mismo catálogo por cada chat. Reúne tus servicios en un enlace que puedes compartir en Instagram, WhatsApp o donde estén tus clientes.",
    etiqueta: "Tu nuevo link en bio",
    estilo: "bg-sky-50 text-sky-700",
  },
  {
    icono: CalendarDays,
    numero: "02",
    titulo: "Una agenda que sí se entiende.",
    texto:
      "Organiza horarios, cupos y excepciones. Consulta tus reservas desde un mismo panel y deja que tus clientes encuentren las opciones disponibles.",
    etiqueta: "Menos trabajo manual",
    estilo: "bg-emerald-50 text-emerald-800",
  },
  {
    icono: Palette,
    numero: "03",
    titulo: "Tu negocio. Tu estilo.",
    texto:
      "Tu nombre, tus fotografías y tus colores. Una experiencia cuidada para tus clientes, con la identidad del negocio que tanto te ha costado construir.",
    etiqueta: "Tu marca al frente",
    estilo: "bg-slate-100 text-slate-700",
  },
];

const PREGUNTAS = [
  {
    pregunta: "¿Para qué negocios está pensado vuki?",
    respuesta:
      "Para micro y pequeñas empresas turísticas de Costa Rica: escuelas de surf, guías, operadores de tours y negocios de experiencias que necesitan organizar su catálogo, horarios y reservas.",
  },
  {
    pregunta: "¿Necesito tener una página web?",
    respuesta:
      "No. Tu perfil público es un enlace propio con la información de tu negocio y sus servicios. Puedes compartirlo directamente por WhatsApp o agregarlo a la biografía de tus redes sociales.",
  },
  {
    pregunta: "¿Puedo conservar los colores y el logo de mi negocio?",
    respuesta:
      "Sí. Puedes personalizar el perfil con el logo, la portada, la descripción y los colores de tu negocio. La identidad de tu empresa sigue siendo la protagonista.",
  },
  {
    pregunta: "¿Dónde consulto mi plan y cómo accedo?",
    respuesta:
      "Si ya tienes una cuenta, inicia sesión para entrar a tu panel. En la sección de suscripción puedes consultar las condiciones y opciones disponibles para tu negocio. Los precios y la disponibilidad de cada plan se muestran en tu cuenta.",
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
            className="vuki-focus rounded-xl"
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
              className="vuki-focus rounded py-3 transition hover:text-white"
              href="#caracteristicas"
            >
              Características
            </a>
            <a
              className="vuki-focus rounded py-3 transition hover:text-white"
              href="#como-funciona"
            >
              Cómo funciona
            </a>
            <a
              className="vuki-focus rounded py-3 transition hover:text-white"
              href="#planes"
            >
              Suscripción
            </a>
          </div>
          <Link
            href="/login"
            className="vuki-focus inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-sky-50 sm:px-5"
          >
            Iniciar sesión
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
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
              <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/5 px-3.5 py-2 text-[11px] font-medium text-emerald-200 sm:text-xs">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
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
                Comparte tus servicios, muestra tus horarios y reúne tus
                reservas. Sin enredos.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/login"
                  className="inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition hover:bg-sky-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                >
                  Entrar a vuki
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
                >
                  Ver cómo funciona
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  Tu propio enlace
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  Tu propia marca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  Un solo panel
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
              <span className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-sky-300" aria-hidden="true" />
                Escuelas de surf
              </span>
              <span className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-sky-300" aria-hidden="true" />
                Tours y aventura
              </span>
              <span className="flex items-center gap-2">
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
              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
                Menos catálogos reenviados, menos horarios dispersos y más
                tiempo para lo que mejor sabes hacer.
              </p>
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
                    <article className="flex h-full flex-col rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-sky-900/[0.03] transition duration-300 hover:-translate-y-1 hover:border-sky-200 hover:shadow-lg motion-reduce:transform-none motion-reduce:transition-none sm:p-7">
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${estilo}`}
                        >
                          <Icono className="h-6 w-6" aria-hidden="true" />
                        </span>
                        <span
                          aria-hidden="true"
                          className="font-display text-sm font-semibold text-slate-500"
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
          </div>
        </section>

        <section
          aria-labelledby="confianza-titulo"
          className="relative isolate overflow-hidden bg-slate-900 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12"
        >
          <FondoMarca className="-z-10" />
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Aparecer className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/[0.04] p-8 text-white shadow-2xl shadow-black/10 sm:p-10">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl"
              />
              <div className="relative">
                <ShieldCheck
                  className="h-9 w-9 text-emerald-400"
                  aria-hidden="true"
                />
                <p className="mt-8 font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
                  Tu negocio al frente.
                  <br />
                  <span className="text-sky-300">vuki detrás.</span>
                </p>
                <p className="mt-5 text-sm leading-relaxed text-slate-300">
                  No eres una ficha más en un catálogo de terceros. Este es el
                  espacio de tus experiencias y de tu marca.
                </p>
                <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-6">
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
              <p className="mt-5 text-base leading-relaxed text-slate-300">
                Una herramienta para organizar tu negocio, no para decirte cómo
                llevarlo.
              </p>
              <ul className="mt-7 space-y-5">
                {[
                  [
                    "Tú defines la experiencia",
                    "Gestiona servicios, precios, horarios y cupos desde tu panel.",
                  ],
                  [
                    "Tu identidad se conserva",
                    "Personaliza tu perfil con tus propias fotografías, logo y colores.",
                  ],
                  [
                    "Tus clientes encuentran claridad",
                    "Un perfil cuidado y una interfaz de reservas disponible en español e inglés.",
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
                Reúne tu operación en un mismo espacio. Consulta el precio, las
                condiciones y las opciones vigentes de tu suscripción desde tu
                cuenta.
              </p>
              <p className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-800">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Más tiempo para tus clientes y tus experiencias.
              </p>
            </Aparecer>
            <Aparecer
              retraso={0.12}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/[0.03] sm:p-9"
            >
              <VLogo showText className="h-8 w-8" />
              <h3 className="mt-6 font-display text-2xl font-bold tracking-tight text-slate-900">
                Tu centro de operaciones.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                La información de tu plan, sin adivinar.
              </p>
              <ul className="my-7 space-y-3.5">
                {[
                  "Perfil público de tu negocio",
                  "Catálogo de servicios y horarios",
                  "Gestión de reservas y disponibilidad",
                  "Personalización de tu marca",
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
                className="vuki-focus flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Acceder a mi cuenta
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
                  <details className="group py-1">
                    <summary className="vuki-focus flex min-h-16 cursor-pointer list-none items-center justify-between gap-5 rounded-lg py-5 text-left text-sm font-semibold text-white marker:content-none [&::-webkit-details-marker]:hidden">
                      {pregunta}
                      <Plus
                        className="h-5 w-5 shrink-0 text-emerald-300 transition-transform group-open:rotate-45 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
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
            <VLogo className="mx-auto h-14 w-14" />
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
              className="vuki-focus mt-8 inline-flex min-h-13 items-center justify-center gap-3 rounded-xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
            >
              Nos vemos en vuki
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Aparecer>
        </section>
      </main>
    </MovimientoMarca>
  );
}
