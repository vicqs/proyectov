import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import {
  construirSemanaCalendario,
  obtenerEtiquetaPeriodoSemana,
} from "@/lib/horarios";
import { COLOR_PRIMARIO_DEFECTO, esHex, textoSobre } from "@/lib/color";
import { leer } from "@/lib/data/server";
import { COLUMNAS_RESERVA_PANEL, type ReservaPanel } from "@/lib/data/columnas";
import type {
  BloqueoExcepcion,
  Horario,
  Servicio,
} from "@/types/database";
import CalendarioView from "@/components/empresa/CalendarioView";

const MIN_OFFSET = -52;
const MAX_OFFSET = 52;

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
  const { negocio } = await requerirEmpresa(slug);
  const offset = Math.max(
    MIN_OFFSET,
    Math.min(MAX_OFFSET, Number.parseInt(semana ?? "0", 10) || 0),
  );

  const ahoraMs = Date.now();
  const hoy = new Date(ahoraMs);
  hoy.setHours(0, 0, 0, 0);

  const inicio = new Date(hoy);
  inicio.setDate(inicio.getDate() - inicio.getDay() + offset * 7);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 7);

  let servicios: Servicio[] = [];
  let horarios: Horario[] = [];
  let reservas: ReservaPanel[] = [];
  let bloqueos: BloqueoExcepcion[] = [];

  if (negocio) {
    const desde = inicio.toISOString();
    const hasta = fin.toISOString();
    [servicios, horarios, reservas, bloqueos] = await Promise.all([
      leer("servicios", { eq: { negocio_id: negocio.id }, orden: ["nombre", true] }),
      leer("horarios", { eq: { negocio_id: negocio.id }, gte: { fecha_hora: desde }, lt: { fecha_hora: hasta } }),
      leer("reservas", {
        eq: { negocio_id: negocio.id },
        gte: { fecha_hora: desde },
        lt: { fecha_hora: hasta },
        columnas: COLUMNAS_RESERVA_PANEL,
      }),
      leer("bloqueos_excepcion", { eq: { negocio_id: negocio.id }, gte: { fecha_fin: desde }, lt: { fecha_inicio: hasta } }),
    ]);
  }

  const { dias, rangoSemana } = construirSemanaCalendario({
    inicio,
    fin,
    hoy,
    ahoraMs,
    servicios,
    horarios,
    reservas,
    bloqueos,
  });

  const rutaCalendario = rutaPanelEmpresa(negocio.slug, "calendario");
  const enlace = (n: number) =>
    n === 0 ? rutaCalendario : `${rutaCalendario}?semana=${n}`;

  const colorMarca = esHex(negocio.color_tema)
    ? negocio.color_tema
    : COLOR_PRIMARIO_DEFECTO;

  return (
    <CalendarioView
      rangoSemana={rangoSemana}
      etiquetaPeriodo={obtenerEtiquetaPeriodoSemana(offset)}
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
