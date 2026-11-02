"use client";

import { useState } from "react";
import {
  eliminarNegocioAction,
  restaurarNegocioAction,
} from "../../actions/admin/negocios";
import { AccionForm } from "./AccionForm";
import { CLASE_INPUT, Tarjeta } from "./ui";

interface Props {
  negocioId: string;
  slug: string;
  eliminadoEn?: string | null;
}

export function TarjetaEliminacion({ negocioId, slug, eliminadoEn }: Props) {
  const [confirmar, setConfirmar] = useState("");
  const coincide = confirmar.trim() === slug;

  return (
    <Tarjeta
      titulo="Eliminación"
      descripcion="El negocio dejará de existir para la empresa y el público (se puede restaurar)."
      className="border-red-200/80"
      accion={
        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200/60">
          Zona de peligro
        </span>
      }
    >
      {eliminadoEn ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Este negocio fue marcado como eliminado. Puedes restaurarlo para reactivar su presencia y panel.
          </p>
          <AccionForm
            accion={restaurarNegocioAction.bind(null, negocioId)}
            boton="Restaurar negocio"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-red-100 bg-red-50/50 p-3.5 text-xs text-red-900 leading-relaxed">
            <p className="font-medium text-red-800">
              Esta acción oculta el negocio y desactiva el acceso para la empresa y clientes públicos.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-slate-700">
              <span>Para confirmar, escribe exactamente:</span>
              <code className="rounded bg-white px-2 py-0.5 font-mono font-bold text-red-700 select-all border border-red-200 shadow-2xs">
                {slug}
              </code>
            </div>
          </div>

          <AccionForm
            accion={eliminarNegocioAction.bind(null, negocioId)}
            boton="Eliminar negocio"
            variante="peligro"
            confirmar="El negocio dejará de existir para empresa y público (se puede restaurar). ¿Continuar?"
            deshabilitado={!coincide}
            claseBoton={!coincide ? "opacity-50 cursor-not-allowed" : ""}
            enLinea
            className="w-full flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            <input
              name="confirmar"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              placeholder={`Escribe «${slug}»`}
              className={`${CLASE_INPUT} flex-1 min-w-0 font-mono text-sm`}
              aria-label="Confirmación de eliminación"
              autoComplete="off"
              spellCheck={false}
            />
          </AccionForm>
        </div>
      )}
    </Tarjeta>
  );
}
