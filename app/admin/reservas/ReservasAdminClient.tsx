"use client";

import { useRouter } from "next/navigation";
import {
  cancelarReservaAction,
  crearReservaManualAction,
} from "../../../actions/reservas";
import ReservasView, {
  type HorarioManual,
  type VistaReserva,
} from "../../../components/admin/ReservasView";

/** Puente cliente de `/admin/reservas`: vista compartida + Server Actions. */
export default function ReservasAdminClient({
  reservas,
  horarios,
}: {
  reservas: VistaReserva[];
  horarios: HorarioManual[];
}) {
  const router = useRouter();

  return (
    <ReservasView
      reservas={reservas}
      onCancelar={async (id) => {
        const { error } = await cancelarReservaAction(id);
        if (!error) router.refresh();
        return error;
      }}
      manual={{
        horarios,
        onCrear: async (datos) => {
          const { error } = await crearReservaManualAction(datos);
          if (!error) router.refresh();
          return error;
        },
      }}
    />
  );
}
