"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, ShieldAlert } from "lucide-react";
import AnimatedCheckoutSheet from "../../components/AnimatedCheckoutSheet";
import ServicioCard from "../../components/ServicioCard";
import type { DemoHorario, DemoServicio } from "../../lib/demoStore";
import { LocaleProvider, useTranslations } from "../../lib/i18n";
import { reservarYPagarAction } from "../../actions/pago-simulado";

export interface NegocioPublico {
  nombre: string;
  descripcion: string;
  portadaUrl: string;
  logoUrl: string;
  colorTema: string;
  whatsapp?: string;
}

interface NegocioProfileClientProps {
  negocio: NegocioPublico;
  servicios: DemoServicio[];
  horarios: DemoHorario[];
  suscripcionActiva: boolean;
  pago?: string;
}

const contenedorLista = {
  oculto: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemLista = {
  oculto: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Perfil público real (/[slug]): misma experiencia premium que el demo
 * (header inmersivo, idioma ES/EN, tarjetas con imagen y checkout animado
 * por pasos), pero alimentada con datos reales del negocio.
 */
export default function NegocioProfileClient(props: NegocioProfileClientProps) {
  return (
    <LocaleProvider>
      <NegocioProfileContenido {...props} />
    </LocaleProvider>
  );
}

function NegocioProfileContenido({
  negocio,
  servicios,
  horarios,
  suscripcionActiva,
  pago,
}: NegocioProfileClientProps) {
  const router = useRouter();
  const { t, locale, setLocale } = useTranslations();
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<DemoServicio | null>(null);
  const [huboReserva, setHuboReserva] = useState(false);

  const horariosDelServicio = servicioSeleccionado
    ? horarios.filter((h) => h.servicioId === servicioSeleccionado.id)
    : [];

  async function handleReservaConfirmada(
    horarioId: string,
    nombreCliente: string,
    emailCliente: string,
    cupos: number,
  ) {
    const horario = horarios.find((h) => h.id === horarioId);
    if (!servicioSeleccionado || !horario) {
      return { error: "El horario ya no está disponible." };
    }
    const resultado = await reservarYPagarAction({
      servicioId: servicioSeleccionado.id,
      email: emailCliente,
      nombre: nombreCliente.trim() || undefined,
      fechaHora: horario.fechaHora,
      cupos,
    });
    if (!resultado.error) setHuboReserva(true);
    return resultado;
  }

  function cerrarSheet() {
    setServicioSeleccionado(null);
    if (huboReserva) {
      setHuboReserva(false);
      router.refresh();
    }
  }

  if (!suscripcionActiva) {
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24">
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

        <div
          role="group"
          aria-label="Language / Idioma"
          className="absolute right-4 top-4 flex overflow-hidden rounded-full border border-white/40 bg-white/80 text-xs font-semibold shadow-sm backdrop-blur-sm"
        >
          {(["es", "en"] as const).map((idioma) => (
            <button
              key={idioma}
              type="button"
              aria-pressed={locale === idioma}
              onClick={() => setLocale(idioma)}
              className={`px-3 py-1.5 outline-none transition focus-visible:ring-2 focus-visible:ring-slate-900 ${
                locale === idioma
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              {idioma.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="relative mx-auto -mt-16 max-w-md px-6 sm:max-w-xl sm:px-8">
        {pago === "exitoso" && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
            ¡Pago confirmado! Revisa tu correo para ver el recibo.
          </div>
        )}
        {pago === "cancelado" && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700">
            El pago fue cancelado. Tu reserva quedó pendiente.
          </div>
        )}

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
          {negocio.whatsapp && (
            <a
              href={`https://wa.me/${negocio.whatsapp}?text=${encodeURIComponent(`Hola ${negocio.nombre}, quisiera consultar sobre una reserva.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
          )}
        </motion.header>

        <section className="mt-14">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-gray-400">
            {t("servicios_disponibles")}
          </h2>

          {servicios.length === 0 ? (
            <p className="text-sm text-gray-500">
              Este negocio aún no tiene servicios disponibles.
            </p>
          ) : (
            <motion.div
              variants={contenedorLista}
              initial="oculto"
              animate="visible"
              className="grid grid-cols-1 gap-5 sm:grid-cols-2"
            >
              {servicios.map((servicio, i) => (
                <motion.div key={servicio.id} variants={itemLista}>
                  <ServicioCard
                    prioritaria={i < 2}
                    servicio={servicio}
                    colorTema={negocio.colorTema}
                    onSeleccionar={setServicioSeleccionado}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>

      <AnimatePresence>
        {servicioSeleccionado && (
          <AnimatedCheckoutSheet
            servicio={servicioSeleccionado}
            negocioNombre={negocio.nombre}
            colorTema={negocio.colorTema}
            horariosDisponibles={horariosDelServicio}
            onReservaConfirmada={handleReservaConfirmada}
            onClose={cerrarSheet}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
