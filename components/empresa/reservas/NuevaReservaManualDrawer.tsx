"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Clock,
  Loader2,
  Mail,
  Package,
  User,
  Users,
} from "lucide-react";
import Drawer from "../../Drawer";
import { toast } from "../../Toast";
import { formatearMoneda } from "@/lib/formato";
import {
  convertirMoneda,
  LISTA_MONEDAS,
  normalizarMoneda,
  type CodigoMoneda,
} from "@/lib/monedas";
import { mensajeErrorUsuario } from "@/lib/errores";
import { formatearDetalleHorarioCR } from "@/lib/zona-horaria";
import type { HorarioManual, ItemManual } from "../ReservasView";

interface NuevaReservaManualDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  monedaNegocio?: CodigoMoneda;
  horariosDisponibles: HorarioManual[];
  /** Ítems de venta directa (ferias): descuentan stock sin horario. */
  items?: ItemManual[];
  hrefHorarios?: string;
  onCrear: (datos: {
    horarioId?: string;
    servicioId?: string;
    nombre: string;
    email: string;
    cupos: number;
    pagada: boolean;
    moneda?: CodigoMoneda;
  }) => Promise<string | null | undefined | void> | void;
}

type ModoManual = "cupo" | "item";

export default function NuevaReservaManualDrawer({
  abierto,
  onCerrar,
  monedaNegocio = "USD",
  horariosDisponibles,
  items = [],
  hrefHorarios,
  onCrear,
}: NuevaReservaManualDrawerProps) {
  return (
    <Drawer
      abierto={abierto}
      onClose={onCerrar}
      titulo="Nueva reserva o venta manual"
    >
      {abierto && (
        <FormularioReservaManual
          monedaNegocio={monedaNegocio}
          horariosDisponibles={horariosDisponibles}
          items={items}
          hrefHorarios={hrefHorarios}
          onCerrar={onCerrar}
          onCrear={onCrear}
        />
      )}
    </Drawer>
  );
}

