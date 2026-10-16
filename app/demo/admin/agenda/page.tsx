"use client";

import { mockNegocio } from "../../../../lib/mockData";
import {
  crearBloqueo,
  eliminarBloqueo,
  useDemoStore,
} from "../../../../lib/demoStore";
import AgendaView from "../../../../components/admin/AgendaView";

/** Bloqueos del panel simulado (respaldado por `lib/demoStore.ts`). */
export default function AdminDemoAgendaPage() {
  const { bloqueos } = useDemoStore(mockNegocio.slug);
  const ahora = Date.now();

  return (
    <AgendaView
      bloqueos={bloqueos
        .filter((b) => new Date(b.fechaFin).getTime() >= ahora)
        .map((b) => ({
          id: b.id,
          inicioIso: b.fechaInicio,
          finIso: b.fechaFin,
          motivo: b.motivo,
        }))}
      onCrear={({ inicio, fin, motivo }) => {
        crearBloqueo(mockNegocio.slug, {
          fechaInicio: new Date(inicio).toISOString(),
          fechaFin: new Date(fin).toISOString(),
          motivo,
        });
      }}
      onEliminar={(id) => eliminarBloqueo(mockNegocio.slug, id)}
    />
  );
}
