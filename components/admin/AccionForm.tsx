"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import ConfirmDialog from "../ConfirmDialog";
import { toast } from "../Toast";
import type { ResultadoAccion } from "../../lib/admin/auth";

type Accion = (
  previo: ResultadoAccion,
  datos: FormData,
) => Promise<ResultadoAccion>;

const VARIANTES = {
  primario: "vuki-btn-primary",
  peligro: "vuki-btn-danger",
  peligro_sutil: "vuki-btn-danger-outline",
  neutro: "vuki-btn-secondary",
  neutro_sm: "vuki-btn-secondary-sm",
  acento_sm: "vuki-btn-accent-sm",
} as const;

interface Props {
  accion: Accion;
  /** Campos del formulario (inputs ocultos o visibles). */
  children?: React.ReactNode;
  boton: string;
  variante?: keyof typeof VARIANTES;
  tamano?: "normal" | "sm" | "xs";
  claseBoton?: string;
  icono?: React.ReactNode;
  /** Pide confirmación antes de enviar (usa ConfirmDialog). */
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

/** Formulario genérico para Server Actions de administración con feedback vía Toast estándar. */
export function AccionForm({
  accion,
  children,
  boton,
  variante = "primario",
  tamano = "normal",
  claseBoton = "",
  icono,
  confirmar,
  limpiarAlOk = false,
  enLinea = false,
  deshabilitado = false,
  className = "",
}: Props) {
  const [estado, enviar, pendiente] = useActionState(accion, ESTADO_INICIAL);
  const [dialogoAbierto, setDialogoAbierto] = useState(false);
  const ref = useRef<HTMLFormElement>(null);
  const confirmadoRef = useRef(false);

  useEffect(() => {
    if (estado.ok) {
      if (limpiarAlOk) ref.current?.reset();
      const matchPassword = estado.ok.match(
        /(?:contraseña temporal:?|temporal:?)\s*([^\s(),.]+)/i,
      );
      if (matchPassword && matchPassword[1]) {
        navigator?.clipboard?.writeText(matchPassword[1]).catch(() => {});
      }
      toast.success(estado.ok);
    } else if (estado.error) {
      toast.error(estado.error);
    }
  }, [estado, limpiarAlOk]);

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    if (confirmar && !confirmadoRef.current) {
      e.preventDefault();
      setDialogoAbierto(true);
      return;
    }
    confirmadoRef.current = false;
  }

  function ejecutarConfirmado() {
    setDialogoAbierto(false);
    confirmadoRef.current = true;
    ref.current?.requestSubmit();
  }

  return (
    <>
      <form
        ref={ref}
        action={enviar}
        onSubmit={alEnviar}
        className={`${enLinea ? "flex flex-wrap items-end gap-2" : "space-y-3"} ${className}`}
      >
        {children}
        <button
          type="submit"
          disabled={pendiente || deshabilitado}
          className={`whitespace-nowrap ${VARIANTES[variante]} ${tamano === "xs" ? "!min-h-0 text-xs !px-2.5 !py-1" : ""} ${claseBoton}`}
        >
          {pendiente ? (
            <Loader2
              className={`${tamano === "xs" ? "h-3 w-3" : tamano === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin shrink-0`}
              aria-hidden="true"
            />
          ) : (
            icono && <span className="shrink-0">{icono}</span>
          )}
          <span>{boton}</span>
        </button>
      </form>

      {confirmar && (
        <ConfirmDialog
          abierto={dialogoAbierto}
          titulo="¿Confirmar acción?"
          descripcion={confirmar}
          textoConfirmar={variante === "peligro" ? "Continuar" : "Confirmar"}
          onConfirmar={ejecutarConfirmado}
          onCancelar={() => setDialogoAbierto(false)}
        />
      )}
    </>
  );
}
