import Link from "next/link";
import { CalendarCheck, ShieldCheck, Sparkles } from "lucide-react";
import VLogo from "./VLogo";

const BENEFICIOS = [
  {
    icono: CalendarCheck,
    texto: "Reservas, horarios y cupos en un solo lugar.",
  },
  {
    icono: Sparkles,
    texto: "Un enlace público propio para que tus clientes reserven.",
  },
  {
    icono: ShieldCheck,
    texto: "Acceso seguro para empresas y para el equipo de Turismo Link.",
  },
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
    <main className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-slate-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="login-flotar absolute -left-24 -top-24 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="login-flotar absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-indigo-500/30 blur-3xl [animation-delay:-7s]"
        />
        <div className="relative flex items-center gap-3 text-white">
          <VLogo className="h-10 w-10" />
          <span className="text-lg font-semibold tracking-tight">
            Turismo Link
          </span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-white">
            Gestiona tu negocio turístico sin complicaciones.
          </h2>
          <ul className="mt-8 space-y-4">
            {BENEFICIOS.map(({ icono: Icono, texto }) => (
              <li key={texto} className="flex items-start gap-3 text-slate-200">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icono className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-sm leading-relaxed">{texto}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-400">
          © {new Date().getFullYear()} Turismo Link
        </p>
      </aside>

      <section className="flex min-h-screen flex-col bg-slate-50 lg:min-h-0 lg:items-center lg:justify-center lg:bg-white lg:px-8 lg:py-10">
        <header className="relative overflow-hidden bg-slate-900 px-6 pb-16 pt-10 text-center lg:hidden">
          <div
            aria-hidden="true"
            className="login-flotar absolute -left-16 -top-20 h-56 w-56 rounded-full bg-sky-500/30 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="login-flotar absolute -bottom-24 -right-10 h-56 w-56 rounded-full bg-indigo-500/30 blur-3xl [animation-delay:-7s]"
          />
          <div className="login-entrada relative flex flex-col items-center gap-3">
            <VLogo className="h-11 w-11" />
            <span className="text-lg font-semibold tracking-tight text-white">
              Turismo Link
            </span>
            <p className="max-w-xs text-sm text-slate-300">
              Gestiona tu negocio turístico sin complicaciones.
            </p>
          </div>
        </header>

        <div className="login-entrada relative -mt-8 w-full max-w-sm self-center px-4 pb-10 [animation-delay:120ms] lg:mt-0 lg:px-0 lg:pb-0">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {titulo}
            </h1>
            {descripcion && (
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                {descripcion}
              </p>
            )}
            <div className="mt-6">{children}</div>
          </div>
          {pie && <div className="mt-6 text-center text-sm">{pie}</div>}
          <p className="mt-6 text-center text-xs text-slate-600">
            Al continuar aceptas los{" "}
            <Link href="/terminos" className="underline hover:text-slate-900">
              términos
            </Link>{" "}
            y la{" "}
            <Link href="/privacidad" className="underline hover:text-slate-900">
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
