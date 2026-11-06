import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * Página 404 contextual dentro del panel operativo de empresa (`/[slug]/admin/*`).
 */
export default function EmpresaAdminNotFound() {
  return (
    <main className="mx-auto max-w-md px-6 py-20 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <SearchX className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="font-display text-lg font-bold text-vuki-ink">
        Sección no encontrada
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        La página o el registro que buscas no está disponible en tu panel.
      </p>
      <div className="mt-6 flex justify-center">
        <Link href="/empresa" className="vuki-btn-primary min-h-11 px-5 py-2.5">
          Ir a mi panel
        </Link>
      </div>
    </main>
  );
}

