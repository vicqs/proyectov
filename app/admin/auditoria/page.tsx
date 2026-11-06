import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
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
  type TonoInsignia,
} from "../../../components/admin/ui";

const FORMATO_ENTIDAD: Record<string, { texto: string; tono: TonoInsignia }> = {
  negocio: { texto: "Negocio", tono: "azul" },
  reporte: { texto: "Reporte", tono: "ambar" },
  ticket: { texto: "Ticket", tono: "azul" },
  configuracion: { texto: "Configuración", tono: "gris" },
  configuración: { texto: "Configuración", tono: "gris" },
  usuario: { texto: "Usuario", tono: "azul" },
  reserva: { texto: "Reserva", tono: "verde" },
  reembolso: { texto: "Reembolso", tono: "ambar" },
  anuncio: { texto: "Anuncio", tono: "gris" },
  comunicado: { texto: "Comunicado", tono: "gris" },
  plan: { texto: "Plan", tono: "azul" },
  sistema: { texto: "Sistema", tono: "gris" },
  registro_sistema: { texto: "Sistema", tono: "gris" },
};

function renderEntidadBadge(entidad: string) {
  const clave = (entidad ?? "").trim().toLowerCase();
  const conf = FORMATO_ENTIDAD[clave];
  if (conf) {
    return <Insignia tono={conf.tono}>{conf.texto}</Insignia>;
  }
  const texto = entidad ? entidad.charAt(0).toUpperCase() + entidad.slice(1) : "—";
  return <Insignia tono="gris">{texto}</Insignia>;
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("auditoria");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const entidadFiltro = (parametro(sp.entidad) ?? "").trim().toLowerCase();

  const [registros, negocios] = await Promise.all([
    leer("auditoria", { orden: ["creado_en", false], limite: 500 }),
    leer("negocios"),
  ]);
  const nombre = new Map(negocios.map((n) => [n.id, n.nombre]));
  const filtrados = registros
    .filter(
      (a) =>
        !q ||
        a.accion.toLowerCase().includes(q) ||
        a.actor_email.toLowerCase().includes(q) ||
        (a.negocio_id && a.negocio_id.toLowerCase().includes(q)) ||
        (nombre.get(a.negocio_id ?? "") ?? "").toLowerCase().includes(q),
    )
    .filter((a) => {
      if (!entidadFiltro) return true;
      const e = (a.entidad ?? "").trim().toLowerCase();
      if (entidadFiltro === "configuracion") {
        return e === "configuracion" || e === "configuración";
      }
      if (entidadFiltro === "sistema") {
        return e === "sistema" || e === "registro_sistema";
      }
      return e === entidadFiltro;
    })
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
        <CampoBusqueda
          defaultValue={q}
          placeholder="Acción, actor o negocio..."
          ariaLabel="Acción, actor o negocio"
          className="sm:w-80"
        />
        <select
          name="entidad"
          defaultValue={entidadFiltro}
          aria-label="Filtrar por entidad"
          className={CLASE_SELECT}
        >
          <option value="">Todas las entidades</option>
          <option value="negocio">Negocio</option>
          <option value="reserva">Reserva</option>
          <option value="reembolso">Reembolso</option>
          <option value="transaccion">Transacción</option>
          <option value="ticket">Ticket</option>
          <option value="reporte">Reporte</option>
          <option value="usuario">Usuario</option>
          <option value="plan">Plan</option>
          <option value="anuncio">Anuncio</option>
          <option value="comunicado">Comunicado</option>
          <option value="configuracion">Configuración</option>
          <option value="sistema">Sistema</option>
        </select>
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
            <Celda>
              <span className="inline-block rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                {a.accion}
              </span>
            </Celda>
            <Celda>{renderEntidadBadge(a.entidad)}</Celda>
            <Celda>
              {a.negocio_id ? (nombre.get(a.negocio_id) ?? "—") : "—"}
            </Celda>
            <Celda className="max-w-xs text-xs text-slate-600">
              {a.detalle && typeof a.detalle === "object" ? (
                <details className="cursor-pointer">
                  <summary className="font-mono text-xs text-sky-700 hover:underline">
                    Ver datos ({Object.keys(a.detalle).length})
                  </summary>
                  <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-sky-200 whitespace-pre-wrap select-all">
                    {JSON.stringify(a.detalle, null, 2)}
                  </pre>
                </details>
              ) : a.detalle ? (
                <span className="font-mono text-[11px] text-slate-500">
                  {String(a.detalle)}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )}
            </Celda>
          </tr>
        ))}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/auditoria"
        params={{ q, entidad: entidadFiltro }}
      />
    </PaginaAdmin>
  );
}
