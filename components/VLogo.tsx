"use client";

import { motion } from "framer-motion";

interface VLogoProps {
  className?: string;
}

/**
 * Logo tipográfico minimalista de "Proyecto V": una letra "V" destacada
 * dentro de un contenedor redondeado oscuro, en el estilo Apple/Airbnb
 * usado en el resto de la demo (bordes suaves, acento zinc-900). Reacciona
 * con una micro-animación al hacer hover/tap.
 */
export default function VLogo({ className = "h-8 w-8" }: VLogoProps) {
  return (
    <motion.span
      role="img"
      aria-label="Proyecto V"
      whileHover={{ scale: 1.08, rotate: -6 }}
      whileTap={{ scale: 0.92, rotate: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
      className={`flex items-center justify-center rounded-xl bg-zinc-900 font-serif text-base font-bold italic text-white ${className}`}
    >
      V
    </motion.span>
  );
}
