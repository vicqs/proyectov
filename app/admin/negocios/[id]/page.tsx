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
import { facturasPendientes } from "../../../../lib/facturas-pendientes";
import { esCobroPasarela } from "../../../../lib/pagos";
import {
  fechaCorta,
  fechaHora,
  parametro,
  usd,
} from "../../../../lib/admin/formato";
import {
  agregarNotaAction,
  cambiarSlugAction,
  editarDatosNegocioAction,
  eliminarNegocioAction,
  limpiarContenidoAction,
  reactivarNegocioAction,
  restaurarNegocioAction,
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
  Campo,
  Celda,
  Estadistica,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
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
        <div className="flex gap-2">
          <Link href="/admin/negocios" className={CLASE_BOTON_NEUTRO}>
            Volver
          </Link>
          {!negocio.eliminado_en && !negocio.suspendido && (
            <Link
              href={`/${negocio.slug}`}
              target="_blank"
              className={CLASE_BOTON_NEUTRO}
            >
              Perfil público
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

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Estadistica titulo="Servicios" valor={String(servicios.length)} />
        <Estadistica
          titulo="Reservas"
          valor={String(reservas.length)}
          nota={`${pagadas.length} pagadas`}
        />
        <Estadistica
          titulo="Volumen cobrado"
          valor={usd(ingresos)}
          tono="bueno"
        />
        <Estadistica
          titulo="Cuota mensual"
          valor={usd(precio.precio)}
          nota={`${precio.plan.nombre}${precio.descuentoPct ? ` · -${precio.descuentoPct}%` : ""}`}
        />
      </div>
      <Tarjeta titulo="Datos del negocio">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <Dato t="Dueño" v={ownerEmail} />
          <Dato t="Alta" v={fechaCorta(negocio.creado_en)} />
          <Dato t="Suscripción" v={estadoEfectivo(negocio)} />
          {negocio.estado_suscripcion === "prueba" ? (
            <Dato t="Prueba hasta" v={fechaCorta(negocio.prueba_hasta)} />
          ) : negocio.estado_suscripcion === "activa" ? (
            <Dato t="Próximo cobro" v={fechaCorta(negocio.proximo_cobro)} />
          ) : null}
          <Dato t="Cliente Stripe" v={negocio.stripe_customer_id ?? "—"} />
          <Dato t="Cuenta IBAN" v={negocio.cuenta_iban || "—"} />
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-slate-400">
              Descripción
            </dt>
            <dd className="mt-0.5 text-slate-700">
              {negocio.descripcion || "—"}
            </dd>
          </div>
        </dl>
      </Tarjeta>
    </>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-slate-400">{t}</dt>
      <dd className="mt-0.5 break-all text-slate-700">{v}</dd>
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
              <Celda>{s.duracion_min} min</Celda>
            </tr>
          ))}
        </Tabla>
      </Tarjeta>
      <Tarjeta titulo={`Horarios próximos (${proximos.length})`}>
        <Tabla
          columnas={["Servicio", "Fecha", "Cupos"]}
          vacia={proximos.length === 0}
        >
          {proximos.slice(0, 30).map((h) => (
            <tr key={h.id}>
              <Celda>{idx.get(h.servicio_id)?.nombre ?? "—"}</Celda>
              <Celda>{fechaHora(h.fecha_hora)}</Celda>
              <Celda>{h.cupos_totales}</Celda>
            </tr>
          ))}
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
                  {r.estado}
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
    <>
      <Tarjeta titulo="Datos públicos">
        <AccionForm
          accion={editarDatosNegocioAction.bind(null, negocioId)}
          boton="Guardar datos"
        >
          <Campo etiqueta="Nombre">
            <input
              name="nombre"
              defaultValue={negocio.nombre}
              required
              maxLength={80}
              className={CLASE_INPUT}
            />
          </Campo>
          <Campo etiqueta="Descripción">
            <textarea
              name="descripcion"
              defaultValue={negocio.descripcion ?? ""}
              maxLength={600}
              rows={3}
              className={CLASE_INPUT}
            />
          </Campo>
        </AccionForm>
      </Tarjeta>

      <Tarjeta
        titulo="Slug"
        descripcion="Cambiarlo rompe los enlaces públicos existentes."
      >
        <AccionForm
          accion={cambiarSlugAction.bind(null, negocioId)}
          boton="Cambiar slug"
          variante="neutro"
          confirmar="¿Cambiar el slug? El enlace anterior dejará de funcionar."
          enLinea
        >
          <input
            name="slug"
            defaultValue={negocio.slug}
            required
            className={`${CLASE_INPUT} sm:w-64`}
            aria-label="Slug"
          />
        </AccionForm>
      </Tarjeta>

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
        >
          <select
            name="que"
            className={`${CLASE_INPUT} sm:w-56`}
            aria-label="Contenido"
          >
            <option value="descripcion">Descripción</option>
            <option value="logo">Logo</option>
            <option value="portada">Imagen de portada</option>
            <option value="todo">Todo lo anterior</option>
          </select>
        </AccionForm>
      </Tarjeta>

      <Tarjeta titulo="Suspensión">
        {negocio.suspendido ? (
          <AccionForm
            accion={reactivarNegocioAction.bind(null, negocioId)}
            boton="Reactivar negocio"
          />
        ) : (
          <AccionForm
            accion={suspenderNegocioAction.bind(null, negocioId)}
            boton="Suspender negocio"
            variante="peligro"
            confirmar="Se ocultará el perfil público y se bloqueará el panel. ¿Continuar?"
            enLinea
          >
            <input
              name="motivo"
              required
              minLength={3}
              maxLength={300}
              placeholder="Motivo (lo verá la empresa)"
              className={`${CLASE_INPUT} sm:w-80`}
              aria-label="Motivo"
            />
          </AccionForm>
        )}
      </Tarjeta>

      <Tarjeta titulo="Eliminación">
        {negocio.eliminado_en ? (
          <AccionForm
            accion={restaurarNegocioAction.bind(null, negocioId)}
            boton="Restaurar negocio"
          />
        ) : (
          <AccionForm
            accion={eliminarNegocioAction.bind(null, negocioId)}
            boton="Eliminar negocio"
            variante="peligro"
            confirmar="El negocio dejará de existir para empresa y público (se puede restaurar). ¿Continuar?"
            enLinea
          >
            <input
              name="confirmar"
              required
              placeholder={`Escribe «${negocio.slug}» para confirmar`}
              className={`${CLASE_INPUT} sm:w-72`}
              aria-label="Confirmación"
            />
          </AccionForm>
        )}
      </Tarjeta>
    </>
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
    <>
      <Tarjeta titulo="Estado actual">
        <p className="text-sm text-slate-600">
          Suscripción: <b>{estadoEfectivo(negocio)}</b> · Plan:{" "}
          <b>{precio.plan.nombre}</b> · Cuota: <b>{usd(precio.precio)}</b>
          {negocio.estado_suscripcion === "prueba" &&
            ` · Prueba hasta: ${fechaCorta(negocio.prueba_hasta)}`}
          {negocio.estado_suscripcion === "activa" &&
            ` · Próximo cobro: ${fechaCorta(negocio.proximo_cobro)}`}
        </p>
      </Tarjeta>
      <Tarjeta
        titulo="Estado manual"
        descripcion="Activa: perfil público y panel funcionan, próximo cobro en 30 días. En prueba: igual que activa hasta su fecha de fin (14 días si estaba vencida). Inactiva: el panel funciona pero el enlace público no recibe reservas. Para suspender o eliminar usa las pestañas de cuenta."
      >
        <AccionForm
          accion={cambiarEstadoManualAction.bind(null, negocioId)}
          boton="Aplicar estado"
          variante="neutro"
          confirmar="¿Cambiar el estado de la suscripción manualmente?"
          enLinea
        >
          <select
            name="estado"
            defaultValue={negocio.estado_suscripcion}
            className={`${CLASE_INPUT} sm:w-44`}
            aria-label="Estado"
          >
            <option value="activa">Activa</option>
            <option value="prueba">En prueba</option>
            <option value="inactiva">Inactiva</option>
          </select>
        </AccionForm>
      </Tarjeta>
      <Tarjeta titulo="Plan">
        <AccionForm
          accion={asignarPlanAction.bind(null, negocioId)}
          boton="Asignar plan"
          variante="neutro"
          enLinea
        >
          <select
            name="plan_id"
            defaultValue={negocio.plan_id ?? ""}
            className={`${CLASE_INPUT} sm:w-64`}
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
      <Tarjeta
        titulo="Funciones"
        descripcion="Heredar usa lo que incluye el plan. Una función apagada globalmente no se puede forzar aquí."
      >
        <AccionForm
          accion={actualizarFuncionesNegocioAction.bind(null, negocioId)}
          boton="Guardar funciones"
          variante="neutro"
          enLinea
        >
          {FLAGS_POR_NEGOCIO.map((f) => {
            const actual = negocio.flags_override?.[f.clave];
            return (
              <Campo key={f.clave} etiqueta={f.etiqueta}>
                <select
                  name={`flag_${f.clave}`}
                  defaultValue={
                    actual === undefined ? "" : actual ? "on" : "off"
                  }
                  className={`${CLASE_INPUT} sm:w-56`}
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
        </AccionForm>
      </Tarjeta>
      <Tarjeta titulo="Descuento">
        <AccionForm
          accion={aplicarDescuentoAction.bind(null, negocioId)}
          boton="Aplicar descuento"
          variante="neutro"
          enLinea
        >
          <input
            name="descuento_pct"
            type="number"
            min={0}
            max={100}
            step="1"
            defaultValue={negocio.descuento_pct ?? 0}
            className={`${CLASE_INPUT} sm:w-28`}
            aria-label="Descuento %"
          />
          <span className="pb-2 text-sm text-slate-500">%</span>
        </AccionForm>
      </Tarjeta>
      <Tarjeta titulo="Extender prueba">
        <AccionForm
          accion={extenderPruebaAction.bind(null, negocioId)}
          boton="Extender"
          variante="neutro"
          enLinea
        >
          <input
            name="dias"
            type="number"
            min={1}
            max={365}
            defaultValue={7}
            className={`${CLASE_INPUT} sm:w-28`}
            aria-label="Días"
          />
          <span className="pb-2 text-sm text-slate-500">días</span>
        </AccionForm>
      </Tarjeta>
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
                  <b>
                    {f.monto.toFixed(2)} {f.moneda}
                  </b>{" "}
                  · {f.intentos} {f.intentos === 1 ? "intento" : "intentos"} de
                  cobro
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
    </>
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
          <textarea
            name="texto"
            required
            minLength={2}
            maxLength={1000}
            rows={3}
            className={CLASE_INPUT}
            aria-label="Nota"
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
