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

/** Luz, órbitas y curvas originales: variantes claras y oscuras ligadas al scroll nativo. */
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
  const giro = useTransform(scrollYProgress, [0, 1], [-24, 24]);
  const curvaY = useTransform(scrollYProgress, [0, 1], [65, -65]);

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
          "absolute -right-[22%] top-[-10%] h-[120%] min-h-[500px] w-[1000px] max-w-none",
          claro ? "opacity-20 sm:opacity-30" : "opacity-35 sm:opacity-50",
        )}
        style={{ rotate: activo ? giro : 0, y: activo ? curvaY : 0 }}
      >
        <defs>
          <linearGradient
            id={id}
            x1="50"
            y1="300"
            x2="900"
            y2="650"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#0284c7" stopOpacity="0" />
            <stop
              offset="0.45"
              stopColor={claro ? "#0284c7" : "#38bdf8"}
              stopOpacity="0.7"
            />
            <stop offset="1" stopColor="#10b981" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        {[0, 34, 68, 102, 136].map((desplazamiento) => (
          <path
            key={desplazamiento}
            d={`M-80 ${470 + desplazamiento} C190 ${110 + desplazamiento}, 480 ${850 + desplazamiento}, 1080 ${260 + desplazamiento}`}
            stroke={`url(#${id})`}
            strokeWidth="1.2"
          />
        ))}
        <circle
          cx="630"
          cy="430"
          r="290"
          stroke={`url(#${id})`}
          strokeWidth="0.8"
        />
        <circle
          cx="630"
          cy="430"
          r="350"
          stroke={`url(#${id})`}
          strokeWidth="0.6"
        />
        <circle cx="900" cy="325" r="5" fill="#10b981" />
      </motion.svg>
    </div>
  );
}
