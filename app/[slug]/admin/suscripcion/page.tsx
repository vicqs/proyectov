import Link from "next/link";
import {
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  Globe2,
  LifeBuoy,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { isStripeMockMode } from "@/lib/stripe";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { estadoEfectivo } from "@/lib/negocio-estado";
import { funcionActivaNegocio, precioDelNegocio } from "@/lib/plataforma";
import { fechaCorta } from "@/lib/admin/formato";
import type { EstadoSuscripcion } from "@/types/database";
import {
  cancelarSuscripcionActivaAction,
  crearCheckoutSuscripcionAction,
} from "@/actions/billing";
import EmpresaPage from "@/components/EmpresaPage";
import SuscribirseButton, {
  CancelarSuscripcionMockButton,
  CopiarEnlacePublicoButton,
} from "./SuscribirseButton";

interface PageProps extends EmpresaPageProps {
  searchParams: Promise<{ estado?: string }>;
}

const BENEFICIOS = [
  "Enlace público propio de reservas y pagos en línea 24/7",
  "0% de comisión de vuki por reserva (solo costo de pasarela)",
  "Gestión ilimitada de servicios, cupos, horarios y bloqueos",
  "Confirmaciones y comprobantes automáticos por correo",
  "Reportes financieros en tiempo real y exportación CSV",
  "Soporte directo desde tu panel de empresa",
];

const ESTADO_STYLES: Record<EstadoSuscripcion, string> = {
  activa: "border-emerald-200 bg-emerald-50 text-emerald-800",
  inactiva: "border-red-200 bg-red-50 text-red-700",
  prueba: "border-amber-200 bg-amber-50 text-amber-800",
};

function formatearMontoPlan(monto: number): string {
  return Number.isInteger(monto) ? `$${monto}` : `$${monto.toFixed(2)}`;
}

/**
 * Gestión de la suscripción SaaS del negocio. Calcula el estado efectivo
 * (incluyendo vencimiento de prueba) y el precio real asignado al plan/negocio.
 */
export default async function SuscripcionPage({
  params,
  searchParams,
}: PageProps) {
  const [{ slug }, { estado: estadoQuery }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { negocio } = await requerirEmpresa(slug);
  const [detallePrecio, soporteActivo] = await Promise.all([
    precioDelNegocio(negocio),
    funcionActivaNegocio(negocio, "soporte_empresas"),
  ]);

  const ahoraMs = new Date().getTime();
  const efectivo = estadoEfectivo(negocio, ahoraMs);
  const activa = efectivo === "activa";
  const pruebaVencida =
    negocio.estado_suscripcion === "prueba" && efectivo === "inactiva";

  const diasRestantesPrueba =
    efectivo === "prueba" && negocio.prueba_hasta
      ? Math.max(
          0,
          Math.ceil(
            (new Date(negocio.prueba_hasta).getTime() - ahoraMs) / 86_400_000,
          ),
        )
      : null;

  const etiquetaEstado =
    efectivo === "activa"
      ? "Suscripción activa"
      : efectivo === "prueba"
        ? diasRestantesPrueba !== null
          ? `Período de prueba · ${diasRestantesPrueba} ${diasRestantesPrueba === 1 ? "día restante" : "días restantes"}`
          : "En período de prueba"
        : pruebaVencida
          ? "Prueba finalizada"
          : "Suscripción inactiva";

  const textoVigencia = activa
    ? negocio.proximo_cobro
      ? `Próxima renovación: ${fechaCorta(negocio.proximo_cobro)}`
      : "Renovación mensual automática"
    : efectivo === "prueba"
      ? negocio.prueba_hasta
        ? `Prueba gratuita hasta el ${fechaCorta(negocio.prueba_hasta)}`
        : "Período de prueba habilitado"
      : "Enlace público en pausa hasta reactivar";

  return (
    <EmpresaPage
      titulo="Suscripción"
      descripcion="Consulta el estado de tu plan, tu tarifa mensual y la disponibilidad de tu enlace público."
    >
      {/* Avisos de retorno desde el flujo de pago o cancelación */}
      {estadoQuery === "activa" && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-sm text-emerald-900"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">¡Suscripción activada con éxito!</p>
            <p className="mt-0.5 text-xs text-emerald-800">
              Tu enlace público{" "}
              <code className="rounded bg-emerald-100/80 px-1.5 py-0.5 font-mono">
                /{negocio.slug}
              </code>{" "}
              está habilitado para recibir reservas y pagos en línea sin
              interrupciones.
            </p>
          </div>
        </div>
      )}

      {estadoQuery === "inactiva" && (
        <div
          role="status"
          className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-950"
        >
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Suscripción pausada</p>
            <p className="mt-0.5 text-xs text-amber-800">
              Tu enlace público quedó en pausa para nuevas reservas. Todos tus
              servicios, horarios e historial financiero siguen guardados y
              puedes reactivar tu plan en cualquier momento.
            </p>
          </div>
        </div>
      )}

      {estadoQuery === "cancelado" && (
        <div
          role="status"
          className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          El proceso de pago fue cancelado y no se realizó ningún cargo. Puedes
          intentarlo de nuevo cuando quieras.
        </div>
      )}

      {estadoQuery === "error" && (
        <div
          role="alert"
          className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <span>
            No pudimos completar la operación en este momento. Inténtalo de
            nuevo en unos minutos.
          </span>
          {soporteActivo && (
            <Link
              href={`/${negocio.slug}/admin/soporte?tema=suscripcion`}
              className="vuki-focus font-semibold underline underline-offset-2"
            >
              Contactar soporte →
            </Link>
          )}
        </div>
      )}

      {/* Tarjeta superior: resumen claro del plan y estado real */}
      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Resumen de tu cuenta
            </p>
            <h2 className="mt-1 font-display text-xl font-bold text-vuki-ink">
              {negocio.nombre}
            </h2>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${ESTADO_STYLES[efectivo]}`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${
                efectivo === "activa"
                  ? "bg-emerald-500"
                  : efectivo === "prueba"
                    ? "bg-amber-500"
                    : "bg-red-500"
              }`}
            />
            {etiquetaEstado}
          </span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <p className="text-xs font-medium text-slate-500">
              {detallePrecio.plan.nombre}
            </p>
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="font-display text-xl font-bold text-vuki-ink">
                {formatearMontoPlan(detallePrecio.precio)}{" "}
                <span className="text-xs font-medium text-slate-500">
                  USD / mes
                </span>
              </span>
              {detallePrecio.descuentoPct > 0 && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                  -{detallePrecio.descuentoPct}%
                </span>
              )}
            </div>
            {detallePrecio.descuentoPct > 0 && (
              <p className="mt-0.5 text-[11px] text-slate-400">
                Precio regular:{" "}
                <span className="line-through">
                  {formatearMontoPlan(detallePrecio.precioLista)} USD
                </span>
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <p className="text-xs font-medium text-slate-500">
              Comisión de vuki
            </p>
            <p className="mt-1 font-display text-xl font-bold text-emerald-700">
              0% por reserva
            </p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Tarifa plana fija sin recargos por volumen
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
              Vigencia y ciclo
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-800">
              {textoVigencia}
            </p>
            {negocio.creado_en && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                Negocio creado el {fechaCorta(negocio.creado_en)}
              </p>
            )}
          </div>
        </div>
      </section>

      {activa ? (
        <div className="grid items-start gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Columna principal: estado operativo del enlace y beneficios activos */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-950">
              <Globe2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Tu página de reservas está en línea
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-emerald-800">
                  Tus clientes pueden consultar disponibilidad, reservar cupos y
                  pagar en{" "}
                  <Link
                    href={`/${negocio.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono font-semibold underline underline-offset-2"
                  >
                    /{negocio.slug}
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href={`/${negocio.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="vuki-focus inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Abrir enlace público
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </Link>
              <CopiarEnlacePublicoButton slug={negocio.slug} />
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Incluido en tu suscripción activa
              </h3>
              <ul className="mt-3 grid gap-2.5 sm:grid-cols-2">
                {BENEFICIOS.map((beneficio) => (
                  <li
                    key={beneficio}
                    className="flex items-start gap-2 rounded-xl bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Columna lateral: tranquilidad, soporte y zona de pruebas */}
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-vuki-ink">
                <ShieldCheck
                  className="h-4 w-4 text-emerald-600"
                  aria-hidden="true"
                />
                Facturación transparente
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Tu tarifa mensual es fija (
                <strong className="text-slate-800">
                  {formatearMontoPlan(detallePrecio.precio)} USD/mes
                </strong>
                ) sin permanencia obligatoria. Si en algún momento pausas tu
                suscripción, tus servicios, horarios y reportes financieros
                permanecen resguardados.
              </p>

              {soporteActivo && (
                <Link
                  href={`/${negocio.slug}/admin/soporte?tema=suscripcion`}
                  className="vuki-focus mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" />
                  ¿Dudas con tu facturación? Escribir a soporte
                </Link>
              )}
            </section>

            {isStripeMockMode && (
              <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Entorno de pruebas (Stripe simulado)
                  </p>
                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    Demo
                  </span>
                </div>
                <p className="mb-3 text-xs leading-relaxed text-slate-500">
                  Puedes simular un impago o cancelación para comprobar cómo se
                  pausa el enlace público sin perder datos del panel.
                </p>
                <CancelarSuscripcionMockButton
                  slug={negocio.slug}
                  action={cancelarSuscripcionActivaAction.bind(
                    null,
                    negocio.slug,
                  )}
                />
              </section>
            )}
          </div>
        </div>
      ) : (
        <section className="rounded-3xl border border-sky-100 border-t-4 border-t-vuki-ocean bg-linear-to-br from-white to-sky-50/60 p-6 shadow-sm sm:p-8">
          {efectivo === "inactiva" ? (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50/90 p-4 text-sm text-red-900">
              <ShieldAlert
                className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">
                  {pruebaVencida
                    ? "Tu período de prueba gratuita finalizó"
                    : "Tu enlace público está en pausa"}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-red-800">
                  Tus servicios, horarios e historial de reservas siguen
                  intactos. Activa tu suscripción para volver a recibir reservas
                  en{" "}
                  <code className="rounded bg-red-100 px-1 font-mono">
                    /{negocio.slug}
                  </code>{" "}
                  al instante.
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 text-sm text-sky-950">
              <Sparkles
                className="mt-0.5 h-5 w-5 shrink-0 text-sky-600"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold">
                  Estás disfrutando de tu prueba gratuita
                  {diasRestantesPrueba !== null
                    ? ` (${diasRestantesPrueba} ${diasRestantesPrueba === 1 ? "día restante" : "días restantes"})`
                    : ""}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-sky-800">
                  Tu enlace{" "}
                  <code className="rounded bg-sky-100 px-1 font-mono">
                    /{negocio.slug}
                  </code>{" "}
                  ya funciona al 100%. Activa tu suscripción cuando quieras para
                  evitar interrupciones al finalizar la prueba.
                </p>
              </div>
            </div>
          )}

          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.15fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-700">
                  {detallePrecio.plan.nombre}
                </p>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                  0% comisión por reserva
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-baseline gap-2.5">
                <p className="font-display text-4xl font-bold tracking-tight text-vuki-ink">
                  {formatearMontoPlan(detallePrecio.precio)}{" "}
                  <span className="text-base font-medium text-slate-500">
                    USD / mes
                  </span>
                </p>
                {detallePrecio.descuentoPct > 0 && (
                  <span className="text-sm text-slate-400 line-through">
                    {formatearMontoPlan(detallePrecio.precioLista)} USD
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                Todo lo que necesitas para vender tus tours, clases o
                experiencias con cobro automático y cupos en tiempo real.
              </p>

              <form
                action={crearCheckoutSuscripcionAction.bind(null, negocio.slug)}
                className="mt-6"
              >
                <SuscribirseButton
                  etiqueta={
                    efectivo === "inactiva"
                      ? "Reactivar suscripción ahora"
                      : "Activar suscripción mensual"
                  }
                />
              </form>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                Sin contratos forzosos · Cancela cuando quieras
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Todo incluido en tu plan
              </p>
              <ul className="mt-3.5 space-y-2.5">
                {BENEFICIOS.map((beneficio) => (
                  <li
                    key={beneficio}
                    className="flex items-start gap-2.5 text-sm text-slate-700"
                  >
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>{beneficio}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}
    </EmpresaPage>
  );
}
