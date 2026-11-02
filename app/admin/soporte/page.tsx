import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { paginar, parametro } from "../../../lib/admin/formato";
import {
  CLASE_SELECT,
  CampoBusqueda,
  FiltrosGet,
  PaginaAdmin,
} from "../../../components/admin/ui";
import { SoporteAdminClient } from "../../../components/admin/SoporteAdminClient";

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("soporte");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const estado = parametro(sp.estado) ?? "";

  const [tickets, negocios] = await Promise.all([
    leer("tickets"),
    leer("negocios"),
  ]);
  const nombreMap = Object.fromEntries(negocios.map((n) => [n.id, n.nombre]));

  const filtrados = tickets
    .filter((t) => !estado || t.estado === estado)
    .filter(
      (t) =>
        !q ||
        t.asunto.toLowerCase().includes(q) ||
        (nombreMap[t.negocio_id] ?? "").toLowerCase().includes(q) ||
        t.creado_por.toLowerCase().includes(q),
    )
    .sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en));

  const pag = paginar(filtrados, parametro(sp.pagina));
  const abiertos = tickets.filter((t) => t.estado === "abierto").length;

  return (
    <PaginaAdmin
      titulo="Soporte"
      descripcion={`${abiertos} ticket(s) sin atender.`}
    >
      <FiltrosGet>
        <CampoBusqueda
          defaultValue={q}
          placeholder="Buscar por asunto o negocio..."
          ariaLabel="Buscar tickets"
          className="sm:w-72"
        />
        <select
          name="estado"
          defaultValue={estado}
          aria-label="Estado del ticket"
          className={CLASE_SELECT}
        >
          <option value="">Todos los estados</option>
          <option value="abierto">Abierto</option>
          <option value="en_curso">En curso</option>
          <option value="resuelto">Resuelto</option>
          <option value="cerrado">Cerrado</option>
        </select>
      </FiltrosGet>

      <SoporteAdminClient
        filas={pag.filas}
        negociosMap={nombreMap}
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        estado={estado}
        q={q}
        ticketIdInicial={parametro(sp.ticketId)}
      />
    </PaginaAdmin>
  );
}
