import Link from "next/link";
import { FiltrosAuto } from "./FiltrosAuto";

export const CLASE_INPUT =
  "min-h-10 w-full min-w-0 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-500 focus-visible:border-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/30 disabled:cursor-not-allowed disabled:bg-slate-100";

export const CLASE_BOTON =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

export const CLASE_BOTON_NEUTRO =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-1 text-sm text-slate-600">{descripcion}</p>
          )}
        </div>
        {accion}
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </div>
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
      className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}
    >
      {titulo && (
        <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
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
}: {
  titulo: string;
  valor: string;
  nota?: string;
  tono?: "normal" | "bueno" | "malo";
}) {
  const color =
    tono === "bueno"
      ? "text-emerald-600"
      : tono === "malo"
        ? "text-red-600"
        : "text-slate-900";
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        {titulo}
      </p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
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
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
          <tr>
            {columnas.map((c) => (
              <th key={c} className="whitespace-nowrap px-4 py-3 font-semibold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
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
