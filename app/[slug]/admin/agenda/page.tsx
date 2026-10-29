import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { BloqueoExcepcion, Horario, Reserva } from "@/types/database";
import AgendaEmpresaClient from "./AgendaEmpresaClient";

function hoyClaveCR(ahoraMs: number): string {
  const cr = new Date(ahoraMs - 6 * 3_600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${cr.getUTCFullYear()}-${p(cr.getUTCMonth() + 1)}-${p(cr.getUTCDate())}`;
}

/**
 * Gestión de la Agenda: lista los bloqueos futuros activos del negocio del
 * usuario autenticado junto con horarios futuros y reservas activas para
 * anticipar conflictos e impacto. La carga inicial ocurre en el servidor;
 * crear y eliminar se hacen desde el cliente vía Server Actions.
 */
export default async function AgendaPage({
  params,
  searchParams,
}: EmpresaPageProps & {
  searchParams: Promise<{ nuevo?: string; fecha?: string }>;
}) {
  const [{ slug }, { nuevo, fecha }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { supabase, negocio } = await requerirEmpresa(slug);

  const ahoraMs = Date.now();
  const ahoraIso = new Date(ahoraMs).toISOString();
  const hoyClave = hoyClaveCR(ahoraMs);
  const inicioHoyIso = new Date(`${hoyClave}T00:00:00-06:00`).toISOString();

  let bloqueos: BloqueoExcepcion[] = [];
  let horarios: Horario[] = [];
  let reservas: Reserva[] = [];

  if (negocio) {
    const [bloqueosRes, horariosRes, reservasRes] = await Promise.all([
      supabase
        .from("bloqueos_excepcion")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_fin", ahoraIso)
        .order("fecha_inicio", { ascending: true }),
      supabase
        .from("horarios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", ahoraIso),
      supabase
        .from("reservas")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", inicioHoyIso),
    ]);

    if (!bloqueosRes.error) {
      bloqueos = (bloqueosRes.data ?? []) as BloqueoExcepcion[];
    }
    horarios = (horariosRes.data ?? []) as Horario[];
    reservas = (reservasRes.data ?? []) as Reserva[];
  }

  const reservasActivasIso = reservas
    .filter((r) => r.estado !== "cancelada")
    .map((r) => r.fecha_hora);

  const fechaSugerida =
    fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= hoyClave
      ? fecha
      : undefined;

  return (
    <AgendaEmpresaClient
      slug={negocio.slug}
      hoyClave={hoyClave}
      ahoraMs={ahoraMs}
      sugerenciaInicial={{
        abrir: nuevo === "1",
        fecha: fechaSugerida,
      }}
      horariosIso={horarios.map((h) => h.fecha_hora)}
      reservasActivasIso={reservasActivasIso}
      bloqueos={bloqueos.map((b) => ({
        id: b.id,
        inicioIso: b.fecha_inicio,
        finIso: b.fecha_fin,
        motivo: b.motivo,
      }))}
    />
  );
}
