import Link from "next/link";
import { Compass } from "lucide-react";
import VLogo from "../../components/VLogo";

/**
 * Página 404 específica para perfiles públicos de negocios (`/[slug]`).
 */
export default function NegocioNotFound() {
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
        <h1 className="font-display text-2xl font-bold tracking-tight text-vuki-ink">
          No pudimos encontrar este negocio turístico
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          El enlace puede estar mal escrito o el comercio ya no está disponible.
          Verifica la dirección e inténtalo de nuevo.
        </p>
        <Link href="/" className="vuki-btn-primary mt-7 min-h-12 px-6 py-3">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}

