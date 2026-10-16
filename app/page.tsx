import Link from "next/link";
import { inicioRapidoAction } from "../actions/auth";
import { isMockMode } from "../lib/mock/client";
import { mockNegocios } from "../lib/mock/data";

const DEMO_LINKS = [
  { href: "/demo/surf-tamarindo", label: "Ver perfil público (demo)" },
  { href: "/demo/admin", label: "Panel de administración (demo)" },
];

export default function HomePage() {
  const mostrarInicioRapido =
    isMockMode && process.env.NODE_ENV !== "production";
  const slugPublico = mockNegocios[0]?.slug;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        Turismo Link — Reservas y pagos en un solo enlace
      </h1>
      <p className="max-w-md text-slate-500">
        Cada pyme turística tiene su propio enlace para mostrar servicios,
        reservar y cobrar. Prueba la demo sin registrarte:
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        {DEMO_LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
          >
            {label}
          </Link>
        ))}
        <Link
          href="/login"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Iniciar sesión
        </Link>
      </div>

      {mostrarInicioRapido && (
        <section className="w-full max-w-md rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Inicio rápido (solo desarrollo)
          </p>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <form action={inicioRapidoAction}>
              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Entrar a /admin sin login
              </button>
            </form>
            {slugPublico && (
              <Link
                href={`/${slugPublico}`}
                className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
              >
                Ver enlace público de /admin ↗
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
