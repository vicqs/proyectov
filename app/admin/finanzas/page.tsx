import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import {
  calcularMrr,
  cargarPlataforma,
  indexar,
  montoReservaUsd,
} from "../../../lib/admin/datos";
import { fechaHora, pluralizar, usd } from "../../../lib/admin/formato";
import { redondearMoneda } from "../../../lib/monedas";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import { esCobroPasarela, esTrxPasarela } from "../../../lib/pagos";
import { obtenerConfiguracion } from "../../../lib/plataforma";
import { isStripeMockMode } from "../../../lib/stripe";
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
  const [{ negocios, servicios, reservas, planes }, reembolsos, config] =
    await Promise.all([
      cargarPlataforma(),
      leer("reembolsos").catch(() => []),
      obtenerConfiguracion().catch(() => null),
    ]);

  const vivos = negocios.filter((n) => !n.eliminado_en);
  const activas = vivos.filter((n) => estadoEfectivo(n) === "activa").length;
  const enPrueba = vivos.filter((n) => estadoEfectivo(n) === "prueba").length;
  const notaMrr =
    activas === 1 && enPrueba === 1
      ? "1 suscripción activa · 1 en prueba"
      : `${pluralizar(activas, "suscripción activa", "suscripciones activas")} · ${enPrueba} en prueba`;
  const idx = indexar(servicios);
  const idxNegocios = indexar(negocios);
  const nombreNegocio = new Map(negocios.map((n) => [n.id, n.nombre]));
  const pagadas = reservas.filter(esCobroPasarela);

  const mrr = calcularMrr(vivos, planes);
  const volumenTotal = redondearMoneda(
    pagadas.reduce((a, r) => a + montoReservaUsd(r, idx, idxNegocios), 0),
  );

  // Volumen por mes (últimos 6) y por negocio (normalizado a USD).
  const porMes = new Map<string, number>();
  const porNegocio = new Map<string, number>();
  for (const r of pagadas) {
    const monto = montoReservaUsd(r, idx, idxNegocios);
    const mes = r.fecha_hora.slice(0, 7);
    porMes.set(mes, redondearMoneda((porMes.get(mes) ?? 0) + monto));
    porNegocio.set(
      r.negocio_id,
      redondearMoneda((porNegocio.get(r.negocio_id) ?? 0) + monto),
    );
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
          nota={
            isStripeMockMode
              ? `${notaMrr} · Stripe simulado (demo)`
              : notaMrr
          }
        />
        <Estadistica
          titulo="ARR estimado"
          valor={usd(mrr * 12)}
          nota={isStripeMockMode ? "Proyección en modo demo" : undefined}
        />
        <Estadistica
          titulo="Volumen cobrado"
          valor={usd(volumenTotal)}
          nota={
            config?.pagos_simulados
              ? `Equiv. USD · ${pagadas.length} reservas pagadas (incluye demo)`
              : `Equiv. USD · ${pagadas.length} reservas pagadas`
          }
          href="/admin/reservas?estado=pagada"
        />
        <Estadistica
          titulo="Discrepancias"
          valor={String(discrepancias.length)}
          tono={discrepancias.length > 0 ? "malo" : "bueno"}
          href="#conciliacion"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Volumen por mes">
          <Tabla
            columnas={[
              "Mes",
              {
                nombre: "Volumen",
                className: "text-right pr-4 whitespace-nowrap",
              },
            ]}
            tableClassName="w-full table-fixed"
            vacia={meses.length === 0}
          >
            {meses.map(([mes, monto]) => (
              <tr key={mes}>
                <Celda>{mes}</Celda>
                <Celda className="text-right pr-4 whitespace-nowrap">
                  {usd(monto)}
                </Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
        <Tarjeta titulo="Top negocios por volumen">
          <Tabla
            columnas={[
              "Negocio",
              {
                nombre: "Volumen",
                className: "text-right pr-4 whitespace-nowrap",
              },
            ]}
            tableClassName="w-full table-fixed"
            vacia={top.length === 0}
          >
            {top.map(([id, monto]) => (
              <tr key={id}>
                <Celda className="truncate">
                  <Link
                    href={`/admin/negocios/${id}`}
                    className="block truncate text-sky-700 hover:underline"
                  >
                    {nombreNegocio.get(id) ?? id}
                  </Link>
                </Celda>
                <Celda className="text-right pr-4 whitespace-nowrap">
                  {usd(monto)}
                </Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
      </div>

      <Tarjeta
        id="conciliacion"
        titulo="Conciliación"
        descripcion="Reservas cuyo estado no coincide con su pago o reembolso."
      >
        <Tabla
          columnas={["Negocio", "Reserva", "Fecha", "Problema", ""]}
          vacia={discrepancias.length === 0}
          vacio="Sin discrepancias."
        >
          {discrepancias.slice(0, 100).map((d, i) => (
            <tr key={`${d.reserva}-${i}`}>
              <Celda>{d.negocio}</Celda>
              <Celda className="font-mono text-xs">
                <Link
                  href={`/admin/reservas?q=${encodeURIComponent(d.reserva)}`}
                  className="font-semibold text-sky-700 hover:underline"
                  title="Buscar e inspeccionar esta reserva"
                >
                  {d.reserva}
                </Link>
              </Celda>
              <Celda>{fechaHora(d.fecha)}</Celda>
              <Celda>{d.problema}</Celda>
              <Celda className="text-right whitespace-nowrap">
                <Link
                  href="/admin/reservas"
                  className="font-medium text-sky-700 hover:underline"
                >
                  Revisar reserva →
                </Link>
              </Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </PaginaAdmin>
  );
}
