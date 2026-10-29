import Link from "next/link";
import VLogo from "./VLogo";

/** Marca de plataforma y atribución, sin revelar datos de contacto personales. */
export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="relative isolate overflow-hidden border-t border-white/10 bg-vuki-ink px-5 py-9 text-center text-xs text-slate-300">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-vuki-ocean to-vuki-emerald"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-vuki-ocean/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-vuki-emerald/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        <nav
          aria-label="Información de vuki"
          className="mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <Link
            href="/"
            aria-label="vuki · inicio"
            className="vuki-focus inline-flex min-h-11 items-center rounded-xl transition-opacity hover:opacity-90"
          >
            <VLogo
              showText
              tone="light"
              className="h-7 w-7"
              wordmarkClassName="text-2xl"
            />
          </Link>
          <Link
            href="/terminos"
            className="vuki-focus relative inline-flex min-h-11 items-center rounded-lg px-2 font-medium text-sky-200 transition hover:text-white after:absolute after:inset-x-2 after:bottom-2.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-400 after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
          >
            Términos
          </Link>
          <Link
            href="/privacidad"
            className="vuki-focus relative inline-flex min-h-11 items-center rounded-lg px-2 font-medium text-sky-200 transition hover:text-white after:absolute after:inset-x-2 after:bottom-2.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-emerald-400 after:transition-transform after:duration-200 hover:after:scale-x-100 motion-reduce:after:transition-none"
          >
            Privacidad
          </Link>
        </nav>
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-0.5 w-12 rounded-full bg-vuki-emerald"
        />
        <p className="leading-relaxed text-slate-400">
          © {anioActual} Victor Quiros Suarez. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
