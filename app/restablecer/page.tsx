"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import AuthShell from "../../components/AuthShell";
import {
  actualizarContrasenaAction,
  type NuevaContrasenaState,
} from "../../actions/auth";
import { conResilienciaRed } from "../../lib/errores";

const inicial: NuevaContrasenaState = {};
const actualizarContrasenaResiliente = conResilienciaRed(
  actualizarContrasenaAction,
);

const INPUT =
  "vuki-input block min-h-11 py-2.5 pr-12";

function CampoClave({
  id,
  etiqueta,
  ver,
  onVer,
}: {
  id: string;
  etiqueta: string;
  ver: boolean;
  onVer: () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={ver ? "text" : "password"}
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className={INPUT}
        />
        <button
          type="button"
          onClick={onVer}
          aria-label={ver ? "Ocultar contraseñas" : "Mostrar contraseñas"}
          aria-pressed={ver}
          className="vuki-focus absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-slate-800"
        >
          {ver ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function RestablecerPage() {
  const [state, accion, pendiente] = useActionState(
    actualizarContrasenaResiliente,
    inicial,
  );
  const [ver, setVer] = useState(false);

  return (
    <AuthShell
      titulo="Nueva contraseña"
      descripcion={
        state.ok ? undefined : "Elige una contraseña de al menos 8 caracteres."
      }
    >
      {state.ok ? (
        <div className="space-y-4 text-sm" role="status">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-800">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            Contraseña actualizada. Ya puedes iniciar sesión.
          </div>
          <Link
            href="/login"
            className="vuki-btn-primary flex min-h-12 w-full py-3"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form action={accion} className="space-y-5">
          <CampoClave
            id="password"
            etiqueta="Nueva contraseña"
            ver={ver}
            onVer={() => setVer((v) => !v)}
          />
          <CampoClave
            id="confirmar"
            etiqueta="Repite la contraseña"
            ver={ver}
            onVer={() => setVer((v) => !v)}
          />
          {state.error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>
                {state.error}{" "}
                <Link href="/recuperar" className="font-medium underline">
                  Solicitar enlace
                </Link>
              </span>
            </div>
          )}
          <button
            type="submit"
            disabled={pendiente}
            className="vuki-btn-primary flex min-h-12 w-full py-3"
          >
            {pendiente && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {pendiente ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
