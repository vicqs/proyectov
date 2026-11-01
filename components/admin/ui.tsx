import Link from "next/link";
import { ArrowUpRight, BarChart3, Search } from "lucide-react";
import EncabezadoPanel from "../EncabezadoPanel";
import { IsotipoVuki } from "../VLogo";
import { FiltrosAuto } from "./FiltrosAuto";

export { PestanasFiltro } from "./PestanasFiltro";
export { TextareaConContador } from "../TextareaConContador";

export const CLASE_INPUT = "vuki-input";
export const CLASE_TEXTAREA = "vuki-textarea";
export const CLASE_SELECT = "vuki-select w-full";
export const CLASE_CHECKBOX = "vuki-checkbox";
export const CLASE_BOTON = "vuki-btn-primary";
export const CLASE_BOTON_NEUTRO = "vuki-btn-secondary";

export function CampoBusqueda({
  name = "q",
  defaultValue,
  placeholder = "Buscar...",
  className = "sm:w-64",
  ariaLabel = "Buscar",
}: {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="vuki-input-search"
      />
    </div>
  );
}

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
      <div className="mt-8 space-y-6">{children}</div>
    </main>
  );
}

export function Tarjeta({
  titulo,
  descripcion,
  children,
  className = "",
  id,
  accion,
}: {
  titulo?: string;
  descripcion?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
  accion?: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={`min-w-0 rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6 ${className}`}
    >
      {(titulo || accion) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
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
          </div>
          {accion && (
            <div className="flex shrink-0 items-center gap-2">{accion}</div>
          )}
        </div>
      )}
      <div className={titulo || accion ? "mt-4" : ""}>{children}</div>
    </section>
  );
}

export function Estadistica({
  titulo,
  valor,
  nota,
  tono = "normal",
  icono,
  href,
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tono?: "normal" | "bueno" | "malo";
  icono?: React.ReactNode;
  href?: string;
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

  const contenido = (
    <>
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
        <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed text-slate-600">
          {titulo}
        </p>
        {href && (
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700"
          />
        )}
      </div>
      <p
        className={`mt-4 break-words font-display text-2xl font-bold tracking-tight ${color}`}
      >
        {valor}
      </p>
      {nota && (
        <p className="mt-1 text-xs leading-relaxed text-slate-600">{nota}</p>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="vuki-focus group relative block h-full min-w-0 overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:shadow-md"
      >
        {contenido}
      </Link>
    );
  }

  return (
    <div className="relative min-w-0 overflow-hidden rounded-3xl border border-sky-100 bg-white p-5 shadow-sm shadow-slate-900/[0.03]">
      {contenido}
    </div>
  );
}

const TONOS = {
  gris: "bg-slate-100 text-slate-700",
  verde: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/60",
  ambar: "bg-amber-50 text-amber-800 ring-1 ring-amber-200/60",
  rojo: "bg-red-50 text-red-700 ring-1 ring-red-200/60",
  azul: "bg-sky-50 text-sky-800 ring-1 ring-sky-200/60",
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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]}`}
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
    <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl border border-sky-100 bg-white shadow-sm shadow-slate-900/[0.02]">
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
        <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-600">
            <IsotipoVuki className="h-6 w-6 opacity-60" />
          </div>
          <p className="text-sm font-medium text-slate-700">{vacio}</p>
          <p className="mt-1 text-xs text-slate-400">
            No hay registros disponibles para mostrar.
          </p>
        </div>
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
