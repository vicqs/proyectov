"use client";

import { useActionState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import type { ResultadoAccion } from "../../lib/admin/auth";

type Accion = (
  previo: ResultadoAccion,
  datos: FormData,
) => Promise<ResultadoAccion>;

const VARIANTES = {
  primario: "bg-sky-600 text-white hover:bg-sky-700",
  peligro: "bg-red-600 text-white hover:bg-red-700",
  neutro: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
} as const;

interface Props {
  accion: Accion;
  /** Campos del formulario (inputs ocultos o visibles). */
  children?: React.ReactNode;
  boton: string;
  variante?: keyof typeof VARIANTES;
  /** Pide confirmación nativa antes de enviar. */
  confirmar?: string;
  /** Limpia los campos cuando la acción termina bien. */
  limpiarAlOk?: boolean;
  /** Muestra campos y botón en una sola fila. */
  enLinea?: boolean;
  /** Deshabilita el botón (p. ej. cuando no hay nada que procesar). */
  deshabilitado?: boolean;
  className?: string;
}

const ESTADO_INICIAL: ResultadoAccion = {};

/** Formulario genérico para Server Actions de administración con feedback. */
export function AccionForm({
  accion,
  children,
  boton,
  variante = "primario",
  confirmar,
  limpiarAlOk = false,
  enLinea = false,
  deshabilitado = false,
  className = "",
}: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (limpiarAlOk && estado.ok) ref.current?.reset();
  }, [estado, limpiarAlOk]);

  return (
    <form
      ref={ref}
      action={enviar}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
      className={`${enLinea ? "flex flex-wrap items-end gap-2" : "space-y-3"} ${className}`}
    >
      {children}
      <button
        type="submit"
        disabled={pendiente || deshabilitado}
        className={`inline-flex min-h-10 items-center whitespace-nowrap justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTES[variante]}`}
      >
        {pendiente && <Loader2 className="h-4 w-4 animate-spin" />}
        {boton}
      </button>
      {estado.error && (
        <p role="alert" className="w-full text-sm text-red-600">
          {estado.error}
        </p>
      )}
      {estado.ok && !estado.error && (
        <p role="status" className="w-full text-sm text-emerald-600">
          {estado.ok}
        </p>
      )}
    </form>
  );
}
