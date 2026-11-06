"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  crearServicioAction,
  editarServicioAction,
  eliminarServicioAction,
} from "@/actions/servicios";
import type { CodigoMoneda } from "@/lib/monedas";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import ServiciosView, {
  type VistaServicio,
} from "@/components/empresa/ServiciosView";

/**
 * Puente cliente de `/[slug]/admin/servicios`: conecta la vista compartida con
 * las Server Actions y refresca los datos del servidor tras cada cambio.
 */
export default function ServiciosEmpresaClient({
  slug,
  monedaNegocio = "USD",
  servicios,
  abrirInicial = false,
}: {
  slug: string;
  monedaNegocio?: CodigoMoneda;
  servicios: VistaServicio[];
  abrirInicial?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  function tieneQueryNuevo(): boolean {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).has("nuevo");
  }

  function limpiarQuery() {
    if (tieneQueryNuevo()) {
      router.replace(pathname, { scroll: false });
    }
  }

  function sincronizarCambios() {
    if (tieneQueryNuevo()) {
      router.replace(pathname, { scroll: false });
    }
  }

  return (
    <ServiciosView
      servicios={servicios}
      monedaNegocio={monedaNegocio}
      conDetalle
      abrirInicial={abrirInicial}
      hrefPublico={`/${encodeURIComponent(slug)}`}
      hrefHorarios={rutaPanelEmpresa(slug, "horarios")}
      hrefReservas={rutaPanelEmpresa(slug, "reservas")}
      onCerrarInicial={limpiarQuery}
      onGuardar={async (id, datos) => {
        const payload = {
          nombre: datos.nombre,
          precio_usd: datos.precioUsd,
          currency: datos.moneda,
          unit_type: datos.tipoUnidad,
          stock: datos.stock,
          duracion_min: datos.duracionMin,
          descripcion: datos.descripcion,
          imagen_url: datos.imagenUrl,
        };
        let error: string | undefined;
        if (id) {
          error = (await editarServicioAction(slug, id, payload)).error;
        } else {
          const formData = new FormData();
          formData.set("nombre", payload.nombre);
          formData.set("precio_usd", String(payload.precio_usd));
          if (payload.currency) {
            formData.set("currency", payload.currency);
          }
          formData.set("unit_type", payload.unit_type);
          if (payload.stock !== null) {
            formData.set("stock", String(payload.stock));
          }
          formData.set("duracion_min", String(payload.duracion_min));
          formData.set("descripcion", payload.descripcion);
          formData.set("imagen_url", payload.imagen_url);
          error = (await crearServicioAction(slug, {}, formData)).error;
        }
        if (!error) sincronizarCambios();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarServicioAction(slug, id);
        if (!error) sincronizarCambios();
        return error;
      }}
    />
  );
}
