"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Clock, Package } from "lucide-react";
import {
  esImagenOptimizable,
  type ServicioPublico,
} from "../lib/tipos-publicos";
import { textoSobre } from "../lib/color";
import { formatearMoneda } from "../lib/formato";
import { useTranslations } from "../lib/i18n";
import {
  convertirMoneda,
  normalizarMoneda,
  type CodigoMoneda,
} from "../lib/monedas";

interface ServicioCardProps {
  servicio: ServicioPublico;
  /** Moneda elegida por el visitante (por defecto la moneda nativa del servicio). */
  monedaVista?: CodigoMoneda;
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
  monedaVista,
  colorTema,
  colorSecundario = colorTema,
  onSeleccionar,
  prioritaria = false,
}: ServicioCardProps) {
  const monedaBase = normalizarMoneda(servicio.moneda, "USD");
  const monedaActiva = normalizarMoneda(monedaVista, monedaBase);
  const precioMostrado = convertirMoneda(
    servicio.precioUsd,
    monedaBase,
    monedaActiva,
  );
  const { t } = useTranslations();
  const esItem = servicio.tipoUnidad === "item";
  const stock = servicio.stockDisponible ?? 0;
  const agotado = esItem && stock <= 0;
  return (
    <motion.button
      type="button"
      onClick={() => onSeleccionar(servicio)}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
      className="group relative block h-64 w-full overflow-hidden rounded-3xl text-left shadow-sm ring-1 ring-black/5 outline-none transition-shadow duration-300 after:pointer-events-none after:absolute after:inset-0 after:rounded-3xl after:ring-1 after:ring-inset after:ring-white/15 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transition-none sm:h-72"
      style={{ ["--tw-ring-color" as string]: colorTema }}
    >
      <Image
        src={servicio.imagenUrl}
        unoptimized={!esImagenOptimizable(servicio.imagenUrl)}
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
          {servicio.descripcion && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/90">
              {servicio.descripcion}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          {esItem ? (
            <span
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold backdrop-blur-sm ${
                agotado
                  ? "bg-red-500/85 text-white"
                  : "bg-white/20 text-white"
              }`}
            >
              <Package className="h-3.5 w-3.5" aria-hidden="true" />
              {agotado
                ? t("agotado")
                : `${stock} ${stock === 1 ? t("disponible") : t("disponibles")}`}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-white/90">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              {servicio.duracionMin} min
            </span>
          )}

          <span
            className="rounded-full px-4 py-2 text-sm font-semibold shadow-lg backdrop-blur-sm transition-transform duration-200 group-hover:scale-[1.03] motion-reduce:transform-none"
            style={{
              backgroundImage: `linear-gradient(135deg, ${colorTema}, ${colorSecundario})`,
              color: textoSobre(colorTema),
            }}
          >
            {formatearMoneda(precioMostrado, monedaActiva)}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
