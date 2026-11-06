import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { COLUMNAS_NEGOCIO_LISTADO } from "../../../lib/data/columnas";
import { tienePermiso } from "../../../lib/roles";
import { parametro } from "../../../lib/admin/formato";
import { NegociosAdminClient } from "../../../components/admin/NegociosAdminClient";

type Busqueda = Promise<Record<string, string | string[] | undefined>>;

export default async function NegociosPage({
  searchParams,
}: {
  searchParams: Busqueda;
}) {
  // Solo las columnas del listado: IBAN, cliente Stripe y user_id no deben viajar al navegador.
  // Para el conteo de reservas basta una columna por fila.
  const [admin, sp, negocios, reservas] = await Promise.all([
    requerirAdmin("negocios_ver"),
    searchParams,
    leer("negocios", { columnas: COLUMNAS_NEGOCIO_LISTADO }),
    leer("reservas", { columnas: ["negocio_id"] }),
  ]);
  const q = (parametro(sp.q) ?? "").trim();
  const estado = parametro(sp.estado) ?? "";
  const pagina = Number.parseInt(parametro(sp.pagina) ?? "1", 10);
  const abrirNuevo = parametro(sp.nuevo) === "1";

  const reservasPorNegocio: Record<string, number> = {};
  for (const r of reservas) {
    reservasPorNegocio[r.negocio_id] =
      (reservasPorNegocio[r.negocio_id] ?? 0) + 1;
  }

  const puedeGestionar = tienePermiso(admin.rol, "negocios_gestionar");

  return (
    <NegociosAdminClient
      negociosIniciales={negocios}
      reservasPorNegocio={reservasPorNegocio}
      puedeGestionar={puedeGestionar}
      qInicial={q}
      estadoInicial={estado}
      paginaInicial={Number.isFinite(pagina) ? pagina : 1}
      abrirNuevoInicial={abrirNuevo && puedeGestionar}
    />
  );
}
