"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Ban, Check, Copy, Loader2, RotateCcw } from "lucide-react";
import { toast } from "../Toast";
import {
  CLASE_BOTON_NEUTRO,
  CLASE_SELECT,
  CampoBusqueda,
  Celda,
  Insignia,
  PestanasFiltro,
  Tabla,
  Tarjeta,
  type TonoInsignia,
} from "./ui";
import { AccionForm } from "./AccionForm";
import { usd } from "../../lib/admin/formato";
import {
  ReembolsoDrawer,
  type ReservaParaReembolso,
} from "./ReembolsoDrawer";
import type { ResultadoAccion } from "../../lib/admin/auth";

const TONO: Record<string, TonoInsignia> = {
  pagada: "verde",
  pendiente: "ambar",
  cancelada: "rojo",
};

const ETIQUETAS: Record<string, string> = {
  pagada: "Pagada",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
};

export interface ReservaItemAdmin {
  id: string;
  fechaHora: string;
  emailCliente: string;
  trxId: string | null;
  esPagoManual: boolean;
  estado: string;
  negocioId: string;
  negocioNombre: string;
  servicioNombre: string;
  montoUsd: number;
  puedeReembolsar: boolean;
  conReembolso: boolean;
}

export interface ReembolsoPendienteItem {
  id: string;
  negocioNombre: string;
  reservaId: string;
  montoUsd: number;
  motivo: string;
}

