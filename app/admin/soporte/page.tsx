import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
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

const TONO_TICKET: Record<string, TonoInsignia> = {
  abierto: "ambar",
  en_curso: "azul",
  resuelto: "verde",
  cerrado: "gris",
};

const ETIQUETAS_ESTADO: Record<string, string> = {
  abierto: "Abierto",
  en_curso: "En curso",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
};

const TONO_PRIORIDAD: Record<string, TonoInsignia> = {
  baja: "gris",
  normal: "azul",
  alta: "ambar",
  urgente: "rojo",
};

const ETIQUETAS_PRIORIDAD: Record<string, string> = {
  baja: "Baja",
  normal: "Normal",
  alta: "Alta",
  urgente: "Urgente",
};

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
  const nombre = new Map(negocios.map((n) => [n.id, n.nombre]));

  const filtrados = tickets
    .filter((t) => !estado || t.estado === estado)
    .filter(
      (t) =>
        !q ||
        t.asunto.toLowerCase().includes(q) ||
        (nombre.get(t.negocio_id) ?? "").toLowerCase().includes(q) ||
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
      <Tabla
        columnas={["Asunto", "Negocio", "Estado", "Prioridad", "Actualizado"]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((t) => (
          <tr key={t.id}>
            <Celda>
              <Link
                href={`/admin/soporte/${t.id}`}
                className="font-medium text-sky-700 hover:underline"
              >
                {t.asunto}
              </Link>
            </Celda>
            <Celda>{nombre.get(t.negocio_id) ?? "—"}</Celda>
            <Celda>
              <Insignia tono={TONO_TICKET[t.estado] ?? "gris"}>
                {ETIQUETAS_ESTADO[t.estado] ?? t.estado}
              </Insignia>
            </Celda>
            <Celda>
              <Insignia tono={TONO_PRIORIDAD[t.prioridad] ?? "gris"}>
                {ETIQUETAS_PRIORIDAD[t.prioridad] ?? t.prioridad}
              </Insignia>
            </Celda>
            <Celda>{fechaHora(t.actualizado_en)}</Celda>
          </tr>
        ))}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/soporte"
        params={{ estado, q }}
      />
    </PaginaAdmin>
  );
}
