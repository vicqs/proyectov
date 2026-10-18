"use client";

import { useRouter } from "next/navigation";
import {
  cancelarReservaAction,
  crearReservaManualAction,
} from "@/actions/reservas";
import ReservasView, {
  type HorarioManual,
  type VistaReserva,
} from "@/components/empresa/ReservasView";

/** Puente cliente de `/[slug]/admin/reservas`: vista compartida + Server Actions. */
export default function ReservasEmpresaClient({
  slug,
  reservas,
  horarios,
}: {
  slug: string;
  reservas: VistaReserva[];
  horarios: HorarioManual[];
}) {
  const router = useRouter();

  return (
    <ReservasView
      reservas={reservas}
      onCancelar={async (id) => {
        const { error } = await cancelarReservaAction(slug, id);
        if (!error) router.refresh();
        return error;
      }}
      manual={{
        horarios,
        onCrear: async (datos) => {
          const { error } = await crearReservaManualAction(slug, datos);
          if (!error) router.refresh();
          return error;
        },
      }}
    />
  );
}
