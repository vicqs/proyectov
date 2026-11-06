import Link from "next/link";
import { SearchX } from "lucide-react";
import { PaginaAdmin } from "../../components/admin/ui";

/**
 * Página 404 contextual dentro del panel de Superadministrador (`/admin/*`).
 * Se muestra cuando un negocio (`/admin/negocios/[id]`) o ticket
 * (`/admin/soporte/[id]`) no existe, conservando el menú lateral.
 */
export default function AdminNotFound() {
  return (
    <PaginaAdmin
      titulo="Registro no encontrado"
      descripcion="El recurso que intentas consultar no existe o fue eliminado del sistema."
    >
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200/90 bg-white px-6 py-14 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <SearchX className="h-7 w-7" aria-hidden="true" />
        </div>
        <h2 className="font-display text-lg font-bold text-vuki-ink">
          No encontramos este elemento
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Verifica el enlace o regresa al resumen principal del panel de
          administración.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/admin" className="vuki-btn-primary min-h-11 px-5 py-2.5">
            Volver al panel
          </Link>
        </div>
      </div>
    </PaginaAdmin>
  );
}

