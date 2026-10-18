"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Download,
  Loader2,
  Mail,
  Plus,
  Search,
  User,
  XCircle,
} from "lucide-react";
import EmpresaPage, { ItemLista, Lista } from "../EmpresaPage";
import Drawer from "../Drawer";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import { descargarCsv } from "../../lib/csv";
import { ZONA_HORARIA } from "../../lib/zona-horaria";

export interface VistaReserva {
  id: string;
  fechaIso: string;
  cliente: string;
  email?: string;
  servicio: string;
  horario?: string;
  cupos?: number;
  estado: "pendiente" | "pagada" | "cancelada";
  monto?: number;
  trxId?: string | null;
}

type Resultado = string | void | Promise<string | void>;

export interface HorarioManual {
  id: string;
  servicio: string;
  label: string;
  cuposDisponibles: number;
}

interface ReservasViewProps {
  reservas: VistaReserva[];
  mensajeVacio?: React.ReactNode;
  /** Si se define, muestra el botón "Cancelar" en reservas no canceladas. */
  onCancelar?: (id: string) => Resultado;
  /** Si se define, habilita el alta de reservas manuales. */
  manual?: {
    horarios: HorarioManual[];
    onCrear: (datos: {
      horarioId: string;
      nombre: string;
      email: string;
      cupos: number;
      pagada: boolean;
    }) => Resultado;
  };
}

const ESTADO_STYLES: Record<VistaReserva["estado"], string> = {
  pendiente: "bg-amber-100 text-amber-700",
  pagada: "bg-emerald-100 text-emerald-700",
  cancelada: "bg-slate-100 text-slate-500",
};

const ESTADO_LABEL: Record<VistaReserva["estado"], string> = {
  pendiente: "Pendiente",
  pagada: "Pagado",
  cancelada: "Cancelada",
};

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none";

function fechaLarga(iso: string) {
  return new Date(iso).toLocaleString("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ZONA_HORARIA,
  });
}

/** Fecha local `YYYY-MM-DD` para comparar con los filtros `type="date"`. */
function diaLocal(iso: string) {
  const f = new Date(iso);
  const mes = String(f.getMonth() + 1).padStart(2, "0");
  const dia = String(f.getDate()).padStart(2, "0");
  return `${f.getFullYear()}-${mes}-${dia}`;
}

/**
 * Reservas con filtros, exportación CSV, cancelación y alta manual.
 * Del panel de empresa (las acciones son opcionales).
 */
