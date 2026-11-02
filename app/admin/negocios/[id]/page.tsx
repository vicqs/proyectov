import Link from "next/link";
import { notFound } from "next/navigation";
import { requerirAdmin } from "../../../../lib/admin/auth";
import { registrarAuditoria } from "../../../../lib/admin/auditoria";
import {
  authAdmin,
  leer,
  leerUno,
  type FilaDe,
} from "../../../../lib/admin/db";
import { indexar, montoReserva } from "../../../../lib/admin/datos";
import { tienePermiso } from "../../../../lib/roles";
import {
  calcularPrecio,
  FLAGS_POR_NEGOCIO,
  funcionActiva,
  listarPlanes,
  obtenerConfiguracion,
} from "../../../../lib/plataforma";
import { estadoEfectivo } from "../../../../lib/negocio-estado";
import { cuposOcupados } from "../../../../lib/horarios";
import { facturasPendientes } from "../../../../lib/facturas-pendientes";
import { esCobroPasarela } from "../../../../lib/pagos";
import {
  Briefcase,
  CalendarCheck,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import {
  fechaCorta,
  fechaHora,
  parametro,
  pluralizar,
  usd,
} from "../../../../lib/admin/formato";
import { BotonCopiar } from "../../../../components/admin/BotonCopiar";
import { TarjetaDatosPublicos } from "../../../../components/admin/TarjetaDatosPublicos";
import { TarjetaEliminacion } from "../../../../components/admin/TarjetaEliminacion";
import {
  agregarNotaAction,
  limpiarContenidoAction,
  reactivarNegocioAction,
  suspenderNegocioAction,
} from "../../../../actions/admin/negocios";
import {
  aplicarDescuentoAction,
  asignarPlanAction,
  actualizarFuncionesNegocioAction,
  cambiarEstadoManualAction,
  extenderPruebaAction,
  reintentarCobroAction,
} from "../../../../actions/admin/suscripciones";
import { AccionForm } from "../../../../components/admin/AccionForm";
import { InsigniaNegocio } from "../../../../components/admin/InsigniaNegocio";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_INPUT,
  CLASE_SELECT,
  Campo,
  Celda,
  Estadistica,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
  TextareaConContador,
} from "../../../../components/admin/ui";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TABS = [
  { clave: "resumen", etiqueta: "Resumen" },
  { clave: "vista", etiqueta: "Vista de soporte" },
  { clave: "cuenta", etiqueta: "Cuenta" },
  { clave: "facturacion", etiqueta: "Facturación" },
  { clave: "soporte", etiqueta: "Notas y soporte" },
] as const;

