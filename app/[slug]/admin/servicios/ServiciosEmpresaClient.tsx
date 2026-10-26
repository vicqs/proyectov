"use client";

import { useRouter } from "next/navigation";
import {
  crearServicioAction,
  editarServicioAction,
  eliminarServicioAction,
} from "@/actions/servicios";
import ServiciosView, {
  type VistaServicio,
} from "@/components/empresa/ServiciosView";

/**
 * Puente cliente de `/[slug]/admin/servicios`: conecta la vista compartida con
 * las Server Actions y refresca los datos del servidor tras cada cambio.
 */
export default function ServiciosEmpresaClient({
  slug,
  servicios,
}: {
  slug: string;
  servicios: VistaServicio[];
}) {
  const router = useRouter();

  return (
    <ServiciosView
      servicios={servicios}
      conDetalle
      onGuardar={async (id, datos) => {
        const payload = {
          nombre: datos.nombre,
          precio_usd: datos.precioUsd,
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
          formData.set("duracion_min", String(payload.duracion_min));
          formData.set("descripcion", payload.descripcion);
          formData.set("imagen_url", payload.imagen_url);
          error = (await crearServicioAction(slug, {}, formData)).error;
        }
        if (!error) router.refresh();
        return error;
      }}
      onEliminar={async (id) => {
        const { error } = await eliminarServicioAction(slug, id);
        if (!error) router.refresh();
        return error;
      }}
    />
  );
}
