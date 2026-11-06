"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { loginAction, type LoginActionState } from "../../actions/auth";
import { conResilienciaRed } from "../../lib/errores";

const initialState: LoginActionState = {};
const loginActionResiliente = conResilienciaRed(loginAction);

const INPUT = "vuki-input block min-h-11 py-2.5";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="vuki-btn-primary group flex min-h-12 w-full py-3"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <LogIn
          className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none"
          aria-hidden="true"
        />
      )}
      {pending ? "Ingresando…" : "Iniciar sesión"}
    </button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginActionResiliente, initialState);
  // El correo se controla para que no se borre tras un intento fallido.
  const [email, setEmail] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const conError = Boolean(state.error);
  const borde = conError
    ? "border-red-400 bg-red-50/20"
    : "border-slate-300 hover:border-slate-400 focus-visible:border-sky-500";

  return (
    <form action={formAction} className="space-y-5" noValidate={false}>
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
          aria-invalid={conError}
          aria-describedby={conError ? "login-error" : undefined}
          className={`${INPUT} ${borde}`}
          placeholder="tu@negocio.com"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Contraseña
          </label>
          <Link
            href="/recuperar"
            className="vuki-focus rounded text-sm font-medium text-sky-700 transition hover:text-sky-800 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={verClave ? "text" : "password"}
            required
            autoComplete="current-password"
            onKeyUp={(e) => setMayusculas(e.getModifierState("CapsLock"))}
            onBlur={() => setMayusculas(false)}
            aria-invalid={conError}
            aria-describedby={conError ? "login-error" : undefined}
            className={`${INPUT} ${borde} pr-12`}
            placeholder="Tu contraseña"
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={verClave}
            className="vuki-focus absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-slate-800"
          >
            {verClave ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {mayusculas && (
          <p className="mt-1.5 text-xs text-amber-700" role="status">
            Tienes las mayúsculas activadas.
          </p>
        )}
      </div>

      {state.error && (
        <div
          id="login-error"
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
