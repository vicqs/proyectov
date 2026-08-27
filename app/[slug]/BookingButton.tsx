"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard, Loader2 } from "lucide-react";

interface BookingButtonProps {
  servicioId: string;
  precioUsd: number;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      style={{ backgroundColor: "var(--color-tema, #0284c7)" }}
      className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <CreditCard className="h-4 w-4" />
      )}
      Reservar
    </button>
  );
}

/**
 * Client Component: la interactividad (formulario + llamada al checkout)
 * se aísla aquí para mantener `page.tsx` como Server Component.
 */
export default function BookingButton({
  servicioId,
  precioUsd,
}: BookingButtonProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const email_cliente = formData.get("email") as string;
    const fecha_hora = new Date().toISOString(); // MVP: fecha/hora actual como placeholder

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          servicio_id: servicioId,
          email_cliente,
          fecha_hora,
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo iniciar el proceso de pago.");
      }

      const { checkout_url } = await res.json();
      window.location.href = checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado.");
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col items-end gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="tu@email.com"
        className="w-40 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none"
      />
      <SubmitButton />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <span className="sr-only">{precioUsd}</span>
    </form>
  );
}
