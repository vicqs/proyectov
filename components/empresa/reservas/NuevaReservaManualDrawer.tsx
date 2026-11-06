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
  User,
  Users,
} from "lucide-react";
import Drawer from "../../Drawer";
import { toast } from "../../Toast";
import { formatearPrecioUsd } from "@/lib/formato";
import { mensajeErrorUsuario } from "@/lib/errores";
import { formatearDetalleHorarioCR } from "@/lib/zona-horaria";
import type { HorarioManual } from "../ReservasView";

interface NuevaReservaManualDrawerProps {
  abierto: boolean;
  onCerrar: () => void;
  horariosDisponibles: HorarioManual[];
  hrefHorarios?: string;
  onCrear: (datos: {
    horarioId: string;
    nombre: string;
    email: string;
    cupos: number;
    pagada: boolean;
  }) => Promise<string | null | undefined | void> | void;
}

export default function NuevaReservaManualDrawer({
  abierto,
  onCerrar,
  horariosDisponibles,
  hrefHorarios,
  onCrear,
}: NuevaReservaManualDrawerProps) {
  return (
    <Drawer
      abierto={abierto}
      onClose={onCerrar}
      titulo="Nueva reserva manual"
    >
      {abierto && (
        <FormularioReservaManual
          horariosDisponibles={horariosDisponibles}
          hrefHorarios={hrefHorarios}
          onCerrar={onCerrar}
          onCrear={onCrear}
        />
      )}
    </Drawer>
  );
}

function FormularioReservaManual({
  horariosDisponibles,
  hrefHorarios,
  onCerrar,
  onCrear,
}: Omit<NuevaReservaManualDrawerProps, "abierto">) {
  const primeroConCupo =
    horariosDisponibles.find((h) => h.cuposDisponibles > 0) ??
    horariosDisponibles[0];

  const [horarioId, setHorarioId] = useState(primeroConCupo?.id ?? "");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [cupos, setCupos] = useState<number | string>(1);
  const [pagada, setPagada] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const horariosConCupo = horariosDisponibles.filter(
    (h) => h.cuposDisponibles > 0,
  );
  const horarioElegido =
    horariosDisponibles.find((h) => h.id === horarioId) ??
    horariosDisponibles.find((h) => h.cuposDisponibles > 0) ??
    horariosDisponibles[0];
  const maxCuposManual = Math.max(1, horarioElegido?.cuposDisponibles ?? 1);
  const cuposNum = Math.max(1, Number(cupos) || 1);
  const montoManualEstimado =
    horarioElegido?.precioUsd !== undefined
      ? horarioElegido.precioUsd * cuposNum
      : undefined;
  const textoFechaHoraDetalle = horarioElegido
    ? formatearDetalleHorarioCR(
        horarioElegido.fechaHora,
        horarioElegido.duracionMin,
        horarioElegido.label,
      )
    : "";

  async function handleManual(evento: React.FormEvent) {
    evento.preventDefault();
    if (guardando) return;
    const idFinal = horarioId || horarioElegido?.id;
    if (!idFinal) {
      toast.error("Selecciona un horario disponible.");
      return;
    }
    setGuardando(true);
    try {
      const error = await onCrear({
        horarioId: idFinal,
        nombre: nombre.trim(),
        email: email.trim(),
        cupos: Number(cupos),
        pagada,
      });
      if (error) {
        toast.error(error);
        return;
      }
      toast.success("Reserva manual registrada con éxito");
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
        Registra un cliente que reservó por teléfono, WhatsApp o en persona.
      </p>

      {horariosConCupo.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2.5">
            <AlertTriangle
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
              aria-hidden="true"
            />
            <div>
              <p className="font-semibold">No hay horarios con cupos libres</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Publica un nuevo horario o amplía los cupos de uno existente
                para anotar esta reserva.
              </p>
              {hrefHorarios && (
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
                if (h && Number(cupos) > h.cuposDisponibles) {
                  setCupos(Math.max(1, h.cuposDisponibles));
                }
              }}
              className="vuki-select mt-1"
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
                    {formatearPrecioUsd(horarioElegido.precioUsd)} / persona
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
            placeholder="Ej. María Rodríguez"
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
          Si la reserva fue por WhatsApp o teléfono y no tienes su correo,
          puedes dejarlo en blanco.
        </span>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Cupos a reservar
          <div className="relative mt-1">
            <Users
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
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
          {horarioElegido && (
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Máximo disponible: {horarioElegido.cuposDisponibles}{" "}
              {horarioElegido.cuposDisponibles === 1 ? "cupo" : "cupos"}
            </span>
          )}
        </label>

        {montoManualEstimado !== undefined && (
          <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <span className="text-xs font-medium text-slate-500">
              Total estimado ({cuposNum}{" "}
              {cuposNum === 1 ? "persona" : "personas"})
            </span>
            <p className="mt-1 font-display text-lg font-bold text-vuki-ink">
              {formatearPrecioUsd(montoManualEstimado)}
            </p>
            <span className="text-[11px] text-slate-500">
              Pago directo al negocio
            </span>
          </div>
        )}
      </div>

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
          disabled={guardando || horariosConCupo.length === 0}
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
              Registrar reserva
            </>
          )}
        </button>
      </div>
    </form>
  );
}
