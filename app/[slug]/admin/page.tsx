import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import type { Reserva, ReservaConServicio, Servicio } from "@/types/database";
import InicioView from "@/components/empresa/InicioView";
import { construirHorarios } from "@/lib/horarios";
import type { Horario } from "@/types/database";

interface PagoConPrecio extends Reserva {
  servicio: Pick<Servicio, "precio_usd"> | null;
}

/**
 * Inicio del dashboard: KPIs, próximas 5 reservas y servicios del negocio
 * del usuario autenticado. Gracias a RLS, los filtros por `negocio_id` solo
 * pueden devolver filas que le pertenecen al usuario logueado.
 */
export default async function EmpresaInicioPage({ params }: EmpresaPageProps) {
  const { slug } = await params;
  const { supabase, negocio } = await requerirEmpresa(slug);

  let proximas: ReservaConServicio[] = [];
  let pagos: PagoConPrecio[] = [];
  let servicios: Servicio[] = [];
  let totalReservas = 0;
  let horarios: Horario[] = [];
  let todas: Reserva[] = [];

  if (negocio) {
    const [serviciosRes, todasRes, horariosRes] = await Promise.all([
      supabase
        .from("servicios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .order("nombre", { ascending: true }),
      supabase.from("reservas").select("*").eq("negocio_id", negocio.id),
      supabase
        .from("horarios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", new Date().toISOString()),
    ]);

    servicios = (serviciosRes.data ?? []) as Servicio[];
    todas = (todasRes.data ?? []) as Reserva[];
    horarios = (horariosRes.data ?? []) as Horario[];
    totalReservas = todas.filter((r) => r.estado !== "cancelada").length;

    const ahora = Date.now();
    proximas = todas
      .filter(
        (r) =>
          (r.estado === "pendiente" || r.estado === "pagada") &&
          new Date(r.fecha_hora).getTime() >= ahora,
      )
      .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
      .slice(0, 5) as unknown as ReservaConServicio[];
    pagos = todas
      .filter((r) => r.estado === "pagada")
      .map((r) => ({
        ...r,
        servicio: servicios.find((s) => s.id === r.servicio_id) ?? null,
      }));
  }

  const montoDe = (p: PagoConPrecio) =>
    p.monto_usd ?? (p.servicio?.precio_usd ?? 0) * (p.cupos ?? 1);
  const totalCobrado = pagos.reduce((acc, pago) => acc + montoDe(pago), 0);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy.getTime() + 86_400_000);
  const haceSemana = Date.now() - 7 * 86_400_000;
  const reservasHoy = todas.filter((r) => {
    const t = new Date(r.fecha_hora).getTime();
    return (
      r.estado !== "cancelada" && t >= hoy.getTime() && t < manana.getTime()
    );
  }).length;
  const ingresosSemana = pagos
    .filter((p) => new Date(p.fecha_hora).getTime() >= haceSemana)
    .reduce((acc, p) => acc + montoDe(p), 0);
  const limite = Date.now() + 7 * 86_400_000;
  const nombreServicio = (id: string) =>
    servicios.find((s) => s.id === id)?.nombre ?? "Servicio";
  const pocosCupos = construirHorarios(
    horarios.filter((h) => new Date(h.fecha_hora).getTime() <= limite),
    todas,
    [],
  )
    .filter((h) => h.cuposDisponibles <= 2)
    .slice(0, 5)
    .map((h) => ({
      id: h.id,
      servicio: nombreServicio(h.servicioId),
      label: h.label,
      cuposDisponibles: h.cuposDisponibles,
    }));

  const finPrueba =
    negocio?.estado_suscripcion === "prueba" && negocio.prueba_hasta
      ? new Date(negocio.prueba_hasta)
      : null;
  const prueba = finPrueba
    ? {
        dias: Math.ceil((finPrueba.getTime() - Date.now()) / 86_400_000),
        fechaFin: finPrueba.toLocaleDateString("es", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        hrefSuscripcion: `/${slug}/admin/suscripcion`,
      }
    : undefined;

  const cobro =
    negocio?.estado_suscripcion === "activa" && negocio.proximo_cobro
      ? new Date(negocio.proximo_cobro)
      : null;
  const proximoCobro = cobro
    ? {
        dias: Math.ceil((cobro.getTime() - Date.now()) / 86_400_000),
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
      descripcion="Este es el resumen de tu negocio."
      totalReservas={totalReservas}
      totalCobrado={totalCobrado}
      reservasHoy={reservasHoy}
      ingresosSemana={ingresosSemana}
      horariosPocosCupos={pocosCupos}
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        duracionMin: s.duracion_min,
        precioUsd: s.precio_usd,
      }))}
      proximasReservas={proximas.map((r) => ({
        id: r.id,
        fechaIso: r.fecha_hora,
        cliente: r.nombre_cliente || r.email_cliente,
        estado: r.estado,
      }))}
    />
  );
}