function FormularioReservaManual({
  monedaNegocio = "USD",
  horariosDisponibles,
  items = [],
  hrefHorarios,
  onCerrar,
  onCrear,
}: Omit<NuevaReservaManualDrawerProps, "abierto">) {
  const horariosConCupo = horariosDisponibles.filter(
    (h) => h.cuposDisponibles > 0,
  );
  const itemsConStock = items.filter((i) => i.stock > 0);
  const hayHorarios = horariosDisponibles.length > 0;
  const hayItems = items.length > 0;

  const primeroConCupo = horariosConCupo[0] ?? horariosDisponibles[0];
  const primerItem = itemsConStock[0] ?? items[0];

  const [modo, setModo] = useState<ModoManual>(
    horariosConCupo.length === 0 && itemsConStock.length > 0 ? "item" : "cupo",
  );
  const [horarioId, setHorarioId] = useState(primeroConCupo?.id ?? "");
  const [servicioItemId, setServicioItemId] = useState(
    primerItem?.servicioId ?? "",
  );
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cupos, setCupos] = useState<number | string>(1);
  const [moneda, setMoneda] = useState<CodigoMoneda>(() =>
    normalizarMoneda(
      (horariosConCupo.length === 0 && itemsConStock.length > 0
        ? primerItem?.moneda
        : primeroConCupo?.moneda) ?? undefined,
      monedaNegocio,
    ),
  );
  const [pagada, setPagada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const esItem = modo === "item";

  const horarioElegido =
    horariosDisponibles.find((h) => h.id === horarioId) ??
    horariosConCupo[0] ??
    horariosDisponibles[0];
  const itemElegido =
    items.find((i) => i.servicioId === servicioItemId) ??
    itemsConStock[0] ??
    items[0];

  const monedaServicio = normalizarMoneda(
    esItem ? itemElegido?.moneda : horarioElegido?.moneda,
    monedaNegocio,
  );
  const disponibleActual = esItem
    ? (itemElegido?.stock ?? 0)
    : (horarioElegido?.cuposDisponibles ?? 0);
  const maxCuposManual = Math.max(
    1,
    esItem ? Math.min(disponibleActual, 50) : disponibleActual,
  );
  const cuposNum = Math.max(1, Number(cupos) || 1);
  const precioUnitario = esItem
    ? itemElegido?.precioUsd
    : horarioElegido?.precioUsd;
  const montoBaseServicio =
    precioUnitario !== undefined ? precioUnitario * cuposNum : undefined;
  const montoManualEstimado =
    montoBaseServicio !== undefined
      ? convertirMoneda(montoBaseServicio, monedaServicio, moneda)
      : undefined;
  const textoFechaHoraDetalle =
    !esItem && horarioElegido
      ? formatearDetalleHorarioCR(
          horarioElegido.fechaHora,
          horarioElegido.duracionMin,
          horarioElegido.label,
        )
      : "";

  const sinOpciones = esItem
    ? itemsConStock.length === 0
    : horariosConCupo.length === 0;

  function cambiarModo(nuevo: ModoManual) {
    setModo(nuevo);
    setCupos(1);
    const mon =
      nuevo === "item"
        ? (itemsConStock[0] ?? items[0])?.moneda
        : (horariosConCupo[0] ?? horariosDisponibles[0])?.moneda;
    setMoneda(normalizarMoneda(mon, monedaNegocio));
  }

  async function handleManual(evento: React.FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    const horarioFinal = horarioId || horarioElegido?.id;
    const itemFinal = servicioItemId || itemElegido?.servicioId;
    if (esItem ? !itemFinal : !horarioFinal) {
      toast.error(
        esItem
          ? "Selecciona un ítem con unidades disponibles."
          : "Selecciona un horario disponible.",
      );
      return;
    }
    setGuardando(true);
    try {
      const error = await onCrear({
        ...(esItem
          ? { servicioId: itemFinal }
          : { horarioId: horarioFinal }),
        nombre: nombre.trim(),
        email: email.trim(),
        cupos: Number(cupos),
        pagada,
        moneda,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(
        esItem
          ? "Venta registrada con éxito"
          : "Reserva manual registrada con éxito",
      );
      onCerrar();
    } catch (e) {
      toast.error(
        mensajeErrorUsuario(
          e,
          "No se pudo registrar la reserva. Intenta de nuevo.",
        ),
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={handleManual} className="space-y-4">
      <p className="text-xs text-slate-500">
        {esItem
          ? "Registra una venta en tu stand o feria: se descuenta del stock al instante."
          : "Registra un cliente que reservó por teléfono, WhatsApp o en persona."}
      </p>

      {hayHorarios && hayItems && (
        <div
          role="group"
          aria-label="Tipo de registro"
          className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100/90 p-1 text-xs"
        >
          {(
            [
              { id: "cupo", etiqueta: "Por horario (cupos)", icono: Clock },
              { id: "item", etiqueta: "Venta de ítems", icono: Package },
            ] as const
          ).map(({ id, etiqueta, icono: Icono }) => (
            <button
              key={id}
              type="button"
              aria-pressed={modo === id}
              onClick={() => cambiarModo(id)}
              className={`vuki-focus inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold transition ${
                modo === id
                  ? "bg-white text-vuki-ink shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icono className="h-3.5 w-3.5" aria-hidden="true" />
              {etiqueta}
            </button>
          ))}
        </div>
      )}

      {sinOpciones ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">
                {esItem
                  ? "No hay ítems con unidades disponibles"
                  : "No hay horarios con cupos libres"}
              </p>
              <p className="mt-0.5 text-xs text-amber-800">
                {esItem
                  ? "Aumenta el stock del ítem en Mis Servicios para registrar esta venta."
                  : "Publica un nuevo horario o amplía los cupos de uno existente para anotar esta reserva."}
              </p>
              {!esItem && hrefHorarios && (
                <Link
                  href={`${hrefHorarios}?nuevo=1`}
                  className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-950"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Ir a Horarios
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : esItem ? (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Ítem
            <select
              value={itemElegido?.servicioId ?? ""}
              onChange={(e) => {
                const nuevoId = e.target.value;
                setServicioItemId(nuevoId);
                const it = items.find((x) => x.servicioId === nuevoId);
                if (it) {
                  setMoneda(normalizarMoneda(it.moneda, monedaNegocio));
                  if (Number(cupos) > it.stock) {
                    setCupos(Math.max(1, Math.min(it.stock, 50)));
                  }
                }
              }}
              className="vuki-select mt-1 w-full"
            >
              {itemsConStock.map((i) => (
                <option key={i.servicioId} value={i.servicioId}>
                  {i.nombre} ({i.stock}{" "}
                  {i.stock === 1 ? "disponible" : "disponibles"})
                </option>
              ))}
            </select>
          </label>

          {itemElegido && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Venta directa
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-vuki-ink">
                    {itemElegido.nombre}
                  </p>
                </div>
                {itemElegido.precioUsd !== undefined && (
                  <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-vuki-ink shadow-2xs">
                    {formatearMoneda(itemElegido.precioUsd, monedaServicio, {
                      mostrarCodigo: monedaServicio !== monedaNegocio,
                    })}{" "}
                    / ítem
                  </span>
                )}
              </div>
              <div className="mt-2.5 flex items-center gap-1 border-t border-slate-200/80 pt-2.5 text-xs font-semibold text-emerald-700">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                {itemElegido.stock}{" "}
                {itemElegido.stock === 1 ? "unidad disponible" : "unidades disponibles"}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Horario disponible
            <select
              value={horarioElegido?.id ?? ""}
              onChange={(e) => {
                const nuevoId = e.target.value;
                setHorarioId(nuevoId);
                const h = horariosDisponibles.find((x) => x.id === nuevoId);
                if (h) {
                  setMoneda(normalizarMoneda(h.moneda, monedaNegocio));
                  if (Number(cupos) > h.cuposDisponibles) {
                    setCupos(Math.max(1, h.cuposDisponibles));
                  }
                }
              }}
              className="vuki-select mt-1 w-full"
            >
              {horariosConCupo.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.label} ({h.cuposDisponibles}{" "}
                  {h.cuposDisponibles === 1 ? "cupo libre" : "cupos libres"})
                </option>
              ))}
            </select>
          </label>

          {horarioElegido && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Salida seleccionada
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-vuki-ink">
                    {horarioElegido.servicioNombre ?? horarioElegido.label}
                  </p>
                </div>
                {horarioElegido.precioUsd !== undefined && (
                  <span className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-vuki-ink shadow-2xs">
                    {formatearMoneda(horarioElegido.precioUsd, monedaServicio, {
                      mostrarCodigo: monedaServicio !== monedaNegocio,
                    })}{" "}
                    / persona
                  </span>
                )}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-slate-200/80 pt-2.5 text-xs text-slate-600">
                {textoFechaHoraDetalle && (
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                    <CalendarDays
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {textoFechaHoraDetalle}
                  </span>
                )}
                {horarioElegido.duracionMin ? (
                  <span className="inline-flex items-center gap-1">
                    <Clock
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {horarioElegido.duracionMin} min
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  {horarioElegido.cuposDisponibles}{" "}
                  {horarioElegido.cuposDisponibles === 1
                    ? "cupo libre"
                    : "cupos libres"}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Nombre del cliente
        {esItem && (
          <span className="font-normal text-slate-400">
            {" "}
            (puedes escribir «Cliente en feria»)
          </span>
        )}
        <div className="relative mt-1">
          <User
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={esItem ? "Ej. Cliente en feria" : "Ej. María Rodríguez"}
            className="vuki-input-icon"
          />
        </div>
      </label>

      <label className="block text-sm font-medium text-slate-700">
        Correo electrónico{" "}
        <span className="font-normal text-slate-400">(opcional)</span>
        <div className="relative mt-1">
          <Mail
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="maria@ejemplo.com (si lo tienes)"
            className="vuki-input-icon"
          />
        </div>
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {esItem
            ? "En una venta de mostrador no necesitas el correo del cliente."
            : "Si la reserva fue por WhatsApp o teléfono y no tienes su correo, puedes dejarlo en blanco."}
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {esItem ? "Cantidad de ítems" : "Cupos a reservar"}
          <div className="relative mt-1">
            {esItem ? (
              <Package
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            ) : (
              <Users
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
            )}
            <input
              type="number"
              min={1}
              max={maxCuposManual}
              required
              value={cupos}
              onChange={(e) =>
                setCupos(
                  e.target.value === ""
                    ? ""
                    : Math.min(
                        maxCuposManual,
                        Math.max(1, Number(e.target.value)),
                      ),
                )
              }
              className="vuki-input-icon"
            />
          </div>
          {!sinOpciones && (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Máximo disponible: {disponibleActual}{" "}
              {esItem
                ? disponibleActual === 1
                  ? "ítem"
                  : "ítems"
                : disponibleActual === 1
                  ? "cupo"
                  : "cupos"}
            </span>
          )}
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Moneda de cobro
          <select
            value={moneda}
            onChange={(e) =>
              setMoneda(normalizarMoneda(e.target.value, monedaServicio))
            }
            className="vuki-select mt-1 w-full"
          >
            {LISTA_MONEDAS.map((m) => (
              <option key={m.codigo} value={m.codigo}>
                {m.codigo} ({m.simbolo}) · {m.etiquetaCortaEs}
              </option>
            ))}
          </select>
        </label>
      </div>

      {montoManualEstimado !== undefined && !sinOpciones && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-3">
          <div>
            <span className="text-xs font-medium text-slate-500">
              Total estimado ({cuposNum}{" "}
              {esItem
                ? cuposNum === 1
                  ? "ítem"
                  : "ítems"
                : cuposNum === 1
                  ? "persona"
                  : "personas"}
              )
            </span>
            {moneda !== monedaServicio && montoBaseServicio !== undefined && (
              <span className="block text-[11px] text-slate-500">
                Tarifa base:{" "}
                {formatearMoneda(montoBaseServicio, monedaServicio, {
                  mostrarCodigo: true,
                })}
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="font-display text-lg font-bold text-vuki-ink">
              {formatearMoneda(montoManualEstimado, moneda, {
                mostrarCodigo: true,
              })}
            </p>
            <span className="text-[11px] text-slate-500">
              Pago directo al negocio
            </span>
          </div>
        </div>
      )}

      <fieldset className="space-y-2 pt-1">
        <legend className="text-sm font-medium text-slate-700">
          Estado del cobro directo
        </legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setPagada(false)}
            className={`vuki-focus flex flex-col items-start rounded-xl border p-3 text-left transition ${
              !pagada
                ? "border-amber-400 bg-amber-50/70 ring-1 ring-amber-300"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-amber-900">
                Pendiente de cobro
              </span>
              <span
                className={`h-3.5 w-3.5 rounded-full border ${
                  !pagada
                    ? "border-amber-600 bg-amber-500"
                    : "border-slate-300 bg-white"
                }`}
              />
            </div>
            <span className="mt-1 text-[11px] leading-snug text-slate-600">
              Paga al llegar o por SINPE por confirmar.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setPagada(true)}
            className={`vuki-focus flex flex-col items-start rounded-xl border p-3 text-left transition ${
              pagada
                ? "border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-400"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-xs font-bold text-emerald-900">
                Ya cobrada
              </span>
              <span
                className={`h-3.5 w-3.5 rounded-full border ${
                  pagada
                    ? "border-emerald-600 bg-emerald-500"
                    : "border-slate-300 bg-white"
                }`}
              />
            </div>
            <span className="mt-1 text-[11px] leading-snug text-slate-600">
              Efectivo, SINPE o transferencia recibida.
            </span>
          </button>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-500">
          Las reservas manuales se gestionan como cobro directo del negocio (sin
          comisión de pasarela Vualá).
        </p>
      </fieldset>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCerrar}
          disabled={guardando}
          className="vuki-focus inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={guardando || sinOpciones}
          className="vuki-focus inline-flex min-h-11 items-center gap-2 rounded-xl bg-vuki-ink px-5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {guardando ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              Registrando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              {esItem ? "Registrar venta" : "Registrar reserva"}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
