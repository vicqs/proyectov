import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Página 404 personalizada (App Router: reemplaza la pantalla genérica de
 * Next.js). Se usa tanto para rutas inexistentes como para negocios que no
 * existen en `/[slug]` (vía `notFound()`).
 */
export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100">
          <Compass className="h-8 w-8 text-sky-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">
          No pudimos encontrar este negocio turístico
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          El enlace puede estar mal escrito o el negocio ya no está disponible.
          Verifica la dirección e inténtalo de nuevo.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