export default async function NegocioDetallePage({
  params,
  searchParams,
}: Props) {
  const admin = await requerirAdmin("negocios_ver");
  const { id } = await params;
  const sp = await searchParams;
  const tab = TABS.some((t) => t.clave === parametro(sp.tab))
    ? (parametro(sp.tab) as (typeof TABS)[number]["clave"])
    : "resumen";

  const negocio = await leerUno("negocios", { eq: { id } });
  if (!negocio) notFound();

  const owner = await authAdmin
    .getUserById(negocio.user_id)
    .then((r) => r.data.user)
    .catch(() => null);

  const puedeGestionar = tienePermiso(admin.rol, "negocios_gestionar");
  const puedeFacturar = tienePermiso(admin.rol, "facturacion");
  const href = (t: string) => `/admin/negocios/${id}?tab=${t}`;

  return (
    <PaginaAdmin
      titulo={negocio.nombre}
      descripcion={
        <span className="flex flex-wrap items-center gap-2">
          /{negocio.slug} <InsigniaNegocio negocio={negocio} />
          {negocio.suspendido && negocio.motivo_suspension && (
            <span className="text-red-600">
              Motivo: {negocio.motivo_suspension}
            </span>
          )}
        </span>
      }
      accion={
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/negocios" className={CLASE_BOTON_NEUTRO}>
            ← Volver
          </Link>
          {!negocio.eliminado_en && !negocio.suspendido && (
            <Link
              href={`/${negocio.slug}`}
              target="_blank"
              className={CLASE_BOTON_NEUTRO}
              title="Ver perfil público"
            >
              Perfil público ↗
            </Link>
          )}
        </div>
      }
    >
      <nav className="flex flex-wrap gap-1 border-b border-slate-200">
        {TABS.map((t) => (
          <Link
            key={t.clave}
            href={href(t.clave)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
              tab === t.clave
                ? "border-sky-600 text-sky-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.etiqueta}
          </Link>
        ))}
      </nav>

      {tab === "resumen" && (
        <Resumen negocio={negocio} ownerEmail={owner?.email ?? "—"} />
      )}
      {tab === "vista" && <VistaSoporte id={id} admin={admin} />}
      {tab === "cuenta" &&
        (puedeGestionar ? <Cuenta negocioId={id} /> : <SinAcceso />)}
      {tab === "facturacion" &&
        (puedeFacturar ? <Facturacion negocioId={id} /> : <SinAcceso />)}
      {tab === "soporte" && <Notas negocioId={id} />}
    </PaginaAdmin>
  );
}

function SinAcceso() {
  return (
    <Tarjeta>
      <p className="text-sm text-slate-500">
        Tu rol no tiene acceso a esta sección.
      </p>
    </Tarjeta>
  );
}

type NegocioFila = FilaDe<"negocios">;

function formatearIban(iban: string): string {
  if (!iban) return "—";
  const limpio = iban.replace(/\s+/g, "").toUpperCase();
  return limpio.match(/.{1,4}/g)?.join(" ") ?? limpio;
}

function formatearDuracionServicio(minutos: number): string {
  if (!Number.isFinite(minutos) || minutos <= 0) return "—";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) {
    return `${horas}h (${minutos} min)`;
  }
  return `${horas}h ${resto}m (${minutos} min)`;
}

