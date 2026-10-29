"use client";

import { usePathname, useRouter } from "next/navigation";
import { crearBloqueoAction, eliminarBloqueoAction } from "@/actions/agenda";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import AgendaView, {
  type SugerenciaBloqueoInicial,
  type VistaBloqueo,
} from "@/components/empresa/AgendaView";

/** Puente cliente de `/[slug]/admin/agenda`: vista compartida + Server Actions. */
export default function AgendaEmpresaClient({
  slug,
  bloqueos,
  horariosIso = [],
  reservasActivasIso = [],
  hoyClave,
  ahoraMs,
  sugerenciaInicial,
}: {
  slug: string;
  bloqueos: VistaBloqueo[];
  horariosIso?: string[];
  reservasActivasIso?: string[];
  hoyClave?: string;
  ahoraMs?: number;
  sugerenciaInicial?: SugerenciaBloqueoInicial;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function tieneQueryInicial(): boolean {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return params.has("nuevo") || params.has("fecha");
  }

  function limpiarQuery() {
    if (tieneQueryInicial()) {
      router.replace(pathname, { scroll: false });
    }
  }

  function sincronizarCambios() {
    if (tieneQueryInicial()) {
      router.replace(pathname, { scroll: false });
    } else {
      router.refresh();
    }
  }

  return (
    <AgendaView
      bloqueos={bloqueos}
      horariosIso={horariosIso}
      reservasActivasIso={reservasActivasIso}
      hoyClave={hoyClave}
      ahoraMs={ahoraMs}
      sugerenciaInicial={sugerenciaInicial}
      hrefCalendario={rutaPanelEmpresa(slug, "calendario")}
      hrefReservas={rutaPanelEmpresa(slug, "reservas")}
      onCerrarInicial={limpiarQuery}
      onCrear={async ({ inicio, fin, motivo }) => {
        const formData = new FormData();
        formData.set("fecha_inicio", inicio);
        formData.set("fecha_fin", fin);
        formData.set("motivo", motivo);
        const { error } = await crearBloqueoAction(slug, {}, formData);
        if (!error) sincronizarCambios();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarBloqueoAction(slug, id);
        if (!error) sincronizarCambios();
        return error;
      }}
    />
  );
}
