"use client";

import { useRouter } from "next/navigation";
import {
  crearHorarioAction,
  crearHorariosLoteAction,
  eliminarHorarioAction,
} from "../../../actions/horarios";
import HorariosView, {
  type VistaHorario,
} from "../../../components/admin/HorariosView";

/** Puente cliente de `/admin/horarios`: vista compartida + Server Actions. */
export default function HorariosAdminClient({
  horarios,
  servicios,
}: {
  horarios: VistaHorario[];
  servicios: { id: string; nombre: string }[];
}) {
  const router = useRouter();

  return (
    <HorariosView
      horarios={horarios}
      servicios={servicios}
      onCrear={async ({ servicioId, fechaHora, cupos }) => {
        const { error } = await crearHorarioAction({
          servicio_id: servicioId,
          fecha_hora: new Date(fechaHora).toISOString(),
          cupos_totales: cupos,
        });
        if (!error) router.refresh();
        return error;
      }}
      onCrearLote={async ({ servicioId, fechasHora, cupos }) => {
        const { error } = await crearHorariosLoteAction({
          servicio_id: servicioId,
          fechas: fechasHora.map((f) => new Date(f).toISOString()),
          cupos_totales: cupos,
        });
        if (!error) router.refresh();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarHorarioAction(id);
        if (!error) router.refresh();
        return error;
      }}
    />
  );
}
