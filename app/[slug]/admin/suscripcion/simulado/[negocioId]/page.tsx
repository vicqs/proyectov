import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";
import PaginaPublica from "@/components/PaginaPublica";
import { requerirEmpresa } from "@/lib/empresa";
import { isStripeMockMode } from "@/lib/stripe";
import {
  cancelarSuscripcionSimuladaAction,
  confirmarSuscripcionSimuladaAction,
} from "@/actions/billing";

interface PageProps {
  params: Promise<{ slug: string; negocioId: string }>;
}

/**
 * Pantalla de checkout simulada (reemplaza a Stripe Checkout mientras no
 * haya credenciales reales). Al confirmar, activa `estado_suscripcion` del
 * negocio igual que lo haría el webhook real de Stripe.
 */
export default async function SuscripcionSimuladaPage({ params }: PageProps) {
  if (!isStripeMockMode) {
    notFound();
  }

  const { slug, negocioId } = await params;
  const { negocio } = await requerirEmpresa(slug);
  if (negocio.id !== negocioId) {
    notFound();
  }

  const confirmar = confirmarSuscripcionSimuladaAction.bind(null, negocio.slug);
  const cancelar = cancelarSuscripcionSimuladaAction.bind(null, negocio.slug);

  return (
    <PaginaPublica
      titulo="Suscripción vuki"
      descripcion={negocio.nombre}
      etiqueta="Stripe Checkout (simulado)"
      icono={<CreditCard className="h-4 w-4" />}
    >
      <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <p className="text-xs font-medium text-emerald-800">
          Total a pagar (mensual)
        </p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight text-vuki-ink">
          $15.00
        </p>
      </div>

      <form action={confirmar}>
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Confirmar suscripción (simulado)
        </button>
      </form>
      <form action={cancelar} className="mt-2">
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Cancelar
        </button>
      </form>
    </PaginaPublica>
  );
}
