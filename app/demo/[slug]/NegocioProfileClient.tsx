"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import type { MockNegocio } from "../../../lib/mockData";
import AnimatedCheckoutSheet from "../../../components/AnimatedCheckoutSheet";
import ServicioCard from "../../../components/ServicioCard";
import {
  crearReserva,
  useDemoStore,
  type DemoServicio,
} from "../../../lib/demoStore";
import { LocaleProvider, useTranslations } from "../../../lib/i18n";

interface NegocioProfileClientProps {
  negocio: MockNegocio;
}

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemLista = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Perfil público de demo (Client Component) — versión "Premium/World-Class":
 * header inmersivo con fade hacia el contenido, tarjetas de servicio con
 * imagen de fondo y micro-interacciones, y bottom sheet animado para el
 * checkout simulado. Se separa del `page.tsx` (Server Component) para
 * poder seguir exportando `generateMetadata` desde el servidor.
 */
export default function NegocioProfileClient({
  negocio,
}: NegocioProfileClientProps) {
  return (
    <LocaleProvider>
      <NegocioProfileContenido negocio={negocio} />
    </LocaleProvider>
  );
}

function NegocioProfileContenido({ negocio }: NegocioProfileClientProps) {
  const { t, locale, setLocale } = useTranslations();
  const { servicios, horarios, reservas, suscripcion } = useDemoStore(
    negocio.slug,
  );
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<DemoServicio | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const suscripcionActiva = suscripcion.estado !== "inactiva";

  const horariosDelServicio = servicioSeleccionado
    ? horarios.filter((h) => h.servicioId === servicioSeleccionado.id)
    : [];

  const reservasDelServicio = servicioSeleccionado
    ? reservas.filter((r) => r.servicioId === servicioSeleccionado.id)
    : [];

  function handleReservaConfirmada(
    horarioId: string,
    nombreCliente: string,
    emailCliente: string,
  ) {
    if (!servicioSeleccionado) return;
    crearReserva(negocio.slug, {
      horarioId,
      servicioId: servicioSeleccionado.id,
      nombreCliente,
      emailCliente,
      cantidadCuposReservados: 1,
      montoPagado: servicioSeleccionado.precioUsd,
    });
  }

  // Si la suscripción del negocio está inactiva (simulado desde
  // /demo/admin/suscripcion), el enlace público deja de mostrar servicios.
  if (montado && !suscripcionActiva) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <ShieldAlert className="h-8 w-8 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900">
          Enlace no disponible
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
          {negocio.nombre} no tiene una suscripción activa en este momento, por
          lo que su enlace público de reservas no está disponible.
        </p>
        <Link
          href="/demo/admin/suscripcion"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white outline-none transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          Ver panel de suscripción (demo)
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      {/* Header inmersivo: la portada ocupa ~30% del alto de pantalla con fade */}
      <div className="relative h-[30vh] min-h-[220px] w-full">
        <Image
          src={negocio.portadaUrl}
          alt={`Portada de ${negocio.nombre}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-black/20" />

        {/* Toggle de idioma ES/EN */}
        <div
          role="group"
          aria-label="Language / Idioma"
          className="absolute right-4 top-4 flex overflow-hidden rounded-full border border-white/40 bg-white/80 text-xs font-semibold shadow-sm backdrop-blur-sm"
        >
          <button
            type="button"
            aria-pressed={locale === "es"}
            onClick={() => setLocale("es")}
            className={`px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-slate-900 ${
              locale === "es"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-white"
            }`}
          >
            ES
          </button>
          <button
            type="button"
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
            className={`px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-slate-900 ${
              locale === "en"
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-white"
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="relative mx-auto -mt-16 max-w-md px-6 sm:max-w-xl sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white shadow-xl sm:h-32 sm:w-32"
        >
          <Image
            src={negocio.logoUrl}
            alt={`Logo de ${negocio.nombre}`}
            fill
            className="object-cover"
            sizes="128px"
          />
        </motion.div>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-8"
        >
          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            {negocio.nombre}
          </h1>
          <p className="mt-3 max-w-md text-base leading-relaxed text-gray-500">
            {negocio.descripcion}
          </p>
        </motion.header>

        <section className="mt-14">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-gray-400">
            {t("servicios_disponibles")}
          </h2>

          <motion.div
            variants={contenedorLista}
            initial="oculto"
            animate="visible"
            className="grid grid-cols-1 gap-5 sm:grid-cols-2"
          >
            {servicios.map((servicio) => (
              <motion.div key={servicio.id} variants={itemLista}>
                <ServicioCard
                  servicio={servicio}
                  colorTema={negocio.colorTema}
                  onSeleccionar={setServicioSeleccionado}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>
      </div>

      <AnimatePresence>
        {servicioSeleccionado && (
          <AnimatedCheckoutSheet
            servicio={servicioSeleccionado}
            negocioNombre={negocio.nombre}
            colorTema={negocio.colorTema}
            horariosDisponibles={horariosDelServicio}
            reservasExistentes={reservasDelServicio}
            onReservaConfirmada={handleReservaConfirmada}
            onClose={() => setServicioSeleccionado(null)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