export default function ReservasView({
  reservas,
  mensajeVacio = "Aún no hay reservas registradas.",
  onCancelar,
  manual,
}: ReservasViewProps) {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState("");
  const [servicio, setServicio] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [porCancelar, setPorCancelar] = useState<VistaReserva | null>(null);

  const [abierto, setAbierto] = useState(false);
  const [horarioId, setHorarioId] = useState("");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cupos, setCupos] = useState("1");
  const [pagada, setPagada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const servicios = useMemo(
    () => Array.from(new Set(reservas.map((r) => r.servicio))).sort(),
    [reservas],
  );

  const filtradas = useMemo(() => {
    const q = texto.trim().toLowerCase();
    return reservas.filter((r) => {
      if (estado && r.estado !== estado) return false;
      if (servicio && r.servicio !== servicio) return false;
      const dia = diaLocal(r.fechaIso);
      if (desde && dia < desde) return false;
      if (hasta && dia > hasta) return false;
      if (
        q &&
        !`${r.cliente} ${r.email ?? ""} ${r.trxId ?? ""}`
          .toLowerCase()
          .includes(q)
      )
        return false;
      return true;
    });
  }, [reservas, texto, estado, servicio, desde, hasta]);

  const hayFiltros = Boolean(texto || estado || servicio || desde || hasta);
  const conHorario = reservas.some((r) => r.horario);
  const conMonto = reservas.some((r) => r.monto !== undefined);
  const conTrx = reservas.some((r) => r.trxId);
  const conAcciones = Boolean(onCancelar);

  function limpiarFiltros() {
    setTexto("");
    setEstado("");
    setServicio("");
    setDesde("");
    setHasta("");
  }

  function exportar() {
    descargarCsv(
      `reservas-${diaLocal(new Date().toISOString())}.csv`,
      [
        "Fecha",
        "Cliente",
        "Correo",
        "Servicio",
        "Horario",
        "Cupos",
        "Estado",
        "Monto USD",
        "ID transacción",
      ],
      filtradas.map((r) => [
        fechaLarga(r.fechaIso),
        r.cliente,
        r.email ?? "",
        r.servicio,
        r.horario ?? "",
        r.cupos ?? "",
        ESTADO_LABEL[r.estado],
        r.monto !== undefined ? r.monto.toFixed(2) : "",
        r.trxId ?? "",
      ]),
    );
  }

  async function handleCancelar() {
    if (!porCancelar || !onCancelar) return;
    const error = await onCancelar(porCancelar.id);
    if (error) toast.error(error);
    else toast.success("Reserva cancelada. Los cupos quedaron libres.");
    setPorCancelar(null);
  }

  function abrirManual() {
    setHorarioId(manual?.horarios[0]?.id ?? "");
    setNombre("");
    setEmail("");
    setCupos("1");
    setPagada(false);
    setAbierto(true);
  }

  async function handleManual(evento: React.FormEvent) {
    evento.preventDefault();
    if (!manual) return;
    setGuardando(true);
    const error = await manual.onCrear({
      horarioId,
      nombre: nombre.trim(),
      email: email.trim(),
      cupos: Number(cupos),
      pagada,
    });
    setGuardando(false);
    if (error) {
      toast.error(error);
      return;
    }
    toast.success("Reserva registrada");
    setAbierto(false);
  }

  const horarioElegido = manual?.horarios.find((h) => h.id === horarioId);

  const botonCancelar = (reserva: VistaReserva) =>
    onCancelar && reserva.estado !== "cancelada" ? (
      <button
        type="button"
        onClick={() => setPorCancelar(reserva)}
        className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
      >
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Cancelar
      </button>
    ) : null;

  return (
    <EmpresaPage
      titulo="Reservas"
      descripcion={`Reservas realizadas a través de tu enlace público (${reservas.length} en total).`}
      accion={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button
            type="button"
            onClick={exportar}
            disabled={filtradas.length === 0}
            className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Exportar CSV
          </button>
          {manual && (
            <motion.button
              type="button"
              onClick={abrirManual}
              disabled={manual.horarios.length === 0}
              whileTap={{ scale: 0.96 }}
              className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Reserva manual
            </motion.button>
          )}
        </div>
      }
    >
      {reservas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-gray-500">
          {mensajeVacio}
        </div>
      ) : (
        <>
          <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative min-w-0 lg:col-span-2">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar reservas"
                placeholder="Buscar por nombre, correo o transacción"
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                className={`${INPUT} pl-9`}
              />
            </div>
            <select
              aria-label="Filtrar por estado"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className={`${INPUT} min-w-0`}
            >
              <option value="">Todos los estados</option>
              <option value="pagada">Pagado</option>
              <option value="pendiente">Pendiente</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <select
              aria-label="Filtrar por servicio"
              value={servicio}
              onChange={(e) => setServicio(e.target.value)}
              className={`${INPUT} min-w-0`}
            >
              <option value="">Todos los servicios</option>
              {servicios.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="flex min-w-0 items-center gap-2 sm:col-span-2 lg:col-span-2">
              <input
                type="date"
                aria-label="Desde"
                value={desde}
                max={hasta || undefined}
                onChange={(e) => setDesde(e.target.value)}
                className={`${INPUT} min-w-0`}
              />
              <input
                type="date"
                aria-label="Hasta"
                value={hasta}
                min={desde || undefined}
                onChange={(e) => setHasta(e.target.value)}
                className={`${INPUT} min-w-0`}
              />
            </div>
            {hayFiltros && (
              <p className="flex items-center justify-between text-xs text-slate-500 sm:col-span-2 lg:col-span-6">
                <span>
                  Mostrando {filtradas.length} de {reservas.length} reservas
                </span>
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="font-semibold text-sky-600 hover:underline"
                >
                  Limpiar filtros
                </button>
              </p>
            )}
          </div>

          {filtradas.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-gray-500">
              Ninguna reserva coincide con los filtros.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 whitespace-nowrap">Fecha</th>
                      <th className="px-5 py-3">Cliente</th>
                      <th className="px-5 py-3">Servicio</th>
                      {conHorario && <th className="px-5 py-3">Horario</th>}
                      {conHorario && <th className="px-5 py-3">Cupos</th>}
                      <th className="px-5 py-3">Estado</th>
                      {conMonto && (
                        <th className="px-5 py-3 text-right">Monto</th>
                      )}
                      {conTrx && (
                        <th className="px-5 py-3 whitespace-nowrap">
                          ID Transacción
                        </th>
                      )}
                      {conAcciones && <th className="px-5 py-3" />}
                    </tr>
                  </thead>
                  <Lista as="tbody">
                    {filtradas.map((reserva) => (
                      <ItemLista
                        as="tr"
                        key={reserva.id}
                        className={`border-b border-slate-50 last:border-0 ${reserva.estado === "cancelada" ? "opacity-60" : ""}`}
                      >
                        <td
                          className="px-5 py-4 whitespace-nowrap text-slate-600"
                          suppressHydrationWarning
                        >
                          {fechaLarga(reserva.fechaIso)}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-slate-900">
                            {reserva.cliente}
                          </p>
                          {reserva.email && (
                            <p className="text-xs text-gray-500">
                              {reserva.email}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {reserva.servicio}
                        </td>
                        {conHorario && (
                          <td className="px-5 py-4 text-slate-600">
                            {reserva.horario ?? "—"}
                          </td>
                        )}
                        {conHorario && (
                          <td className="px-5 py-4 text-slate-600">
                            {reserva.cupos ?? "—"}
                          </td>
                        )}
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado]}`}
                          >
                            {ESTADO_LABEL[reserva.estado]}
                          </span>
                        </td>
                        {conMonto && (
                          <td className="px-5 py-4 text-right font-semibold text-slate-900">
                            {reserva.monto !== undefined
                              ? `$${reserva.monto.toFixed(2)}`
                              : "—"}
                          </td>
                        )}
                        {conTrx && (
                          <td className="px-5 py-4 font-mono text-xs text-slate-500">
                            {reserva.trxId ?? "—"}
                          </td>
                        )}
                        {conAcciones && (
                          <td className="px-5 py-4 text-right">
                            {botonCancelar(reserva)}
                          </td>
                        )}
                      </ItemLista>
                    ))}
                  </Lista>
                </table>
              </div>

              <Lista as="ul" className="space-y-3 sm:hidden">
                {filtradas.map((reserva) => (
                  <ItemLista
                    as="li"
                    key={reserva.id}
                    className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${reserva.estado === "cancelada" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                        <CalendarCheck
                          className="h-5 w-5 text-emerald-600"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">
                          {reserva.servicio}
                        </p>
                        <p
                          className="text-xs text-gray-500"
                          suppressHydrationWarning
                        >
                          {reserva.horario ?? fechaLarga(reserva.fechaIso)}
                          {reserva.cupos ? ` · ${reserva.cupos} cupo(s)` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p className="flex items-center gap-1.5">
                        {reserva.email ? (
                          <User
                            className="h-3.5 w-3.5 text-slate-400"
                            aria-hidden="true"
                          />
                        ) : (
                          <Mail
                            className="h-3.5 w-3.5 text-slate-400"
                            aria-hidden="true"
                          />
                        )}
                        {reserva.cliente}
                      </p>
                      {reserva.email && (
                        <p className="flex items-center gap-1.5">
                          <Mail
                            className="h-3.5 w-3.5 text-slate-400"
                            aria-hidden="true"
                          />
                          {reserva.email}
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_STYLES[reserva.estado]}`}
                      >
                        {ESTADO_LABEL[reserva.estado]}
                      </span>
                      <div className="flex items-center gap-3">
                        {reserva.monto !== undefined && (
                          <span className="font-semibold text-slate-900">
                            ${reserva.monto.toFixed(2)}
                          </span>
                        )}
                        {botonCancelar(reserva)}
                      </div>
                    </div>
                  </ItemLista>
                ))}
              </Lista>
            </>
          )}
        </>
      )}

      {manual && (
        <Drawer
          abierto={abierto}
          onClose={() => setAbierto(false)}
          titulo="Reserva manual"
        >
          <form onSubmit={handleManual} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="m-horario"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Horario
              </label>
              <select
                id="m-horario"
                required
                value={horarioId}
                onChange={(e) => setHorarioId(e.target.value)}
                className={INPUT}
              >
                {manual.horarios.map((h) => (
                  <option
                    key={h.id}
                    value={h.id}
                    disabled={h.cuposDisponibles === 0}
                  >
                    {h.servicio} · {h.label} ({h.cuposDisponibles} cupos)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="m-nombre"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Nombre del cliente
              </label>
              <input
                id="m-nombre"
                required
                maxLength={100}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor="m-email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Correo
              </label>
              <input
                id="m-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label
                htmlFor="m-cupos"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Personas (cupos)
              </label>
              <input
                id="m-cupos"
                type="number"
                min="1"
                max={Math.max(1, horarioElegido?.cuposDisponibles ?? 1)}
                required
                value={cupos}
                onChange={(e) => setCupos(e.target.value)}
                className={INPUT}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={pagada}
                onChange={(e) => setPagada(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Ya recibí el pago (marcar como pagada)
            </label>
            <motion.button
              type="submit"
              disabled={guardando}
              whileTap={{ scale: 0.97 }}
              className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Registrar reserva
            </motion.button>
          </form>
        </Drawer>
      )}

      <ConfirmDialog
        abierto={porCancelar !== null}
        titulo="¿Cancelar esta reserva?"
        descripcion="Se liberarán sus cupos. Si el cliente ya pagó, el reembolso debes gestionarlo por separado."
        onConfirmar={() => void handleCancelar()}
        onCancelar={() => setPorCancelar(null)}
      />
    </EmpresaPage>
  );
}
