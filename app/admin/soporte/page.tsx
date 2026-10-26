import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
import {
  CLASE_INPUT,
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

export default async function SoportePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("soporte");
  const sp = await searchParams;
  const estado = parametro(sp.estado) ?? "";
  const [tickets, negocios] = await Promise.all([
    leer("tickets"),
    leer("negocios"),
  ]);
  const nombre = new Map(negocios.map((n) => [n.id, n.nombre]));
  const filtrados = tickets
    .filter((t) => !estado || t.estado === estado)
    .sort((a, b) => b.actualizado_en.localeCompare(a.actualizado_en));
  const pag = paginar(filtrados, parametro(sp.pagina));
  const abiertos = tickets.filter((t) => t.estado === "abierto").length;

  return (
    <PaginaAdmin
      titulo="Soporte"
      descripcion={`${abiertos} ticket(s) sin atender.`}
    >
      <FiltrosGet>
        <select
          name="estado"
          defaultValue={estado}
          aria-label="Estado del ticket"
          className={`${CLASE_INPUT} sm:w-44`}
        >
          <option value="">Todos</option>
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
                {t.estado.replace("_", " ")}
              </Insignia>
            </Celda>
            <Celda>{t.prioridad}</Celda>
            <Celda>{fechaHora(t.actualizado_en)}</Celda>
          </tr>
        ))}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/soporte"
        params={{ estado }}
      />
    </PaginaAdmin>
  );
}
