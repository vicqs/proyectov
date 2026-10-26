import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { construirHorarios } from "@/lib/horarios";
import type { Horario, Reserva, Servicio } from "@/types/database";
import HorariosEmpresaClient from "./HorariosEmpresaClient";

/**
 * Horarios y cupos del negocio autenticado: lista los horarios futuros con
 * la ocupación calculada a partir de las reservas existentes.
 */
export default async function HorariosPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { supabase, negocio } = await requerirEmpresa(slug);

  let servicios: Pick<Servicio, "id" | "nombre">[] = [];
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
        .gte("fecha_hora", new Date().toISOString())
        .order("fecha_hora", { ascending: true }),
      supabase.from("reservas").select("*").eq("negocio_id", negocio.id),
    ]);
    servicios = (serviciosRes.data ?? []) as Servicio[];
    horarios = (horariosRes.data ?? []) as Horario[];
    reservas = (reservasRes.data ?? []) as Reserva[];
  }

  return (
    <HorariosEmpresaClient
      slug={negocio.slug}
      servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre }))}
      horarios={construirHorarios(horarios, reservas, []).map((h) => ({
        id: h.id,
        servicioId: h.servicioId,
        label: h.label,
        fechaHora: h.fechaHora,
        cuposTotales: h.cuposTotales,
        cuposDisponibles: h.cuposDisponibles,
      }))}
    />
  );
}
