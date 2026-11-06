"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import {
  cambiarContrasenaEmpresaAction,
  type CambiarContrasenaEmpresaState,
} from "@/actions/personalizacion";
import Drawer from "@/components/Drawer";
import { toast } from "@/components/Toast";
import { conResilienciaRed } from "@/lib/errores";

const initialPassState: CambiarContrasenaEmpresaState = {};
const INPUT = "vuki-input min-h-11";

interface CambiarContrasenaCardProps {
  slug: string;
  emailCuenta: string;
}

export default function CambiarContrasenaCard({
  slug,
  emailCuenta,
}: CambiarContrasenaCardProps) {
  const [abierto, setAbierto] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState(
    conResilienciaRed(cambiarContrasenaEmpresaAction.bind(null, slug)),
    initialPassState,
  );

  function cerrarDrawer() {
    if (pending) return;
    setAbierto(false);
    formRef.current?.reset();
  }

  useEffect(() => {
    if (state.success && state.savedAt) {
      toast.success("Contraseña actualizada correctamente.");
      cerrarDrawer();
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <section
        id="acceso"
        className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
              <Lock className="h-4 w-4 text-slate-500" aria-hidden="true" />
              Cuenta y seguridad
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Credenciales con las que administras este panel.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAbierto(true)}
            className="vuki-focus inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            Cambiar contraseña
          </button>
        </div>

        {emailCuenta && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <Mail
              className="h-3.5 w-3.5 shrink-0 text-slate-400"
              aria-hidden="true"
            />
            <span className="text-slate-500">Sesión:</span>
            <strong className="truncate font-semibold text-slate-800">
              {emailCuenta}
            </strong>
          </div>
        )}
      </section>

      <Drawer
        abierto={abierto}
        onClose={cerrarDrawer}
        titulo="Cambiar contraseña"
      >
        <form ref={formRef} action={action} className="flex flex-col gap-5">
          {emailCuenta && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
              <Mail
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
              <span className="text-slate-500">Sesión:</span>
              <strong className="truncate font-semibold text-slate-800">
                {emailCuenta}
              </strong>
            </div>
          )}

          <p className="text-xs text-slate-500">
            Ingresa tu contraseña actual y define una nueva para acceder a este
            panel de administración.
          </p>

          <div>
            <label
              htmlFor="pass_actual"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Contraseña actual
            </label>
            <input
              id="pass_actual"
              name="actual"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className={INPUT}
            />
          </div>

          <div>
            <label
              htmlFor="pass_nueva"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nueva contraseña (mínimo 8 caracteres)
            </label>
            <input
              id="pass_nueva"
              name="nueva"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="••••••••"
              className={INPUT}
            />
            <p className="mt-1 text-xs text-slate-400">
              Debe contener al menos 8 caracteres y ser distinta a la actual.
            </p>
          </div>

          <div>
            <label
              htmlFor="pass_confirmar"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Confirmar nueva contraseña
            </label>
            <input
              id="pass_confirmar"
              name="confirmar"
              type="password"
              required
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              placeholder="••••••••"
              className={INPUT}
            />
          </div>

          <div className="mt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={pending}
              className="vuki-focus flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Lock className="h-4 w-4" aria-hidden="true" />
              )}
              {pending ? "Actualizando..." : "Actualizar contraseña"}
            </button>

            <button
              type="button"
              onClick={cerrarDrawer}
              disabled={pending}
              className="vuki-focus flex min-h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Drawer>
    </>
  );
}

