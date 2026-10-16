"use client";

import { motion } from "framer-motion";

interface AdminPageProps {
  titulo: string;
  descripcion?: React.ReactNode;
  /** Botón/acción principal alineada a la derecha del encabezado. */
  accion?: React.ReactNode;
  children: React.ReactNode;
}

/** Contenedor y encabezado estándar de todas las páginas del panel admin. */
export default function AdminPage({
  titulo,
  descripcion,
  accion,
  children,
}: AdminPageProps) {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 sm:px-10 2xl:max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
          )}
        </div>
        {accion}
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
    <ItemLista className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-gray-400">
        {icono}
        {titulo}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${acento ? "text-emerald-600" : "text-slate-900"}`}
      >
        {valor}
      </p>
      {nota && <p className="mt-1 text-xs text-slate-400">{nota}</p>}
    </ItemLista>
  );
}