async function Resumen({
  negocio,
  ownerEmail,
}: {
  negocio: NegocioFila;
  ownerEmail: string;
}) {
  const [servicios, reservas, planes] = await Promise.all([
    leer("servicios", { eq: { negocio_id: negocio.id } }),
    leer("reservas", { eq: { negocio_id: negocio.id } }),
    listarPlanes(),
  ]);
  const idx = indexar(servicios);
  const pagadas = reservas.filter((r) => r.estado === "pagada");
  const ingresos = reservas
    .filter(esCobroPasarela)
    .reduce((a, r) => a + montoReserva(r, idx), 0);
  const precio = calcularPrecio(negocio, planes);
  const estado = estadoEfectivo(negocio);
  const etiquetaSuscripcion =
    estado === "prueba"
      ? "En prueba"
      : estado === "activa"
        ? "Activa"
        : "Inactiva";

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Estadistica
          titulo="Servicios"
          icono={<Briefcase className="h-4 w-4" />}
          valor={String(servicios.length)}
          nota={pluralizar(servicios.length, "servicio", "servicios")}
        />
        <Estadistica
          titulo="Reservas"
          icono={<CalendarCheck className="h-4 w-4" />}
          valor={String(reservas.length)}
          nota={pluralizar(pagadas.length, "pagada", "pagadas")}
          href={`/admin/reservas?negocio=${negocio.id}`}
        />
        <Estadistica
          titulo="Volumen cobrado"
          icono={<TrendingUp className="h-4 w-4" />}
          valor={usd(ingresos)}
          tono="bueno"
          href="/admin/finanzas"
        />
        <Estadistica
          titulo="Cuota mensual"
          icono={<CreditCard className="h-4 w-4" />}
          valor={usd(precio.precio)}
          nota={`${precio.plan.nombre}${precio.descuentoPct ? ` · -${precio.descuentoPct}%` : ""}`}
        />
      </div>
      <Tarjeta titulo="Datos del negocio">
        <dl className="grid gap-3.5 sm:grid-cols-2">
          <Dato t="Dueño" v={ownerEmail || "—"} />
          <Dato t="Alta" v={fechaCorta(negocio.creado_en)} />
          <Dato
            t="Suscripción"
            v={
              <div className="flex flex-wrap items-center gap-2">
                <Insignia
                  tono={
                    estado === "activa"
                      ? "verde"
                      : estado === "prueba"
                        ? "azul"
                        : "ambar"
                  }
                >
                  {etiquetaSuscripcion}
                </Insignia>
                {negocio.suspendido && (
                  <Insignia tono="rojo">Suspendido</Insignia>
                )}
              </div>
            }
          />
          {negocio.estado_suscripcion === "prueba" ? (
            <Dato t="Prueba hasta" v={fechaCorta(negocio.prueba_hasta)} />
          ) : negocio.estado_suscripcion === "activa" ? (
            <Dato t="Próximo cobro" v={fechaCorta(negocio.proximo_cobro)} />
          ) : (
            <Dato t="Ciclo de cobro" v="Sin cobro programado" />
          )}
          <Dato
            t="Cliente Stripe"
            v={
              negocio.stripe_customer_id ? (
                <span className="font-mono text-xs text-slate-700">
                  {negocio.stripe_customer_id}
                </span>
              ) : (
                <span className="text-slate-400">—</span>
              )
            }
          />
          <Dato
            t="Cuenta IBAN"
            v={
              negocio.cuenta_iban ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold tracking-wider text-slate-900">
                    {formatearIban(negocio.cuenta_iban)}
                  </span>
                  <BotonCopiar
                    texto={negocio.cuenta_iban}
                    etiqueta="Copiar cuenta IBAN"
                    mensajeExito="Cuenta IBAN copiada"
                  />
                </div>
              ) : (
                <span className="text-slate-400">No registrada</span>
              )
            }
          />
          <Dato
            t="Descripción"
            v={
              negocio.descripcion ? (
                <span className="text-slate-700 leading-relaxed">
                  {negocio.descripcion}
                </span>
              ) : (
                <span className="text-slate-400 italic">
                  Sin descripción registrada
                </span>
              )
            }
            className="sm:col-span-2"
          />
        </dl>
      </Tarjeta>
    </>
  );
}

