import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import {
  indexar,
  montoReserva,
  ETIQUETA_ESTADO,
} from "../../../lib/admin/datos";
import { fechaHora, paginar, parametro, usd } from "../../../lib/admin/formato";
import { admiteReembolsoPasarela, esPagoManual } from "../../../lib/pagos";
import {
  cancelarReservaAction,
  completarReembolsoAction,
  registrarReembolsoAction,
} from "../../../actions/admin/reservas";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_INPUT,
  Celda,
  FiltrosGet,
  Insignia,
  PaginaAdmin,
  Paginacion,
  Tabla,
  Tarjeta,
  type TonoInsignia,
} from "../../../components/admin/ui";

const TONO: Record<string, TonoInsignia> = {
  pagada: "verde",
  pendiente: "ambar",
  cancelada: "rojo",
};

export default async function ReservasAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requerirAdmin("reservas");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const estado = parametro(sp.estado) ?? "";
  const negocioId = parametro(sp.negocio) ?? "";

  const [reservas, servicios, negocios, reembolsos] = await Promise.all([
    leer("reservas"),
    leer("servicios"),
    leer("negocios"),
    leer("reembolsos").catch(() => []),
  ]);
  const idx = indexar(servicios);
  const nombreNegocio = new Map(negocios.map((n) => [n.id, n.nombre]));
  const conReembolso = new Set(reembolsos.map((r) => r.reserva_id));

  const filtradas = reservas
    .filter((r) => !estado || r.estado === estado)
    .filter((r) => !negocioId || r.negocio_id === negocioId)
    .filter(
      (r) =>
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.email_cliente.toLowerCase().includes(q) ||
        (r.trx_id ?? "").toLowerCase().includes(q),
    )
    .sort((a, b) => b.fecha_hora.localeCompare(a.fecha_hora));
  const pag = paginar(filtradas, parametro(sp.pagina));
  const pendientes = reembolsos.filter((r) => r.estado === "pendiente");

  return (
    <PaginaAdmin
      titulo="Reservas globales"
      descripcion="Busca y corrige reservas de cualquier negocio."
      accion={
        <a href="/admin/exportar/reservas" className={CLASE_BOTON_NEUTRO}>
          Exportar CSV
        </a>
      }
    >
      {pendientes.length > 0 && (
        <Tarjeta titulo="Reembolsos pendientes">
          <Tabla columnas={["Negocio", "Reserva", "Monto", "Motivo", ""]}>
            {pendientes.map((r) => (
              <tr key={r.id}>
                <Celda>{nombreNegocio.get(r.negocio_id) ?? "—"}</Celda>
                <Celda className="font-mono text-xs">{r.reserva_id}</Celda>
                <Celda>{usd(r.monto_usd)}</Celda>
                <Celda>{r.motivo}</Celda>
                <Celda>
                  <AccionForm
                    accion={completarReembolsoAction.bind(null, r.id)}
                    boton="Marcar completado"
                    variante="neutro"
                    confirmar="¿Confirmas que el dinero ya fue devuelto al cliente?"
                  />
                </Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
      )}

      <FiltrosGet>
        <input
          name="q"
          defaultValue={q}
          aria-label="Correo, id o transacción" placeholder="Correo, id o transacción"
          className={`${CLASE_INPUT} sm:w-64`}
        />
        <select
          name="estado"
          defaultValue={estado}
          className={`${CLASE_INPUT} sm:w-40`}
        >
          <option value="">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="pagada">Pagada</option>
          <option value="cancelada">Cancelada</option>
        </select>
        <select
          name="negocio"
          defaultValue={negocioId}
          className={`${CLASE_INPUT} sm:w-56`}
        >
          <option value="">Todos los negocios</option>
          {negocios.map((n) => (
            <option key={n.id} value={n.id}>
              {n.nombre}
            </option>
          ))}
        </select>
      </FiltrosGet>

      <Tabla
        columnas={[
          "Fecha",
          "Negocio / servicio",
          "Cliente",
          "Estado",
          "Monto",
          "Acciones",
        ]}
        vacia={pag.filas.length === 0}
      >
        {pag.filas.map((r) => {
          const monto = montoReserva(r, idx);
          const puedeReembolsar =
            admiteReembolsoPasarela(r) && !conReembolso.has(r.id);
          return (
            <tr key={r.id}>
              <Celda>{fechaHora(r.fecha_hora)}</Celda>
              <Celda>
                <Link
                  href={`/admin/negocios/${r.negocio_id}`}
                  className="font-medium text-sky-700 hover:underline"
                >
                  {nombreNegocio.get(r.negocio_id) ?? "—"}
                </Link>
                <p className="text-xs text-slate-400">
                  {idx.get(r.servicio_id)?.nombre ?? "—"}
                </p>
              </Celda>
              <Celda>
                {r.email_cliente}
                {r.trx_id && (
                  <p className="text-xs text-slate-400">
                    {esPagoManual(r.trx_id)
                      ? "Pago manual (fuera de pasarela)"
                      : `trx ${r.trx_id}`}
                  </p>
                )}
              </Celda>
              <Celda>
                <Insignia tono={TONO[r.estado] ?? "gris"}>
                  {ETIQUETA_ESTADO[r.estado] ?? r.estado}
                </Insignia>
                {conReembolso.has(r.id) && (
                  <p className="mt-1 text-xs text-slate-400">Con reembolso</p>
                )}
              </Celda>
              <Celda>{usd(monto)}</Celda>
              <Celda>
                <div className="space-y-2">
                  {r.estado !== "cancelada" && (
                    <AccionForm
                      accion={cancelarReservaAction.bind(null, r.id)}
                      boton="Cancelar"
                      variante="peligro"
                      confirmar="¿Cancelar esta reserva? Se libera el cupo."
                    />
                  )}
                  {puedeReembolsar && (
                    <details>
                      <summary className="cursor-pointer text-sm text-sky-700">
                        Reembolsar
                      </summary>
                      <div className="mt-2">
                        <AccionForm
                          accion={registrarReembolsoAction.bind(null, r.id)}
                          boton="Registrar reembolso"
                          variante="neutro"
                        >
                          <input
                            name="monto_usd"
                            type="number"
                            step="0.01"
                            min={0.01}
                            max={monto}
                            defaultValue={monto}
                            className={CLASE_INPUT}
                          />
                          <input
                            name="motivo"
                            required
                            aria-label="Motivo" placeholder="Motivo"
                            className={CLASE_INPUT}
                          />
                        </AccionForm>
                      </div>
                    </details>
                  )}
                </div>
              </Celda>
            </tr>
          );
        })}
      </Tabla>
      <Paginacion
        pagina={pag.pagina}
        paginas={pag.paginas}
        total={pag.total}
        base="/admin/reservas"
        params={{ q, estado, negocio: negocioId }}
      />
    </PaginaAdmin>
  );
}
