import Link from "next/link";
import {
  PaginaAdmin,
  Tarjeta,
  CLASE_BOTON,
} from "../../../components/admin/ui";
import { requerirAdmin } from "../../../lib/admin/auth";

export default async function SinPermisoPage() {
  await requerirAdmin();
  return (
    <PaginaAdmin titulo="Sin permiso">
      <Tarjeta>
        <p className="text-sm text-slate-600">
          Tu rol no tiene acceso a esta sección. Si lo necesitas, pídeselo a un
          superadministrador.
        </p>
        <Link href="/admin" className={`${CLASE_BOTON} mt-4`}>
          Volver al resumen
        </Link>
      </Tarjeta>
    </PaginaAdmin>
  );
}