export function ReservasAdminClient({
  reservas,
  negocios,
  reembolsosPendientes,
  conteos,
  qInicial,
  estadoInicial,
  negocioInicial,
  pagina,
  paginas,
  total,
  cancelarAction,
  registrarReembolsoAction,
  completarReembolsoAction,
  puedeCompletarReembolso = true,
}: {
  reservas: ReservaItemAdmin[];
  negocios: { id: string; nombre: string }[];
  reembolsosPendientes: ReembolsoPendienteItem[];
  conteos: {
    todas: number;
    pagadas: number;
    pendientes: number;
    canceladas: number;
    conReembolso: number;
  };
  qInicial: string;
  estadoInicial: string;
  negocioInicial: string;
  pagina: number;
  paginas: number;
  total: number;
  cancelarAction: (
    id: string,
    previo: ResultadoAccion,
    datos: FormData,
  ) => Promise<ResultadoAccion>;
  registrarReembolsoAction: (
    reservaId: string,
    previo: ResultadoAccion,
    datos: FormData,
  ) => Promise<ResultadoAccion>;
  completarReembolsoAction: (
    id: string,
    previo: ResultadoAccion,
    datos: FormData,
  ) => Promise<ResultadoAccion>;
  puedeCompletarReembolso?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pendiente, iniciar] = useTransition();
  const [reservaParaReembolso, setReservaParaReembolso] =
    useState<ReservaParaReembolso | null>(null);
  const [idCopiado, setIdCopiado] = useState<string | null>(null);

  async function copiarId(id: string) {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(id);
      setIdCopiado(id);
      toast.success("ID de reserva copiado al portapapeles");
      window.setTimeout(() => {
        setIdCopiado((actual) => (actual === id ? null : actual));
      }, 2000);
    } catch {
      toast.error("No se pudo copiar el ID.");
    }
  }

  const vistaActiva =
    estadoInicial === "pagada"
      ? "pagadas"
      : estadoInicial === "pendiente"
        ? "pendientes"
        : estadoInicial === "cancelada"
          ? "canceladas"
          : estadoInicial === "reembolso"
            ? "reembolso"
            : "todas";

  function cambiarFiltro(cambios: {
    q?: string;
    estado?: string;
    negocio?: string;
    pagina?: string;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(cambios)) {
      if (v === undefined || v === "") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    }
    // Reiniciar a página 1 al cambiar filtros
    if (!("pagina" in cambios)) {
      params.delete("pagina");
    }
    const qStr = params.toString();
    iniciar(() => {
      router.replace(qStr ? `${pathname}?${qStr}` : pathname, {
        scroll: false,
      });
    });
  }

  function seleccionarPestana(id: string) {
    const estadoMap: Record<string, string> = {
      todas: "",
      pagadas: "pagada",
      pendientes: "pendiente",
      canceladas: "cancelada",
      reembolso: "reembolso",
    };
    cambiarFiltro({ estado: estadoMap[id] ?? "" });
  }

  const pestanas = useMemo(
    () => [
      { id: "todas", etiqueta: "Todas", conteo: conteos.todas },
      { id: "pagadas", etiqueta: "Pagadas", conteo: conteos.pagadas },
      { id: "pendientes", etiqueta: "Pendientes", conteo: conteos.pendientes },
      { id: "canceladas", etiqueta: "Canceladas", conteo: conteos.canceladas },
      {
        id: "reembolso",
        etiqueta: "Con reembolso",
        conteo: conteos.conReembolso,
      },
    ],
    [conteos],
  );

  const hayFiltros = !!qInicial || !!estadoInicial || !!negocioInicial;

  return (
    <>
      {/* Reembolsos pendientes de conciliación */}
      {reembolsosPendientes.length > 0 && (
        <Tarjeta titulo="Reembolsos pendientes de confirmación">
          <Tabla columnas={["Negocio", "Reserva", "Monto", "Motivo", ""]}>
            {reembolsosPendientes.map((r) => (
              <tr key={r.id}>
                <Celda>{r.negocioNombre}</Celda>
                <Celda className="font-mono text-xs">{r.reservaId}</Celda>
                <Celda>{usd(r.montoUsd)}</Celda>
                <Celda>{r.motivo}</Celda>
                <Celda>
                  {puedeCompletarReembolso ? (
                    <AccionForm
                      accion={completarReembolsoAction.bind(null, r.id)}
                      boton="Marcar completado"
                      variante="acento_sm"
                      tamano="sm"
                      icono={
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      }
                      confirmar="¿Confirmas que el dinero ya fue devuelto al cliente?"
                    />
                  ) : (
                    <Insignia tono="ambar">Pendiente de finanzas</Insignia>
                  )}
                </Celda>
              </tr>
            ))}
          </Tabla>
        </Tarjeta>
      )}

      {/* Barra de filtros unificada (estilo panel de empresa) */}
      <div className="space-y-3 rounded-2xl border border-sky-100 bg-white p-4 shadow-sm shadow-slate-900/[0.02]">
        {/* Pestañas rápidas */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <PestanasFiltro
            pestanas={pestanas}
            activa={vistaActiva}
            onChange={seleccionarPestana}
          />
          {pendiente && (
            <div className="flex items-center gap-1.5 text-xs text-vuki-ocean">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Actualizando...</span>
            </div>
          )}
        </div>

        {/* Fila de controles secundarios */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <div className="min-w-0 flex-1 sm:max-w-xs">
            <CampoBusqueda
              defaultValue={qInicial}
              placeholder="Buscar cliente, ID o transacción..."
              ariaLabel="Buscar cliente, ID o transacción"
              className="w-full"
            />
          </div>

          <div className="min-w-0 sm:w-60">
            <select
              aria-label="Filtrar por negocio"
              value={negocioInicial}
              onChange={(e) => cambiarFiltro({ negocio: e.target.value })}
              className={`${CLASE_SELECT} w-full`}
            >
              <option value="">Todos los negocios</option>
              {negocios.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.nombre}
                </option>
              ))}
            </select>
          </div>

          {hayFiltros && (
            <button
              type="button"
              onClick={() =>
                cambiarFiltro({ q: "", estado: "", negocio: "" })
              }
              className="vuki-btn-secondary-sm"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabla de reservas */}
      <Tabla
        columnas={[
          "Fecha",
          "Negocio / servicio",
          "Cliente",
          "Estado",
          "Monto",
          "Acciones",
        ]}
        vacia={reservas.length === 0}
      >
        {reservas.map((r) => (
          <tr key={r.id}>
            <Celda>
              <p className="font-medium text-slate-800">{r.fechaHora}</p>
              <div className="mt-0.5 flex items-center gap-1.5">
                <span
                  className="font-mono text-[11px] text-slate-400 select-all"
                  title={`ID completo: ${r.id}`}
                >
                  {r.id.slice(0, 8)}
                </span>
                <button
                  type="button"
                  onClick={() => void copiarId(r.id)}
                  title={idCopiado === r.id ? "¡Copiado!" : "Copiar ID completo"}
                  aria-label={`Copiar ID de reserva ${r.id}`}
                  className="vuki-focus inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  {idCopiado === r.id ? (
                    <Check className="h-3 w-3 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3 w-3" aria-hidden="true" />
                  )}
                </button>
              </div>
            </Celda>
            <Celda>
              <Link
                href={`/admin/negocios/${r.negocioId}`}
                className="font-semibold text-sky-700 hover:underline"
              >
                {r.negocioNombre}
              </Link>
              <p className="text-xs text-slate-500">{r.servicioNombre}</p>
            </Celda>
            <Celda>
              <p className="text-slate-800">{r.emailCliente}</p>
              {r.trxId && (
                <p className="text-xs text-slate-400 font-mono">
                  {r.esPagoManual ? "Pago manual" : r.trxId}
                </p>
              )}
            </Celda>
            <Celda>
              <Insignia tono={TONO[r.estado] ?? "gris"}>
                {ETIQUETAS[r.estado] ?? r.estado}
              </Insignia>
              {r.conReembolso && (
                <p className="mt-1 text-xs text-slate-500 font-medium">
                  Con reembolso
                </p>
              )}
            </Celda>
            <Celda className="font-semibold text-slate-900">
              {usd(r.montoUsd)}
            </Celda>
            <Celda>
              <div className="flex flex-wrap items-center gap-1.5">
                {r.puedeReembolsar && (
                  <button
                    type="button"
                    onClick={() =>
                      setReservaParaReembolso({
                        id: r.id,
                        fechaHora: r.fechaHora,
                        emailCliente: r.emailCliente,
                        trxId: r.trxId,
                        negocioNombre: r.negocioNombre,
                        servicioNombre: r.servicioNombre,
                        montoUsd: r.montoUsd,
                      })
                    }
                    className="vuki-btn-secondary-sm"
                  >
                    <RotateCcw className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    <span>Reembolsar</span>
                  </button>
                )}
                {r.estado !== "cancelada" && (
                  <AccionForm
                    accion={cancelarAction.bind(null, r.id)}
                    boton="Cancelar"
                    variante="peligro_sutil"
                    tamano="sm"
                    icono={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                    confirmar="¿Cancelar esta reserva? Se liberará el cupo."
                  />
                )}
              </div>
            </Celda>
          </tr>
        ))}
      </Tabla>

      {/* Paginación */}
      <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span>{total} reserva(s) encontrada(s)</span>
        {paginas > 1 && (
          <div className="flex flex-wrap items-center gap-2">
            {pagina > 1 && (
              <button
                type="button"
                onClick={() => cambiarFiltro({ pagina: String(pagina - 1) })}
                className="vuki-btn-secondary-sm"
              >
                Anterior
              </button>
            )}
            <span>
              Página {pagina} de {paginas}
            </span>
            {pagina < paginas && (
              <button
                type="button"
                onClick={() => cambiarFiltro({ pagina: String(pagina + 1) })}
                className="vuki-btn-secondary-sm"
              >
                Siguiente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Drawer lateral de reembolso (idéntico a Drawer de empresa/servicios) */}
      <ReembolsoDrawer
        reserva={reservaParaReembolso}
        onClose={() => setReservaParaReembolso(null)}
        accion={registrarReembolsoAction}
      />
    </>
  );
}

