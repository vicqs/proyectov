import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import { construirHorarios, estaBloqueado } from "@/lib/horarios";
import { COLOR_PRIMARIO_DEFECTO, esHex, textoSobre } from "@/lib/color";
import type {
  BloqueoExcepcion,
  Horario,
  Reserva,
  Servicio,
} from "@/types/database";
import CalendarioView, {
  type CalendarioDiaItem,
} from "@/components/empresa/CalendarioView";

const MIN_OFFSET = -52;
const MAX_OFFSET = 52;

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DIAS_MIN = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DIAS_LARGOS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];
const MESES_CORTOS = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];
const MESES_LARGOS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function formatoHora(iso: string): string {
  const f = new Date(iso);
  const h = f.getHours();
  const m = String(f.getMinutes()).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "a.m." : "p.m."}`;
}

function claveFechaLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatoFechaCorta(d: Date, incluirAnio = false): string {
  const base = `${DIAS_MIN[d.getDay()]} ${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  return incluirAnio ? `${base} ${d.getFullYear()}` : base;
}

function obtenerEtiquetaPeriodo(offset: number): string {
  if (offset === 0) return "Esta semana";
  if (offset === 1) return "Próxima semana";
  if (offset === -1) return "Semana pasada";
  return offset > 1
    ? `En ${offset} semanas`
    : `Hace ${Math.abs(offset)} semanas`;
}

function formatoHorarioBloqueo(
  b: BloqueoExcepcion,
  iniDia: number,
  finDia: number,
): string {
  const iniB = new Date(b.fecha_inicio).getTime();
  const finB = new Date(b.fecha_fin).getTime();
  if (iniB <= iniDia && finB >= finDia - 60_000) {
    return "Todo el día";
  }
  if (iniB > iniDia && finB < finDia - 60_000) {
    return `${formatoHora(b.fecha_inicio)} – ${formatoHora(b.fecha_fin)}`;
  }
  if (iniB > iniDia) {
    return `Desde ${formatoHora(b.fecha_inicio)}`;
  }
  return `Hasta ${formatoHora(b.fecha_fin)}`;
}

/**
 * Vista semanal de solo lectura que junta horarios (con ocupación),
 * reservas y bloqueos de agenda. Navegación por `?semana=N` (0 = actual).
 */
