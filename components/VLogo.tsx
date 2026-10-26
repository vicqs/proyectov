import type { SVGProps } from "react";
import { cn } from "../lib/cn";
import { ISOTIPO_VUKI, LOGOTIPO_VUKI, MARCA, TRAZOS_VUKI } from "../lib/marca";

/** Un único original vectorial para UI, iconos y Open Graph. */
export function IsotipoVuki({
  framed = false,
  tone = "dark",
  ...props
}: SVGProps<SVGSVGElement> & {
  framed?: boolean;
  tone?: "dark" | "light";
}) {
  return (
    <svg
      viewBox={framed ? ISOTIPO_VUKI.viewBox : ISOTIPO_VUKI.viewBoxLibre}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={MARCA.nombre}
      {...props}
    >
      {framed && (
        <rect
          width={ISOTIPO_VUKI.lado}
          height={ISOTIPO_VUKI.lado}
          rx={ISOTIPO_VUKI.radio}
          fill={MARCA.colores.oscuro}
        />
      )}
      <g transform={framed ? ISOTIPO_VUKI.transformacionMarco : undefined}>
        <path
          d={TRAZOS_VUKI.izquierdo}
          fill={
            framed || tone === "light"
              ? MARCA.colores.blanco
              : MARCA.colores.oscuro
          }
        />
        <path d={TRAZOS_VUKI.derecho} fill={MARCA.colores.azul} />
        <path d={TRAZOS_VUKI.arco} fill={MARCA.colores.esmeralda} />
      </g>
    </svg>
  );
}

/** Wordmark vectorial: conserva forma, espaciado y punto esmeralda sin fuentes. */
export function LogotipoVuki({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox={LOGOTIPO_VUKI.viewBox}
      width={`${LOGOTIPO_VUKI.ancho}em`}
      height={`${LOGOTIPO_VUKI.alto}em`}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={MARCA.nombre}
      className={cn("inline-block shrink-0 text-3xl", className)}
      {...props}
    >
      <g transform={`translate(0 ${LOGOTIPO_VUKI.lineaBase}) scale(1 -1)`}>
        {LOGOTIPO_VUKI.letras.map(({ x, d }) => (
          <path key={x} d={d} transform={`translate(${x} 0)`} />
        ))}
        <circle {...LOGOTIPO_VUKI.puntoLetraI} fill={MARCA.colores.esmeralda} />
        <circle {...LOGOTIPO_VUKI.puntoFinal} fill={MARCA.colores.esmeralda} />
      </g>
    </svg>
  );
}

interface VLogoProps {
  className?: string;
  showText?: boolean;
  tone?: "dark" | "light";
  framed?: boolean;
  wordmarkClassName?: string;
}

/**
 * El monograma VK de vuki. Isotipo y wordmark comparten geometría
 * con los iconos y la vista previa social; funciona en servidor y cliente.
 * className controla el tamaño del símbolo, no limita el ancho del texto.
 */
export default function VLogo({
  className,
  showText = false,
  tone = "dark",
  framed = !showText,
  wordmarkClassName,
}: VLogoProps) {
  return (
    <span
      role="img"
      aria-label={MARCA.nombre}
      className={cn(
        "inline-flex shrink-0 select-none items-end gap-2",
        tone === "light" ? "text-white" : "text-vuki-ink",
      )}
    >
      <IsotipoVuki
        framed={framed}
        tone={tone}
        preserveAspectRatio={showText ? "xMidYMax meet" : "xMidYMid meet"}
        aria-hidden="true"
        className={cn("shrink-0", className ?? "h-9 w-9")}
      />
      {showText && (
        <LogotipoVuki aria-hidden="true" className={wordmarkClassName} />
      )}
    </span>
  );
}
