import type { ReactNode } from "react";
import { IsotipoVuki } from "./VLogo";

/** Cabecera de contenido: colores del negocio o identidad de administración. */
export default function EncabezadoPanel({
  titulo,
  descripcion,
  accion,
  contexto,
}: {
  titulo: string;
  descripcion?: ReactNode;
  accion?: ReactNode;
  contexto: "empresa" | "administracion";
}) {
  const esEmpresa = contexto === "empresa";

  return (
    <header
      className={`relative isolate overflow-hidden rounded-3xl border bg-linear-to-br via-white p-6 shadow-sm shadow-sky-950/[0.03] sm:p-8 ${
        esEmpresa
          ? "border-(--marca-borde) from-(--marca-fondo) to-(--marca-2-fondo)"
          : "border-sky-100 from-sky-50 to-emerald-50/70"
      }`}
    >
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r ${
          esEmpresa
            ? "from-(--marca) to-(--marca-2)"
            : "from-vuki-ocean to-vuki-emerald"
        }`}
      />
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full border ${
          esEmpresa ? "border-(--marca-2-borde)" : "border-emerald-200/40"
        }`}
      />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className={`mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] ${
              esEmpresa ? "text-(--marca-texto)" : "text-sky-800"
            }`}
          >
            <IsotipoVuki className="h-5 w-5 shrink-0" aria-hidden="true" />
            {esEmpresa ? "Tu espacio en vuki" : "Centro de control · vuki"}
          </p>
          <h1 className="break-words font-display text-2xl font-bold leading-tight tracking-tight text-vuki-ink sm:text-3xl">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
              {descripcion}
            </p>
          )}
        </div>
        {accion && (
          <div className="flex shrink-0 flex-wrap gap-2">{accion}</div>
        )}
      </div>
    </header>
  );
}