export default async function CalendarioPage({
  params,
  searchParams,
}: EmpresaPageProps & {
  searchParams: Promise<{ semana?: string }>;
}) {
  const [{ slug }, { semana }] = await Promise.all([params, searchParams]);
  const { supabase, negocio } = await requerirEmpresa(slug);
  const offset = Math.max(
    MIN_OFFSET,
    Math.min(MAX_OFFSET, Number.parseInt(semana ?? "0", 10) || 0),
  );

  const ahoraMs = Date.now();
  const hoy = new Date(ahoraMs);
  hoy.setHours(0, 0, 0, 0);
  const hoyMs = hoy.getTime();

  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  const mananaMs = manana.getTime();

  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - inicio.getDay() + offset * 7);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 7);

  let servicios: Servicio[] = [];
  let horarios: Horario[] = [];
  let reservas: Reserva[] = [];
  let bloqueos: BloqueoExcepcion[] = [];

  if (negocio) {
    const desde = inicio.toISOString();
    const hasta = fin.toISOString();
    const [s, h, r, b] = await Promise.all([
      supabase
        .from("servicios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .order("nombre", { ascending: true }),
      supabase
        .from("horarios")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", desde)
        .lt("fecha_hora", hasta),
      supabase
        .from("reservas")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_hora", desde)
        .lt("fecha_hora", hasta),
      supabase
        .from("bloqueos_excepcion")
        .select("*")
        .eq("negocio_id", negocio.id)
        .gte("fecha_fin", desde)
        .lt("fecha_inicio", hasta),
    ]);
    servicios = (s.data ?? []) as Servicio[];
    horarios = (h.data ?? []) as Horario[];
    reservas = (r.data ?? []) as Reserva[];
    bloqueos = (b.data ?? []) as BloqueoExcepcion[];
  }

  const servicioPorId = new Map(servicios.map((s) => [s.id, s]));
  const nombreServicio = (id: string) =>
    servicioPorId.get(id)?.nombre ?? "Servicio";

  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();

  const slotsSemana = construirHorarios(
    horarios.filter((h) => {
      const t = new Date(h.fecha_hora).getTime();
      return t >= inicioMs && t < finMs;
    }),
    reservas,
    [],
  );

  const reservasActivas = reservas
    .filter((r) => {
      const t = new Date(r.fecha_hora).getTime();
      return r.estado !== "cancelada" && t >= inicioMs && t < finMs;
    })
    .sort(
      (a, b) =>
        new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    );

  const fechasFechas = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    const sig = new Date(d);
    sig.setDate(d.getDate() + 1);
    return { fecha: d, ini: d.getTime(), finDia: sig.getTime() };
  });

  const reservasAsignadas = new Set<string>();

  const dias: CalendarioDiaItem[] = fechasFechas.map(
    ({ fecha, ini, finDia }) => {
      const slotsDia = slotsSemana
        .filter((s) => {
          const t = new Date(s.fechaHora).getTime();
          return t >= ini && t < finDia;
        })
        .map((s) => {
          const slotMs = new Date(s.fechaHora).getTime();
          const srv = servicioPorId.get(s.servicioId);
          const reservasSlot = reservasActivas
            .filter(
              (r) =>
                r.servicio_id === s.servicioId &&
                new Date(r.fecha_hora).getTime() === slotMs,
            )
            .map((r) => {
              reservasAsignadas.add(r.id);
              const nombre = r.nombre_cliente?.trim();
              return {
                id: r.id,
                cliente: nombre || r.email_cliente,
                email: nombre ? r.email_cliente : undefined,
                cupos: r.cupos ?? 1,
                estado: (r.estado === "pagada" ? "pagada" : "pendiente") as
                  | "pendiente"
                  | "pagada",
              };
            });

          return {
            id: s.id,
            servicioId: s.servicioId,
            servicioNombre: srv?.nombre ?? "Servicio",
            duracionMin: srv?.duracion_min,
            hora: formatoHora(s.fechaHora),
            cuposTotales: s.cuposTotales,
            cuposDisponibles: s.cuposDisponibles,
            bloqueado: estaBloqueado(s.fechaHora, bloqueos),
            yaPaso: slotMs < ahoraMs,
            reservas: reservasSlot,
          };
        });

      const reservasSueltas = reservasActivas
        .filter((r) => {
          const t = new Date(r.fecha_hora).getTime();
          return t >= ini && t < finDia && !reservasAsignadas.has(r.id);
        })
        .map((r) => {
          const nombre = r.nombre_cliente?.trim();
          return {
            id: r.id,
            servicioId: r.servicio_id,
            servicioNombre: nombreServicio(r.servicio_id),
            hora: formatoHora(r.fecha_hora),
            cliente: nombre || r.email_cliente,
            email: nombre ? r.email_cliente : undefined,
            cupos: r.cupos ?? 1,
            estado: (r.estado === "pagada" ? "pagada" : "pendiente") as
              | "pendiente"
              | "pagada",
          };
        });

      const bloqueosDia = bloqueos
        .filter((b) => {
          const iniB = new Date(b.fecha_inicio).getTime();
          const finB = new Date(b.fecha_fin).getTime();
          return iniB < finDia && (finB > ini || iniB === ini);
        })
        .map((b) => ({
          id: b.id,
          motivo: b.motivo,
          horarioTexto: formatoHorarioBloqueo(b, ini, finDia),
        }));

      return {
        clave: claveFechaLocal(fecha),
        iso: fecha.toISOString(),
        diaNumero: fecha.getDate(),
        diaSemanaCorto: DIAS_CORTOS[fecha.getDay()],
        diaSemanaLargo: DIAS_LARGOS[fecha.getDay()],
        mesCorto: MESES_CORTOS[fecha.getMonth()],
        mesLargo: MESES_LARGOS[fecha.getMonth()],
        esHoy: ini === hoyMs,
        esManana: ini === mananaMs,
        esPasado: finDia <= hoyMs,
        slots: slotsDia,
        reservasSueltas,
        bloqueos: bloqueosDia,
      };
    },
  );

  const primerDia = fechasFechas[0].fecha;
  const ultimoDia = fechasFechas[6].fecha;
  const distintoAnio =
    primerDia.getFullYear() !== ultimoDia.getFullYear() ||
    primerDia.getFullYear() !== hoy.getFullYear();
  const rangoSemana = `${formatoFechaCorta(primerDia, distintoAnio)} – ${formatoFechaCorta(ultimoDia, distintoAnio)}`;

  const rutaCalendario = rutaPanelEmpresa(negocio.slug, "calendario");
  const enlace = (n: number) =>
    n === 0 ? rutaCalendario : `${rutaCalendario}?semana=${n}`;

  const colorMarca = esHex(negocio.color_tema)
    ? negocio.color_tema
    : COLOR_PRIMARIO_DEFECTO;

  return (
    <CalendarioView
      rangoSemana={rangoSemana}
      etiquetaPeriodo={obtenerEtiquetaPeriodo(offset)}
      offset={offset}
      enlaceAnterior={offset > MIN_OFFSET ? enlace(offset - 1) : undefined}
      enlaceHoy={enlace(0)}
      enlaceSiguiente={offset < MAX_OFFSET ? enlace(offset + 1) : undefined}
      hrefHorarios={rutaPanelEmpresa(negocio.slug, "horarios")}
      hrefAgenda={rutaPanelEmpresa(negocio.slug, "agenda")}
      hrefReservas={rutaPanelEmpresa(negocio.slug, "reservas")}
      hrefServicios={rutaPanelEmpresa(negocio.slug, "servicios")}
      textoMarca={textoSobre(colorMarca)}
      servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre }))}
      dias={dias}
    />
  );
}
