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
  CLASE_INPUT,
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

  const [usuarios, perfiles, negocios] = await Promise.all([
    listarUsuariosAuth(),
    leer("perfiles").catch(() => []),
    leer("negocios"),
  ]);
  const perfil = new Map(perfiles.map((p) => [p.user_id, p]));
  const negocioDe = new Map(negocios.map((n) => [n.user_id, n]));
  const esSuper = tienePermiso(admin.rol, "equipo");

  const filas = usuarios
    .filter((u) => !q || (u.email ?? "").toLowerCase().includes(q))
    .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
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
        <input
          name="q"
          defaultValue={q}
          aria-label="Correo" placeholder="Correo"
          className={`${CLASE_INPUT} sm:w-64`}
        />
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
          const rol = rolEfectivo(u.email, p?.rol_admin ?? null);
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
                  <div className="flex flex-wrap gap-2">
                    <AccionForm
                      accion={bloquearUsuarioAction.bind(
                        null,
                        u.id,
                        !p?.bloqueado,
                      )}
                      boton={p?.bloqueado ? "Desbloquear" : "Bloquear"}
                      variante={p?.bloqueado ? "neutro" : "peligro"}
                      confirmar={
                        p?.bloqueado
                          ? undefined
                          : "¿Bloquear a este usuario y cerrar sus sesiones?"
                      }
                    />
                    <AccionForm
                      accion={cerrarSesionesAction.bind(null, u.id)}
                      boton="Cerrar sesiones"
                      variante="neutro"
                    />
                    {esSuper && (
                      <AccionForm
                        accion={restablecerContrasenaAction.bind(null, u.id)}
                        boton="Contraseña temporal"
                        variante="neutro"
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
        params={{ q }}
      />
    </PaginaAdmin>
  );
}
