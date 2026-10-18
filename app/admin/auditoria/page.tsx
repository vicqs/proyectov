import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_INPUT,
  Celda,
  FiltrosGet,
  PaginaAdmin,
  Paginacion,
  Tabla,
} from "../../../components/admin/ui";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("auditoria");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const [registros, negocios] = await Promise.all([
    leer("auditoria", { orden: ["creado_en", false] }),
    leer("negocios"),
  ]);
  const nombre = new Map(negocios.map((n) => [n.id, n.nombre]));
  const filtrados = registros
    .filter(
      (a) =>
        !q ||
        a.accion.toLowerCase().includes(q) ||
        a.actor_email.toLowerCase().includes(q) ||
        (nombre.get(a.negocio_id ?? "") ?? "").toLowerCase().includes(q),
    )
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en));
  const pag = paginar(filtrados, parametro(sp.pagina), 40);

  return (
    <PaginaAdmin
      titulo="Auditoría"
      descripcion="Registro inmutable de acciones administrativas y eventos de empresas."
      accion={
        <a href="/admin/exportar/auditoria" className={CLASE_BOTON_NEUTRO}>
          Exportar CSV
        </a>
      }
    >
      <FiltrosGet>
        <input
          name="q"
          defaultValue={q}
          aria-label="Acción, actor o negocio" placeholder="Acción, actor o negocio"
          className={`${CLASE_INPUT} sm:w-72`}
        />
      </FiltrosGet>
      <Tabla
        columnas={["Fecha", "Actor", "Acción", "Entidad", "Negocio", "Detalle"]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((a) => (
          <tr key={a.id}>
            <Celda>{fechaHora(a.creado_en)}</Celda>
            <Celda>
              {a.actor_email}
              <p className="text-xs text-slate-400">{a.actor_rol}</p>
            </Celda>
            <Celda className="font-mono text-xs">{a.accion}</Celda>
            <Celda>{a.entidad}</Celda>
            <Celda>
              {a.negocio_id ? (nombre.get(a.negocio_id) ?? "—") : "—"}
            </Celda>
            <Celda className="max-w-xs break-words text-xs text-slate-500">
              {a.detalle ? JSON.stringify(a.detalle) : ""}
            </Celda>
          </tr>
        ))}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/auditoria"
        params={{ q }}
      />
    </PaginaAdmin>
  );
}
