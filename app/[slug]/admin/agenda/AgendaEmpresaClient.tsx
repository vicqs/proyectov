"use client";

import { useRouter } from "next/navigation";
import { crearBloqueoAction, eliminarBloqueoAction } from "@/actions/agenda";
import AgendaView, { type VistaBloqueo } from "@/components/empresa/AgendaView";

/** Puente cliente de `/[slug]/admin/agenda`: vista compartida + Server Actions. */
export default function AgendaEmpresaClient({
  slug,
  bloqueos,
}: {
  slug: string;
  bloqueos: VistaBloqueo[];
}) {
  const router = useRouter();

  return (
    <AgendaView
      bloqueos={bloqueos}
      onCrear={async ({ inicio, fin, motivo }) => {
        const formData = new FormData();
        formData.set("fecha_inicio", inicio);
        formData.set("fecha_fin", fin);
        formData.set("motivo", motivo);
        const { error } = await crearBloqueoAction(slug, {}, formData);
        if (!error) router.refresh();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarBloqueoAction(slug, id);
        if (!error) router.refresh();
        return error;
      }}
    />
  );
}
