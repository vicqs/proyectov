import Link from "next/link";
import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { calcularPrecio, FLAGS_POR_NEGOCIO } from "../../../lib/plataforma";
import { estadoEfectivo } from "../../../lib/negocio-estado";
import { isStripeMockMode, stripe } from "../../../lib/stripe";
import { fechaCorta, fechaHora, usd } from "../../../lib/admin/formato";
import {
  actualizarPlanAction,
  crearPlanAction,
  marcarPlanDefectoAction,
} from "../../../actions/admin/suscripciones";
import { AccionForm } from "../../../components/admin/AccionForm";
import { InsigniaNegocio } from "../../../components/admin/InsigniaNegocio";
import {
  CLASE_INPUT,
  Campo,
  Celda,
  Insignia,
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
  await requerirAdmin("facturacion");
  const [planes, negocios, facturas] = await Promise.all([
    leer("planes").catch(() => []),
    leer("negocios"),
    facturasStripe(),
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
      <Tarjeta
        titulo="Planes"
        descripcion="Los cambios de precio aplican a los próximos cobros."
      >
        <div className="space-y-3">
          {planes.map((p) => (
            <div key={p.id} className="rounded-xl border border-slate-200 p-3">
              <AccionForm
                accion={actualizarPlanAction.bind(null, p.id)}
                boton="Guardar"
                variante="neutro"
                enLinea
              >
                <Campo etiqueta="Nombre">
                  <input
                    name="nombre"
                    defaultValue={p.nombre}
                    required
                    className={`${CLASE_INPUT} sm:w-52`}
                  />
                </Campo>
                <Campo etiqueta="USD / mes">
                  <input
                    name="precio_usd"
                    type="number"
                    step="0.01"
                    min={0}
                    defaultValue={p.precio_usd}
                    required
                    className={`${CLASE_INPUT} sm:w-28`}
                  />
                </Campo>
                <Campo etiqueta="Stripe price id">
                  <input
                    name="stripe_price_id"
                    defaultValue={p.stripe_price_id ?? ""}
                    className={`${CLASE_INPUT} sm:w-44`}
                  />
                </Campo>
                <label className="flex items-center gap-1 pb-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    name="activo"
                    defaultChecked={p.activo}
                  />{" "}
                  Activo
                </label>
                {FLAGS_POR_NEGOCIO.map((f) => (
                  <label
                    key={f.clave}
                    className="flex items-center gap-1 pb-2 text-sm text-slate-600"
                  >
                    <input
                      type="checkbox"
                      name={`flag_${f.clave}`}
                      defaultChecked={p.flags?.[f.clave] ?? true}
                    />{" "}
                    {f.etiqueta}
                  </label>
                ))}
                {p.por_defecto && <Insignia tono="azul">Por defecto</Insignia>}
              </AccionForm>
              {!p.por_defecto && p.activo && (
                <div className="mt-2">
                  <AccionForm
                    accion={marcarPlanDefectoAction.bind(null, p.id)}
                    boton="Hacer predeterminado"
                    variante="neutro"
                  />
                </div>
              )}
            </div>
          ))}
          {planes.length === 0 && (
            <p className="text-sm text-slate-400">
              Sin planes (¿falta ejecutar la migración?). Se usa el precio de
              respaldo.
            </p>
          )}
        </div>
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="mb-2 text-sm font-semibold text-slate-700">
            Nuevo plan
          </h3>
          <AccionForm
            accion={crearPlanAction}
            boton="Crear plan"
            limpiarAlOk
            enLinea
          >
            <Campo etiqueta="Nombre">
              <input
                name="nombre"
                required
                className={`${CLASE_INPUT} sm:w-52`}
              />
            </Campo>
            <Campo etiqueta="USD / mes">
              <input
                name="precio_usd"
                type="number"
                step="0.01"
                min={0}
                required
                className={`${CLASE_INPUT} sm:w-28`}
              />
            </Campo>
            <Campo etiqueta="Stripe price id (opcional)">
              <input
                name="stripe_price_id"
                className={`${CLASE_INPUT} sm:w-52`}
              />
            </Campo>
            {FLAGS_POR_NEGOCIO.map((f) => (
              <label
                key={f.clave}
                className="flex items-center gap-1 pb-2 text-sm text-slate-600"
              >
                <input
                  type="checkbox"
                  name={`flag_${f.clave}`}
                  defaultChecked
                />{" "}
                {f.etiqueta}
              </label>
            ))}
          </AccionForm>
        </div>
      </Tarjeta>

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
                  <p className="font-medium text-slate-900">{n.nombre}</p>
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
                    : n.estado_suscripcion === "activa" && n.proximo_cobro
                      ? `Cobro: ${fechaCorta(n.proximo_cobro)}`
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
        {facturas === null ? (
          <p className="text-sm text-slate-500">
            Stripe está en modo simulado: no hay facturas reales.
          </p>
        ) : (
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
        )}
      </Tarjeta>
    </PaginaAdmin>
  );
}
