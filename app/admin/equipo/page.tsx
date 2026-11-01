import { Trash2 } from "lucide-react";
import { requerirAdmin, rolEfectivo } from "../../../lib/admin/auth";
import { leer, listarUsuariosAuth } from "../../../lib/admin/db";
import { fechaHora } from "../../../lib/admin/formato";
import {
  ETIQUETA_ROL,
  ROLES_ADMIN,
  TODOS_LOS_PERMISOS,
} from "../../../lib/roles";
import {
  asignarRolAction,
  quitarRolAction,
} from "../../../actions/admin/equipo";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Celda,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
} from "../../../components/admin/ui";

export default async function EquipoPage() {
  const admin = await requerirAdmin("equipo");
  const [usuarios, perfiles] = await Promise.all([
    listarUsuariosAuth(),
    leer("perfiles").catch(() => []),
  ]);
  const perfil = new Map(perfiles.map((p) => [p.user_id, p]));
  const equipo = usuarios
    .map((u) => ({
      u,
      rol: rolEfectivo(u.email, perfil.get(u.id)?.rol_admin ?? null),
    }))
    .filter((x) => x.rol)
    .sort((a, b) => (a.u.email ?? "").localeCompare(b.u.email ?? ""));

  return (
    <PaginaAdmin
      titulo="Equipo"
      descripcion={`${equipo.length} persona(s) con acceso al área de administración.`}
    >
      <Tarjeta
        titulo="Asignar rol"
        descripcion="Si el correo no tiene cuenta, se crea con una contraseña temporal que se muestra una sola vez."
      >
        <AccionForm
          accion={asignarRolAction}
          boton="Asignar"
          limpiarAlOk
          enLinea
        >
          <Campo etiqueta="Correo">
            <input
              name="email"
              type="email"
              required
              placeholder="colaborador@vuki.com"
              className={`${CLASE_INPUT} sm:w-72`}
            />
          </Campo>
          <Campo etiqueta="Rol">
            <select
              name="rol"
              defaultValue="soporte"
              className={CLASE_SELECT}
            >
              {ROLES_ADMIN.map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </select>
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tabla
        columnas={["Correo", "Rol", "Origen", "Último acceso", ""]}
        vacia={equipo.length === 0}
      >
        {equipo.map(({ u, rol }) => {
          const enBd = !!perfil.get(u.id)?.rol_admin;
          return (
            <tr key={u.id}>
              <Celda>{u.email}</Celda>
              <Celda>
                <Insignia tono="azul">{ETIQUETA_ROL[rol!]}</Insignia>
              </Celda>
              <Celda>{enBd ? "Base de datos" : "ADMIN_GLOBAL_EMAILS"}</Celda>
              <Celda className="whitespace-nowrap text-xs text-slate-500">
                {fechaHora(u.last_sign_in_at)}
              </Celda>
              <Celda>
                {u.id === admin.user.id ? (
                  <span className="text-xs text-slate-400">Tú</span>
                ) : enBd ? (
                  <AccionForm
                    accion={quitarRolAction.bind(null, u.id)}
                    boton="Quitar rol"
                    variante="peligro_sutil"
                    tamano="sm"
                    icono={<Trash2 className="h-3.5 w-3.5" aria-hidden="true" />}
                    confirmar="¿Quitar el acceso al área de administración?"
                  />
                ) : null}
              </Celda>
            </tr>
          );
        })}
      </Tabla>

      <Tarjeta titulo="Permisos por rol">
        <p className="text-sm text-slate-500">
          Superadministrador: {TODOS_LOS_PERMISOS.length} permisos (todos).
          Finanzas: facturación, finanzas, reservas y auditoría. Soporte:
          usuarios, tickets, moderación, reservas y sistema.
        </p>
      </Tarjeta>
    </PaginaAdmin>
  );
}
