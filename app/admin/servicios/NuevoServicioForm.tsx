"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";
import {
  crearServicioAction,
  type CrearServicioActionState,
} from "../../../actions/servicios";

const initialState: CrearServicioActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      Agregar servicio
    </button>
  );
}

/** Formulario de creación de servicio. Client Component por la interactividad. */
export default function NuevoServicioForm() {
  const [state, formAction] = useActionState(crearServicioAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="nombre"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          required
          placeholder="Clase de surf 1h"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="w-full sm:w-32">
        <label
          htmlFor="precio_usd"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Precio (USD)
        </label>
        <input
          id="precio_usd"
          name="precio_usd"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="w-full sm:w-32">
        <label
          htmlFor="duracion_min"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Duración (min)
        </label>
        <input
          id="duracion_min"
          name="duracion_min"
          type="number"
          min="1"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <SubmitButton />

      {state.error && (
        <p className="text-sm text-red-500 sm:basis-full">{state.error}</p>
      )}
    </form>
  );
}
