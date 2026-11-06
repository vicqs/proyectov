import { Suspense } from "react";
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
import {
  indexar,
  monedaReserva,
  montoReserva,
  montoReservaEnMoneda,
} from "../../../../lib/admin/datos";
import {
  normalizarMoneda,
  obtenerInfoMoneda,
  redondearMontoMoneda,
  type CodigoMoneda,
} from "../../../../lib/monedas";
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
import { esClienteStripeSimulado } from "../../../../lib/formato";
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
  moneda,
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
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const [admin, negocio] = await Promise.all([
    requerirAdmin("negocios_ver"),
    leerUno("negocios", { eq: { id } }),
  ]);
  if (!negocio) notFound();

  const tab = TABS.some((t) => t.clave === parametro(sp.tab))
    ? (parametro(sp.tab) as (typeof TABS)[number]["clave"])
    : "resumen";

  const puedeGestionar = tienePermiso(admin.rol, "negocios_gestionar");
  const puedeFacturar = tienePermiso(admin.rol, "facturacion");
  const puedeVerFinanzas = tienePermiso(admin.rol, "finanzas");
  const puedeSoporte = tienePermiso(admin.rol, "soporte");
  const puedeModeracion = tienePermiso(admin.rol, "moderacion");
  const puedeAuditoria = tienePermiso(admin.rol, "auditoria");
  const tabsVisibles = TABS.filter((t) => {
    if (t.clave === "cuenta") return puedeGestionar;
    if (t.clave === "facturacion") return puedeFacturar;
    return true;
  }).map((t) =>
    t.clave === "soporte" && !puedeSoporte
      ? { ...t, etiqueta: "Notas y actividad" }
      : t,
  );
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
      <nav
        aria-label="Secciones de la ficha del negocio"
        className="flex flex-wrap gap-1.5 border-b border-sky-100 pb-4"
      >
        {tabsVisibles.map((t) => (
          <Link
            key={t.clave}
            href={href(t.clave)}
            aria-current={tab === t.clave ? "page" : undefined}
            className={`vuki-focus vuki-tab-pill ${
              tab === t.clave ? "vuki-tab-pill-active" : ""
            }`}
          >
            {t.etiqueta}
          </Link>
        ))}
      </nav>

      <Suspense key={tab} fallback={<EsqueletoSeccionNegocio />}>
        {tab === "resumen" && (
          <Resumen
            negocio={negocio}
            puedeVerFinanzas={puedeVerFinanzas}
            puedeFacturar={puedeFacturar}
          />
        )}
        {tab === "vista" && (
          <VistaSoporte
            id={id}
            admin={admin}
            monedaNegocio={normalizarMoneda(negocio.moneda, "USD")}
          />
        )}
        {tab === "cuenta" &&
          (puedeGestionar ? <Cuenta negocio={negocio} /> : <SinAcceso />)}
        {tab === "facturacion" &&
          (puedeFacturar ? <Facturacion negocio={negocio} /> : <SinAcceso />)}
        {tab === "soporte" && (
          <Notas
            negocioId={id}
            negocioNombre={negocio.nombre}
            puedeSoporte={puedeSoporte}
            puedeModeracion={puedeModeracion}
            puedeAuditoria={puedeAuditoria}
          />
        )}
      </Suspense>
    </PaginaAdmin>
  );
}

function EsqueletoSeccionNegocio() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Cargando sección del negocio"
      className="space-y-6"
    >
      <div className="h-44 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="vuki-skeleton h-5 w-48 rounded-lg" />
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="vuki-skeleton h-20 rounded-2xl" />
          <div className="vuki-skeleton h-20 rounded-2xl" />
          <div className="vuki-skeleton h-20 rounded-2xl" />
        </div>
      </div>
      <div className="h-64 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
        <div className="vuki-skeleton h-5 w-56 rounded-lg" />
        <div className="vuki-skeleton mt-4 h-40 w-full rounded-2xl" />
      </div>
    </div>
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

function formatearDuracionServicio(
  minutos: number,
  tipo?: "cupo" | "item",
  stock?: number | null,
): string {
  if (tipo === "item") {
    return `Venta directa · ${stock ?? 0} ${(stock ?? 0) === 1 ? "unidad" : "unidades"}`;
  }
  if (!Number.isFinite(minutos) || minutos <= 0) return "—";
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (resto === 0) {
    return `${horas}h (${minutos} min)`;
  }
  return `${horas}h ${resto}m (${minutos} min)`;
}

