"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CalendarDays, Check, Link2, Waves } from "lucide-react";
import { IsotipoVuki } from "../VLogo";
import { useMovimientoMarca } from "./MovimientoMarca";

/** Decoración independiente del formulario: ni sus datos ni su posición se animan. */
export default function EscenaAcceso() {
  const { activo } = useMovimientoMarca();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.2 });
  const [enFormulario, setEnFormulario] = useState(false);
  const punteroX = useMotionValue(0);
  const punteroY = useMotionValue(0);
  const x = useSpring(punteroX, { stiffness: 70, damping: 24 });
  const y = useSpring(punteroY, { stiffness: 70, damping: 24 });
  const rotateY = useTransform(x, [-1, 1], [-3, 3]);
  const rotateX = useTransform(y, [-1, 1], [3, -3]);
  const animar = activo && visible && !enFormulario;

  useEffect(() => {
    // React puede aplicar autoFocus antes de que se registren los listeners.
    setEnFormulario(Boolean(document.activeElement?.closest("form")));
    function actualizar(evento: FocusEvent) {
      const destino =
        evento.type === "focusout" ? evento.relatedTarget : evento.target;
      setEnFormulario(
        destino instanceof Element && Boolean(destino.closest("form")),
      );
    }
    document.addEventListener("focusin", actualizar);
    document.addEventListener("focusout", actualizar);
    return () => {
      document.removeEventListener("focusin", actualizar);
      document.removeEventListener("focusout", actualizar);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-acceso-animado={animar ? "activo" : "quieto"}
      className="relative mt-7 h-[210px] [perspective:900px] xl:h-[230px]"
      onPointerMove={(evento) => {
        if (!animar || evento.pointerType !== "mouse") return;
        const caja = evento.currentTarget.getBoundingClientRect();
        punteroX.set(((evento.clientX - caja.left) / caja.width - 0.5) * 2);
        punteroY.set(((evento.clientY - caja.top) / caja.height - 0.5) * 2);
      }}
      onPointerLeave={() => {
        punteroX.set(0);
        punteroY.set(0);
      }}
    >
      <motion.div
        aria-hidden="true"
        className="relative h-full [transform-style:preserve-3d]"
        style={{ rotateX: animar ? rotateX : 0, rotateY: animar ? rotateY : 0 }}
      >
        <svg
          viewBox="0 0 480 230"
          fill="none"
          className="absolute inset-0 h-full w-full"
        >
          <path
            d="M38 172C126 206 108 15 240 76S342 231 454 113"
            stroke="#38bdf8"
            strokeOpacity="0.25"
            strokeWidth="1.5"
          />
          <motion.path
            d="M38 172C126 206 108 15 240 76S342 231 454 113"
            stroke="#6ee7b7"
            strokeOpacity="0.7"
            strokeWidth="2"
            strokeDasharray="3 25"
            animate={{ strokeDashoffset: animar ? [0, -112] : 0 }}
            transition={
              animar
                ? { duration: 12, repeat: Infinity, ease: "linear" }
                : { duration: 0 }
            }
          />
        </svg>
        <motion.div
          className="absolute left-2 top-3 flex h-24 w-24 items-center justify-center rounded-[1.8rem] border border-white/15 bg-slate-900/70 shadow-xl shadow-black/10 backdrop-blur-xl xl:left-4 xl:h-28 xl:w-28"
          initial={false}
          animate={
            animar
              ? { y: [0, -7, 0], rotate: [-7, -3, -7] }
              : { y: 0, rotate: -5 }
          }
          transition={
            animar
              ? { duration: 9, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          <IsotipoVuki tone="light" className="h-16 w-16" />
        </motion.div>
        <motion.div
          className="absolute right-1 top-1 w-[66%] max-w-[300px] rounded-2xl border border-white/20 bg-slate-800/95 p-4 shadow-2xl shadow-black/20 xl:p-5"
          initial={false}
          animate={
            animar ? { y: [0, 6, 0], rotate: [2, 0, 2] } : { y: 0, rotate: 1 }
          }
          transition={
            animar
              ? { duration: 11, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          <div className="flex items-center justify-between text-white">
            <span className="inline-flex items-center gap-2 text-xs font-semibold">
              <CalendarDays className="h-4 w-4 text-sky-300" />
              Tu día, en orden.
            </span>
            <span className="text-[9px] text-slate-300">Ejemplo</span>
          </div>
          <div className="mt-3 space-y-2">
            {[
              ["09:00", "Clase de surf", "bg-sky-300"],
              ["11:00", "Tour en grupo", "bg-emerald-300"],
            ].map(([hora, servicio, color]) => (
              <div
                key={hora}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-2 text-[10px] text-slate-200"
              >
                <span className={`h-5 w-0.5 rounded-full ${color}`} />
                <span className="font-semibold">{hora}</span>
                <span className="flex-1">{servicio}</span>
                <Check className="h-3 w-3 text-emerald-300" />
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          className="absolute bottom-7 left-4 flex max-w-[88%] items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/95 px-4 py-3 shadow-xl xl:bottom-9 xl:left-6"
          initial={false}
          animate={animar ? { y: [0, -5, 0], x: [0, 4, 0] } : { y: 0, x: 0 }}
          transition={
            animar
              ? { duration: 8, repeat: Infinity, ease: "easeInOut" }
              : { duration: 0 }
          }
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400/10 text-sky-300">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[10px] text-slate-300">
              Un enlace para tus clientes.
            </p>
            <p className="mt-1 text-xs font-semibold text-white">
              Todo tu negocio, conectado.
            </p>
          </div>
          <Waves className="ml-3 h-5 w-5 shrink-0 text-emerald-300" />
        </motion.div>
      </motion.div>
      <p className="absolute inset-x-0 bottom-0 text-center text-[10px] text-slate-400">
        Vista ilustrativa de tu espacio en vuki.
      </p>
    </div>
  );
}
