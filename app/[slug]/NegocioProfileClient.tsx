"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Unlink } from "lucide-react";
import AnimatedCheckoutSheet from "../../components/AnimatedCheckoutSheet";
import ServicioCard from "../../components/ServicioCard";
import MarcaReserva from "../../components/MarcaReserva";
import SelectorIdioma from "../../components/SelectorIdioma";
import SelectorMoneda from "../../components/SelectorMoneda";
import {
  esImagenOptimizable,
  type HorarioPublico,
  type ServicioPublico,
} from "../../lib/tipos-publicos";
import { LocaleProvider, useTranslations } from "../../lib/i18n";
import {
  esMonedaSoportada,
  normalizarMoneda,
  type CodigoMoneda,
} from "../../lib/monedas";
import { reservarYPagarAction } from "../../actions/pago-simulado";
import { mensajeErrorUsuario } from "../../lib/errores";

export interface NegocioPublico {
  nombre: string;
  descripcion: string;
  portadaUrl: string;
  logoUrl: string;
  colorTema: string;
  colorSecundario: string;
  moneda?: CodigoMoneda;
  whatsapp?: string;
}

interface NegocioProfileClientProps {
  negocio: NegocioPublico;
  servicios: ServicioPublico[];
  horarios: HorarioPublico[];
  suscripcionActiva: boolean;
  pago?: string;
  modoPagosSimulados?: boolean;
  /** Ruta del formulario de reportes (solo si la función está activa). */
  hrefReportar?: string;
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
 * Perfil público real (/[slug]): experiencia premium de reservas
 * (header inmersivo, idioma ES/EN, tarjetas con imagen y checkout animado
 * por pasos), alimentada con datos reales del negocio.
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
  modoPagosSimulados,
  hrefReportar,
}: NegocioProfileClientProps) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const monedaNegocio = normalizarMoneda(negocio.moneda, "USD");
  const [monedaVista, setMonedaVista] = useState<CodigoMoneda>(monedaNegocio);
  const [servicioSeleccionado, setServicioSeleccionado] =
    useState<ServicioPublico | null>(null);
  const [huboReserva, setHuboReserva] = useState(false);

  useEffect(() => {
    try {
      const guardada = window.localStorage.getItem("vuki_moneda");
      if (esMonedaSoportada(guardada)) {
        setMonedaVista(guardada);
      }
    } catch {
      // Almacenamiento no disponible: usa la moneda predeterminada del negocio.
    }
  }, []);

  const cambiarMoneda = useCallback((nueva: CodigoMoneda) => {
    setMonedaVista(nueva);
    try {
      window.localStorage.setItem("vuki_moneda", nueva);
    } catch {
      // Almacenamiento no disponible: la selección aplica durante la sesión.
    }
  }, []);

  const horariosDelServicio = servicioSeleccionado
    ? horarios.filter((h) => h.servicioId === servicioSeleccionado.id)
    : [];

  const whatsappDigitos = negocio.whatsapp
    ? negocio.whatsapp.replace(/\D/g, "")
    : "";
  const whatsappUrl = whatsappDigitos.length >= 7
    ? `https://wa.me/${whatsappDigitos}?text=${encodeURIComponent(t("whatsapp_mensaje"))}`
    : null;

  async function handleReservaConfirmada(
    horarioId: string | null,
    nombreCliente: string,
    emailCliente: string,
    cupos: number,
    monedaPago?: CodigoMoneda,
  ) {
    const esItem = servicioSeleccionado?.tipoUnidad === "item";
    const horario = horarioId
      ? horarios.find((h) => h.id === horarioId)
      : undefined;
    if (!servicioSeleccionado || (!esItem && !horario)) {
      return { error: t("horario_no_disponible") };
    }
    try {
      const resultado = await reservarYPagarAction({
        servicioId: servicioSeleccionado.id,
        email: emailCliente,
        nombre: nombreCliente.trim() || undefined,
        fechaHora: esItem ? undefined : horario?.fechaHora,
        cupos,
        moneda: monedaPago ?? monedaVista,
      });
      if (!resultado.error) setHuboReserva(true);
      return resultado;
    } catch (error) {
      return { error: mensajeErrorUsuario(error, t("error_pago")) };
    }
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
      <main className="flex min-h-[85svh] flex-col items-center justify-center bg-slate-50 px-6 py-16 text-center">
        <div className="w-full max-w-sm rounded-3xl border border-slate-200/80 bg-white px-6 py-10 shadow-xl shadow-slate-900/5 sm:px-8">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-sky-50 text-sky-700">
            <Unlink
              className="h-11 w-11"
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </div>
          <p className="mt-7 break-words text-xs font-medium text-slate-500">
            {negocio.nombre}
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900">
            {t("enlace_no_disponible")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {t("agenda_inactiva")}
          </p>
          <MarcaReserva idioma={locale} className="mt-7" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="relative h-[30vh] min-h-[220px] w-full">
        <Image
          src={negocio.portadaUrl}
          unoptimized={!esImagenOptimizable(negocio.portadaUrl)}
          alt={`Portada de ${negocio.nombre}`}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-black/20" />

        <div className="absolute right-4 top-4 flex items-center gap-2">
          <SelectorMoneda valor={monedaVista} onChange={cambiarMoneda} />
          <SelectorIdioma />
        </div>
      </div>

      <div className="relative mx-auto -mt-16 max-w-md px-6 sm:max-w-xl sm:px-8">
        {pago === "exitoso" && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700"
          >
            {modoPagosSimulados
              ? t("pago_demo_confirmado")
              : t("pago_confirmado")}
          </div>
        )}
        {pago === "cancelado" && (
          <div
            role="status"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-700"
          >
            {t("pago_cancelado")}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-slate-100 shadow-xl sm:h-32 sm:w-32"
        >
          <Image
            src={negocio.logoUrl}
            unoptimized={!esImagenOptimizable(negocio.logoUrl)}
            alt={`Logo de ${negocio.nombre}`}
            fill
            loading="eager"
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
          <h1 className="break-words font-display text-3xl font-bold tracking-tight text-vuki-ink sm:text-4xl">
            {negocio.nombre}
          </h1>
          <div
            aria-hidden="true"
            className="mt-3 h-1 w-16 rounded-full"
            style={{
              backgroundImage: `linear-gradient(90deg, ${negocio.colorTema}, ${negocio.colorSecundario})`,
            }}
          />
          <p className="mt-3 max-w-md whitespace-pre-line break-words text-base leading-relaxed text-slate-600">
            {negocio.descripcion}
          </p>
          {whatsappUrl && (
            <motion.a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="vuki-focus group mt-4 inline-flex min-h-11 items-center gap-2.5 rounded-full border border-emerald-300/80 bg-emerald-50/90 px-4 py-2 text-sm font-semibold text-emerald-800 shadow-xs transition-colors hover:border-emerald-400 hover:bg-emerald-100/90 hover:shadow-sm hover:shadow-emerald-600/10"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 duration-1000" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <MessageCircle
                className="h-4 w-4 text-emerald-600 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
                aria-hidden="true"
              />
              <span>WhatsApp</span>
            </motion.a>
          )}
        </motion.header>

        <section className="mt-14">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-slate-500">
            {t("servicios_disponibles")}
          </h2>

          {servicios.length === 0 ? (
            <p className="rounded-2xl border border-slate-100 bg-slate-50/70 px-5 py-8 text-center text-sm text-slate-500">
              {t("sin_servicios")}
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
                    monedaVista={monedaVista}
                    colorTema={negocio.colorTema}
                    colorSecundario={negocio.colorSecundario}
                    onSeleccionar={setServicioSeleccionado}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
        <div className="mt-12 flex flex-col items-center gap-1 border-t border-slate-100 pt-6">
          <MarcaReserva idioma={locale} />
          {hrefReportar && (
            <Link
              href={hrefReportar}
              className="vuki-focus inline-block rounded-lg px-2 py-2 text-xs text-slate-500 hover:text-slate-700 hover:underline focus-visible:underline"
            >
              {t("reportar_perfil")}
            </Link>
          )}
        </div>
      </div>

      <AnimatePresence>
        {servicioSeleccionado && (
          <AnimatedCheckoutSheet
            servicio={servicioSeleccionado}
            moneda={monedaVista}
            onCambiarMoneda={cambiarMoneda}
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