async function resolverEmailOwner(negocio: NegocioFila): Promise<string> {
  if (negocio.email_contacto) return negocio.email_contacto;
  const [perfilOwner, authUser] = await Promise.all([
    leerUno("perfiles", { eq: { user_id: negocio.user_id } }),
    authAdmin
      .getUserById(negocio.user_id)
      .then((r) => r.data.user?.email ?? null)
      .catch(() => null),
  ]);
  return perfilOwner?.email || authUser || "—";
}

async function Resumen({
  negocio,
  puedeVerFinanzas,
  puedeFacturar,
}: {
  negocio: NegocioFila;
  puedeVerFinanzas: boolean;
  puedeFacturar: boolean;
}) {
  const [servicios, reservas, planes, ownerEmail] = await Promise.all([
    leer("servicios", { eq: { negocio_id: negocio.id } }),
    leer("reservas", { eq: { negocio_id: negocio.id } }),
    puedeFacturar ? listarPlanes() : Promise.resolve([]),
    resolverEmailOwner(negocio),
  ]);
  const idx = indexar(servicios);
  const monedaNeg = normalizarMoneda(negocio.moneda, "USD");
  const infoMoneda = obtenerInfoMoneda(monedaNeg);
  const idxNeg = new Map([[negocio.id, negocio]]);
  const pagadas = reservas.filter((r) => r.estado === "pagada");
  const ingresos = puedeVerFinanzas
    ? redondearMontoMoneda(
        reservas
          .filter(esCobroPasarela)
          .reduce((a, r) => a + montoReservaEnMoneda(r, monedaNeg, idx, idxNeg), 0),
      )
    : 0;
  const precio = puedeFacturar ? calcularPrecio(negocio, planes) : null;
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
        {puedeVerFinanzas && (
          <Estadistica
            titulo="Volumen cobrado"
            icono={<TrendingUp className="h-4 w-4" />}
            valor={moneda(ingresos, monedaNeg)}
            tono="bueno"
            href="/admin/finanzas"
          />
        )}
        {puedeFacturar && precio && (
          <Estadistica
            titulo="Cuota mensual"
            icono={<CreditCard className="h-4 w-4" />}
            valor={usd(precio.precio)}
            nota={`${precio.plan.nombre}${precio.descuentoPct ? ` · -${precio.descuentoPct}%` : ""}`}
          />
        )}
      </div>
      <Tarjeta titulo="Datos del negocio">
        <dl className="grid gap-3.5 sm:grid-cols-2">
          <Dato t="Dueño" v={ownerEmail || "—"} />
          <Dato t="Alta" v={fechaCorta(negocio.creado_en)} />
          <Dato
            t="Moneda operativa"
            v={`${infoMoneda.codigo} (${infoMoneda.simbolo}) · ${infoMoneda.nombreEs}`}
          />
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
          {puedeFacturar && (
            <Dato
              t="Cliente Stripe"
              v={
                negocio.stripe_customer_id ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs text-slate-700">
                      {negocio.stripe_customer_id}
                    </span>
                    {esClienteStripeSimulado(negocio.stripe_customer_id) && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                        Simulado (demo)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-slate-400">—</span>
                )
              }
            />
          )}
          {puedeVerFinanzas && (
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
          )}
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

// Caché en memoria para evitar auditorías duplicadas en el mismo minuto por StrictMode o cambio de pestañas
const cacheSoporteVista = new Map<string, number>();

/** Vista de solo lectura de lo que ve el dueño; cada consulta queda auditada una vez por minuto. */
async function VistaSoporte({
  id,
  admin,
  monedaNegocio,
}: {
  id: string;
  admin: Awaited<ReturnType<typeof requerirAdmin>>;
  monedaNegocio: CodigoMoneda;
}) {
  const ahora = Date.now();
  const cacheKey = `${admin.user.id}:${id}`;
  const ultimoTimestamp = cacheSoporteVista.get(cacheKey) ?? 0;

  // Evita duplicados por doble montaje (StrictMode) o cambio rápido de pestañas (ventana de 60 segundos)
  const auditoriaPromise = (async () => {
    if (ahora - ultimoTimestamp <= 60_000) return;
    cacheSoporteVista.set(cacheKey, ahora);

    // Verificación en BD por si se ejecuta en diferentes workers o instancias
    const unMinutoAtras = new Date(ahora - 60_000).toISOString();
    const reciente = await leerUno("auditoria", {
      eq: {
        negocio_id: id,
        accion: "soporte.vista",
        actor_id: admin.user.id,
      },
      gte: { creado_en: unMinutoAtras },
    });

    if (!reciente) {
      await registrarAuditoria(admin, {
        accion: "soporte.vista",
        entidad: "negocio",
        entidad_id: id,
        negocio_id: id,
      });
    }
  })();

  const [servicios, horarios, bloqueos, reservas] = await Promise.all([
    leer("servicios", { eq: { negocio_id: id } }),
    leer("horarios", { eq: { negocio_id: id }, orden: ["fecha_hora", true] }),
    leer("bloqueos_excepcion", { eq: { negocio_id: id } }),
    leer("reservas", { eq: { negocio_id: id }, orden: ["fecha_hora", false] }),
    auditoriaPromise,
  ]);
  const idx = indexar(servicios);
  const idxNeg = new Map([[id, { moneda: monedaNegocio }]]);
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
          columnas={["Servicio", "Precio", "Modalidad / duración"]}
          vacia={servicios.length === 0}
        >
          {servicios.map((s) => (
            <tr key={s.id}>
              <Celda>{s.nombre}</Celda>
              <Celda>{moneda(s.precio_usd, s.currency ?? monedaNegocio)}</Celda>
              <Celda>
                {formatearDuracionServicio(
                  s.duracion_min,
                  s.unit_type,
                  s.stock,
                )}
              </Celda>
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
              <Celda>
                {moneda(
                  montoReserva(r, idx, idxNeg),
                  monedaReserva(r, idx, idxNeg),
                )}
              </Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
    </>
  );
}

function Cuenta({ negocio }: { negocio: NegocioFila }) {
  const negocioId = negocio.id;
  return (
    <div className="space-y-6">
      {/* Tarjeta superior: Datos públicos (Nombre y Slug en 2 columnas, Descripción debajo) */}
      <TarjetaDatosPublicos
        negocioId={negocioId}
        nombre={negocio.nombre}
        slug={negocio.slug}
        descripcion={negocio.descripcion ?? ""}
        moneda={negocio.moneda}
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

async function Facturacion({ negocio }: { negocio: NegocioFila }) {
  const negocioId = negocio.id;
  const [planes, config, pendientes] = await Promise.all([
    listarPlanes(),
    obtenerConfiguracion(),
    facturasPendientes(negocio.stripe_customer_id),
  ]);
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
              key={negocio.estado_suscripcion}
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
              key={negocio.plan_id ?? ""}
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
                key={negocio.descuento_pct ?? 0}
                name="descuento_pct"
                type="number"
                min={0}
                max={100}
                step="1"
                defaultValue={negocio.descuento_pct ?? 0}
                className={`${CLASE_INPUT} vuki-input-sin-spinner pr-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                aria-label="Descuento (%)"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">
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
                className={`${CLASE_INPUT} vuki-input-sin-spinner pr-14 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                aria-label="Días a extender"
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 select-none">
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
                const valorActual =
                  actual === undefined ? "" : actual ? "on" : "off";
                return (
                  <Campo key={f.clave} etiqueta={f.etiqueta}>
                    <select
                      key={`${f.clave}-${valorActual}`}
                      name={`flag_${f.clave}`}
                      defaultValue={valorActual}
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
                    <b>{moneda(f.monto, f.moneda)}</b> · {f.intentos}{" "}
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

const ETIQUETAS_ACCIONES: Record<string, string> = {
  "soporte.vista": "Consulta de soporte",
  "negocio.nota": "Nota interna",
  "negocio.crear": "Creación de negocio",
  "negocio.editar": "Edición de negocio",
  "negocio.suspender": "Suspensión de negocio",
  "negocio.reactivar": "Reactivación de negocio",
  "negocio.eliminar": "Eliminación de negocio",
  "negocio.restaurar": "Restauración de negocio",
  "negocio.cambiar_slug": "Cambio de slug",
  "negocio.cambiar_estado": "Cambio de estado",
  "negocio.limpiar_contenido": "Limpieza de contenido",
  "negocio.transferir": "Transferencia de negocio",
  "negocio.funciones": "Actualización de funciones",
  "negocio.aplicar_plan": "Aplicación de plan",
  "negocio.cancelar_plan": "Cancelación de plan",
  "suscripcion.plan": "Cambio de plan",
  "suscripcion.descuento": "Aplicación de descuento",
  "suscripcion.extender_prueba": "Extensión de prueba",
  "suscripcion.estado_manual": "Estado de suscripción",
  "suscripcion.reintentar_cobro": "Reintento de cobro",
  "ticket.crear": "Creación de ticket",
  "ticket.responder": "Respuesta a ticket",
  "ticket.actualizar": "Actualización de ticket",
  "factura.actualizar": "Actualización de comprobante fiscal",
  "reserva.cancelar": "Cancelación de reserva",
  "reembolso.registrar": "Registro de reembolso",
  "reembolso.completar": "Reembolso completado",
  "usuario.cerrar_sesiones": "Cierre de sesiones",
  "usuario.restablecer_contrasena": "Restablecimiento de contraseña",
  "configuracion.general": "Configuración general",
  "configuracion.plantillas": "Configuración de plantillas",
  "configuracion.legal": "Configuración legal",
  "equipo.asignar_rol": "Asignación de rol",
  "equipo.quitar_rol": "Remoción de rol",
  "anuncio.crear": "Creación de anuncio",
  "anuncio.eliminar": "Eliminación de anuncio",
  "comunicado.enviar": "Envío de comunicado",
  "sistema.resolver": "Resolución de error",
  "sistema.reprocesar_webhook": "Reprocesamiento de webhook",
};

function formatoAccion(accion: string) {
  const etiqueta = ETIQUETAS_ACCIONES[accion];
  if (etiqueta) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-1.5">
        <span className="font-medium text-slate-800">{etiqueta}</span>
        <span className="font-mono text-[11px] text-slate-400">({accion})</span>
      </div>
    );
  }
  return <span className="font-mono text-xs text-slate-700">{accion}</span>;
}

async function Notas({
  negocioId,
  negocioNombre,
  puedeSoporte,
  puedeModeracion,
  puedeAuditoria,
}: {
  negocioId: string;
  negocioNombre?: string;
  puedeSoporte: boolean;
  puedeModeracion: boolean;
  puedeAuditoria: boolean;
}) {
  const [notas, tickets, reportes, auditoria] = await Promise.all([
    leer("notas_internas", {
      eq: { negocio_id: negocioId },
      orden: ["creado_en", false],
    }),
    puedeSoporte
      ? leer("tickets", {
          eq: { negocio_id: negocioId },
          orden: ["creado_en", false],
        })
      : Promise.resolve([]),
    puedeModeracion
      ? leer("reportes_perfil", {
          eq: { negocio_id: negocioId },
          orden: ["creado_en", false],
        })
      : Promise.resolve([]),
    puedeAuditoria
      ? leer("auditoria", {
          eq: { negocio_id: negocioId },
          orden: ["creado_en", false],
          limite: 25,
        })
      : Promise.resolve([]),
  ]);

  // Deduplicación en la visualización:
  // Evita mostrar eventos idénticos consecutivos en el mismo minuto o consultas duplicadas consecutivas
  const auditoriaDeduplicada = auditoria.filter((item, index) => {
    if (index === 0) return true;
    const previo = auditoria[index - 1];
    const esMismoEvento =
      item.accion === previo.accion &&
      item.actor_email === previo.actor_email &&
      item.negocio_id === previo.negocio_id;

    if (!esMismoEvento) return true;

    // Deduplica soporte.vista consecutivos
    if (item.accion === "soporte.vista") return false;

    // Deduplica eventos idénticos consecutivos ocurridos en menos de 60 segundos
    const diffMs = Math.abs(
      new Date(previo.creado_en).getTime() - new Date(item.creado_en).getTime(),
    );
    return diffMs > 60_000;
  });

  const eventosVisibles = auditoriaDeduplicada.slice(0, 8);
  const busquedaAuditoria = encodeURIComponent(negocioNombre || negocioId);

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
      {(puedeSoporte || puedeModeracion) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {puedeSoporte && (
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
          )}
          {puedeModeracion && (
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
          )}
        </div>
      )}
      {puedeAuditoria && (
        <Tarjeta
          titulo="Actividad reciente"
          descripcion="Historial de acciones y eventos registrados para este negocio."
          accion={
            <Link
              href={`/admin/auditoria?q=${busquedaAuditoria}`}
              className="text-xs font-semibold text-sky-700 hover:text-sky-800 hover:underline"
            >
              Ver en Auditoría &rarr;
            </Link>
          }
        >
          <Tabla
            columnas={["Fecha", "Actor", "Acción"]}
            vacia={eventosVisibles.length === 0}
          >
            {eventosVisibles.map((a) => (
              <tr key={a.id}>
                <Celda className="whitespace-nowrap text-slate-500">
                  {fechaHora(a.creado_en)}
                </Celda>
                <Celda className="text-slate-700 font-medium">
                  {a.actor_email}
                </Celda>
                <Celda>{formatoAccion(a.accion)}</Celda>
              </tr>
            ))}
          </Tabla>
          {auditoriaDeduplicada.length > 8 && (
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
              <span>
                Mostrando los 8 eventos más recientes de{" "}
                {auditoriaDeduplicada.length} registrados.
              </span>
              <Link
                href={`/admin/auditoria?q=${busquedaAuditoria}`}
                className="font-medium text-sky-700 hover:underline"
              >
                Ver todos en Auditoría &rarr;
              </Link>
            </div>
          )}
        </Tarjeta>
      )}
    </>
  );
}
