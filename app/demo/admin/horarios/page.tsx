"use client";

import { mockNegocio } from "../../../../lib/mockData";
import {
  crearHorario,
  eliminarHorario,
  useDemoStore,
} from "../../../../lib/demoStore";
import HorariosView from "../../../../components/admin/HorariosView";

/** Horarios del panel simulado (respaldado por `lib/demoStore.ts`). */
export default function AdminDemoHorariosPage() {
  const { horarios, servicios } = useDemoStore(mockNegocio.slug);

  return (
    <HorariosView
      horarios={horarios}
      servicios={servicios}
      onCrear={({ servicioId, fechaHora, cupos }) => {
        crearHorario(mockNegocio.slug, {
          servicioId,
          fechaHoraIso: new Date(fechaHora).toISOString(),
          cuposTotales: cupos,
        });
      }}
      onEliminar={(id) => eliminarHorario(mockNegocio.slug, id)}
    />
  );
}
