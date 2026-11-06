"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { cn } from "../../lib/cn";
import { TRAZOS_VUKI } from "../../lib/marca";

interface PreferenciasMovimiento {
  activo: boolean;
}

const ContextoMovimiento = createContext<PreferenciasMovimiento>({
  activo: false,
});

/** Mejora progresiva: el HTML inicial y la versión sin JavaScript son estáticos. */
export function MovimientoMarca({ children }: { children: ReactNode }) {
  const reducido = useReducedMotion();
  const [listo, setListo] = useState(false);

  useEffect(() => {
    setListo(true);
  }, []);

  return (
    <ContextoMovimiento.Provider
      value={{
        // La primera renderización debe coincidir con el HTML estático del servidor.
        activo: listo && !reducido,
      }}
    >
      {children}
    </ContextoMovimiento.Provider>
  );
}

export function useMovimientoMarca() {
  return useContext(ContextoMovimiento);
}

/** El contenido nunca empieza oculto: también se puede leer sin hidratación. */
export function Aparecer({
  children,
  className,
  retraso = 0,
}: {
  children: ReactNode;
  className?: string;
  retraso?: number;
}) {
  const { activo } = useMovimientoMarca();

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={
        activo ? { y: [22, 0], opacity: [0.35, 1] } : { y: 0, opacity: 1 }
      }
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: activo ? 0.7 : 0,
        delay: activo ? retraso : 0,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

export function ProgresoPagina() {
  const { activo } = useMovimientoMarca();
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      aria-hidden="true"
      data-progreso-lectura
      className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-sky-400 to-emerald-400"
      style={{ scaleX: activo ? scrollYProgress : 0 }}
    />
  );
}

/**
 * Onda amplia y suave inspirada en el gesto de «vuki.»:
 * una caída limpia en V, una curva abierta en U y el arco fluido de la K hacia el punto final.
 */
function trazoOndaVuki(desplazamiento: number) {
  const d = desplazamiento;
  return [
    `M-80 ${520 + d}`,
    `C80 ${440 + d}, 170 ${650 + d}, 290 ${650 + d}`,
    `C400 ${650 + d}, 430 ${470 + d}, 545 ${565 + d}`,
    `C640 ${645 + d}, 710 ${370 + d}, 835 ${455 + d}`,
    `C920 ${515 + d}, 990 ${430 + d}, 1080 ${390 + d}`,
  ].join(" ");
}

/** Luz, órbitas y curvas originales: variantes claras y oscuras ligadas al scroll nativo y geometría vuki. */
export function FondoMarca({
  className,
  tono = "oscuro",
}: {
  className?: string;
  tono?: "claro" | "oscuro";
}) {
  const { activo } = useMovimientoMarca();
  const claro = tono === "claro";
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const luzY = useTransform(scrollYProgress, [0, 1], [-85, 85]);
  const luzX = useTransform(scrollYProgress, [0, 1], [70, -70]);
  const giro = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  const curvaY = useTransform(scrollYProgress, [0, 1], [48, -48]);
  const ondaPrincipal = trazoOndaVuki(32);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-atmosfera-marca
      data-tono={tono}
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <motion.div
        className={cn(
          "absolute -left-56 bottom-0 h-[620px] w-[620px] rounded-full blur-[100px]",
          claro ? "bg-sky-200/35" : "bg-sky-600/20",
        )}
        style={{ y: activo ? luzY : 0 }}
      />
      <motion.div
        className={cn(
          "absolute -right-60 -top-36 h-[720px] w-[720px] rounded-full blur-[100px]",
          claro ? "bg-emerald-100/60" : "bg-emerald-500/15",
        )}
        style={{ x: activo ? luzX : 0, y: activo ? curvaY : 0 }}
      />
      <div
        className={cn("vuki-grid absolute inset-0", claro && "opacity-60")}
      />
      <motion.svg
        viewBox="0 0 1000 1000"
        fill="none"
        className={cn(
          "absolute -right-28 top-[-10%] h-[120%] min-h-[500px] w-[1000px] max-w-none sm:-right-20",
          claro ? "opacity-15 sm:opacity-25" : "opacity-25 sm:opacity-35",
        )}
        style={{ rotate: activo ? giro : 0, y: activo ? curvaY : 0 }}
      >
        <defs>
          <linearGradient
            id={id}
            x1="80"
            y1="260"
            x2="920"
            y2="700"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0284c7" stopOpacity="0" />
            <stop
              offset="0.45"
              stopColor={claro ? "#0284c7" : "#38bdf8"}
              stopOpacity="0.52"
            />
            <stop offset="0.88" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="1" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dos órbitas circulares finas centradas en el arco del monograma VK */}
        <circle
          cx="655"
          cy="445"
          r="275"
          stroke={`url(#${id})`}
          strokeWidth="0.7"
        />
        <circle
          cx="655"
          cy="445"
          r="340"
          stroke={`url(#${id})`}
          strokeWidth="0.55"
        />

        {/* Silueta limpia de una sola línea del monograma VK */}
        <g transform="translate(365 130) scale(0.82)" opacity="0.65">
          <path
            d={TRAZOS_VUKI.izquierdo}
            stroke={`url(#${id})`}
            strokeWidth="1.05"
          />
          <path
            d={TRAZOS_VUKI.derecho}
            stroke={`url(#${id})`}
            strokeWidth="1.05"
          />
          <path
            d={TRAZOS_VUKI.arco}
            stroke={`url(#${id})`}
            strokeWidth="1.1"
          />
        </g>

        {/* Tres ondas suaves y espaciadas con el gesto fluido de vuki. */}
        <motion.g
          initial={false}
          animate={activo ? { y: [0, -5, 0] } : { y: 0 }}
          transition={
            activo
              ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          {[0, 32, 64].map((desplazamiento) => (
            <path
              key={desplazamiento}
              d={trazoOndaVuki(desplazamiento)}
              stroke={`url(#${id})`}
              strokeWidth="0.95"
            />
          ))}
          <motion.path
            d={ondaPrincipal}
            stroke={claro ? "#059669" : "#34d399"}
            strokeOpacity={claro ? "0.4" : "0.5"}
            strokeWidth="1.3"
            strokeDasharray="4 32"
            animate={{ strokeDashoffset: activo ? [0, -180] : 0 }}
            transition={
              activo
                ? { duration: 16, repeat: Infinity, ease: "linear" }
                : { duration: 0 }
            }
          />
        </motion.g>

        {/* Puntos esmeralda sutiles (la «i» y el punto final «.») */}
        <circle
          cx="835"
          cy="415"
          r="3.5"
          fill="#10b981"
          fillOpacity="0.75"
        />
        <circle
          cx="935"
          cy="495"
          r="3.5"
          fill="#10b981"
          fillOpacity="0.75"
        />
      </motion.svg>
    </div>
  );
}
