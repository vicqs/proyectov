"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../lib/cn";

type Variante = "abrir" | "cerrar";

interface AnimatedIconButtonProps extends HTMLMotionProps<"button"> {
  /**
   * "abrir": gira 90° al presionar (tap) y se agranda levemente al pasar
   * el mouse — usado en botones de hamburguesa/menú.
   * "cerrar": gira 90° al pasar el mouse (hover) y se encoge al presionar
   * — usado en botones de "X" que cierran drawers/paneles/modales.
   */
  variante?: Variante;
}

const TRANSICION = { type: "spring" as const, stiffness: 300, damping: 20 };

/**
 * Botón de ícono con la micro-animación "identidad" de la app: un giro de
 * 90° que vuelve a su posición con física de resorte al interactuar.
 * Se usa de forma consistente en los botones de abrir/cerrar menús y
 * paneles (hamburguesa, drawers) para reforzar la identidad visual.
 */
const AnimatedIconButton = forwardRef<
  HTMLButtonElement,
  AnimatedIconButtonProps
>(function AnimatedIconButton(
  { variante = "abrir", className, children, ...props },
  ref,
) {
  const esAbrir = variante === "abrir";

  return (
    <motion.button
      ref={ref}
      type="button"
      whileHover={esAbrir ? { scale: 1.06 } : { rotate: 90 }}
      whileTap={esAbrir ? { scale: 0.9, rotate: 90 } : { scale: 0.85 }}
      transition={TRANSICION}
      className={cn(
        "rounded-lg p-2 text-slate-600 outline-none transition hover:bg-slate-100",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});

export default AnimatedIconButton;
