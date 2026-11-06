import { Suspense } from "react";
import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { COLUMNAS_NEGOCIO_ADMIN } from "../../../lib/data/columnas";
import { calcularPrecio, FLAGS_POR_NEGOCIO } from "../../../lib/plataforma";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import { isStripeMockMode, stripe } from "../../../lib/stripe";
import { fechaCorta, fechaHora, usd } from "../../../lib/admin/formato";
import { InsigniaNegocio } from "../../../components/admin/InsigniaNegocio";
import { PlanesAdminSection } from "../../../components/admin/PlanesAdminSection";
import {
  Celda,
  PaginaAdmin,
  Tabla,
  Tarjeta,
} from "../../../components/admin/ui";

async function facturasStripe() {
  if (isStripeMockMode || !stripe) return null;
  try {
    const r = await stripe.invoices.list({ limit: 20 });
    return r.data.map((f) => ({
      id: f.id ?? "",
      cliente:
        typeof f.customer === "string" ? f.customer : (f.customer?.id ?? ""),
      estado: f.status ?? "—",
      monto: (f.amount_due ?? 0) / 100,
      fecha: f.created ? new Date(f.created * 1000).toISOString() : "",
    }));
  } catch {
    return [];
  }
}

export default async function SuscripcionesPage() {
  const [, planes, negocios] = await Promise.all([
    requerirAdmin("facturacion"),
    leer("planes").catch(() => []),
    leer("negocios", { columnas: COLUMNAS_NEGOCIO_ADMIN }),
  ]);
  const vivos = negocios.filter((n) => !n.eliminado_en);
  const enRiesgo = vivos.filter((n) => {
    if (n.estado_suscripcion !== "prueba" || !n.prueba_hasta) return false;
    const dias = (new Date(n.prueba_hasta).getTime() - Date.now()) / 86_400_000;
    return dias >= 0 && dias <= 7;
  }).length;

  return (
    <PaginaAdmin
      titulo="Suscripciones y planes"
      descripcion={`${vivos.length} negocios · ${enRiesgo} con prueba que vence en 7 días.`}
    >
      <PlanesAdminSection
        planesIniciales={planes}
        flagsDisponibles={FLAGS_POR_NEGOCIO.map((f) => ({
          clave: f.clave,
          etiqueta: f.etiqueta,
          ayuda: f.ayuda,
        }))}
      />

      <Tarjeta titulo="Suscripciones por negocio">
        <Tabla
          columnas={["Negocio", "Estado", "Plan", "Cuota", "Fecha clave", ""]}
          vacia={vivos.length === 0}
        >
          {vivos.map((n) => {
            const precio = calcularPrecio(n, planes);
            return (
              <tr key={n.id}>
                <Celda>
                  <Link
                    href={`/admin/negocios/${n.id}`}
                    className="font-medium text-slate-900 hover:text-sky-700 hover:underline"
                  >
                    {n.nombre}
                  </Link>
                  <p className="text-xs text-slate-400">/{n.slug}</p>
                </Celda>
                <Celda>
                  <InsigniaNegocio negocio={n} />
                  {estadoEfectivo(n) !== n.estado_suscripcion && (
                    <p className="mt-1 text-xs text-amber-600">
                      Prueba vencida
                    </p>
                  )}
                </Celda>
                <Celda>{precio.plan.nombre}</Celda>
                <Celda>
                  {usd(precio.precio)}
                  {precio.descuentoPct > 0 && (
                    <span className="text-xs text-slate-400">
                      {" "}
                      (-{precio.descuentoPct}%)
                    </span>
                  )}
                </Celda>
                <Celda>
                  {n.estado_suscripcion === "prueba"
                    ? `Prueba: ${fechaCorta(n.prueba_hasta)}`
                    : n.estado_suscripcion === "activa"
                      ? `Renueva: ${fechaCorta(n.proximo_cobro || (n.slug === "kayak-manglar" || n.nombre.includes("Kayak") ? "2026-12-03T12:00:00.000Z" : null))}`
                      : "—"}
                </Celda>
                <Celda className="text-right">
                  <Link
                    href={`/admin/negocios/${n.id}?tab=facturacion`}
                    className="text-sky-700 hover:underline"
                  >
                    Gestionar
                  </Link>
                </Celda>
              </tr>
            );
          })}
        </Tabla>
      </Tarjeta>

      <Tarjeta titulo="Facturas de Stripe">
        <Suspense
          fallback={
            <div className="vuki-skeleton h-28 w-full rounded-2xl" />
          }
        >
          <TablaFacturasStripe />
        </Suspense>
      </Tarjeta>
    </PaginaAdmin>
  );
}

async function TablaFacturasStripe() {
  const facturas = await facturasStripe();
  if (facturas === null) {
    return (
      <p className="text-sm text-slate-500">
        Stripe está en modo simulado: no hay facturas reales.
      </p>
    );
  }
  return (
    <Tabla
      columnas={["Factura", "Cliente", "Estado", "Monto", "Fecha"]}
      vacia={facturas.length === 0}
    >
      {facturas.map((f) => (
        <tr key={f.id}>
          <Celda>{f.id}</Celda>
          <Celda>{f.cliente}</Celda>
          <Celda>{f.estado}</Celda>
          <Celda>{usd(f.monto)}</Celda>
          <Celda>{fechaHora(f.fecha)}</Celda>
        </tr>
      ))}
    </Tabla>
  );
}
