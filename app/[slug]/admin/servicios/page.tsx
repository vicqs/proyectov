import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { Horario, Reserva, Servicio } from "@/types/database";
import ServiciosEmpresaClient from "./ServiciosEmpresaClient";

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
  const { supabase, negocio } = await requerirEmpresa(slug);

  let servicios: Servicio[] = [];
  let horarios: Horario[] = [];
  let reservas: Reserva[] = [];

  if (negocio) {
    const [serviciosRes, horariosRes, reservasRes] = await Promise.all([
      supabase
        .from("servicios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .order("nombre", { ascending: true }),
      supabase
        .from("horarios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", new Date().toISOString()),
      supabase.from("reservas").select("*").eq("negocio_id", negocio.id),
    ]);

    if (!serviciosRes.error) {
      servicios = (serviciosRes.data ?? []) as Servicio[];
    }
    horarios = (horariosRes.data ?? []) as Horario[];
    reservas = (reservasRes.data ?? []) as Reserva[];
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

  return (
    <ServiciosEmpresaClient
      slug={negocio.slug}
      abrirInicial={nuevo === "1"}
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        precioUsd: s.precio_usd,
        duracionMin: s.duracion_min,
        descripcion: s.descripcion ?? "",
        imagenUrl: s.imagen_url ?? "",
        horariosActivos: horariosPorServicio.get(s.id) ?? 0,
        reservasTotales: reservasPorServicio.get(s.id) ?? 0,
      }))}
    />
  );
}
