"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import EncabezadoPanel from "./EncabezadoPanel";

interface EmpresaPageProps {
  titulo: string;
  descripcion?: React.ReactNode;
  /** Botón/acción principal alineada a la derecha del encabezado. */
  accion?: React.ReactNode;
  children: React.ReactNode;
}

/** Contenedor y encabezado estándar de todas las páginas del panel de empresa. */
export default function EmpresaPage({
  titulo,
  descripcion,
  accion,
  children,
}: EmpresaPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-8 2xl:max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <EncabezadoPanel
          contexto="empresa"
          titulo={titulo}
          descripcion={descripcion}
          accion={accion}
        />
      </motion.div>
      <div className="mt-8">{children}</div>
    </main>
  );
}

export const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

export const itemLista = {
  oculto: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

/** Contenedor con entrada escalonada de sus `ItemLista` hijos. */
export function Lista({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "ul" | "section" | "tbody";
}) {
  const Comp = motion[as];
  return (
    <Comp
      variants={contenedorLista}
      initial="oculto"
      animate="visible"
      className={className}
    >
      {children}
    </Comp>
  );
}

/** Elemento de lista con animación de entrada (usar dentro de `Lista`). */
export function ItemLista({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "tr";
}) {
  const Comp = motion[as];
  return (
    <Comp variants={itemLista} className={className}>
      {children}
    </Comp>
  );
}

/** Tarjeta KPI estándar (Inicio y Finanzas). Si recibe `href`, es navegable. */
export function KpiCard({
  icono,
  titulo,
  valor,
  detalle,
  nota,
  ayuda,
  acento,
  href,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  /** Desglose secundario opcional debajo del valor principal. */
  detalle?: React.ReactNode;
  nota?: React.ReactNode;
  /** Elemento informativo discreto (ej. tooltip) alineado con el título. */
  ayuda?: React.ReactNode;
  acento?: boolean;
  href?: string;
}) {
  const interior = (
    <>
      <div
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${acento ? "bg-(--marca-2)" : "bg-(--marca)"}`}
      />
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${acento ? "bg-(--marca-2-fondo) text-(--marca-2-texto)" : "bg-(--marca-fondo) text-(--marca-texto)"}`}
        >
          {icono}
        </span>
        <p className="min-w-0 flex-1 text-xs font-semibold leading-relaxed text-slate-600">
          {titulo}
        </p>
        {ayuda}
        {href && (
          <ArrowUpRight
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-slate-700"
          />
        )}
      </div>
      <p
        className={`mt-4 break-words font-display text-2xl font-bold tracking-tight ${acento ? "text-(--marca-2-texto)" : "text-vuki-ink"}`}
      >
        {valor}
      </p>
      {detalle && (
        <div className="mt-1.5 space-y-1 text-xs text-slate-500">{detalle}</div>
      )}
      {nota && (
        <div className={`${detalle ? "mt-2" : "mt-1"} text-xs text-slate-600`}>
          {nota}
        </div>
      )}
    </>
  );

  const bordeClase = acento
    ? "border-(--marca-2-borde)"
    : "border-(--marca-borde)";

  if (href) {
    return (
      <ItemLista className="min-w-0">
        <Link
          href={href}
          className={`vuki-focus group relative block h-full min-w-0 overflow-hidden rounded-3xl border bg-white p-5 shadow-sm shadow-slate-900/[0.03] transition hover:border-slate-300 hover:shadow-md ${bordeClase}`}
        >
          {interior}
        </Link>
      </ItemLista>
    );
  }

  return (
    <ItemLista
      className={`relative min-w-0 overflow-hidden rounded-3xl border bg-white p-5 shadow-sm shadow-slate-900/[0.03] ${bordeClase}`}
    >
      {interior}
    </ItemLista>
  );
}
