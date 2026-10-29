"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  Check,
  Copy,
  Loader2,
  Rocket,
} from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { toast } from "@/components/Toast";

/**
 * Botón principal de checkout de suscripción: usa `useFormStatus` para
 * mostrar estado de carga claro mientras la Server Action redirige a Stripe
 * (o al checkout simulado).
 */
export default function SuscribirseButton({
  etiqueta = "Suscribirse ahora",
}: {
  etiqueta?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="vuki-focus flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-vuki-ink px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
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
          {etiqueta}
        </>
      )}
    </button>
  );
}

/**
 * Botón rápido para copiar la URL pública del negocio al portapapeles.
 */
export function CopiarEnlacePublicoButton({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      toast.success("Enlace público copiado al portapapeles");
      window.setTimeout(() => setCopiado(false), 2200);
    } catch {
      toast.error("No se pudo copiar el enlace.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copiar()}
      className="vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {copiado ? (
        <>
          <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ¡Enlace copiado!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copiar enlace
        </>
      )}
    </button>
  );
}

function DisparadorCancelacionMock({
  onAbrirConfirmacion,
}: {
  onAbrirConfirmacion: () => void;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={onAbrirConfirmacion}
      className="vuki-focus inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2
            className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none"
            aria-hidden="true"
          />
          Pausando suscripción...
        </>
      ) : (
        <>
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Simular cancelación / impago
        </>
      )}
    </button>
  );
}

/**
 * Botón protegido con diálogo de confirmación para simular impago o
 * cancelación de suscripción en modo de desarrollo.
 */
export function CancelarSuscripcionMockButton({
  action,
  slug,
}: {
  action: () => Promise<unknown>;
  slug: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <form ref={formRef} action={action as () => Promise<void>}>
        <DisparadorCancelacionMock
          onAbrirConfirmacion={() => setConfirmando(true)}
        />
      </form>

      <ConfirmDialog
        abierto={confirmando}
        titulo="¿Pausar suscripción en modo simulado?"
        descripcion={`Tu enlace público /${slug} dejará de recibir nuevas reservas hasta que vuelvas a activarla. Tus servicios, horarios e historial de reservas se conservarán intactos.`}
        textoConfirmar="Sí, pausar suscripción"
        textoCancelar="Mantener activa"
        onCancelar={() => setConfirmando(false)}
        onConfirmar={() => {
          setConfirmando(false);
          formRef.current?.requestSubmit();
        }}
      />
    </>
  );
}
