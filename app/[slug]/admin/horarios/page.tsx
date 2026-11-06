import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { construirHorarios, sugerirProximoHorario } from "@/lib/horarios";
import { hoyClaveCR } from "@/lib/zona-horaria";
import type { Horario, Reserva, Servicio } from "@/types/database";
import HorariosEmpresaClient from "./HorariosEmpresaClient";
import { leer } from "@/lib/data/server";

/**
 * Horarios y cupos del negocio autenticado: lista los horarios futuros con
 * la ocupación calculada a partir de las reservas existentes.
 * Admite `?nuevo=1&fecha=YYYY-MM-DD&servicio=UUID` para abrir el formulario
 * preconfigurado al llegar desde Calendario.
 */
export default async function HorariosPage({
  params,
  searchParams,
}: EmpresaPageProps & {
  searchParams: Promise<{
    nuevo?: string;
    fecha?: string;
    servicio?: string;
  }>;
}) {
  const [{ slug }, { nuevo, fecha, servicio }] = await Promise.all([
    params,
    searchParams,
  ]);
  const { negocio } = await requerirEmpresa(slug);

  const ahora = new Date();
  const hoyClave = hoyClaveCR(ahora.getTime());
  const inicioHoyIso = new Date(`${hoyClave}T00:00:00-06:00`).toISOString();

  let servicios: Pick<
    Servicio,
    "id" | "nombre" | "duracion_min" | "precio_usd"
  >[] = [];
  let horarios: Horario[] = [];
  let reservas: Pick<
    Reserva,
    "servicio_id" | "fecha_hora" | "cupos" | "estado" | "trx_id"
  >[] = [];

  if (negocio) {
    [servicios, horarios, reservas] = await Promise.all([
      leer("servicios", { eq: { negocio_id: negocio.id }, orden: ["nombre", true] }),
      leer("horarios", {
        eq: { negocio_id: negocio.id }, gte: { fecha_hora: inicioHoyIso },
        orden: ["fecha_hora", true],
      }),
      // Solo las columnas que usa el cálculo de cupos ocupados.
      leer("reservas", {
        eq: { negocio_id: negocio.id },
        gte: { fecha_hora: inicioHoyIso },
        neq: { estado: "cancelada" },
        columnas: ["servicio_id", "fecha_hora", "cupos", "estado", "trx_id"],
      }),
    ]);
  }

  const { fechaSugerida, horaSugerida } = sugerirProximoHorario(
    ahora,
    hoyClave,
    fecha,
  );

  const servicioSugerido =
    servicio && servicios.some((s) => s.id === servicio)
      ? servicio
      : servicios[0]?.id;

  return (
    <HorariosEmpresaClient
      slug={negocio.slug}
      hoyClave={hoyClave}
      sugerenciaInicial={{
        abrir: nuevo === "1",
        fecha: fechaSugerida,
        hora: horaSugerida,
        servicioId: servicioSugerido,
      }}
      servicios={servicios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        duracionMin: s.duracion_min,
        precioUsd: s.precio_usd,
      }))}
      horarios={construirHorarios(horarios, reservas, []).map((h) => ({
        id: h.id,
        servicioId: h.servicioId,
        label: h.label,
        fechaHora: h.fechaHora,
        cuposTotales: h.cuposTotales,
        cuposDisponibles: h.cuposDisponibles,
        yaPaso: new Date(h.fechaHora).getTime() <= ahora.getTime(),
      }))}
    />
  );
}
