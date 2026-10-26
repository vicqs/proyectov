import Link from "next/link";
import { BarChart3 } from "lucide-react";
import EncabezadoPanel from "../EncabezadoPanel";
import { FiltrosAuto } from "./FiltrosAuto";

export const CLASE_INPUT =
  "min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-vuki-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vuki-ocean/20 disabled:cursor-not-allowed disabled:bg-slate-100";

export const CLASE_BOTON =
  "vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-vuki-ink px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800";

export const CLASE_BOTON_NEUTRO =
  "vuki-focus inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-sky-50";

export function PaginaAdmin({
  titulo,
  descripcion,
  accion,
  children,
}: {
  titulo: string;
  descripcion?: React.ReactNode;
  accion?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto min-w-0 max-w-7xl px-4 py-6 sm:px-8 sm:py-8">
      <EncabezadoPanel
        contexto="administracion"
        titulo={titulo}
        descripcion={descripcion}
        accion={accion}
      />
      <div className="mt-6 space-y-6">{children}</div>
    </main>
  );
}

export function Tarjeta({
  titulo,
  descripcion,
  children,
  className = "",
}: {
  titulo?: string;
  descripcion?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6 ${className}`}
    >
      {titulo && (
        <h2 className="flex items-center gap-2.5 font-display text-base font-semibold tracking-tight text-vuki-ink">
          <span
            aria-hidden="true"
            className="h-4 w-1 shrink-0 rounded-full bg-vuki-ocean"
          />
          {titulo}
        </h2>
      )}
      {descripcion && (
        <p className="mt-0.5 text-sm text-slate-600">{descripcion}</p>
      )}
      <div className={titulo ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Estadistica({
  titulo,
  valor,
  nota,
  tono = "normal",
  icono,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tono?: "normal" | "bueno" | "malo";
  icono?: React.ReactNode;
}) {
  const color =
    tono === "bueno"
      ? "text-emerald-700"
      : tono === "malo"
        ? "text-red-700"
        : "text-vuki-ink";
  const decoracion =
    tono === "bueno"
      ? "bg-emerald-50 text-emerald-700"
      : tono === "malo"
        ? "bg-red-50 text-red-700"
        : "bg-sky-50 text-sky-700";
  return (
    <div className="relative min-w-0 overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${tono === "bueno" ? "bg-vuki-emerald/70" : tono === "malo" ? "bg-red-400/70" : "bg-vuki-ocean/60"}`}
      />
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${decoracion}`}
        >
          {icono ?? <BarChart3 className="h-4 w-4" />}
        </span>
        <p className="text-xs font-semibold leading-relaxed text-slate-600">
          {titulo}
        </p>
      </div>
      <p
        className={`mt-4 break-words font-display text-2xl font-bold tracking-tight ${color}`}
      >
        {valor}
      </p>
      {nota && (
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{nota}</p>
      )}
    </div>
  );
}

const TONOS = {
  gris: "bg-slate-100 text-slate-700",
  verde: "bg-emerald-100 text-emerald-700",
  ambar: "bg-amber-100 text-amber-800",
  rojo: "bg-red-100 text-red-700",
  azul: "bg-sky-100 text-sky-700",
} as const;

export type TonoInsignia = keyof typeof TONOS;

export function Insignia({
  children,
  tono = "gris",
}: {
  children: React.ReactNode;
  tono?: TonoInsignia;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TONOS[tono]}`}
    >
      {children}
    </span>
  );
}

export function Tabla({
  columnas,
  children,
  vacio = "Sin resultados.",
  vacia = false,
}: {
  columnas: string[];
  children: React.ReactNode;
  vacio?: string;
  vacia?: boolean;
}) {
  return (
    <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl border border-sky-100 bg-white shadow-sm">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-sky-100 bg-sky-50/70 text-xs uppercase tracking-wider text-slate-600">
          <tr>
            {columnas.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 [&>tr]:transition-colors [&>tr:hover]:bg-sky-50/50">
          {children}
        </tbody>
      </table>
      {vacia && (
        <p className="px-4 py-8 text-center text-sm text-slate-500">{vacio}</p>
      )}
    </div>
  );
}

export function Celda({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

export function Campo({
  etiqueta,
  children,
  ayuda,
}: {
  etiqueta: string;
  children: React.ReactNode;
  ayuda?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{etiqueta}</span>
      {children}
      {ayuda && (
        <span className="mt-1 block text-xs text-slate-500">{ayuda}</span>
      )}
    </label>
  );
}

export function Paginacion({
  pagina,
  paginas,
  total,
  base,
  params = {},
}: {
  pagina: number;
  paginas: number;
  total: number;
  base: string;
  params?: Record<string, string | undefined>;
}) {
  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    q.set("pagina", String(p));
    return `${base}?${q.toString()}`;
  };
  return (
    <div className="flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <span>{total} resultado(s)</span>
      {paginas > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          {pagina > 1 && (
            <Link className={CLASE_BOTON_NEUTRO} href={href(pagina - 1)}>
              Anterior
            </Link>
          )}
          <span>
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas && (
            <Link className={CLASE_BOTON_NEUTRO} href={href(pagina + 1)}>
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

/** Formulario GET de búsqueda/filtros reutilizable. */
export function FiltrosGet({ children }: { children: React.ReactNode }) {
  return <FiltrosAuto>{children}</FiltrosAuto>;
}
