import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { normalizarMoneda } from "@/lib/monedas";
import type { Horario, Reserva, Servicio } from "@/types/database";
import ServiciosEmpresaClient from "./ServiciosEmpresaClient";
import { leer } from "@/lib/data/server";

/**
 * Lista los servicios del negocio del usuario autenticado junto con el conteo
 * de horarios futuros y reservas registradas. La consulta usa el cliente SSR
 * (respeta RLS) y la edición ocurre en el cliente vía Server Actions.
 */
export default async function ServiciosPage({
  params,
  searchParams,
}: EmpresaPageProps & {
  searchParams: Promise<{ nuevo?: string }>;
}) {
  const [{ slug }, { nuevo }] = await Promise.all([params, searchParams]);
  const { negocio } = await requerirEmpresa(slug);

  let servicios: Servicio[] = [];
  let horarios: Pick<Horario, "servicio_id">[] = [];
  let reservas: Pick<Reserva, "servicio_id">[] = [];

  const ahoraIso = new Date().toISOString();

  if (negocio) {
    // Horarios y reservas solo se cuentan por servicio: una columna basta.
    [servicios, horarios, reservas] = await Promise.all([
      leer("servicios", { eq: { negocio_id: negocio.id }, orden: ["nombre", true] }),
      leer("horarios", {
        eq: { negocio_id: negocio.id },
        gte: { fecha_hora: ahoraIso },
        columnas: ["servicio_id"],
      }),
      leer("reservas", { eq: { negocio_id: negocio.id }, columnas: ["servicio_id"] }),
    ]);
  }

  const horariosPorServicio = new Map<string, number>();
  for (const h of horarios) {
    horariosPorServicio.set(
      h.servicio_id,
      (horariosPorServicio.get(h.servicio_id) ?? 0) + 1,
    );
  }

  const reservasPorServicio = new Map<string, number>();
  for (const r of reservas) {
    reservasPorServicio.set(
      r.servicio_id,
      (reservasPorServicio.get(r.servicio_id) ?? 0) + 1,
    );
  }

  const monedaNegocio = normalizarMoneda(negocio.moneda, "USD");

  return (
    <ServiciosEmpresaClient
      slug={negocio.slug}
      monedaNegocio={monedaNegocio}
      abrirInicial={nuevo === "1"}
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precioUsd: s.precio_usd,
        moneda: normalizarMoneda(s.currency, monedaNegocio),
        duracionMin: s.duracion_min,
        tipoUnidad: s.unit_type ?? "cupo",
        stock: s.stock ?? null,
        descripcion: s.descripcion ?? "",
        imagenUrl: s.imagen_url ?? "",
        horariosActivos: horariosPorServicio.get(s.id) ?? 0,
        reservasTotales: reservasPorServicio.get(s.id) ?? 0,
      }))}
    />
  );
}