function Dato({
  t,
  v,
  className = "",
}: {
  t: string;
  v: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:border-slate-200/80 ${className}`}
    >
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {t}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-800 break-words">
        {v}
      </dd>
    </div>
  );
}

/** Vista de solo lectura de lo que ve el dueño; cada consulta queda auditada. */
async function VistaSoporte({
  id,
  admin,
}: {
  id: string;
  admin: Awaited<ReturnType<typeof requerirAdmin>>;
}) {
  await registrarAuditoria(admin, {
    accion: "soporte.vista",
    entidad: "negocio",
    entidad_id: id,
    negocio_id: id,
  });
  const [servicios, horarios, bloqueos, reservas] = await Promise.all([
    leer("servicios", { eq: { negocio_id: id } }),
    leer("horarios", { eq: { negocio_id: id }, orden: ["fecha_hora", true] }),
    leer("bloqueos_excepcion", { eq: { negocio_id: id } }),
    leer("reservas", { eq: { negocio_id: id }, orden: ["fecha_hora", false] }),
  ]);
  const idx = indexar(servicios);
  const proximos = horarios.filter(
    (h) => new Date(h.fecha_hora).getTime() >= Date.now(),
  );

  return (
    <>
      <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Vista de solo lectura. Esta consulta quedó registrada en la auditoría.
      </p>
      <Tarjeta titulo="Servicios">
        <Tabla
          columnas={["Servicio", "Precio", "Duración"]}
          vacia={servicios.length === 0}
        >
          {servicios.map((s) => (
            <tr key={s.id}>
              <Celda>{s.nombre}</Celda>
              <Celda>{usd(s.precio_usd)}</Celda>
              <Celda>{formatearDuracionServicio(s.duracion_min)}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo={`Horarios próximos (${proximos.length})`}>
        <Tabla
          columnas={["Servicio", "Fecha", "Cupos"]}
          vacia={proximos.length === 0}
        >
          {proximos.slice(0, 30).map((h) => {
            const ocupados = cuposOcupados(
              reservas,
              h.servicio_id,
              h.fecha_hora,
            );
            const disponibles = Math.max(0, h.cupos_totales - ocupados);
            return (
              <tr key={h.id}>
                <Celda>{idx.get(h.servicio_id)?.nombre ?? "—"}</Celda>
                <Celda>{fechaHora(h.fecha_hora)}</Celda>
                <Celda>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-900">
                      {ocupados}/{h.cupos_totales} ocupados
                    </span>
                    <span className="text-xs text-slate-500">
                      ({disponibles} {disponibles === 1 ? "disponible" : "disponibles"})
                    </span>
                  </div>
                </Celda>
              </tr>
            );
          })}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo={`Bloqueos (${bloqueos.length})`}>
        <Tabla
          columnas={["Desde", "Hasta", "Motivo"]}
          vacia={bloqueos.length === 0}
        >
          {bloqueos.map((b) => (
            <tr key={b.id}>
              <Celda>{fechaHora(b.fecha_inicio)}</Celda>
              <Celda>{fechaHora(b.fecha_fin)}</Celda>
              <Celda>{b.motivo}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo="Últimas reservas">
        <Tabla
          columnas={["Fecha", "Servicio", "Cliente", "Estado", "Monto"]}
          vacia={reservas.length === 0}
        >
          {reservas.slice(0, 20).map((r) => (
            <tr key={r.id}>
              <Celda>{fechaHora(r.fecha_hora)}</Celda>
              <Celda>{idx.get(r.servicio_id)?.nombre ?? "—"}</Celda>
              <Celda>{r.email_cliente}</Celda>
              <Celda>
                <Insignia
                  tono={
                    r.estado === "pagada"
                      ? "verde"
                      : r.estado === "cancelada"
                        ? "rojo"
                        : "ambar"
                  }
                >
                  {r.estado === "pagada"
                    ? "Pagada"
                    : r.estado === "cancelada"
                      ? "Cancelada"
                      : "Pendiente"}
                </Insignia>
              </Celda>
              <Celda>{usd(montoReserva(r, idx))}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </>
  );
}

async function Cuenta({ negocioId }: { negocioId: string }) {
  const negocio = await leerUno("negocios", { eq: { id: negocioId } });
  if (!negocio) notFound();
  return (
    <div className="space-y-6">
      {/* Tarjeta superior: Datos públicos (Nombre y Slug en 2 columnas, Descripción debajo) */}
      <TarjetaDatosPublicos
        negocioId={negocioId}
        nombre={negocio.nombre}
        slug={negocio.slug}
        descripcion={negocio.descripcion ?? ""}
      />

      {/* Grid de 2 columnas para tarjetas de control */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna izquierda: Moderación de contenido y Suspensión */}
        <div className="space-y-6">
          <Tarjeta
            titulo="Moderación de contenido"
            descripcion="Retira contenido inapropiado del perfil público."
          >
            <AccionForm
              accion={limpiarContenidoAction.bind(null, negocioId)}
              boton="Retirar contenido"
              variante="peligro"
              confirmar="¿Retirar este contenido del perfil?"
              enLinea
              className="w-full flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <select
                name="que"
                className={`${CLASE_SELECT} flex-1 min-w-0`}
                aria-label="Contenido"
              >
                <option value="descripcion">Descripción</option>
                <option value="logo">Logo</option>
                <option value="portada">Imagen de portada</option>
                <option value="todo">Todo lo anterior</option>
              </select>
            </AccionForm>
          </Tarjeta>

          <Tarjeta
            titulo="Suspensión"
            descripcion={
              negocio.suspendido
                ? "El negocio está actualmente suspendido para el público y panel."
                : "Oculta el perfil público y bloquea el panel del negocio."
            }
          >
            {negocio.suspendido ? (
              <div className="space-y-3">
                {negocio.motivo_suspension && (
                  <p className="rounded-lg border border-red-100 bg-red-50 p-2.5 text-xs text-red-600">
                    <b>Motivo de suspensión:</b> {negocio.motivo_suspension}
                  </p>
                )}
                <AccionForm
                  accion={reactivarNegocioAction.bind(null, negocioId)}
                  boton="Reactivar negocio"
                />
              </div>
            ) : (
              <AccionForm
                accion={suspenderNegocioAction.bind(null, negocioId)}
                boton="Suspender negocio"
                variante="peligro"
                confirmar="Se ocultará el perfil público y se bloqueará el panel. ¿Continuar?"
                enLinea
                className="w-full flex-col sm:flex-row items-stretch sm:items-center gap-2"
              >
                <input
                  name="motivo"
                  required
                  minLength={3}
                  maxLength={300}
                  placeholder="Motivo (lo verá la empresa)"
                  className={`${CLASE_INPUT} flex-1 min-w-0`}
                  aria-label="Motivo"
                />
              </AccionForm>
            )}
          </Tarjeta>
        </div>

        {/* Columna derecha: Eliminación (zona de peligro) */}
        <div>
          <TarjetaEliminacion
            negocioId={negocioId}
            slug={negocio.slug}
            eliminadoEn={negocio.eliminado_en}
          />
        </div>
      </div>
    </div>
  );
}

async function Facturacion({ negocioId }: { negocioId: string }) {
  const [negocio, planes, config] = await Promise.all([
    leerUno("negocios", { eq: { id: negocioId } }),
    listarPlanes(),
    obtenerConfiguracion(),
  ]);
  if (!negocio) notFound();
  const pendientes = await facturasPendientes(negocio.stripe_customer_id);
  const precio = calcularPrecio(negocio, planes);
  return (
    <div className="space-y-6">
      {/* Barra de resumen compacta superior */}
      <Tarjeta titulo="Estado actual">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Suscripción:
            </span>
            <Insignia
              tono={
                negocio.estado_suscripcion === "activa"
                  ? "verde"
                  : negocio.estado_suscripcion === "prueba"
                    ? "azul"
                    : "ambar"
              }
            >
              <span className="capitalize">{estadoEfectivo(negocio)}</span>
            </Insignia>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plan:
            </span>{" "}
            <b className="font-semibold text-slate-900">{precio.plan.nombre}</b>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cuota:
            </span>{" "}
            <b className="font-semibold text-slate-900">{usd(precio.precio)}</b>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {negocio.estado_suscripcion === "prueba"
                ? "Fin de prueba:"
                : negocio.estado_suscripcion === "activa"
                  ? "Próximo cobro:"
                  : "Ciclo:"}
            </span>{" "}
            <span className="font-medium text-slate-800">
              {negocio.estado_suscripcion === "prueba"
                ? fechaCorta(negocio.prueba_hasta)
                : negocio.estado_suscripcion === "activa"
                  ? fechaCorta(negocio.proximo_cobro)
                  : "Sin cobro programado"}
            </span>
          </div>
        </div>
      </Tarjeta>

      {/* Grid de 2 columnas para tarjetas operativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Fila 1 (Columna izquierda): Estado manual */}
        <Tarjeta
          titulo="Estado manual"
          descripcion="Activo: perfil público y panel funcionan. En prueba: periodo de prueba vigente. Inactivo: panel funciona pero sin reservas públicas."
        >
          <AccionForm
            accion={cambiarEstadoManualAction.bind(null, negocioId)}
            boton="Aplicar estado"
            variante="neutro"
            confirmar="¿Cambiar el estado de la suscripción manualmente?"
            enLinea
            className="flex items-center gap-3 w-full"
          >
            <select
              name="estado"
              defaultValue={negocio.estado_suscripcion}
              className={`${CLASE_SELECT} flex-1 min-w-0`}
              aria-label="Estado"
            >
              <option value="activa">Activo</option>
              <option value="prueba">En prueba</option>
              <option value="inactiva">Inactivo</option>
            </select>
          </AccionForm>
        </Tarjeta>

        {/* Fila 1 (Columna derecha): Plan */}
        <Tarjeta
          titulo="Plan"
          descripcion="Asigna o cambia el plan contratado para este negocio."
        >
          <AccionForm
            accion={asignarPlanAction.bind(null, negocioId)}
            boton="Asignar plan"
            variante="neutro"
            enLinea
            className="flex items-center gap-3 w-full"
          >
            <select
              name="plan_id"
              defaultValue={negocio.plan_id ?? ""}
              className={`${CLASE_SELECT} flex-1 min-w-0`}
              aria-label="Plan"
            >
              <option value="">Plan por defecto</option>
              {planes
                .filter((p) => p.activo)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} · {usd(p.precio_usd)}
                  </option>
                ))}
            </select>
          </AccionForm>
        </Tarjeta>

        {/* Fila 2 (Columna izquierda): Descuento */}
        <Tarjeta
          titulo="Descuento (%)"
          descripcion="Aplica un porcentaje de descuento sobre la cuota mensual."
        >
          <AccionForm
            accion={aplicarDescuentoAction.bind(null, negocioId)}
            boton="Aplicar descuento"
            variante="neutro"
            enLinea
            className="flex items-center gap-3 w-full"
          >
            <div className="relative w-32 sm:w-36 shrink-0">
              <input
                name="descuento_pct"
                type="number"
                min={0}
                max={100}
                step="1"
                defaultValue={negocio.descuento_pct ?? 0}
                className={`${CLASE_INPUT} pr-8`}
                aria-label="Descuento (%)"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                %
              </span>
            </div>
          </AccionForm>
        </Tarjeta>

        {/* Fila 2 (Columna derecha): Extender prueba */}
        <Tarjeta
          titulo="Días a extender"
          descripcion="Suma días adicionales al periodo de prueba gratuito."
        >
          <AccionForm
            accion={extenderPruebaAction.bind(null, negocioId)}
            boton="Extender"
            variante="neutro"
            enLinea
            className="flex items-center gap-3 w-full"
          >
            <div className="relative w-32 sm:w-36 shrink-0">
              <input
                name="dias"
                type="number"
                min={1}
                max={365}
                defaultValue={7}
                className={`${CLASE_INPUT} pr-14`}
                aria-label="Días a extender"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                días
              </span>
            </div>
          </AccionForm>
        </Tarjeta>

        {/* Fila 3 (Columna izquierda): Funciones */}
        <Tarjeta
          titulo="Funciones"
          descripcion="Heredar usa lo que incluye el plan. Una función apagada globalmente no se puede forzar aquí."
        >
          <AccionForm
            accion={actualizarFuncionesNegocioAction.bind(null, negocioId)}
            boton="Guardar funciones"
            variante="neutro"
          >
            <div className="space-y-3">
              {FLAGS_POR_NEGOCIO.map((f) => {
                const actual = negocio.flags_override?.[f.clave];
                return (
                  <Campo key={f.clave} etiqueta={f.etiqueta}>
                    <select
                      name={`flag_${f.clave}`}
                      defaultValue={
                        actual === undefined ? "" : actual ? "on" : "off"
                      }
                      className={`${CLASE_SELECT} w-full`}
                    >
                      <option value="">
                        Heredar del plan (
                        {funcionActiva(
                          config,
                          { ...negocio, flags_override: {} },
                          planes,
                          f.clave,
                        )
                          ? "activa"
                          : "inactiva"}
                        )
                      </option>
                      <option value="on">Activada</option>
                      <option value="off">Desactivada</option>
                    </select>
                  </Campo>
                );
              })}
            </div>
          </AccionForm>
        </Tarjeta>

        {/* Fila 3 (Columna derecha): Reintentar cobro */}
        <Tarjeta
          titulo="Reintentar cobro"
          descripcion="Cobra las facturas abiertas del cliente en Stripe. Solo se habilita si hay cobros pendientes."
        >
          {pendientes.facturas.length > 0 ? (
            <ul className="mb-4 divide-y divide-slate-100 text-sm">
              {pendientes.facturas.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2"
                >
                  <span className="text-slate-700">
                    Factura <b>{f.numero}</b> · emitida el {fechaCorta(f.creada)}
                  </span>
                  <span className="text-slate-600">
                    <b>{usd(f.monto)}</b> · {f.intentos}{" "}
                    {f.intentos === 1 ? "intento" : "intentos"} de cobro
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-4 text-sm text-slate-500">
              {pendientes.aviso ?? "No hay cobros pendientes."}
            </p>
          )}
          <AccionForm
            accion={reintentarCobroAction.bind(null, negocioId)}
            boton="Reintentar cobro"
            variante="neutro"
            confirmar="¿Reintentar el cobro ahora?"
            deshabilitado={pendientes.facturas.length === 0}
          />
        </Tarjeta>
      </div>
    </div>
  );
}

async function Notas({ negocioId }: { negocioId: string }) {
  const [notas, tickets, reportes, auditoria] = await Promise.all([
    leer("notas_internas", {
      eq: { negocio_id: negocioId },
      orden: ["creado_en", false],
    }),
    leer("tickets", {
      eq: { negocio_id: negocioId },
      orden: ["creado_en", false],
    }),
    leer("reportes_perfil", {
      eq: { negocio_id: negocioId },
      orden: ["creado_en", false],
    }),
    leer("auditoria", {
      eq: { negocio_id: negocioId },
      orden: ["creado_en", false],
      limite: 25,
    }),
  ]);
  return (
    <>
      <Tarjeta
        titulo="Notas internas"
        descripcion="Solo las ve el equipo de administración."
      >
        <AccionForm
          accion={agregarNotaAction.bind(null, negocioId)}
          boton="Agregar nota"
          limpiarAlOk
        >
          <TextareaConContador
            name="texto"
            required
            minLength={2}
            maxLength={1000}
            rows={3}
            aria-label="Nota"
            placeholder="Escribe una nota interna sobre este negocio..."
          />
        </AccionForm>
        <ul className="mt-4 space-y-2 text-sm">
          {notas.length === 0 && <li className="text-slate-400">Sin notas.</li>}
          {notas.map((n) => (
            <li key={n.id} className="rounded-lg bg-slate-50 p-3">
              <p className="whitespace-pre-wrap text-slate-700">{n.texto}</p>
              <p className="mt-1 text-xs text-slate-400">
                {n.autor_email} · {fechaHora(n.creado_en)}
              </p>
            </li>
          ))}
        </ul>
      </Tarjeta>
      <Tarjeta titulo="Tickets">
        <Tabla
          columnas={["Asunto", "Estado", "Creado"]}
          vacia={tickets.length === 0}
        >
          {tickets.map((t) => (
            <tr key={t.id}>
              <Celda>
                <Link
                  href={`/admin/soporte/${t.id}`}
                  className="text-sky-700 hover:underline"
                >
                  {t.asunto}
                </Link>
              </Celda>
              <Celda>{t.estado}</Celda>
              <Celda>{fechaHora(t.creado_en)}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo="Reportes del perfil">
        <Tabla
          columnas={["Motivo", "Estado", "Fecha"]}
          vacia={reportes.length === 0}
        >
          {reportes.map((r) => (
            <tr key={r.id}>
              <Celda>{r.motivo}</Celda>
              <Celda>{r.estado}</Celda>
              <Celda>{fechaHora(r.creado_en)}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo="Actividad reciente">
        <Tabla
          columnas={["Fecha", "Actor", "Acción"]}
          vacia={auditoria.length === 0}
        >
          {auditoria.map((a) => (
            <tr key={a.id}>
              <Celda>{fechaHora(a.creado_en)}</Celda>
              <Celda>{a.actor_email}</Celda>
              <Celda>{a.accion}</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </>
  );
}
