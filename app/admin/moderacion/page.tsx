import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
import { resolverReporteAction } from "../../../actions/admin/moderacion";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_SELECT,
  CampoBusqueda,
  Celda,
  FiltrosGet,
  Insignia,
  PaginaAdmin,
  Paginacion,
  Tabla,
  type TonoInsignia,
} from "../../../components/admin/ui";

const TONO: Record<string, TonoInsignia> = {
  pendiente: "ambar",
  atendido: "verde",
  descartado: "gris",
};

const ETIQUETAS: Record<string, string> = {
  pendiente: "Pendiente",
  atendido: "Atendido",
  descartado: "Descartado",
};

export default async function ModeracionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("moderacion");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const estado = parametro(sp.estado) ?? "";
  const [reportes, negocios] = await Promise.all([
    leer("reportes_perfil"),
    leer("negocios"),
  ]);
  const negocio = new Map(negocios.map((n) => [n.id, n]));
  const lista = reportes
    .filter((r) => !estado || estado === "todos" || r.estado === estado)
    .filter((r) => {
      if (!q) return true;
      const nom = negocio.get(r.negocio_id)?.nombre?.toLowerCase() ?? "";
      return (
        nom.includes(q) ||
        r.motivo.toLowerCase().includes(q) ||
        (r.detalle ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en));

  const pag = paginar(lista, parametro(sp.pagina), 25);
  const pendientes = reportes.filter((r) => r.estado === "pendiente").length;

  return (
    <PaginaAdmin
      titulo="Moderación"
      descripcion={`${pendientes} reporte(s) pendiente(s). Para suspender un negocio, ábrelo desde su ficha.`}
    >
      <FiltrosGet>
        <CampoBusqueda
          defaultValue={q}
          placeholder="Buscar negocio o motivo..."
          ariaLabel="Buscar reportes"
          className="sm:w-72"
        />
        <select
          name="estado"
          defaultValue={estado}
          className={CLASE_SELECT}
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los reportes</option>
          <option value="pendiente">Pendientes</option>
          <option value="atendido">Atendidos</option>
          <option value="descartado">Descartados</option>
        </select>
      </FiltrosGet>
      <Tabla
        columnas={["Fecha", "Negocio", "Motivo", "Estado", "Acciones"]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((r) => {
          const n = negocio.get(r.negocio_id);
          return (
            <tr key={r.id}>
              <Celda>{fechaHora(r.creado_en)}</Celda>
              <Celda>
                {n ? (
                  <Link
                    href={`/admin/negocios/${n.id}`}
                    className="font-medium text-sky-700 hover:underline"
                  >
                    {n.nombre}
                  </Link>
                ) : (
                  "—"
                )}
                {n && (
                  <p className="text-xs">
                    <Link
                      href={`/${n.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-sky-700 hover:underline"
                    >
                      Ver perfil público ↗
                    </Link>
                  </p>
                )}
              </Celda>
              <Celda>
                <p className="font-medium text-slate-900">{r.motivo}</p>
                {r.detalle && (
                  <p className="max-w-md whitespace-pre-wrap text-xs text-slate-500">
                    {r.detalle}
                  </p>
                )}
                {r.email_reportante && (
                  <p className="text-xs text-slate-400">{r.email_reportante}</p>
                )}
              </Celda>
              <Celda>
                <Insignia tono={TONO[r.estado] ?? "gris"}>
                  {ETIQUETAS[r.estado] ?? r.estado}
                </Insignia>
                {r.resuelto_por && (
                  <p className="text-xs text-slate-400">{r.resuelto_por}</p>
                )}
              </Celda>
              <Celda>
                {r.estado === "pendiente" ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <AccionForm
                      accion={resolverReporteAction.bind(null, r.id)}
                      boton="Atendido"
                      variante="acento_sm"
                      tamano="sm"
                      icono={<Check className="h-3.5 w-3.5" aria-hidden="true" />}
                    >
                      <input type="hidden" name="estado" value="atendido" />
                    </AccionForm>
                    <AccionForm
                      accion={resolverReporteAction.bind(null, r.id)}
                      boton="Descartar"
                      variante="neutro_sm"
                      tamano="sm"
                      icono={<X className="h-3.5 w-3.5" aria-hidden="true" />}
                    >
                      <input type="hidden" name="estado" value="descartado" />
                    </AccionForm>
                  </div>
                ) : (
                  <AccionForm
                    accion={resolverReporteAction.bind(null, r.id)}
                    boton="Reabrir"
                    variante="neutro_sm"
                    tamano="sm"
                    icono={<RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />}
                  >
                    <input type="hidden" name="estado" value="pendiente" />
                  </AccionForm>
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
        base="/admin/moderacion"
        params={{ estado, q }}
      />
    </PaginaAdmin>
  );
}
