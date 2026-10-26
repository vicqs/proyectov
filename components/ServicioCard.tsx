"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import type { ServicioPublico } from "../lib/tipos-publicos";
import { textoSobre } from "../lib/color";

interface ServicioCardProps {
  servicio: ServicioPublico;
  colorTema: string;
  /** Segundo color de marca; junto al principal forma el degradado del precio. */
  colorSecundario?: string;
  onSeleccionar: (servicio: ServicioPublico) => void;
  /** Carga la imagen de inmediato (tarjetas visibles sin hacer scroll). */
  prioritaria?: boolean;
}

/**
 * Tarjeta de servicio "premium": imagen de fondo a sangre, degradado
 * oscuro inferior para legibilidad del texto blanco (estilo Apple
 * Fitness / Airbnb) y micro-interacción de elevación en hover/tap.
 */
export default function ServicioCard({
  servicio,
  colorTema,
  colorSecundario = colorTema,
  onSeleccionar,
  prioritaria = false,
}: ServicioCardProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSeleccionar(servicio)}
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative block h-64 w-full overflow-hidden rounded-3xl text-left shadow-sm outline-none transition-shadow duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none sm:h-72"
      style={{ ["--tw-ring-color" as string]: colorTema }}
    >
      <Image
        src={servicio.imagenUrl}
        alt=""
        aria-hidden="true"
        fill
        loading={prioritaria ? "eager" : "lazy"}
        sizes="(max-width: 640px) 100vw, 480px"
        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none"
      />

      {/* Degradado oscuro para legibilidad del texto */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-6">
        <div>
          <h3 className="break-words text-xl font-semibold tracking-tight text-white">
            {servicio.nombre}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/90">
            {servicio.descripcion}
          </p>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white/90">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {servicio.duracionMin} min
          </span>

          <span
            className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm"
            style={{
              backgroundImage: `linear-gradient(135deg, ${colorTema}, ${colorSecundario})`,
              color: textoSobre(colorTema),
            }}
          >
            ${servicio.precioUsd.toFixed(2)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
