"use client";

import { mockNegocio } from "../../../../lib/mockData";
import {
  crearServicio,
  editarServicio,
  eliminarServicio,
  useDemoStore,
} from "../../../../lib/demoStore";
import ServiciosView from "../../../../components/admin/ServiciosView";

const IMAGEN_POR_DEFECTO =
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop";

/** Servicios del panel simulado (respaldado por `lib/demoStore.ts`). */
export default function AdminDemoServiciosPage() {
  const { servicios } = useDemoStore(mockNegocio.slug);

  return (
    <ServiciosView
      servicios={servicios}
      conDetalle
      onGuardar={(id, datos) => {
        const payload = {
          nombre: datos.nombre,
          descripcion: datos.descripcion,
          precioUsd: datos.precioUsd,
          duracionMin: datos.duracionMin,
          imagenUrl: datos.imagenUrl || IMAGEN_POR_DEFECTO,
        };
        if (id) editarServicio(mockNegocio.slug, id, payload);
        else crearServicio(mockNegocio.slug, payload);
      }}
      onEliminar={(id) => eliminarServicio(mockNegocio.slug, id)}
    />
  );
}
