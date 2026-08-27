"use client";

import { motion } from "framer-motion";
import { CalendarCheck, Mail, User } from "lucide-react";
import { mockNegocio } from "../../../../lib/mockData";
import { useDemoStore } from "../../../../lib/demoStore";

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemLista = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Data table de reservas confirmadas (leídas de `lib/demoStore.ts`, las
 * mismas que registra `AnimatedCheckoutSheet` al "pagar"). Equivalente
 * simplificado de `/admin/reservas` en la app real, con datos ricos del
 * cliente (nombre, email, cupos, monto).
 */
export default function AdminDemoReservasPage() {
  const { reservas, servicios, horarios } = useDemoStore(mockNegocio.slug);

  function nombreServicio(servicioId: string) {
    return servicios.find((s) => s.id === servicioId)?.nombre ?? "—";
  }

  function labelHorario(horarioId: string) {
    return horarios.find((h) => h.id === horarioId)?.label ?? "—";
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12 sm:px-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        Reservas
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Reservas confirmadas por clientes a través de tu enlace público (
        {reservas.length} en total).
      </p>

      {reservas.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-gray-500">
          Aún no tienes reservas. Prueba reservando desde{" "}
          <span className="font-medium text-slate-700">
            /demo/{mockNegocio.slug}
          </span>
          .
        </div>
      ) : (
        <>
          {/* Tabla en pantallas medianas+ */}
          <div className="mt-8 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm sm:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Fecha de reserva</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Servicio</th>
                  <th className="px-5 py-3">Horario</th>
                  <th className="px-5 py-3">Cupos</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <motion.tbody
                variants={contenedorLista}
                initial="oculto"
                animate="visible"
              >
                {reservas.map((reserva) => (
                  <motion.tr
                    key={reserva.id}
                    variants={itemLista}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(reserva.fechaReserva).toLocaleString("es-CR", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-900">
                        {reserva.nombreCliente}
                      </p>
                      <p className="text-xs text-gray-500">
                        {reserva.emailCliente}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {nombreServicio(reserva.servicioId)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {labelHorario(reserva.horarioId)}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {reserva.cantidadCuposReservados}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Pagado
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-slate-900">
                      ${reserva.montoPagado.toFixed(2)}
                    </td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </table>
          </div>

          {/* Tarjetas en móvil */}
          <motion.ul
            variants={contenedorLista}
            initial="oculto"
            animate="visible"
            className="mt-8 space-y-3 sm:hidden"
          >
            {reservas.map((reserva) => (
              <motion.li
                key={reserva.id}
                variants={itemLista}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                    <CalendarCheck
                      className="h-5 w-5 text-emerald-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">
                      {nombreServicio(reserva.servicioId)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {labelHorario(reserva.horarioId)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <User
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {reserva.nombreCliente}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail
                      className="h-3.5 w-3.5 text-slate-400"
                      aria-hidden="true"
                    />
                    {reserva.emailCliente}
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Pagado
                  </span>
                  <span className="font-semibold text-slate-900">
                    ${reserva.montoPagado.toFixed(2)}
                  </span>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </>
      )}
    </main>
  );
}
