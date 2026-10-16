"use client";

import { mockNegocio } from "../../../../lib/mockData";
import { useDemoStore } from "../../../../lib/demoStore";
import ReservasView from "../../../../components/admin/ReservasView";

/** Reservas del panel simulado (mismas que registra el checkout público). */
export default function AdminDemoReservasPage() {
  const { reservas, servicios, horarios } = useDemoStore(mockNegocio.slug);

  return (
    <ReservasView
      mensajeVacio={
        <>
          Aún no tienes reservas. Prueba reservando desde{" "}
          <span className="font-medium text-slate-700">
            /demo/{mockNegocio.slug}
          </span>
          .
        </>
      }
      reservas={reservas.map((r) => ({
        id: r.id,
        fechaIso: r.fechaReserva,
        cliente: r.nombreCliente,
        email: r.emailCliente,
        servicio: servicios.find((s) => s.id === r.servicioId)?.nombre ?? "—",
        horario: horarios.find((h) => h.id === r.horarioId)?.label ?? "—",
        cupos: r.cantidadCuposReservados,
        estado: "pagada" as const,
        monto: r.montoPagado,
      }))}
    />
  );
}
