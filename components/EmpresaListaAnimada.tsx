"use client";

import { motion } from "framer-motion";

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

