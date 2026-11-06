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

const ROLES_PERMISOS_INFO = [
  {
    rol: "superadmin" as const,
    nombre: "Superadministrador",
    descripcion: "Acceso total y configuración global de la plataforma.",
    modulos: [
      "Resumen",
      "Negocios (ver y gestionar)",
      "Reservas",
      "Usuarios",
      "Suscripciones",
      "Finanzas",
      "Soporte",
      "Moderación",
      "Comunicación",
      "Configuración",
      "Sistema",
      "Auditoría",
      "Equipo",
    ],
  },
  {
    rol: "finanzas" as const,
    nombre: "Finanzas",
    descripcion: "Operaciones monetarias, suscripciones y auditoría.",
    modulos: [
      "Resumen",
      "Negocios (lectura)",
      "Reservas",
      "Suscripciones",
      "Finanzas",
      "Auditoría",
    ],
  },
  {
    rol: "soporte" as const,
    nombre: "Soporte",
    descripcion: "Atención al cliente, usuarios, reportes y salud del sistema.",
    modulos: [
      "Resumen",
      "Negocios (lectura)",
      "Reservas",
      "Usuarios",
      "Soporte",
      "Moderación",
      "Sistema",
    ],
  },
];

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
          className="items-end"
        >
          <Campo etiqueta="Correo">
            <input
              name="email"
              type="email"
              required
              placeholder="colaborador@vuki.cr"
              className={`${CLASE_INPUT} sm:w-72`}
            />
          </Campo>
          <Campo etiqueta="Rol">
            <select
              name="rol"
              defaultValue="soporte"
              className={CLASE_SELECT}
            >
              {ROLES_ADMIN.filter((r) => r !== "superadmin").map((r) => (
                <option key={r} value={r}>
                  {ETIQUETA_ROL[r]}
                </option>
              ))}
            </select>
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tabla
        columnas={["Correo", "Rol", "Origen", "Último acceso", "Acción"]}
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

      <Tarjeta
        titulo="Permisos por rol"
        descripcion="Alcance y módulos autorizados según el nivel asignado."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {ROLES_PERMISOS_INFO.map((r) => (
            <div
              key={r.rol}
              className="flex flex-col rounded-2xl border border-sky-100 bg-sky-50/20 p-4 transition-colors hover:border-sky-200"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-sm font-bold text-vuki-ink">
                  {r.nombre}
                </h3>
                <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 shadow-2xs border border-slate-200/70">
                  {r.rol === "superadmin"
                    ? `${TODOS_LOS_PERMISOS.length} permisos`
                    : `${r.modulos.length} módulos`}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">{r.descripcion}</p>
              <div className="mt-3.5 flex flex-wrap gap-1.5 pt-3 border-t border-sky-100/70">
                {r.modulos.map((m) => (
                  <span
                    key={m}
                    className="inline-flex items-center rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-700 shadow-2xs border border-slate-200/80"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Tarjeta>
    </PaginaAdmin>
  );
}
