import type { ReactNode } from "react";
import Link from "next/link";
import VLogo from "./VLogo";

/** Marco de marca para trámites públicos; no agrega lógica ni promesas de pago. */
export default function PaginaPublica({
  titulo,
  descripcion,
  etiqueta,
  icono,
  children,
  pie,
  accion,
}: {
  titulo: string;
  descripcion?: ReactNode;
  etiqueta: string;
  icono?: ReactNode;
  children: ReactNode;
  pie?: ReactNode;
  /** Elemento a la derecha del logo (p. ej. selector de idioma). */
  accion?: ReactNode;
}) {
  return (
    <main className="relative isolate min-h-[85svh] overflow-hidden bg-vuki-surface px-4 py-10 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-linear-to-br from-sky-100/70 via-white to-emerald-100/50"
      />
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-7 flex items-center justify-between gap-3">
          <Link
            href="/"
            aria-label="vuki · inicio"
            className="vuki-focus inline-flex min-h-11 items-center rounded-xl"
          >
            <VLogo showText className="h-9 w-9" />
          </Link>
          {accion}
        </div>
        <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xl shadow-sky-950/[0.05]">
          <header className="relative border-b border-sky-100 bg-linear-to-br from-sky-50 via-white to-emerald-50/70 px-6 py-7 sm:px-8">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
            />
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-800">
              {icono && (
                <span
                  aria-hidden="true"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100/70 text-sky-700"
                >
                  {icono}
                </span>
              )}
              {etiqueta}
            </p>
            <h1 className="mt-4 break-words font-display text-2xl font-bold leading-tight tracking-tight text-vuki-ink sm:text-3xl">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-3 text-sm leading-relaxed text-slate-600 [overflow-wrap:anywhere]">
                {descripcion}
              </p>
            )}
          </header>
          <div className="p-6 sm:p-8">{children}</div>
          {pie && (
            <div className="border-t border-sky-100 bg-sky-50/40 px-6 py-4 sm:px-8">
              {pie}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
