import Link from "next/link";
import { Compass } from "lucide-react";
import VLogo from "../components/VLogo";

/**
 * Página 404 personalizada (App Router: reemplaza la pantalla genérica de
 * Next.js). Se usa tanto para rutas inexistentes como para negocios que no
 * existen en `/[slug]` (vía `notFound()`).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-[85svh] items-center justify-center bg-slate-50 px-5 py-16">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white px-6 py-10 text-center shadow-xl shadow-slate-900/5 sm:px-9">
        <VLogo showText className="h-8 w-8" wordmarkClassName="text-2xl" />
        <div className="mx-auto mb-5 mt-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-sky-50">
          <Compass
            className="h-9 w-9 text-sky-700"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
          No pudimos encontrar este negocio turístico
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          El enlace puede estar mal escrito o el negocio ya no está disponible.
          Verifica la dirección e inténtalo de nuevo.
        </p>
        <Link
          href="/"
          className="vuki-focus mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
