import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarClock, FileText, Fingerprint } from "lucide-react";
import { cn } from "../lib/cn";
import VLogo from "./VLogo";
import {
  Aparecer,
  FondoMarca,
  MovimientoMarca,
  ProgresoPagina,
} from "./marketing/MovimientoMarca";

interface LegalPageProps {
  tipo: "terminos" | "privacidad";
  fechaActualizacion?: string;
  children: ReactNode;
}

export default function LegalPage({
  tipo,
  fechaActualizacion,
  children,
}: LegalPageProps) {
  const documentos = {
    terminos: {
      titulo: "Términos y Condiciones",
      etiqueta: "Términos",
      href: "/terminos",
      subtitulo: "Condiciones de uso de la plataforma vuki.",
      icono: FileText,
    },
    privacidad: {
      titulo: "Política de Privacidad",
      etiqueta: "Privacidad",
      href: "/privacidad",
      subtitulo:
        "Información sobre el tratamiento de datos en la plataforma vuki.",
      icono: Fingerprint,
    },
  };
  const documento = documentos[tipo];
  const Icono = documento.icono;

  return (
    <MovimientoMarca>
      <div className="min-h-screen bg-vuki-surface text-slate-900">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              aria-label="vuki: ir al inicio"
              className="vuki-focus inline-flex min-h-11 items-center rounded-lg transition-opacity hover:opacity-90"
            >
              <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
            </Link>
            <nav
              aria-label="Navegación principal"
              className="flex items-center gap-1 sm:gap-3"
            >
              <Link
                href="/"
                className="vuki-focus group inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100/80 hover:text-slate-900"
              >
                <ArrowLeft
                  aria-hidden="true"
                  className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:-translate-x-0.5 group-hover:text-slate-700 motion-reduce:transform-none"
                />
                Inicio
              </Link>
              <Link
                href="/login"
                className="vuki-focus group inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white shadow-sm shadow-slate-900/10 transition hover:bg-slate-800"
              >
                Iniciar sesión
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
                />
              </Link>
            </nav>
          </div>
          <ProgresoPagina />
        </header>

        <main>
          <section
            aria-labelledby="titulo-legal"
            className="relative isolate overflow-hidden bg-vuki-ink"
          >
            <FondoMarca className="-z-10" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
            >
              <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-vuki-ocean/15 blur-3xl" />
              <div className="absolute -bottom-32 right-12 h-64 w-64 rounded-full bg-vuki-emerald/10 blur-3xl" />
            </div>
            <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
              <Aparecer>
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
                  <Icono
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-sky-300"
                    strokeWidth={1.75}
                  />
                  <p className="text-xs font-medium text-slate-200">
                    Información legal
                  </p>
                </div>
                <h1
                  id="titulo-legal"
                  className="mt-5 max-w-4xl text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
                >
                  {documento.titulo}
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                  {documento.subtitulo}
                </p>
                {fechaActualizacion && (
                  <p className="mt-6 inline-flex items-center gap-2 text-xs font-medium leading-6 text-slate-300 sm:text-sm">
                    <CalendarClock
                      aria-hidden="true"
                      className="h-4 w-4 text-emerald-400"
                    />
                    Última actualización: {fechaActualizacion}
                  </p>
                )}
              </Aparecer>
            </div>
          </section>

          <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-16">
            <aside className="min-w-0 lg:sticky lg:top-24">
              <Aparecer retraso={0.05}>
                <nav
                  aria-labelledby="documentos-legales"
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5"
                >
                  <h2
                    id="documentos-legales"
                    className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Documentos legales
                  </h2>
                  <ul className="mt-3.5 grid grid-cols-2 gap-2 lg:grid-cols-1">
                    {Object.entries(documentos).map(([clave, enlace]) => {
                      const esActual = clave === tipo;
                      const IconoEnlace = enlace.icono;

                      return (
                        <li key={clave} className="min-w-0">
                          <Link
                            href={enlace.href}
                            aria-current={esActual ? "page" : undefined}
                            className={cn(
                              "vuki-focus group flex min-h-12 items-center gap-2 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all sm:gap-3",
                              esActual
                                ? "bg-sky-50/90 text-slate-900 shadow-xs ring-1 ring-inset ring-sky-200/80"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                            )}
                          >
                            <IconoEnlace
                              aria-hidden="true"
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105 motion-reduce:transform-none",
                                esActual
                                  ? "text-vuki-ocean"
                                  : "text-slate-500 group-hover:text-slate-800",
                              )}
                            />
                            <span className="truncate">{enlace.etiqueta}</span>
                            {esActual && (
                              <span
                                aria-hidden="true"
                                className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-vuki-emerald lg:inline-block"
                              />
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </nav>
              </Aparecer>
            </aside>

            <Aparecer retraso={0.1} className="min-w-0">
              <article
                aria-label={documento.titulo}
                className="relative min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-6 text-base leading-8 text-slate-600 shadow-md shadow-slate-900/[0.03] [overflow-wrap:anywhere] sm:p-10 lg:p-12 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_p]:mt-3"
              >
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-vuki-ocean via-sky-400 to-vuki-emerald opacity-80"
                />
                <div className="mx-auto max-w-[70ch]">{children}</div>
              </article>
            </Aparecer>
          </div>
        </main>
      </div>
    </MovimientoMarca>
  );
}
