"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import AuthShell from "../../components/AuthShell";
import {
  solicitarRecuperacionAction,
  type RecuperacionState,
} from "../../actions/auth";

const inicial: RecuperacionState = {};

const INPUT =
  "block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-500 transition focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40";

const ENLACE_VOLVER =
  "rounded font-medium text-sky-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500";

function Formulario() {
  const [state, accion, pendiente] = useActionState(
    solicitarRecuperacionAction,
    inicial,
  );
  const [email, setEmail] = useState("");
  const enlaceVencido = useSearchParams().get("error") === "enlace";

  return (
    <AuthShell
      titulo="Recuperar contraseña"
      descripcion="Escribe tu correo y te enviaremos un enlace para elegir una nueva contraseña."
      pie={
        <Link href="/login" className={ENLACE_VOLVER}>
          Volver a iniciar sesión
        </Link>
      }
    >
      {enlaceVencido && !state.ok && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          El enlace no es válido o ya venció. Solicita uno nuevo.
        </div>
      )}

      {state.ok ? (
        <div className="space-y-3 text-sm" role="status">
          <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-emerald-800">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0"
              aria-hidden="true"
            />
            <span>
              Si <b className="break-all">{email}</b> está registrado, te
              enviamos un enlace para restablecer la contraseña. Revisa también
              tu carpeta de spam.
            </span>
          </div>
          {state.enlaceDev && (
            <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-amber-800">
              Modo simulado (sin correo):{" "}
              <a href={state.enlaceDev} className="font-medium underline">
                abrir enlace de recuperación
              </a>
            </p>
          )}
        </div>
      ) : (
        <form action={accion} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(state.error)}
              aria-describedby={state.error ? "recuperar-error" : undefined}
              className={INPUT}
              placeholder="tu@negocio.com"
            />
          </div>
          {state.error && (
            <div
              id="recuperar-error"
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0"
                aria-hidden="true"
              />
              <span>{state.error}</span>
            </div>
          )}
          <button
            type="submit"
            disabled={pendiente}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-900/15 transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {pendiente ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-4 w-4" aria-hidden="true" />
            )}
            {pendiente ? "Enviando…" : "Enviar enlace"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function RecuperarPage() {
  return (
    <Suspense>
      <Formulario />
    </Suspense>
  );
}
