import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, parametro } from "../../../lib/admin/formato";
import { resolverReporteAction } from "../../../actions/admin/moderacion";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_INPUT,
  Celda,
  FiltrosGet,
  Insignia,
  PaginaAdmin,
  Tabla,
  type TonoInsignia,
} from "../../../components/admin/ui";

const TONO: Record<string, TonoInsignia> = {
  pendiente: "ambar",
  atendido: "verde",
  descartado: "gris",
};

export default async function ModeracionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("moderacion");
  const sp = await searchParams;
  const estado = parametro(sp.estado) ?? "pendiente";
  const [reportes, negocios] = await Promise.all([
    leer("reportes_perfil"),
    leer("negocios"),
  ]);
  const negocio = new Map(negocios.map((n) => [n.id, n]));
  const lista = reportes
    .filter((r) => !estado || estado === "todos" || r.estado === estado)
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
    .slice(0, 100);

  return (
    <PaginaAdmin
      titulo="Moderación"
      descripcion="Reportes de perfiles públicos. Para suspender un negocio, ábrelo desde su ficha."
    >
      <FiltrosGet>
        <select
          name="estado"
          defaultValue={estado}
          className={`${CLASE_INPUT} sm:w-44`}
        >
          <option value="pendiente">Pendientes</option>
          <option value="atendido">Atendidos</option>
          <option value="descartado">Descartados</option>
          <option value="todos">Todos</option>
        </select>
      </FiltrosGet>
      <Tabla
        columnas={["Fecha", "Negocio", "Motivo", "Estado", "Acciones"]}
        vacia={lista.length === 0}
      >
        {lista.map((r) => {
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
                      className="text-slate-400 hover:underline"
                    >
                      Ver perfil público
                    </Link>
                  </p>
                )}
              </Celda>
              <Celda>
                <p className="font-medium">{r.motivo}</p>
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
                <Insignia tono={TONO[r.estado] ?? "gris"}>{r.estado}</Insignia>
                {r.resuelto_por && (
                  <p className="text-xs text-slate-400">{r.resuelto_por}</p>
                )}
              </Celda>
              <Celda>
                {r.estado === "pendiente" ? (
                  <div className="flex gap-2">
                    <AccionForm
                      accion={resolverReporteAction.bind(null, r.id)}
                      boton="Atendido"
                    >
                      <input type="hidden" name="estado" value="atendido" />
                    </AccionForm>
                    <AccionForm
                      accion={resolverReporteAction.bind(null, r.id)}
                      boton="Descartar"
                      variante="neutro"
                    >
                      <input type="hidden" name="estado" value="descartado" />
                    </AccionForm>
                  </div>
                ) : (
                  <AccionForm
                    accion={resolverReporteAction.bind(null, r.id)}
                    boton="Reabrir"
                    variante="neutro"
                  >
                    <input type="hidden" name="estado" value="pendiente" />
                  </AccionForm>
                )}
              </Celda>
            </tr>
          );
        })}
      </Tabla>
    </PaginaAdmin>
  );
}
