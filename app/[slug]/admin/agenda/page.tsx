import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { reservaOcupaCupo } from "@/lib/horarios";
import { hoyClaveCR } from "@/lib/zona-horaria";
import type { BloqueoExcepcion, Horario, Reserva, Servicio } from "@/types/database";
import AgendaEmpresaClient from "./AgendaEmpresaClient";
import { leer } from "@/lib/data/server";

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
  const { negocio } = await requerirEmpresa(slug);

  const ahoraMs = Date.now();
  const ahoraIso = new Date(ahoraMs).toISOString();
  const hoyClave = hoyClaveCR(ahoraMs);
  const inicioHoyIso = new Date(`${hoyClave}T00:00:00-06:00`).toISOString();

  let bloqueos: BloqueoExcepcion[] = [];
  let horarios: Horario[] = [];
  let reservas: Pick<Reserva, "servicio_id" | "fecha_hora" | "estado" | "trx_id">[] = [];
  let servicios: Pick<Servicio, "id" | "duracion_min" | "unit_type">[] = [];

  if (negocio) {
    [bloqueos, horarios, reservas, servicios] = await Promise.all([
      leer("bloqueos_excepcion", {
        eq: { negocio_id: negocio.id }, gte: { fecha_fin: ahoraIso }, orden: ["fecha_inicio", true],
      }),
      leer("horarios", { eq: { negocio_id: negocio.id }, gte: { fecha_hora: ahoraIso } }),
      leer("reservas", {
        eq: { negocio_id: negocio.id },
        gte: { fecha_hora: inicioHoyIso },
        columnas: ["servicio_id", "fecha_hora", "estado", "trx_id"],
      }),
      leer("servicios", { eq: { negocio_id: negocio.id }, columnas: ["id", "duracion_min", "unit_type"] }),
    ]);
  }

  const duracionPorServicio = new Map(
    servicios.map((s) => [s.id, s.duracion_min]),
  );
  // Las ventas de ítems no ocupan un horario: no generan conflicto al bloquear fechas.
  const idsItem = new Set(
    servicios.filter((s) => s.unit_type === "item").map((s) => s.id),
  );

  const horariosDetallados = horarios.map((h) => ({
    id: h.id,
    fechaHora: h.fecha_hora,
    duracionMin: duracionPorServicio.get(h.servicio_id) ?? 60,
  }));

  const reservasActivasIso = reservas
    .filter((r) => !idsItem.has(r.servicio_id) && reservaOcupaCupo(r, ahoraMs))
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
      horarios={horariosDetallados}
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
