import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import { tienePermiso } from "../../../lib/roles";
import { fechaCorta, paginar, parametro } from "../../../lib/admin/formato";
import {
  CLASE_BOTON,
  CLASE_INPUT,
  Celda,
  FiltrosGet,
  PaginaAdmin,
  Paginacion,
  Tabla,
} from "../../../components/admin/ui";
import { InsigniaNegocio } from "../../../components/admin/InsigniaNegocio";

type Busqueda = Promise<Record<string, string | string[] | undefined>>;

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Busqueda;
}) {
  const admin = await requerirAdmin("negocios_ver");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const estado = parametro(sp.estado) ?? "";

  const [negocios, reservas] = await Promise.all([
    leer("negocios"),
    leer("reservas"),
  ]);
  const reservasPorNegocio = new Map<string, number>();
  for (const r of reservas) {
    reservasPorNegocio.set(
      r.negocio_id,
      (reservasPorNegocio.get(r.negocio_id) ?? 0) + 1,
    );
  }

  const filtrados = negocios
    .filter((n) => {
      if (estado === "eliminado") return !!n.eliminado_en;
      if (n.eliminado_en) return false;
      if (estado === "suspendido") return !!n.suspendido;
      if (estado === "activa" || estado === "prueba" || estado === "inactiva") {
        return estadoEfectivo(n) === estado;
      }
      return true;
    })
    .filter(
      (n) =>
        !q ||
        n.nombre.toLowerCase().includes(q) ||
        n.slug.toLowerCase().includes(q),
    )
    .sort((a, b) => (b.creado_en ?? "").localeCompare(a.creado_en ?? ""));

  const pag = paginar(filtrados, parametro(sp.pagina));

  return (
    <PaginaAdmin
      titulo="Negocios"
      descripcion="Todas las empresas registradas en la plataforma."
      accion={
        tienePermiso(admin.rol, "negocios_gestionar") ? (
          <Link href="/admin/negocios/nuevo" className={CLASE_BOTON}>
            Nuevo negocio
          </Link>
        ) : undefined
      }
    >
      <FiltrosGet>
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nombre o slug"
          className={`${CLASE_INPUT} sm:w-64`}
          aria-label="Buscar"
        />
        <select
          name="estado"
          defaultValue={estado}
          className={`${CLASE_INPUT} sm:w-44`}
          aria-label="Estado"
        >
          <option value="">Todos (sin eliminados)</option>
          <option value="activa">Activos</option>
          <option value="prueba">En prueba</option>
          <option value="inactiva">Inactivos</option>
          <option value="suspendido">Suspendidos</option>
          <option value="eliminado">Eliminados</option>
        </select>
      </FiltrosGet>

      <Tabla
        columnas={["Negocio", "Estado", "Reservas", "Alta", ""]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((n) => (
          <tr key={n.id}>
            <Celda>
              <p className="font-medium text-slate-900">{n.nombre}</p>
              <p className="text-xs text-slate-500">/{n.slug}</p>
            </Celda>
            <Celda>
              <InsigniaNegocio negocio={n} />
            </Celda>
            <Celda>{reservasPorNegocio.get(n.id) ?? 0}</Celda>
            <Celda>{fechaCorta(n.creado_en)}</Celda>
            <Celda className="text-right">
              <Link
                href={`/admin/negocios/${n.id}`}
                className="font-medium text-sky-700 hover:underline"
              >
                Gestionar
              </Link>
            </Celda>
          </tr>
        ))}
      </Tabla>
      <Paginacion
        {...pag}
        base="/admin/negocios"
        params={{ q: q || undefined, estado: estado || undefined }}
      />
    </PaginaAdmin>
  );
}
