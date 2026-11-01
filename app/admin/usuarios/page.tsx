import { Ban, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { requerirAdmin, rolEfectivo } from "../../../lib/admin/auth";
import { leer, listarUsuariosAuth } from "../../../lib/admin/db";
import { ETIQUETA_ROL, tienePermiso } from "../../../lib/roles";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
import {
  bloquearUsuarioAction,
  cerrarSesionesAction,
  restablecerContrasenaAction,
} from "../../../actions/admin/usuarios";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_SELECT,
  CampoBusqueda,
  Celda,
  FiltrosGet,
  Insignia,
  PaginaAdmin,
  Paginacion,
  Tabla,
} from "../../../components/admin/ui";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requerirAdmin("usuarios");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const rolFiltro = parametro(sp.rol) ?? "";
  const estadoFiltro = parametro(sp.estado) ?? "";

  const [usuarios, perfiles, negocios] = await Promise.all([
    listarUsuariosAuth(),
    leer("perfiles").catch(() => []),
    leer("negocios"),
  ]);
  const perfil = new Map(perfiles.map((p) => [p.user_id, p]));
  const negocioDe = new Map(negocios.map((n) => [n.user_id, n]));
  const esSuper = tienePermiso(admin.rol, "equipo");

  const filas = usuarios
    .filter((u) => {
      if (!q) return true;
      const nom = negocioDe.get(u.id)?.nombre?.toLowerCase() ?? "";
      return (u.email ?? "").toLowerCase().includes(q) || nom.includes(q);
    })
    .filter((u) => {
      if (!rolFiltro) return true;
      const p = perfil.get(u.id);
      const rol = rolEfectivo(u.email ?? "", p?.rol_admin ?? null);
      if (rolFiltro === "empresa") return !rol;
      if (rolFiltro === "equipo") return !!rol;
      return rol === rolFiltro;
    })
    .filter((u) => {
      if (!estadoFiltro) return true;
      const p = perfil.get(u.id);
      const bloqueado = !!p?.bloqueado;
      if (estadoFiltro === "bloqueado") return bloqueado;
      if (estadoFiltro === "activo") return !bloqueado;
      return true;
    })
    .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));

  const pag = paginar(filas, parametro(sp.pagina));

  return (
    <PaginaAdmin
      titulo="Usuarios"
      descripcion="Cuentas de empresas y del equipo. No se muestran contraseñas."
      accion={
        <a href="/admin/exportar/usuarios" className={CLASE_BOTON_NEUTRO}>
          Exportar CSV
        </a>
      }
    >
      <FiltrosGet>
        <CampoBusqueda
          defaultValue={q}
          placeholder="Buscar por correo o negocio..."
          ariaLabel="Buscar por correo o negocio"
          className="sm:w-72"
        />
        <select
          name="rol"
          defaultValue={rolFiltro}
          aria-label="Filtrar por rol"
          className={CLASE_SELECT}
        >
          <option value="">Todos los roles</option>
          <option value="empresa">Empresas</option>
          <option value="equipo">Todo el equipo</option>
          <option value="superadmin">Superadministrador</option>
          <option value="finanzas">Finanzas</option>
          <option value="soporte">Soporte</option>
        </select>
        <select
          name="estado"
          defaultValue={estadoFiltro}
          aria-label="Filtrar por estado"
          className={CLASE_SELECT}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="bloqueado">Bloqueados</option>
        </select>
      </FiltrosGet>

      <Tabla
        columnas={[
          "Correo",
          "Negocio",
          "Rol",
          "Estado",
          "Último acceso",
          "Acciones",
        ]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((u) => {
          const p = perfil.get(u.id);
          const rol = rolEfectivo(u.email ?? "", p?.rol_admin ?? null);
          const propio = u.id === admin.user.id;
          const protegido = !!rol && !esSuper;
          return (
            <tr key={u.id}>
              <Celda>{u.email}</Celda>
              <Celda>{negocioDe.get(u.id)?.nombre ?? "—"}</Celda>
              <Celda>
                {rol ? (
                  <Insignia tono="azul">{ETIQUETA_ROL[rol]}</Insignia>
                ) : (
                  "Empresa"
                )}
              </Celda>
              <Celda>
                {p?.bloqueado ? (
                  <Insignia tono="rojo">Bloqueado</Insignia>
                ) : (
                  <Insignia tono="verde">Activo</Insignia>
                )}
              </Celda>
              <Celda className="whitespace-nowrap">{fechaHora(u.last_sign_in_at)}</Celda>
              <Celda>
                {propio ? (
                  <span className="text-xs text-slate-400">Tu cuenta</span>
                ) : protegido ? (
                  <span className="text-xs text-slate-400">
                    Solo superadmin
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AccionForm
                      accion={bloquearUsuarioAction.bind(
                        null,
                        u.id,
                        !p?.bloqueado,
                      )}
                      boton={p?.bloqueado ? "Desbloquear" : "Bloquear"}
                      variante={p?.bloqueado ? "neutro_sm" : "peligro_sutil"}
                      tamano="sm"
                      icono={
                        p?.bloqueado ? (
                          <ShieldCheck
                            className="h-3.5 w-3.5 text-emerald-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                        )
                      }
                      confirmar={
                        p?.bloqueado
                          ? undefined
                          : "¿Bloquear a este usuario y cerrar sus sesiones?"
                      }
                    />
                    <AccionForm
                      accion={cerrarSesionesAction.bind(null, u.id)}
                      boton="Cerrar sesiones"
                      variante="neutro_sm"
                      tamano="sm"
                      icono={
                        <LogOut
                          className="h-3.5 w-3.5 text-slate-500"
                          aria-hidden="true"
                        />
                      }
                    />
                    {esSuper && (
                      <AccionForm
                        accion={restablecerContrasenaAction.bind(null, u.id)}
                        boton="Contraseña temporal"
                        variante="neutro_sm"
                        tamano="sm"
                        icono={
                          <KeyRound
                            className="h-3.5 w-3.5 text-slate-500"
                            aria-hidden="true"
                          />
                        }
                        confirmar="Se generará una contraseña nueva y se cerrarán sus sesiones."
                      />
                    )}
                  </div>
                )}
              </Celda>
            </tr>
          );
        })}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/usuarios"
        params={{ q, rol: rolFiltro, estado: estadoFiltro }}
      />
    </PaginaAdmin>
  );
}
