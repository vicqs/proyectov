import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import {
  calcularMrr,
  cargarPlataforma,
  indexar,
  montoReserva,
} from "../../../lib/admin/datos";
import { fechaHora, usd } from "../../../lib/admin/formato";
import { esCobroPasarela, esTrxPasarela } from "../../../lib/pagos";
import {
  CLASE_BOTON_NEUTRO,
  Celda,
  Estadistica,
  PaginaAdmin,
  Tabla,
  Tarjeta,
} from "../../../components/admin/ui";

export default async function FinanzasAdminPage() {
  await requerirAdmin("finanzas");
  const { negocios, servicios, reservas, planes } = await cargarPlataforma();
  const reembolsos = await leer("reembolsos").catch(() => []);

  const vivos = negocios.filter((n) => !n.eliminado_en);
  const idx = indexar(servicios);
  const nombreNegocio = new Map(negocios.map((n) => [n.id, n.nombre]));
  const pagadas = reservas.filter(esCobroPasarela);

  const mrr = calcularMrr(vivos, planes);
  const volumenTotal = pagadas.reduce((a, r) => a + montoReserva(r, idx), 0);

  // Volumen por mes (últimos 6) y por negocio.
  const porMes = new Map<string, number>();
  const porNegocio = new Map<string, number>();
  for (const r of pagadas) {
    const monto = montoReserva(r, idx);
    const mes = r.fecha_hora.slice(0, 7);
    porMes.set(mes, (porMes.get(mes) ?? 0) + monto);
    porNegocio.set(r.negocio_id, (porNegocio.get(r.negocio_id) ?? 0) + monto);
  }
  const meses = [...porMes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6);
  const top = [...porNegocio.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Conciliación: discrepancias entre reservas, pagos y reembolsos.
  const hace24h = Date.now() - 86_400_000;
  const reembolsadas = new Set(reembolsos.map((r) => r.reserva_id));
  const conteoTrx = new Map<string, number>();
  for (const r of reservas) {
    if (r.trx_id && esTrxPasarela(r.trx_id))
      conteoTrx.set(r.trx_id, (conteoTrx.get(r.trx_id) ?? 0) + 1);
  }
  const discrepancias: {
    reserva: string;
    negocio: string;
    problema: string;
    fecha: string;
  }[] = [];
  for (const r of reservas) {
    const base = {
      reserva: r.id,
      negocio: nombreNegocio.get(r.negocio_id) ?? "—",
      fecha: r.fecha_hora,
    };
    if (r.estado === "pagada" && !r.trx_id) {
      discrepancias.push({
        ...base,
        problema: "Pagada sin transacción bancaria",
      });
    }
    if (
      esCobroPasarela(r) &&
      (r.monto_usd === null || r.monto_usd === undefined)
    ) {
      discrepancias.push({ ...base, problema: "Pagada sin monto registrado" });
    }
    if (
      r.estado === "pendiente" &&
      new Date(r.fecha_hora).getTime() < hace24h
    ) {
      discrepancias.push({
        ...base,
        problema: "Pendiente con fecha ya vencida",
      });
    }
    if (
      r.estado === "cancelada" &&
      esTrxPasarela(r.trx_id) &&
      !reembolsadas.has(r.id)
    ) {
      discrepancias.push({
        ...base,
        problema: "Cancelada con pago sin reembolso registrado",
      });
    }
    if (r.trx_id && esTrxPasarela(r.trx_id) && (conteoTrx.get(r.trx_id) ?? 0) > 1) {
      discrepancias.push({
        ...base,
        problema: `Transacción duplicada (${r.trx_id})`,
      });
    }
  }

  return (
    <PaginaAdmin
      titulo="Finanzas de la plataforma"
      descripcion="Ingresos por suscripción y volumen de reservas de todos los negocios."
      accion={
        <a href="/admin/exportar/finanzas" className={CLASE_BOTON_NEUTRO}>
          Exportar CSV
        </a>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Estadistica
          titulo="MRR"
          valor={usd(mrr)}
          tono="bueno"
          nota="Suscripciones activas con descuento"
        />
        <Estadistica titulo="ARR estimado" valor={usd(mrr * 12)} />
        <Estadistica
          titulo="Volumen cobrado"
          valor={usd(volumenTotal)}
          nota={`${pagadas.length} reservas pagadas`}
        />
        <Estadistica
          titulo="Discrepancias"
          valor={String(discrepancias.length)}
          tono={discrepancias.length > 0 ? "malo" : "bueno"}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Volumen por mes">
          <Tabla columnas={["Mes", "Volumen"]} vacia={meses.length === 0}>
            {meses.map(([mes, monto]) => (
              <tr key={mes}>
                <Celda>{mes}</Celda>
                <Celda>{usd(monto)}</Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
        <Tarjeta titulo="Top negocios por volumen">
          <Tabla columnas={["Negocio", "Volumen"]} vacia={top.length === 0}>
            {top.map(([id, monto]) => (
              <tr key={id}>
                <Celda>
                  <Link
                    href={`/admin/negocios/${id}`}
                    className="text-sky-700 hover:underline"
                  >
                    {nombreNegocio.get(id) ?? id}
                  </Link>
                </Celda>
                <Celda>{usd(monto)}</Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
      </div>

      <Tarjeta
        titulo="Conciliación"
        descripcion="Reservas cuyo estado no coincide con su pago o reembolso."
      >
        <Tabla
          columnas={["Negocio", "Reserva", "Fecha", "Problema"]}
          vacia={discrepancias.length === 0}
          vacio="Sin discrepancias."
        >
          {discrepancias.slice(0, 100).map((d, i) => (
            <tr key={`${d.reserva}-${i}`}>
              <Celda>{d.negocio}</Celda>
              <Celda className="font-mono text-xs">{d.reserva}</Celda>
              <Celda>{fechaHora(d.fecha)}</Celda>
              <Celda>{d.problema}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </PaginaAdmin>
  );
}
