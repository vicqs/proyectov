"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, CreditCard, ShieldAlert } from "lucide-react";
import { mockNegocio } from "../../../../lib/mockData";
import {
  activarSuscripcion,
  cancelarSuscripcion,
  useDemoStore,
  type EstadoSuscripcionDemo,
} from "../../../../lib/demoStore";
import { toast } from "../../../../components/Toast";

const PRECIO_MENSUAL_USD = 15;

const ETIQUETAS_ESTADO: Record<
  EstadoSuscripcionDemo,
  { texto: string; clases: string }
> = {
  activa: { texto: "Activa", clases: "bg-emerald-100 text-emerald-700" },
  prueba: { texto: "Prueba gratuita", clases: "bg-amber-100 text-amber-700" },
  inactiva: { texto: "Inactiva", clases: "bg-red-100 text-red-700" },
};

/**
 * Dashboard financiero/suscripción SIMULADO (sin Supabase ni pasarela de
 * pago real — todo vive en `lib/demoStore.ts`). Muestra el estado actual,
 * la fecha del próximo cobro y permite simular activación/cancelación,
 * reflejando de inmediato el efecto sobre el enlace público.
 *
 * Ruta: /demo/admin/suscripcion
 */
export default function AdminSuscripcionDemoPage() {
  const { suscripcion } = useDemoStore(mockNegocio.slug);
  const [cargando, setCargando] = useState(false);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [vencimiento, setVencimiento] = useState("");
  const [cvc, setCvc] = useState("");

  function handleSimularPago() {
    setCargando(true);
    setTimeout(() => {
      activarSuscripcion(mockNegocio.slug);
      setCargando(false);
      setNumeroTarjeta("");
      setVencimiento("");
      setCvc("");
      toast.success("Pago simulado con éxito. Suscripción activa.");
    }, 1200);
  }

  function handleCancelar() {
    cancelarSuscripcion(mockNegocio.slug);
    toast.success("Suscripción cancelada");
  }

  const etiqueta = ETIQUETAS_ESTADO[suscripcion.estado];
  const activa = suscripcion.estado === "activa";
  const fechaProximoCobro = new Date(
    suscripcion.fechaProximoCobro,
  ).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-white px-6 py-16 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
        Proyecto V — sin Supabase ni Tilopay
      </p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
        Suscripción de {mockNegocio.nombre}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">
        Este panel simula, 100% en el navegador (
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
          localStorage
        </code>
        ), el ciclo de pago de la suscripción SaaS del negocio. No se conecta a
        Supabase ni a una pasarela de pago real todavía.
      </p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-8 overflow-hidden rounded-3xl border p-7 shadow-sm ${
          activa
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-red-200 bg-red-50/40"
        }`}
      >
        <div
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${etiqueta.clases}`}
        >
          {activa ? (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          ) : (
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
          )}
          Estado: {etiqueta.texto.toUpperCase()}
        </div>

        {activa ? (
          <p className="mt-4 text-sm text-slate-600">
            Próximo cobro:{" "}
            <span className="font-semibold text-slate-900">
              {fechaProximoCobro}
            </span>{" "}
            por ${PRECIO_MENSUAL_USD.toFixed(2)}
          </p>
        ) : (
          <p className="mt-4 text-sm text-red-700">
            El enlace público de {mockNegocio.nombre} está desactivado hasta
            reactivar la suscripción.
          </p>
        )}
      </motion.div>

      {!activa ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-3xl border border-slate-200 p-7 shadow-sm"
        >
          <div className="flex items-center gap-2 text-slate-400">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Plan mensual
            </span>
          </div>
          <p className="mt-3 text-4xl font-bold tracking-tight text-slate-900">
            ${PRECIO_MENSUAL_USD}
            <span className="text-base font-medium text-gray-400">/mes</span>
          </p>
          <ul className="mt-5 space-y-2 text-sm text-gray-600">
            <li>• Enlace público ilimitado para tus clientes</li>
            <li>• Cobros y reservas en línea</li>
            <li>• Panel financiero con comisiones estimadas</li>
          </ul>

          <div className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="numero-tarjeta"
                className="mb-2 block text-xs font-medium text-gray-500"
              >
                Número de tarjeta
              </label>
              <input
                id="numero-tarjeta"
                type="text"
                inputMode="numeric"
                maxLength={19}
                value={numeroTarjeta}
                onChange={(e) => setNumeroTarjeta(e.target.value)}
                placeholder="4242 4242 4242 4242"
                className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <label
                  htmlFor="vencimiento"
                  className="mb-2 block text-xs font-medium text-gray-500"
                >
                  Vencimiento
                </label>
                <input
                  id="vencimiento"
                  type="text"
                  maxLength={5}
                  value={vencimiento}
                  onChange={(e) => setVencimiento(e.target.value)}
                  placeholder="MM/AA"
                  className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="cvc"
                  className="mb-2 block text-xs font-medium text-gray-500"
                >
                  CVC
                </label>
                <input
                  id="cvc"
                  type="text"
                  maxLength={4}
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value)}
                  placeholder="123"
                  className="h-14 w-full border-b-2 border-slate-200 bg-transparent px-1 text-base text-slate-900 outline-none transition focus-visible:border-slate-900"
                />
              </div>
            </div>
          </div>

          <motion.button
            type="button"
            onClick={handleSimularPago}
            disabled={cargando || !numeroTarjeta || !vencimiento || !cvc}
            whileTap={{ scale: 0.97 }}
            aria-live="polite"
            className="mt-7 h-14 w-full rounded-2xl bg-slate-900 text-base font-semibold text-white shadow-sm outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando
              ? "Procesando pago simulado..."
              : "Simular pago y activar"}
          </motion.button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 rounded-3xl border border-slate-200 p-7 shadow-sm"
        >
          <p className="text-sm text-gray-600">
            El negocio tiene su suscripción al día. Su enlace público{" "}
            <Link
              href={`/demo/${mockNegocio.slug}`}
              className="font-medium text-slate-900 underline underline-offset-2"
            >
              /demo/{mockNegocio.slug}
            </Link>{" "}
            está activo y sus clientes pueden reservar y pagar con normalidad.
          </p>

          <Link
            href={`/demo/${mockNegocio.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 text-base font-semibold text-white shadow-sm outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            Ver enlace público ↗
          </Link>

          <motion.button
            type="button"
            onClick={handleCancelar}
            whileTap={{ scale: 0.97 }}
            className="mt-6 h-14 w-full rounded-2xl border border-red-200 text-base font-semibold text-red-600 outline-none transition hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            Cancelar suscripción (simular impago)
          </motion.button>
        </motion.div>
      )}

      <p className="mt-6 text-center text-xs text-gray-400">
        Cambia el estado aquí y luego visita{" "}
        <Link
          href={`/demo/${mockNegocio.slug}`}
          className="underline underline-offset-2"
        >
          /demo/{mockNegocio.slug}
        </Link>{" "}
        para ver el efecto en el enlace público.
      </p>
    </main>
  );
}
