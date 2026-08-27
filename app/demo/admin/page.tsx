"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Clock, DollarSign, ListChecks } from "lucide-react";
import { mockNegocio } from "../../../lib/mockData";
import { useDemoStore } from "../../../lib/demoStore";

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemLista = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/**
 * "Inicio" del panel de administración simulado: resumen del negocio,
 * reservas totales y sus servicios. Equivalente simplificado de `/admin`
 * en la app real, respaldado por `lib/demoStore.ts`.
 */
export default function AdminDemoInicioPage() {
  const { servicios, reservas } = useDemoStore(mockNegocio.slug);
  const totalCobrado = reservas.reduce((acc, r) => acc + r.montoPagado, 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Bienvenido, {mockNegocio.nombre}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Este es tu panel de administración (simulado, sin Supabase).
        </p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <CalendarCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Reservas
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {reservas.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
            <DollarSign className="h-3.5 w-3.5" aria-hidden="true" />
            Total cobrado
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            ${totalCobrado.toFixed(2)}
          </p>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-gray-400">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          Tus servicios
        </h2>
        <motion.div
          variants={contenedorLista}
          initial="oculto"
          animate="visible"
          className="space-y-3"
        >
          {servicios.map((servicio) => (
            <motion.div
              key={servicio.id}
              variants={itemLista}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div>
                <p className="font-semibold text-slate-900">
                  {servicio.nombre}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {servicio.duracionMin} min
                </p>
              </div>
              <span className="flex items-center gap-1 text-lg font-bold text-slate-900">
                <DollarSign
                  className="h-4 w-4 text-gray-400"
                  aria-hidden="true"
                />
                {servicio.precioUsd.toFixed(2)}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </main>
  );
}
