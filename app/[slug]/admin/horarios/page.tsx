import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { construirHorarios } from "@/lib/horarios";
import type { Horario, Reserva, Servicio } from "@/types/database";
import HorariosEmpresaClient from "./HorariosEmpresaClient";

function claveLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

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

  const ahora = new Date();
  const hoyClave = claveLocal(ahora);

  const proximo = new Date(ahora);
  proximo.setMinutes(0, 0, 0);
  proximo.setHours(proximo.getHours() + 1);
  if (proximo.getHours() >= 18 || proximo.getHours() < 6) {
    if (proximo.getHours() >= 18) proximo.setDate(proximo.getDate() + 1);
    proximo.setHours(9, 0, 0, 0);
  }

  let fechaSugerida = claveLocal(proximo);
  let horaSugerida = `${String(proximo.getHours()).padStart(2, "0")}:00`;

  if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && fecha >= hoyClave) {
    if (fecha === hoyClave) {
      const sigHora = ahora.getHours() + 1;
      if (sigHora <= 9) {
        fechaSugerida = fecha;
        horaSugerida = "09:00";
      } else if (sigHora <= 22) {
        fechaSugerida = fecha;
        horaSugerida = `${String(sigHora).padStart(2, "0")}:00`;
      } else {
        const manana = new Date(ahora);
        manana.setDate(manana.getDate() + 1);
        fechaSugerida = claveLocal(manana);
        horaSugerida = "09:00";
      }
    } else {
      fechaSugerida = fecha;
      horaSugerida = "09:00";
    }
  }

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
