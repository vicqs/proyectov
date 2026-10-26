import Link from "next/link";
import { LogotipoVuki } from "./VLogo";

/** Marca de plataforma y atribución, sin revelar datos de contacto personales. */
export default function Footer() {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white px-5 py-7 text-center text-xs text-slate-500">
      <nav
        aria-label="Información de vuki"
        className="mb-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1"
      >
        <Link
          href="/"
          className="vuki-focus inline-flex min-h-11 items-center rounded font-display text-lg font-extrabold tracking-tight text-slate-900"
        >
          <LogotipoVuki className="text-lg text-vuki-ink" />
        </Link>
        <Link
          href="/terminos"
          className="vuki-focus inline-flex min-h-11 items-center rounded transition hover:text-slate-900"
        >
          Términos
        </Link>
        <Link
          href="/privacidad"
          className="vuki-focus inline-flex min-h-11 items-center rounded transition hover:text-slate-900"
        >
          Privacidad
        </Link>
      </nav>
      <p className="leading-relaxed">
        © {anioActual} Victor Quiros Suarez. Todos los derechos reservados.
      </p>
    </footer>
  );
}
