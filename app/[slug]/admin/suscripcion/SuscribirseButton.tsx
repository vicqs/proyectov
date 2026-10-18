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
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Redirigiendo a la pasarela de pago...
        </>
      ) : (
        <>
          <Rocket className="h-4 w-4" />
          Suscribirse ahora
        </>
      )}
    </button>
  );
}
