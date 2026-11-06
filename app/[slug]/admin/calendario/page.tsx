import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import {
  construirSemanaCalendario,
  obtenerEtiquetaPeriodoSemana,
} from "@/lib/horarios";
import { desplazarClave, hoyClaveCR, partesCR } from "@/lib/zona-horaria";
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
  const hoyClave = hoyClaveCR(ahoraMs);
  const hoy = new Date(`${hoyClave}T00:00:00-06:00`);
  const { diaSemana } = partesCR(hoy.toISOString());
  const inicioClave = desplazarClave(hoyClave, -diaSemana + offset * 7);
  const finClave = desplazarClave(inicioClave, 7);
  const inicio = new Date(`${inicioClave}T00:00:00-06:00`);
  const fin = new Date(`${finClave}T00:00:00-06:00`);

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

  // Las ventas de ítems no tienen salida programada: no se dibujan en el calendario.
  const idsItem = new Set(
    servicios.filter((s) => s.unit_type === "item").map((s) => s.id),
  );
  reservas = reservas.filter((r) => !idsItem.has(r.servicio_id));

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
      servicios={servicios
        .filter((s) => s.unit_type !== "item")
        .map((s) => ({ id: s.id, nombre: s.nombre }))}
      dias={dias}
    />
  );
}
