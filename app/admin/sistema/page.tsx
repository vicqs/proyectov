import { requerirAdmin } from "../../../lib/admin/auth";
import { leer } from "../../../lib/admin/db";
import { fechaHora, parametro } from "../../../lib/admin/formato";
import { isMockMode } from "../../../lib/mock/client";
import { isStripeMockMode } from "../../../lib/stripe";
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
} from "../../../components/admin/ui";

async function contar(tabla: Parameters<typeof leer>[0]): Promise<string> {
  try {
    return String((await leer(tabla)).length);
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

  const [registros, negocios, reservas, config] = await Promise.all([
    leer("registro_sistema").catch(() => []),
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
  const errores = registros.filter(
    (r) => r.estado === "error" && !r.resuelto,
  ).length;
  const puedeReprocesar = tienePermiso(admin.rol, "sistema");

  const comprobaciones: [string, string, boolean][] = [
    ["Base de datos", isMockMode ? "Memoria (simulada)" : "Supabase", true],
    ["Pagos de suscripción", isStripeMockMode ? "Simulado" : "Stripe", true],
    [
      "Correo",
      isMockMode
        ? "Simulado (solo consola)"
        : process.env.RESEND_API_KEY
          ? "Resend configurado"
          : "Sin RESEND_API_KEY",
      isMockMode || !!process.env.RESEND_API_KEY,
    ],
    [
      "Secreto webhook de pagos",
      process.env.PAGO_WEBHOOK_SECRET
        ? "Configurado"
        : "Falta PAGO_WEBHOOK_SECRET",
      !!process.env.PAGO_WEBHOOK_SECRET || isMockMode,
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
        <ul className="divide-y divide-slate-100 text-sm">
          {comprobaciones.map(([nombre, estado, ok]) => (
            <li key={nombre} className="flex items-center justify-between py-2">
              <span className="text-slate-700">{nombre}</span>
              <span className="flex items-center gap-2 text-slate-500">
                {estado}
                <Insignia tono={ok ? "verde" : "rojo"}>
                  {ok ? "OK" : "Revisar"}
                </Insignia>
              </span>
            </li>
          ))}
        </ul>
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
