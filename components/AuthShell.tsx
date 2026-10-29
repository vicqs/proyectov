import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck } from "lucide-react";
import VLogo from "./VLogo";
import EscenaAcceso from "./marketing/EscenaAcceso";
import {
  Aparecer,
  FondoMarca,
  MovimientoMarca,
} from "./marketing/MovimientoMarca";

const PUNTOS_ACCESO = [
  "Enlace ES/EN",
  "Calendario y cupos",
  "Finanzas · Hacienda",
];

interface AuthShellProps {
  titulo: string;
  descripcion?: React.ReactNode;
  children: React.ReactNode;
  /** Contenido bajo la tarjeta (enlaces secundarios). */
  pie?: React.ReactNode;
}

/** Marco común de login, recuperación y restablecimiento de contraseña. */
export default function AuthShell({
  titulo,
  descripcion,
  children,
  pie,
}: AuthShellProps) {
  return (
    <MovimientoMarca>
      <main className="grid min-h-svh bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
        <aside className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-16">
          <FondoMarca />
          <Link
            href="/"
            aria-label="Ir al inicio de vuki"
            className="vuki-focus relative w-fit rounded-xl transition-opacity hover:opacity-90"
          >
            <VLogo
              showText
              tone="light"
              className="h-11 w-11"
              wordmarkClassName="text-4xl"
            />
          </Link>
          <Aparecer className="relative my-9 max-w-lg">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-200">
              <span
                className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                aria-hidden="true"
              />
              Hecho para el turismo de Costa Rica
            </p>
            <h2 className="font-display text-4xl font-bold leading-[1.15] tracking-tight text-white xl:text-5xl">
              Menos mensajes.
              <br />
              Más <span className="text-emerald-400">experiencias.</span>
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300">
              Tu enlace público, tu agenda y tus finanzas en un solo lugar.
            </p>
            <EscenaAcceso />
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
              {PUNTOS_ACCESO.map((texto) => (
                <li key={texto} className="inline-flex items-center gap-1.5">
                  <Check
                    className="h-3.5 w-3.5 text-emerald-400"
                    aria-hidden="true"
                  />
                  <span>{texto}</span>
                </li>
              ))}
            </ul>
          </Aparecer>
          <div className="relative flex items-center justify-between gap-4 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} vuki</span>
            <span>El monograma de vuki.</span>
          </div>
        </aside>

        <section className="flex min-h-svh flex-col lg:min-h-0 lg:items-center lg:justify-center lg:bg-white lg:px-10 lg:py-14">
          <header className="relative overflow-hidden bg-slate-900 px-6 pb-20 pt-8 text-center lg:hidden">
            <FondoMarca />
            <div className="relative flex flex-col items-center gap-3">
              <Link
                href="/"
                aria-label="Ir al inicio de vuki"
                className="vuki-focus rounded-xl"
              >
                <VLogo
                  showText
                  tone="light"
                  className="h-11 w-11"
                  wordmarkClassName="text-4xl"
                />
              </Link>
              <p className="max-w-xs text-sm text-slate-300">
                Tu negocio turístico, en buenas manos.
              </p>
            </div>
          </header>

          <div className="relative -mt-10 w-full max-w-[420px] self-center px-4 pb-10 lg:mt-0 lg:px-0 lg:pb-0">
            <Link
              href="/"
              className="vuki-focus group mb-8 hidden min-h-11 w-fit items-center gap-2 rounded-lg text-sm text-slate-500 transition hover:text-slate-900 lg:inline-flex"
            >
              <ArrowLeft
                className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transform-none"
                aria-hidden="true"
              />
              Volver a vuki
            </Link>
            <div className="rounded-3xl border border-slate-200/80 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-9 lg:border-0 lg:p-0 lg:shadow-none">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-sky-700">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                Tu espacio en vuki
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900">
                {titulo}
              </h1>
              {descripcion && (
                <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
                  {descripcion}
                </p>
              )}
              <div className="mt-7">{children}</div>
            </div>
            {pie && <div className="mt-6 text-center text-sm">{pie}</div>}
            <p className="mt-7 text-center text-xs leading-relaxed text-slate-500">
              Al continuar aceptas los{" "}
              <Link
                href="/terminos"
                className="vuki-focus rounded underline underline-offset-2 transition hover:text-slate-900"
              >
                términos
              </Link>{" "}
              y la{" "}
              <Link
                href="/privacidad"
                className="vuki-focus rounded underline underline-offset-2 transition hover:text-slate-900"
              >
                política de privacidad
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </MovimientoMarca>
  );
}
