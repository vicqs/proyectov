import Link from "next/link";
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        Turismo Link — Reservas y pagos en un solo enlace
      </h1>
      <p className="max-w-md text-slate-500">
        Cada pyme turística tiene su propio enlace para mostrar servicios,
        reservar y cobrar.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/login"
          className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
        >
          Iniciar sesión
        </Link>
      </div>
    </main>
  );
}
