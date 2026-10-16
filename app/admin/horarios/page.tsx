import { createSupabaseServerClient } from "../../../lib/supabase/server";
import { construirHorarios } from "../../../lib/horarios";
import type { Horario, Reserva, Servicio } from "../../../types/database";
import HorariosAdminClient from "./HorariosAdminClient";

/**
 * Horarios y cupos del negocio autenticado: lista los horarios futuros con
 * la ocupación calculada a partir de las reservas existentes.
 */
export default async function HorariosPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: negocio } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user!.id)
    .single();

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
    <HorariosAdminClient
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
