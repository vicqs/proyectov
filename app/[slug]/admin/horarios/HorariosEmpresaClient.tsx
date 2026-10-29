"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  crearHorarioAction,
  crearHorariosLoteAction,
  eliminarHorarioAction,
} from "@/actions/horarios";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import HorariosView, {
  type SugerenciaHorarioInicial,
  type VistaHorario,
} from "@/components/empresa/HorariosView";

/** Puente cliente de `/[slug]/admin/horarios`: vista compartida + Server Actions. */
export default function HorariosEmpresaClient({
  slug,
  horarios,
  servicios,
  hoyClave,
  sugerenciaInicial,
}: {
  slug: string;
  horarios: VistaHorario[];
  servicios: { id: string; nombre: string }[];
  hoyClave?: string;
  sugerenciaInicial?: SugerenciaHorarioInicial;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function tieneQueryInicial(): boolean {
    if (typeof window === "undefined") return false;
    const params = new URLSearchParams(window.location.search);
    return (
      params.has("nuevo") || params.has("fecha") || params.has("servicio")
    );
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
    <HorariosView
      horarios={horarios}
      servicios={servicios}
      hoyClave={hoyClave}
      sugerenciaInicial={sugerenciaInicial}
      hrefCalendario={rutaPanelEmpresa(slug, "calendario")}
      hrefServicios={rutaPanelEmpresa(slug, "servicios")}
      hrefReservas={rutaPanelEmpresa(slug, "reservas")}
      onCerrarInicial={limpiarQuery}
      onCrear={async ({ servicioId, fechaHora, cupos }) => {
        const { error } = await crearHorarioAction(slug, {
          servicio_id: servicioId,
          fecha_hora: new Date(fechaHora).toISOString(),
          cupos_totales: cupos,
        });
        if (!error) sincronizarCambios();
        return error;
      }}
      onCrearLote={async ({ servicioId, fechasHora, cupos }) => {
        const { error } = await crearHorariosLoteAction(slug, {
          servicio_id: servicioId,
          fechas: fechasHora.map((f) => new Date(f).toISOString()),
          cupos_totales: cupos,
        });
        if (!error) sincronizarCambios();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarHorarioAction(slug, id);
        if (!error) sincronizarCambios();
        return error;
      }}
    />
  );
}
