"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  cancelarReservaAction,
  crearReservaManualAction,
} from "@/actions/reservas";
import type { CodigoMoneda } from "@/lib/monedas";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import ReservasView, {
  type HorarioManual,
  type ItemManual,
  type VistaReserva,
} from "@/components/empresa/ReservasView";

/** Puente cliente de `/[slug]/admin/reservas`: vista compartida + Server Actions. */
export default function ReservasEmpresaClient({
  slug,
  monedaNegocio = "USD",
  reservas,
  horarios,
  items = [],
  hoyClave,
  ahoraMs,
  abrirManualInicial = false,
}: {
  slug: string;
  monedaNegocio?: CodigoMoneda;
  reservas: VistaReserva[];
  horarios: HorarioManual[];
  items?: ItemManual[];
  hoyClave?: string;
  ahoraMs?: number;
  abrirManualInicial?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function tieneQueryManual(): boolean {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.has("nueva") || params.has("nuevo");
  }

  function limpiarQuery() {
    if (tieneQueryManual()) {
      router.replace(pathname, { scroll: false });
    }
  }

  function sincronizarCambios() {
    if (tieneQueryManual()) {
      router.replace(pathname, { scroll: false });
    }
  }

  return (
    <ReservasView
      reservas={reservas}
      monedaNegocio={monedaNegocio}
      hoyClave={hoyClave}
      ahoraMs={ahoraMs}
      abrirManualInicial={abrirManualInicial}
      hrefHorarios={rutaPanelEmpresa(slug, "horarios")}
      hrefCalendario={rutaPanelEmpresa(slug, "calendario")}
      onCerrarManualInicial={limpiarQuery}
      onCancelar={async (id) => {
        const { error } = await cancelarReservaAction(slug, id);
        if (!error) sincronizarCambios();
        return error;
      }}
      manual={{
        horarios,
        items,
        onCrear: async (datos) => {
          const { error } = await crearReservaManualAction(slug, datos);
          if (!error) sincronizarCambios();
          return error;
        },
      }}
    />
  );
}
