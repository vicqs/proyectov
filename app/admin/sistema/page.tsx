import { requerirAdmin } from "../../../lib/admin/auth";
import { contar as contarDb, leer } from "../../../lib/admin/db";
import { fechaHora, parametro } from "../../../lib/admin/formato";
import { isStripeMockMode } from "../../../lib/stripe";
import { isTilopayConfigured } from "../../../lib/tilopay";
import { tienePermiso } from "../../../lib/roles";
import {
  reprocesarWebhookAction,
  resolverRegistroAction,
} from "../../../actions/admin/sistema";
import { AccionForm } from "../../../components/admin/AccionForm";
import {
  CLASE_SELECT,
  CampoBusqueda,
  Celda,
  FiltrosGet,
  Insignia,
  PaginaAdmin,
  Tabla,
  Tarjeta,
  type TonoInsignia,
} from "../../../components/admin/ui";

function resolverBadgeComprobacion(
  estado: string,
  ok: boolean,
): { texto: string; tono: TonoInsignia } {
  if (!ok) {
    return { texto: "Revisar", tono: "rojo" };
  }
  const estadoMin = estado.toLowerCase();
  if (
    estadoMin.includes("no configurado") ||
    estadoMin.includes("sin resend") ||
    estadoMin.includes("falta")
  ) {
    return { texto: "Aviso", tono: "ambar" };
  }
  if (estadoMin.includes("simula")) {
    return { texto: "Simulado", tono: "azul" };
  }
  return { texto: "OK", tono: "verde" };
}

async function contar(tabla: Parameters<typeof contarDb>[0]): Promise<string> {
  try {
    return String(await contarDb(tabla));
  } catch {
    return "error";
  }
}

