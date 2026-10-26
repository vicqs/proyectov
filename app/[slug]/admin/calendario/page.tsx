import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { requerirEmpresa, type EmpresaPageProps } from "@/lib/empresa";
import { rutaPanelEmpresa } from "@/lib/rutas-empresa";
import { construirHorarios, estaBloqueado, etiquetaDia } from "@/lib/horarios";
import type {
  BloqueoExcepcion,
  Horario,
  Reserva,
  Servicio,
} from "@/types/database";
import EmpresaPage from "@/components/EmpresaPage";

const DIA_MS = 86_400_000;

function formatoHora(iso: string) {
  const f = new Date(iso);
  const h = f.getHours();
  const m = String(f.getMinutes()).padStart(2, "0");
  return `${h % 12 === 0 ? 12 : h % 12}:${m} ${h < 12 ? "a.m." : "p.m."}`;
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
    -52,
    Math.min(52, Number.parseInt(semana ?? "0", 10) || 0),
  );

  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - inicio.getDay() + offset * 7);
  const fin = new Date(inicio.getTime() + 7 * DIA_MS);

  let servicios: Servicio[] = [];
  let horarios: Horario[] = [];
  let reservas: Reserva[] = [];
  let bloqueos: BloqueoExcepcion[] = [];

  if (negocio) {
    const desde = inicio.toISOString();
    const hasta = fin.toISOString();
    const [s, h, r, b] = await Promise.all([
      supabase.from("servicios").select("*").eq("negocio_id", negocio.id),
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

  const nombreServicio = (id: string) =>
    servicios.find((x) => x.id === id)?.nombre ?? "Servicio";

  const slots = construirHorarios(
    horarios.filter((h) => {
      const t = new Date(h.fecha_hora).getTime();
      return t >= inicio.getTime() && t < fin.getTime();
    }),
    reservas,
    [],
  );

  const dias = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(inicio.getTime() + i * DIA_MS);
    const ini = d.getTime();
    return {
      fecha: d,
      iso: d.toISOString(),
      slots: slots.filter((s) => {
        const t = new Date(s.fechaHora).getTime();
        return t >= ini && t < ini + DIA_MS;
      }),
      bloqueos: bloqueos.filter(
        (b) =>
          new Date(b.fecha_inicio).getTime() < ini + DIA_MS &&
          new Date(b.fecha_fin).getTime() >= ini,
      ),
    };
  });

  const rango = `${etiquetaDia(dias[0].iso)} – ${etiquetaDia(dias[6].iso)}`;
  const rutaCalendario = rutaPanelEmpresa(negocio.slug, "calendario");
  const enlace = (n: number) =>
    n === 0 ? rutaCalendario : `${rutaCalendario}?semana=${n}`;
  const botonNav =
    "flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50";

  return (
    <EmpresaPage
      titulo="Calendario"
      descripcion={`Semana del ${rango}: horarios, ocupación y bloqueos.`}
      accion={
        <div className="flex items-center gap-2">
          <Link
            href={enlace(offset - 1)}
            aria-label="Semana anterior"
            className={botonNav}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link href={enlace(0)} className={botonNav}>
            Hoy
          </Link>
          <Link
            href={enlace(offset + 1)}
            aria-label="Semana siguiente"
            className={botonNav}
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      }
    >
      <ul className="space-y-4">
        {dias.map((dia) => (
          <li
            key={dia.iso}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <h2 className="mb-3 text-sm font-semibold capitalize text-slate-800">
              {etiquetaDia(dia.iso)}
            </h2>

            {dia.bloqueos.map((b) => (
              <p
                key={b.id}
                className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
              >
                Bloqueado: {b.motivo}
              </p>
            ))}

            {dia.slots.length === 0 && dia.bloqueos.length === 0 ? (
              <p className="text-xs text-slate-400">Sin horarios.</p>
            ) : (
              <ul className="space-y-2">
                {dia.slots.map((s) => {
                  const ocupados = s.cuposTotales - s.cuposDisponibles;
                  const bloqueado = estaBloqueado(s.fechaHora, bloqueos);
                  return (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span className="text-slate-700">
                        <span className="font-semibold">
                          {formatoHora(s.fechaHora)}
                        </span>{" "}
                        · {nombreServicio(s.servicioId)}
                      </span>
                      <span
                        className={`whitespace-nowrap text-xs font-semibold ${
                          bloqueado
                            ? "text-red-600"
                            : s.cuposDisponibles === 0
                              ? "text-red-600"
                              : s.cuposDisponibles <= 2
                                ? "text-amber-600"
                                : "text-emerald-600"
                        }`}
                      >
                        {bloqueado
                          ? "Bloqueado"
                          : `${ocupados}/${s.cuposTotales} cupos`}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </EmpresaPage>
  );
}
