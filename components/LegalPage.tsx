import type { ReactNode } from "react";
import Link from "next/link";
import { FileText, Fingerprint } from "lucide-react";
import { cn } from "../lib/cn";
import VLogo from "./VLogo";

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
    <div className="min-h-screen bg-vuki-surface text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            aria-label="vuki: ir al inicio"
            className="vuki-focus inline-flex min-h-11 items-center rounded-lg"
          >
            <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
          </Link>
          <nav
            aria-label="Navegación principal"
            className="flex items-center gap-1 sm:gap-3"
          >
            <Link
              href="/"
              className="vuki-focus inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            >
              Inicio
            </Link>
            <Link
              href="/login"
              className="vuki-focus inline-flex min-h-11 items-center rounded-xl bg-vuki-ink px-4 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section
          aria-labelledby="titulo-legal"
          className="relative isolate overflow-hidden bg-vuki-ink"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
          >
            <div className="absolute -right-24 -top-32 h-80 w-80 rounded-full bg-vuki-ocean/15 blur-3xl" />
            <div className="absolute -bottom-32 right-12 h-64 w-64 rounded-full bg-vuki-emerald/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="flex items-center gap-3">
              <Icono
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-vuki-ocean"
                strokeWidth={1.75}
              />
              <p className="text-sm font-medium text-slate-300">
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
              <p className="mt-6 text-sm leading-6 text-slate-300">
                Última actualización: {fechaActualizacion}
              </p>
            )}
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-8 sm:px-6 sm:py-12 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-16">
          <aside className="min-w-0 lg:sticky lg:top-8">
            <nav
              aria-labelledby="documentos-legales"
              className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <h2
                id="documentos-legales"
                className="text-xs font-semibold uppercase tracking-wider text-slate-600"
              >
                Documentos legales
              </h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-1">
                {Object.entries(documentos).map(([clave, enlace]) => {
                  const esActual = clave === tipo;
                  const IconoEnlace = enlace.icono;

                  return (
                    <li key={clave} className="min-w-0">
                      <Link
                        href={enlace.href}
                        aria-current={esActual ? "page" : undefined}
                        className={cn(
                          "vuki-focus flex min-h-12 items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium sm:gap-3",
                          esActual
                            ? "bg-sky-50 text-slate-900 ring-1 ring-inset ring-sky-100"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <IconoEnlace
                          aria-hidden="true"
                          className={cn(
                            "h-4 w-4 shrink-0",
                            esActual ? "text-vuki-ocean" : "text-slate-600",
                          )}
                        />
                        {enlace.etiqueta}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          <article
            aria-label={documento.titulo}
            className="min-w-0 rounded-3xl border border-slate-200 bg-white p-6 text-base leading-8 text-slate-600 shadow-sm [overflow-wrap:anywhere] sm:p-10 lg:p-12 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:leading-snug [&_h2]:tracking-tight [&_h2]:text-slate-900 [&_p]:mt-3"
          >
            <div className="mx-auto max-w-[70ch]">{children}</div>
          </article>
        </div>
      </main>
    </div>
  );
}
