import Link from "next/link";
import { requerirAdmin } from "../../../../lib/admin/auth";
import { NuevoNegocioForm } from "../../../../components/admin/NuevoNegocioForm";
import {
  CLASE_BOTON_NEUTRO,
  PaginaAdmin,
  Tarjeta,
} from "../../../../components/admin/ui";

export default async function NuevoNegocioPage() {
  await requerirAdmin("negocios_gestionar");
  return (
    <PaginaAdmin
      titulo="Nuevo negocio"
      descripcion="Crea el negocio y su usuario dueño. Comienza en periodo de prueba."
      accion={
        <Link href="/admin/negocios" className={CLASE_BOTON_NEUTRO}>
          Volver
        </Link>
      }
    >
      <Tarjeta>
        <NuevoNegocioForm />
      </Tarjeta>
    </PaginaAdmin>
  );
}
