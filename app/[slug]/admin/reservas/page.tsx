import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { Horario, ReservaConServicio, Servicio } from "@/types/database";
import { construirHorarios, etiquetaHorario } from "@/lib/horarios";
import ReservasEmpresaClient from "./ReservasEmpresaClient";

function hoyClaveCR(ahoraMs: number): string {
  const cr = new Date(ahoraMs - 6 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${cr.getUTCFullYear()}-${p(cr.getUTCMonth() + 1)}-${p(cr.getUTCDate())}`;
}

/**
 * Todas las reservas del negocio, con el nombre y tarifa del servicio traídos
 * mediante consulta anidada de Supabase (JOIN implícito por FK).
 * Server Component: la consulta se ejecuta en el servidor y respeta RLS.
 */
export default async function ReservasPage({
  params,
  searchParams,
}: EmpresaPageProps & {
  searchParams: Promise<{ nueva?: string; nuevo?: string }>;
}) {
  const [{ slug }, { nueva, nuevo }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { supabase, negocio } = await requerirEmpresa(slug);

  const ahoraMs = Date.now();
  const ahoraIso = new Date(ahoraMs).toISOString();
  const hoyClave = hoyClaveCR(ahoraMs);

  let reservas: ReservaConServicio[] = [];
  let horarios: Horario[] = [];
  let servicios: Servicio[] = [];

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
        .gte("fecha_hora", ahoraIso)
        .order("fecha_hora", { ascending: true }),
      supabase.from("servicios").select("*").eq("negocio_id", negocio.id),
    ]);

    if (!reservasRes.error) {
      reservas = (reservasRes.data ?? []) as unknown as ReservaConServicio[];
    }
    horarios = (horariosRes.data ?? []) as Horario[];
    servicios = (serviciosRes.data ?? []) as Servicio[];
  }

  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));

  return (
    <ReservasEmpresaClient
      slug={negocio.slug}
      hoyClave={hoyClave}
      ahoraMs={ahoraMs}
      abrirManualInicial={nueva === "1" || nuevo === "1"}
      reservas={reservas.map((r) => {
        const cupos = r.cupos ?? 1;
        const tarifa =
          r.servicio?.precio_usd ??
          servicioPorId.get(r.servicio_id)?.precio_usd;
        const calculado =
          r.monto_usd ?? (tarifa !== undefined ? tarifa * cupos : undefined);

        return {
          id: r.id,
          fechaIso: r.fecha_hora,
          cliente: r.nombre_cliente || r.email_cliente,
          email: r.nombre_cliente ? r.email_cliente : undefined,
          servicio:
            r.servicio?.nombre ??
            servicioPorId.get(r.servicio_id)?.nombre ??
            "—",
          horario: etiquetaHorario(r.fecha_hora),
          cupos,
          monto: r.estado === "pagada" ? calculado : undefined,
          montoEstimado: calculado,
          estado: r.estado,
          trxId: r.trx_id,
        };
      })}
      horarios={construirHorarios(horarios, reservas, []).map((h) => {
        const srv = servicioPorId.get(h.servicioId);
        return {
          id: h.id,
          servicio: srv?.nombre ?? "Servicio",
          label: h.label,
          cuposDisponibles: h.cuposDisponibles,
          precioUsd: srv?.precio_usd,
        };
      })}
    />
  );
}
