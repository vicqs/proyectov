import Link from "next/link";
import { requerirAdmin } from "../../../../lib/admin/auth";
import { crearNegocioAction } from "../../../../actions/admin/negocios";
import { AccionForm } from "../../../../components/admin/AccionForm";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_INPUT,
  Campo,
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
        <AccionForm
          accion={crearNegocioAction}
          boton="Crear negocio"
          limpiarAlOk
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo etiqueta="Nombre del negocio">
              <input
                name="nombre"
                required
                maxLength={80}
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo
              etiqueta="Slug (URL pública)"
              ayuda="Minúsculas, números y guiones. No puede ser una ruta reservada."
            >
              <input
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9\-]{1,38}[a-z0-9]"
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo
              etiqueta="Correo del dueño"
              ayuda="Si no existe, se crea con una contraseña temporal."
            >
              <input
                name="email"
                type="email"
                required
                className={CLASE_INPUT}
              />
            </Campo>
            <Campo etiqueta="Cuenta IBAN (opcional)">
              <input
                name="cuenta_iban"
                maxLength={40}
                className={CLASE_INPUT}
              />
            </Campo>
          </div>
        </AccionForm>
      </Tarjeta>
    </PaginaAdmin>
  );
}
