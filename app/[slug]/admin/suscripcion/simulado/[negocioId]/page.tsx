import { notFound } from "next/navigation";
import { CalendarClock, CheckCircle2, CreditCard } from "lucide-react";
import PaginaPublica from "@/components/PaginaPublica";
import { requerirEmpresa } from "@/lib/empresa";
import { precioDelNegocio } from "@/lib/plataforma";
import { isStripeMockMode } from "@/lib/stripe";
import { estadoEfectivo } from "@/lib/negocio-estado";
import { fechaCorta } from "@/lib/admin/formato";
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

  const detallePrecio = await precioDelNegocio(negocio);
  const confirmar = confirmarSuscripcionSimuladaAction.bind(null, negocio.slug);
  const cancelar = cancelarSuscripcionSimuladaAction.bind(null, negocio.slug);

  const ahoraMs = Date.now();
  const efectivo = estadoEfectivo(negocio, ahoraMs);
  const diasRestantesPrueba =
    efectivo === "prueba" && negocio.prueba_hasta
      ? Math.max(
          0,
          Math.ceil(
            (new Date(negocio.prueba_hasta).getTime() - ahoraMs) / 86_400_000,
          ),
        )
      : null;

  const fechaRenovacionIso =
    diasRestantesPrueba && diasRestantesPrueba > 0 && negocio.prueba_hasta
      ? negocio.prueba_hasta
      : (negocio.proximo_cobro ??
        new Date(ahoraMs + 30 * 86_400_000).toISOString());

  const textoCiclo =
    diasRestantesPrueba && diasRestantesPrueba > 0 && negocio.prueba_hasta
      ? `0% comisión por reserva · Tu próximo ciclo se renueva el ${fechaCorta(negocio.prueba_hasta)} (${diasRestantesPrueba} ${diasRestantesPrueba === 1 ? "día restante de prueba" : "días restantes de prueba"})`
      : `0% comisión por reserva · Tu próximo ciclo se renueva el ${fechaCorta(fechaRenovacionIso)}`;

  return (
    <PaginaPublica
      titulo={detallePrecio.plan.nombre}
      descripcion={negocio.nombre}
      etiqueta="Stripe Checkout (simulado)"
      icono={<CreditCard className="h-4 w-4" />}
      mostrarLogo={false}
      centrado
    >
      <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium text-emerald-800">
            Total a pagar (renovación mensual)
          </p>
          {detallePrecio.descuentoPct > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              -{detallePrecio.descuentoPct}% aplicado
            </span>
          )}
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <p className="font-display text-3xl font-bold tracking-tight text-vuki-ink">
            ${detallePrecio.precio.toFixed(2)}{" "}
            <span className="text-sm font-medium text-slate-500">USD</span>
          </p>
          {detallePrecio.descuentoPct > 0 && (
            <span className="text-xs text-slate-400 line-through">
              ${detallePrecio.precioLista.toFixed(2)} USD
            </span>
          )}
        </div>
        <div className="mt-3.5 space-y-2 border-t border-emerald-100/90 pt-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-900">
            <CalendarClock className="h-3.5 w-3.5 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>{textoCiclo}</span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Habilita de inmediato /{negocio.slug} (modo simulado, sin cargo real).</span>
          </p>
        </div>
      </div>

      <form action={confirmar}>
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Confirmar suscripción (simulado)
        </button>
      </form>
      <form action={cancelar} className="mt-2">
        <button
          type="submit"
          className="vuki-focus min-h-12 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          Volver sin activar
        </button>
      </form>
    </PaginaPublica>
  );
}
