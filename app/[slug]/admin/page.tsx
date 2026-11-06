import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { construirHorarios, reservaOcupaCupo } from "@/lib/horarios";
import { esCobroPasarela, esPagoManual, montoEfectivoReserva } from "@/lib/pagos";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import { hoyClaveCR } from "@/lib/zona-horaria";
import type { BloqueoExcepcion, Horario, Servicio } from "@/types/database";
import InicioView from "@/components/empresa/InicioView";
import { leer } from "@/lib/data/server";
import { COLUMNAS_RESERVA_PANEL, type ReservaPanel } from "@/lib/data/columnas";

interface PagoConPrecio extends ReservaPanel {
  servicio: Pick<Servicio, "precio_usd"> | null;
}

/**
 * Inicio del dashboard: KPIs, atajos operativos, próximas 5 reservas y
 * servicios del negocio del usuario autenticado. Gracias a RLS, los filtros
 * por `negocio_id` solo pueden devolver filas que pertenecen al usuario.
 */
export default async function EmpresaInicioPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { negocio } = await requerirEmpresa(slug);

  const ahoraMs = Date.now();
  const hoyClave = hoyClaveCR(ahoraMs);
  const inicioHoyMs = new Date(`${hoyClave}T00:00:00-06:00`).getTime();
  const inicioHoyIso = new Date(inicioHoyMs).toISOString();
  const finHoyMs = inicioHoyMs + 86_400_000;
  const haceSemana = ahoraMs - 7 * 86_400_000;

  let proximas: ReservaPanel[] = [];
  let pagos: PagoConPrecio[] = [];
  let manualesPagadas: PagoConPrecio[] = [];
  let servicios: Servicio[] = [];
  let totalReservas = 0;
  let horarios: Horario[] = [];
  let todas: ReservaPanel[] = [];
  let bloqueos: BloqueoExcepcion[] = [];

  if (negocio) {
    [servicios, todas, horarios, bloqueos] = await Promise.all([
      leer("servicios", { eq: { negocio_id: negocio.id }, orden: ["nombre", true] }),
      leer("reservas", { eq: { negocio_id: negocio.id }, columnas: COLUMNAS_RESERVA_PANEL }),
      leer("horarios", { eq: { negocio_id: negocio.id }, gte: { fecha_hora: inicioHoyIso } }),
      leer("bloqueos_excepcion", { eq: { negocio_id: negocio.id }, gte: { fecha_fin: inicioHoyIso } }),
    ]);

    totalReservas = todas.filter((r) => reservaOcupaCupo(r, ahoraMs)).length;

    proximas = todas
      .filter(
        (r) =>
          reservaOcupaCupo(r, ahoraMs) &&
          new Date(r.fecha_hora).getTime() >= ahoraMs,
      )
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
      .slice(0, 5);

    const conServicio = (r: ReservaPanel): PagoConPrecio => ({
      ...r,
      servicio: servicios.find((s) => s.id === r.servicio_id) ?? null,
    });

    pagos = todas.filter((r) => esCobroPasarela(r)).map(conServicio);
    manualesPagadas = todas
      .filter((r) => r.estado === "pagada" && esPagoManual(r.trx_id))
      .map(conServicio);
  }

  const montoDe = (p: PagoConPrecio) =>
    montoEfectivoReserva(p, p.servicio?.precio_usd);
  const totalCobrado = pagos.reduce((acc, pago) => acc + montoDe(pago), 0);
  const cobrosManualesUsd = manualesPagadas.reduce(
    (acc, pago) => acc + montoDe(pago),
    0,
  );

  const reservasDeHoy = todas.filter((r) => {
    const t = new Date(r.fecha_hora).getTime();
    return reservaOcupaCupo(r, ahoraMs) && t >= inicioHoyMs && t < finHoyMs;
  });
  const reservasHoy = reservasDeHoy.length;
  const personasHoy = reservasDeHoy.reduce(
    (acc, r) => acc + (r.cupos ?? 1),
    0,
  );

  const ingresosSemana = pagos
    .filter((p) => new Date(p.fecha_hora).getTime() >= haceSemana)
    .reduce((acc, p) => acc + montoDe(p), 0);

  const limite = ahoraMs + 7 * 86_400_000;
  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
  const horariosPorServicio = new Map<string, number>();
  for (const h of horarios) {
    horariosPorServicio.set(
      h.servicio_id,
      (horariosPorServicio.get(h.servicio_id) ?? 0) + 1,
    );
  }

  const pocosCupos = construirHorarios(
    horarios.filter((h) => new Date(h.fecha_hora).getTime() <= limite),
    todas,
    bloqueos,
  )
    .filter((h) => h.cuposDisponibles <= 2)
    .slice(0, 5)
    .map((h) => ({
      id: h.id,
      servicioId: h.servicioId,
      servicio: servicioPorId.get(h.servicioId)?.nombre ?? "Servicio",
      label: h.label,
      cuposDisponibles: h.cuposDisponibles,
    }));

  const slugActual = negocio?.slug ?? slug;
  const finPrueba =
    negocio?.estado_suscripcion === "prueba" && negocio.prueba_hasta
      ? new Date(negocio.prueba_hasta)
      : null;
  const prueba = finPrueba
    ? {
        dias: Math.ceil((finPrueba.getTime() - ahoraMs) / 86_400_000),
        fechaFin: finPrueba.toLocaleDateString("es", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        hrefSuscripcion: rutaPanelEmpresa(slugActual, "suscripcion"),
      }
    : undefined;

  const cobro =
    negocio?.estado_suscripcion === "activa" && negocio.proximo_cobro
      ? new Date(negocio.proximo_cobro)
      : null;
  const proximoCobro = cobro
    ? {
        dias: Math.ceil((cobro.getTime() - ahoraMs) / 86_400_000),
        fecha: cobro.toLocaleDateString("es", {
          day: "numeric",
          month: "long",
        }),
        automatico: true,
      }
    : undefined;

  return (
    <InicioView
      prueba={prueba}
      proximoCobro={proximoCobro}
      nombre={negocio?.nombre ?? "tu negocio"}
      descripcion="Consulta tus salidas de hoy, próximas reservas e ingresos desde un solo lugar."
      hoyClave={hoyClave}
      totalReservas={totalReservas}
      totalCobrado={totalCobrado}
      cobrosManualesUsd={cobrosManualesUsd}
      reservasHoy={reservasHoy}
      personasHoy={personasHoy}
      ingresosSemana={ingresosSemana}
      totalHorariosFuturos={horarios.length}
      horariosPocosCupos={pocosCupos}
      rutas={{
        publico: `/${encodeURIComponent(slugActual)}`,
        calendario: rutaPanelEmpresa(slugActual, "calendario"),
        horarios: rutaPanelEmpresa(slugActual, "horarios"),
        reservas: rutaPanelEmpresa(slugActual, "reservas"),
        servicios: rutaPanelEmpresa(slugActual, "servicios"),
        finanzas: rutaPanelEmpresa(slugActual, "finanzas"),
        agenda: rutaPanelEmpresa(slugActual, "agenda"),
      }}
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        duracionMin: s.duracion_min,
        precioUsd: s.precio_usd,
        horariosActivos: horariosPorServicio.get(s.id) ?? 0,
      }))}
      proximasReservas={proximas.map((r) => {
        const srv = servicioPorId.get(r.servicio_id);
        const cupos = r.cupos ?? 1;
        return {
          id: r.id,
          fechaIso: r.fecha_hora,
          cliente: r.nombre_cliente || r.email_cliente,
          email: r.email_cliente,
          servicio: srv?.nombre,
          cupos,
          monto: r.monto_usd ?? (srv ? srv.precio_usd * cupos : undefined),
          esManual: esPagoManual(r.trx_id),
          estado: r.estado,
        };
      })}
    />
  );
}
