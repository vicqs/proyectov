import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { Horario, ReservaConServicio, Servicio } from "@/types/database";
import { construirHorarios, etiquetaHorario } from "@/lib/horarios";
import ReservasEmpresaClient from "./ReservasEmpresaClient";

/**
 * Todas las reservas del negocio, con el nombre del servicio traído
 * mediante consulta anidada de Supabase (JOIN implícito por FK).
 * Server Component: la consulta se ejecuta en el servidor y respeta RLS.
 */
export default async function ReservasPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { supabase, negocio } = await requerirEmpresa(slug);

  let reservas: ReservaConServicio[] = [];
  let horarios: Horario[] = [];
  let servicios: Pick<Servicio, "id" | "nombre">[] = [];

  if (negocio) {
    const [reservasRes, horariosRes, serviciosRes] = await Promise.all([
      supabase
        .from("reservas")
        .select("*, servicio:servicios(nombre, precio_usd)")
        .eq("negocio_id", negocio.id)
        .order("fecha_hora", { ascending: false }),
      supabase
        .from("horarios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", new Date().toISOString())
        .order("fecha_hora", { ascending: true }),
      supabase.from("servicios").select("*").eq("negocio_id", negocio.id),
    ]);

    if (!reservasRes.error) {
      reservas = (reservasRes.data ?? []) as unknown as ReservaConServicio[];
    }
    horarios = (horariosRes.data ?? []) as Horario[];
    servicios = (serviciosRes.data ?? []) as Servicio[];
  }

  const nombreServicio = (id: string) =>
    servicios.find((s) => s.id === id)?.nombre ?? "Servicio";

  return (
    <ReservasEmpresaClient
      slug={negocio.slug}
      reservas={reservas.map((r) => ({
        id: r.id,
        fechaIso: r.fecha_hora,
        cliente: r.nombre_cliente || r.email_cliente,
        email: r.nombre_cliente ? r.email_cliente : undefined,
        servicio: r.servicio?.nombre ?? "—",
        horario: etiquetaHorario(r.fecha_hora),
        cupos: r.cupos ?? 1,
        monto:
          r.estado === "pagada" && r.servicio
            ? (r.monto_usd ?? r.servicio.precio_usd * (r.cupos ?? 1))
            : undefined,
        estado: r.estado,
        trxId: r.trx_id,
      }))}
      horarios={construirHorarios(horarios, reservas, []).map((h) => ({
        id: h.id,
        servicio: nombreServicio(h.servicioId),
        label: h.label,
        cuposDisponibles: h.cuposDisponibles,
      }))}
    />
  );
}
