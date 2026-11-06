import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { BloqueoExcepcion, Horario, Servicio } from "@/types/database";
import { construirHorarios, etiquetaHorario } from "@/lib/horarios";
import { convertirMoneda, normalizarMoneda } from "@/lib/monedas";
import { hoyClaveCR } from "@/lib/zona-horaria";
import ReservasEmpresaClient from "./ReservasEmpresaClient";
import { leer } from "@/lib/data/server";
import { COLUMNAS_RESERVA_PANEL, type ReservaPanel } from "@/lib/data/columnas";

type ReservaConServicio = ReservaPanel & {
  servicio: Pick<Servicio, "nombre" | "precio_usd" | "currency" | "unit_type"> | null;
};

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
  const { negocio } = await requerirEmpresa(slug);

  const ahoraMs = Date.now();
  const ahoraIso = new Date(ahoraMs).toISOString();
  const hoyClave = hoyClaveCR(ahoraMs);

  let reservas: ReservaConServicio[] = [];
  let horarios: Horario[] = [];
  let servicios: Servicio[] = [];
  let bloqueos: Pick<BloqueoExcepcion, "fecha_inicio" | "fecha_fin">[] = [];

  if (negocio) {
    const [reservasDb, horariosDb, serviciosDb, bloqueosDb] = await Promise.all([
      leer("reservas", {
        eq: { negocio_id: negocio.id },
        orden: ["fecha_hora", false],
        columnas: COLUMNAS_RESERVA_PANEL,
      }),
      leer("horarios", {
        eq: { negocio_id: negocio.id }, gte: { fecha_hora: ahoraIso }, orden: ["fecha_hora", true],
      }),
      leer("servicios", { eq: { negocio_id: negocio.id } }),
      leer("bloqueos_excepcion", { eq: { negocio_id: negocio.id }, gte: { fecha_fin: ahoraIso } }),
    ]);
    horarios = horariosDb;
    servicios = serviciosDb;
    bloqueos = bloqueosDb;
    const serviciosPorId = new Map(serviciosDb.map((s) => [s.id, s]));
    reservas = reservasDb.map((r) => ({ ...r, servicio: serviciosPorId.get(r.servicio_id) ?? null }));
  }

  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
  const monedaNegocio = normalizarMoneda(negocio.moneda, "USD");

  return (
    <ReservasEmpresaClient
      slug={negocio.slug}
      monedaNegocio={monedaNegocio}
      hoyClave={hoyClave}
      ahoraMs={ahoraMs}
      abrirManualInicial={nueva === "1" || nuevo === "1"}
      reservas={reservas.map((r) => {
        const cupos = r.cupos ?? 1;
        const srv = r.servicio ?? servicioPorId.get(r.servicio_id);
        const tarifa = srv?.precio_usd;
        const monedaSrv = normalizarMoneda(srv?.currency, monedaNegocio);
        const monedaRes = normalizarMoneda(r.currency, monedaSrv);
        const calculado =
          r.monto_usd ??
          r.gross_amount ??
          (tarifa !== undefined
            ? convertirMoneda(tarifa * cupos, monedaSrv, monedaRes)
            : undefined);

        return {
          id: r.id,
          fechaIso: r.fecha_hora,
          cliente: r.nombre_cliente || r.email_cliente,
          email: r.nombre_cliente ? r.email_cliente : undefined,
          servicio: srv?.nombre ?? "—",
          horario: etiquetaHorario(r.fecha_hora),
          cupos,
          esItem: srv?.unit_type === "item",
          monto: r.estado === "pagada" ? calculado : undefined,
          montoEstimado: calculado,
          moneda: monedaRes,
          tipoCambioBccr: r.exchange_rate_bccr,
          estado: r.estado,
          trxId: r.trx_id,
        };
      })}
      horarios={construirHorarios(horarios, reservas, bloqueos, true).map((h) => {
        const srv = servicioPorId.get(h.servicioId);
        return {
          id: h.id,
          servicioNombre: srv?.nombre ?? "Servicio",
          label: h.label,
          cuposDisponibles: h.cuposDisponibles,
          cuposTotales: h.cuposTotales,
          precioUsd: srv?.precio_usd,
          moneda: normalizarMoneda(srv?.currency, monedaNegocio),
          fechaHora: h.fechaHora,
          duracionMin: srv?.duracion_min ?? 60,
        };
      })}
      items={servicios
        .filter((s) => s.unit_type === "item")
        .map((s) => ({
          servicioId: s.id,
          nombre: s.nombre,
          stock: s.stock ?? 0,
          precioUsd: s.precio_usd,
          moneda: normalizarMoneda(s.currency, monedaNegocio),
        }))}
    />
  );
}
