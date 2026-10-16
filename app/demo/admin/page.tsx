"use client";

import { mockNegocio } from "../../../lib/mockData";
import { useDemoStore } from "../../../lib/demoStore";
import InicioView from "../../../components/admin/InicioView";

/** Inicio del panel simulado: usa la misma vista que `/admin`. */
export default function AdminDemoInicioPage() {
  const { servicios, reservas, horarios, personalizacion } = useDemoStore(
    mockNegocio.slug,
  );
  const totalCobrado = reservas.reduce((acc, r) => acc + r.montoPagado, 0);

  const proximas = reservas
    .map((r) => ({
      id: r.id,
      fechaIso:
        horarios.find((h) => h.id === r.horarioId)?.fechaHora ?? r.fechaReserva,
      cliente: r.nombreCliente,
      estado: r.estado,
    }))
    .sort((a, b) => a.fechaIso.localeCompare(b.fechaIso))
    .slice(0, 5);

  return (
    <InicioView
      nombre={personalizacion.nombre}
      descripcion="Este es tu panel de administración (simulado, sin Supabase)."
      totalReservas={reservas.length}
      totalCobrado={totalCobrado}
      servicios={servicios}
      proximasReservas={proximas}
    />
  );
}
