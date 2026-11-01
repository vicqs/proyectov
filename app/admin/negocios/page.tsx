import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import { tienePermiso } from "../../../lib/roles";
import { fechaCorta, paginar, parametro } from "../../../lib/admin/formato";
import {
  CLASE_BOTON,
  CLASE_BOTON_NEUTRO,
  CampoBusqueda,
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

  const conteos = {
    todos: negocios.filter((n) => !n.eliminado_en).length,
    activa: negocios.filter((n) => !n.eliminado_en && estadoEfectivo(n) === "activa").length,
    prueba: negocios.filter((n) => !n.eliminado_en && estadoEfectivo(n) === "prueba").length,
    inactiva: negocios.filter((n) => !n.eliminado_en && estadoEfectivo(n) === "inactiva").length,
    suspendido: negocios.filter((n) => !n.eliminado_en && n.suspendido).length,
    eliminado: negocios.filter((n) => !!n.eliminado_en).length,
  };

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
        <div className="flex flex-wrap items-center gap-2">
          <a href="/admin/exportar/negocios" className={CLASE_BOTON_NEUTRO}>
            Exportar CSV
          </a>
          {tienePermiso(admin.rol, "negocios_gestionar") && (
            <Link href="/admin/negocios/nuevo" className={CLASE_BOTON}>
              Nuevo negocio
            </Link>
          )}
        </div>
      }
    >
      <div className="space-y-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
        <div
          role="group"
          aria-label="Filtrar por estado del negocio"
          className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-3"
        >
          {[
            { id: "", etiqueta: "Todos", conteo: conteos.todos },
            { id: "activa", etiqueta: "Activos", conteo: conteos.activa },
            { id: "prueba", etiqueta: "En prueba", conteo: conteos.prueba },
            { id: "inactiva", etiqueta: "Inactivos", conteo: conteos.inactiva },
            { id: "suspendido", etiqueta: "Suspendidos", conteo: conteos.suspendido },
            { id: "eliminado", etiqueta: "Eliminados", conteo: conteos.eliminado },
          ].map((tab) => {
            const on = estado === tab.id;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (tab.id) params.set("estado", tab.id);
            const href = `/admin/negocios?${params.toString()}`;
            return (
              <Link
                key={tab.id}
                href={href}
                className={`vuki-tab-pill ${on ? "vuki-tab-pill-active" : ""}`}
              >
                {tab.etiqueta}
                <span
                  className={
                    on ? "vuki-tab-pill-badge-active" : "vuki-tab-pill-badge"
                  }
                >
                  {tab.conteo}
                </span>
              </Link>
            );
          })}
        </div>

        <FiltrosGet>
          <input type="hidden" name="estado" value={estado} />
          <CampoBusqueda
            defaultValue={q}
            placeholder="Buscar por nombre o slug..."
            ariaLabel="Buscar por nombre o slug"
            className="sm:w-80"
          />
        </FiltrosGet>
      </div>

      <Tabla
        columnas={["Negocio", "Estado", "Reservas", "Alta", ""]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((n) => (
          <tr key={n.id}>
            <Celda>
              <Link
                href={`/admin/negocios/${n.id}`}
                className="font-medium text-slate-900 hover:text-sky-700 hover:underline"
              >
                {n.nombre}
              </Link>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span>/{n.slug}</span>
                {!n.eliminado_en && (
                  <>
                    <span>·</span>
                    <Link
                      href={`/${n.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-sky-700 hover:underline"
                      title="Ver perfil público"
                    >
                      Público ↗
                    </Link>
                  </>
                )}
              </div>
            </Celda>
            <Celda>
              <InsigniaNegocio negocio={n} />
            </Celda>
            <Celda>{reservasPorNegocio.get(n.id) ?? 0}</Celda>
            <Celda>{fechaCorta(n.creado_en)}</Celda>
            <Celda className="text-right">
              <Link
                href={`/admin/negocios/${n.id}`}
                className="font-semibold text-sky-700 hover:underline text-xs"
              >
                Gestionar →
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
