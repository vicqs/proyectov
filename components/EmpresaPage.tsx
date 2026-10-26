"use client";

import { motion } from "framer-motion";
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

/** Tarjeta KPI estándar (Inicio y Finanzas). */
export function KpiCard({
  icono,
  titulo,
  valor,
  nota,
  acento,
}: {
  icono: React.ReactNode;
  titulo: string;
  valor: string;
  nota?: string;
  acento?: boolean;
}) {
  return (
    <ItemLista
      className={`relative min-w-0 overflow-hidden rounded-3xl border bg-white p-5 shadow-sm shadow-slate-900/[0.03] ${acento ? "border-(--marca-2-borde)" : "border-(--marca-borde)"}`}
    >
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
        <p className="text-xs font-semibold leading-relaxed text-slate-600">
          {titulo}
        </p>
      </div>
      <p
        className={`mt-4 break-words font-display text-2xl font-bold tracking-tight ${acento ? "text-(--marca-2-texto)" : "text-vuki-ink"}`}
      >
        {valor}
      </p>
      {nota && <p className="mt-1 text-xs text-slate-600">{nota}</p>}
    </ItemLista>
  );
}