export default async function SistemaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requerirAdmin("sistema");
  const sp = await searchParams;
  const q = (parametro(sp.q) ?? "").trim().toLowerCase();
  const tipo = parametro(sp.tipo) ?? "";
  const soloPendientes = parametro(sp.todos) !== "1";

  const [registros, errores, negocios, reservas, config] = await Promise.all([
    leer("registro_sistema", {
      orden: ["creado_en", false],
      limite: 200,
    }).catch(() => []),
    contarDb("registro_sistema", {
      eq: { estado: "error", resuelto: false },
    }).catch(() => 0),
    contar("negocios"),
    contar("reservas"),
    contar("configuracion_plataforma"),
  ]);

  const lista = registros
    .filter((r) => !tipo || r.tipo === tipo)
    .filter((r) => !soloPendientes || (r.estado === "error" && !r.resuelto))
    .filter((r) => {
      if (!q) return true;
      return (
        (r.origen ?? "").toLowerCase().includes(q) ||
        (r.detalle ?? "").toLowerCase().includes(q) ||
        (r.tipo ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.creado_en.localeCompare(a.creado_en))
    .slice(0, 100);
  const puedeReprocesar = tienePermiso(admin.rol, "sistema");

  const secretoWebhookPago = Boolean(
    process.env.TILOPAY_WEBHOOK_SECRET || process.env.PAGO_WEBHOOK_SECRET,
  );
  const tilopayListo = isTilopayConfigured();

  const comprobaciones: [string, string, boolean][] = [
    ["Base de datos", "Supabase", true],
    [
      "Pasarela de reservas (Tilopay)",
      tilopayListo
        ? "API Tilopay configurada"
        : "Modo simulado (TILOPAY_* pendiente)",
      true,
    ],
    ["Pagos de suscripción", isStripeMockMode ? "Simulado" : "Stripe", true],
    [
      "Correo",
      process.env.RESEND_API_KEY
        ? "Resend configurado"
        : "Sin RESEND_API_KEY",
      !!process.env.RESEND_API_KEY,
    ],
    [
      "Secreto webhook de pagos",
      secretoWebhookPago
        ? "Configurado"
        : "Falta PAGO_WEBHOOK_SECRET / TILOPAY_WEBHOOK_SECRET",
      secretoWebhookPago,
    ],
    [
      "Secreto webhook de Stripe",
      process.env.STRIPE_WEBHOOK_SECRET ? "Configurado" : "No configurado",
      !!process.env.STRIPE_WEBHOOK_SECRET || isStripeMockMode,
    ],
    [
      "Tabla de configuración",
      config === "error" ? "No disponible: ejecuta la migración" : "Disponible",
      config !== "error",
    ],
  ];

  return (
    <PaginaAdmin
      titulo="Salud del sistema"
      descripcion={`${errores} incidencia(s) sin resolver · ${negocios} negocios · ${reservas} reservas.`}
    >
      <Tarjeta titulo="Comprobaciones">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comprobaciones.map(([nombre, estado, ok]) => {
            const badge = resolverBadgeComprobacion(estado, ok);
            return (
              <div
                key={nombre}
                className="flex items-center justify-between gap-3 rounded-xl border border-sky-100/80 bg-slate-50/50 px-4 py-3 text-sm transition hover:border-sky-200 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <span className="block font-medium text-slate-800">
                    {nombre}
                  </span>
                  <span className="block text-xs text-slate-500 truncate">
                    {estado}
                  </span>
                </div>
                <div className="shrink-0">
                  <Insignia tono={badge.tono}>{badge.texto}</Insignia>
                </div>
              </div>
            );
          })}
        </div>
      </Tarjeta>

      <FiltrosGet>
        <CampoBusqueda
          defaultValue={q}
          placeholder="Buscar en origen o detalle..."
          ariaLabel="Buscar registros"
          className="sm:w-72"
        />
        <select
          name="tipo"
          defaultValue={tipo}
          aria-label="Filtrar por tipo"
          className={CLASE_SELECT}
        >
          <option value="">Todos los tipos</option>
          <option value="webhook">Webhooks</option>
          <option value="correo">Correos</option>
          <option value="error">Errores</option>
        </select>
        <select
          name="todos"
          defaultValue={soloPendientes ? "0" : "1"}
          aria-label="Filtrar por resolución"
          className={CLASE_SELECT}
        >
          <option value="0">Solo sin resolver</option>
          <option value="1">Todo el registro</option>
        </select>
      </FiltrosGet>

      <Tabla
        columnas={["Fecha", "Tipo", "Origen", "Detalle", "Acciones"]}
        vacia={lista.length === 0}
        vacio="Sin registros."
      >
        {lista.map((r) => {
          const detalleStr =
            typeof r.detalle === "string"
              ? r.detalle
              : r.detalle
                ? JSON.stringify(r.detalle)
                : "";
          return (
            <tr key={r.id}>
              <Celda>{fechaHora(r.creado_en)}</Celda>
              <Celda>
                <Insignia
                  tono={
                    r.estado === "ok" ? "verde" : r.resuelto ? "gris" : "rojo"
                  }
                >
                  {r.tipo}
                </Insignia>
              </Celda>
              <Celda>{r.origen}</Celda>
              <Celda className="max-w-md break-words">
                {detalleStr ? (
                  detalleStr.length > 70 ? (
                    <details className="cursor-pointer text-xs">
                      <summary className="text-slate-700 hover:text-sky-700 font-medium">
                        {detalleStr.slice(0, 70)}...
                      </summary>
                      <pre className="mt-1.5 max-h-44 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-2 font-mono text-[11px] text-slate-200 whitespace-pre-wrap select-all">
                        {detalleStr}
                      </pre>
                    </details>
                  ) : (
                    <span className="text-xs text-slate-700">{detalleStr}</span>
                  )
                ) : (
                  <span className="text-slate-400 text-xs">—</span>
                )}
              </Celda>
              <Celda>
                {r.estado === "error" && !r.resuelto && (
                  <div className="flex flex-wrap gap-2">
                    {puedeReprocesar &&
                      r.tipo === "webhook" &&
                      r.origen === "pago" &&
                      r.payload && (
                        <AccionForm
                          accion={reprocesarWebhookAction.bind(null, r.id)}
                          boton="Reprocesar"
                          variante="neutro"
                        />
                      )}
                    <AccionForm
                      accion={resolverRegistroAction.bind(null, r.id)}
                      boton="Resuelto"
                      variante="neutro"
                    />
                  </div>
                )}
              </Celda>
            </tr>
          );
        })}
      </Tabla>
    </PaginaAdmin>
  );
}
