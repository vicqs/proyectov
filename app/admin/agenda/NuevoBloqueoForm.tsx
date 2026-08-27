"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Plus } from "lucide-react";
import {
  crearBloqueoAction,
  type CrearBloqueoActionState,
} from "../../../actions/agenda";

const initialState: CrearBloqueoActionState = {};

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
      Guardar bloqueo
    </button>
  );
}

/** Formulario de creación de bloqueo de horario. Client Component + Server Action. */
export default function NuevoBloqueoForm() {
  const [state, formAction] = useActionState(crearBloqueoAction, initialState);
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
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-end sm:flex-wrap"
    >
      <div className="flex-1 min-w-[10rem]">
        <label
          htmlFor="fecha_inicio"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Fecha inicio
        </label>
        <input
          id="fecha_inicio"
          name="fecha_inicio"
          type="datetime-local"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="flex-1 min-w-[10rem]">
        <label
          htmlFor="fecha_fin"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Fecha fin
        </label>
        <input
          id="fecha_fin"
          name="fecha_fin"
          type="datetime-local"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
        />
      </div>

      <div className="flex-[2] min-w-[12rem]">
        <label
          htmlFor="motivo"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Motivo
        </label>
        <input
          id="motivo"
          name="motivo"
          required
          placeholder="Vacaciones, mantenimiento, etc."
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
