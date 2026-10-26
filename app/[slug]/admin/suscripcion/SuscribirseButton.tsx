"use client";

import { useFormStatus } from "react-dom";
import { Loader2, Rocket } from "lucide-react";

/**
 * Botón "Suscribirse ahora": Client Component aislado para poder usar
 * `useFormStatus` y mostrar un estado de carga claro mientras la Server
 * Action redirige a Stripe (o al checkout simulado).
 */
export default function SuscribirseButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="vuki-focus flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2
            className="h-4 w-4 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Redirigiendo a la pasarela de pago...
        </>
      ) : (
        <>
          <Rocket className="h-4 w-4" aria-hidden="true" />
          Suscribirse ahora
        </>
      )}
    </button>
  );
}
