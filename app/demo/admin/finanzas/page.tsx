"use client";

import { mockNegocio } from "../../../../lib/mockData";
import { useDemoStore } from "../../../../lib/demoStore";
import FinanzasView from "../../../../components/admin/FinanzasView";

/** Finanzas del panel simulado, calculadas sobre las reservas del store. */
export default function AdminDemoFinanzasPage() {
  const { reservas, servicios } = useDemoStore(mockNegocio.slug);

  return (
    <FinanzasView
      pagos={[...reservas]
        .sort((a, b) => b.fechaReserva.localeCompare(a.fechaReserva))
        .map((r) => ({
          id: r.id,
          fechaIso: r.fechaReserva,
          servicio: servicios.find((s) => s.id === r.servicioId)?.nombre ?? "—",
          cliente: r.nombreCliente,
          monto: r.montoPagado,
        }))}
    />
  );
}
