import { requerirAdmin } from "../../../lib/admin/auth";
import { tienePermiso } from "../../../lib/roles";
import { leer } from "../../../lib/admin/db";
import {
  cargarPlataforma,
  indexar,
  montoReserva,
} from "../../../lib/admin/datos";
import { fechaHora, paginar, parametro } from "../../../lib/admin/formato";
import { admiteReembolsoPasarela, esPagoManual } from "../../../lib/pagos";
import {
  cancelarReservaAction,
  completarReembolsoAction,
  registrarReembolsoAction,
} from "../../../actions/admin/reservas";
import { CLASE_BOTON_NEUTRO, PaginaAdmin } from "../../../components/admin/ui";
import {
  ReservasAdminClient,
  type ReservaItemAdmin,
  type ReembolsoPendienteItem,
} from "../../../components/admin/ReservasAdminClient";

export default async function ReservasAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [admin, sp, { reservas, servicios, negocios }, reembolsos] =
    await Promise.all([
      requerirAdmin("reservas"),
      searchParams,
      cargarPlataforma(),
      leer("reembolsos").catch(() => []),
    ]);
  const puedeCompletarReembolso = tienePermiso(admin.rol, "finanzas");
  const idx = indexar(servicios);
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const estado = parametro(sp.estado) ?? "";
  const negocioId = parametro(sp.negocio) ?? "";
  const nombreNegocio = new Map(negocios.map((n) => [n.id, n.nombre]));
  const conReembolso = new Set(reembolsos.map((r) => r.reserva_id));
  const conReembolsoCompletado = new Set(
    reembolsos
      .filter((r) => r.estado === "completado")
      .map((r) => r.reserva_id),
  );

  // Conteos globales para las pestañas rápidas
  const conteos = {
    todas: reservas.length,
    pagadas: reservas.filter((r) => r.estado === "pagada").length,
    pendientes: reservas.filter((r) => r.estado === "pendiente").length,
    canceladas: reservas.filter((r) => r.estado === "cancelada").length,
    conReembolso: reservas.filter((r) => conReembolso.has(r.id)).length,
  };

  const filtradas = reservas
    .filter((r) => {
      if (!estado) return true;
      if (estado === "reembolso") return conReembolso.has(r.id);
      return r.estado === estado;
    })
    .filter((r) => !negocioId || r.negocio_id === negocioId)
    .filter(
      (r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.email_cliente.toLowerCase().includes(q) ||
        (r.trx_id ?? "").toLowerCase().includes(q) ||
        (nombreNegocio.get(r.negocio_id) ?? "").toLowerCase().includes(q) ||
        (idx.get(r.servicio_id)?.nombre ?? "").toLowerCase().includes(q),
    )
    .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));

  const pag = paginar(filtradas, parametro(sp.pagina));
  const pendientes = reembolsos.filter((r) => r.estado === "pendiente");

  const filasMapeadas: ReservaItemAdmin[] = pag.filas.map((r) => ({
    id: r.id,
    fechaHora: fechaHora(r.fecha_hora),
    emailCliente: r.email_cliente,
    trxId: r.trx_id ?? null,
    esPagoManual: esPagoManual(r.trx_id),
    estado: r.estado,
    negocioId: r.negocio_id,
    negocioNombre: nombreNegocio.get(r.negocio_id) ?? "—",
    servicioNombre: idx.get(r.servicio_id)?.nombre ?? "—",
    montoUsd: montoReserva(r, idx),
    puedeReembolsar:
      admiteReembolsoPasarela(r) && !conReembolsoCompletado.has(r.id),
    conReembolso: conReembolso.has(r.id),
  }));

  const reembolsosMapeados: ReembolsoPendienteItem[] = pendientes.map((r) => ({
    id: r.id,
    negocioNombre: nombreNegocio.get(r.negocio_id) ?? "—",
    reservaId: r.reserva_id,
    montoUsd: r.monto_usd,
    motivo: r.motivo,
  }));

  return (
    <PaginaAdmin
      titulo="Reservas globales"
      descripcion="Busca y corrige reservas de cualquier negocio con herramientas de conciliación."
      accion={
        <a href="/admin/exportar/reservas" className={CLASE_BOTON_NEUTRO}>
          Exportar CSV
        </a>
      }
    >
      <ReservasAdminClient
        reservas={filasMapeadas}
        negocios={negocios.map((n) => ({ id: n.id, nombre: n.nombre }))}
        reembolsosPendientes={reembolsosMapeados}
        conteos={conteos}
        qInicial={q}
        estadoInicial={estado}
        negocioInicial={negocioId}
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        cancelarAction={cancelarReservaAction}
        registrarReembolsoAction={registrarReembolsoAction}
        completarReembolsoAction={completarReembolsoAction}
        puedeCompletarReembolso={puedeCompletarReembolso}
      />
    </PaginaAdmin>
  );
}
