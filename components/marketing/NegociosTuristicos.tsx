"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Anchor,
  Bike,
  Bus,
  CalendarDays,
  CalendarOff,
  Check,
  Clock,
  CloudRain,
  Compass,
  Download,
  Globe2,
  MessageCircle,
  Palmtree,
  Receipt,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
  Waves,
  X,
} from "lucide-react";
import { Aparecer, FondoMarca, useMovimientoMarca } from "./MovimientoMarca";

export type GiroId =
  | "alquiler"
  | "aventura"
  | "guias"
  | "escuelas"
  | "marinos"
  | "parques"
  | "bienestar"
  | "shuttles"
  | "ferias";

export interface GiroNegocio {
  id: GiroId;
  numero: string;
  icono: typeof Waves;
  titulo: string;
  insignia: string;
  resumen: string;
  ejemplos: string[];
  acentoClase: string;
  pildoraClase: string;
  simulador: {
    negocio: string;
    tituloVista: string;
    cupoEtiqueta: string;
    slotPrincipal: {
      hora: string;
      servicio: string;
      estado: string;
      pct: number;
      tono: "emerald" | "amber";
    };
    slotSecundario: {
      icono: "reloj" | "clima" | "whatsapp" | "hacienda";
      titulo: string;
      detalle: string;
      etiqueta: string;
    };
  };
}

export const GIROS_TURISTICOS: GiroNegocio[] = [
  {
    id: "alquiler",
    numero: "01",
    icono: Bike,
    titulo: "Alquiler de equipo",
    insignia: "Stock por bloque horario",
    resumen:
      "Descuenta unidades solo en la franja reservada (2 h o día completo) y evita sobreventas.",
    ejemplos: ["Tablas de surf", "SUP y kayaks", "ATV y bicis"],
    acentoClase: "bg-sky-400/15 text-sky-300 ring-1 ring-sky-300/25",
    pildoraClase: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    simulador: {
      negocio: "Playa Guiones Rentals",
      tituloVista: "Inventario por franja horaria",
      cupoEtiqueta: "10 tablas en flota",
      slotPrincipal: {
        hora: "8:00 a.m. – 4:00 p.m.",
        servicio: "Tabla Longboard · Día completo",
        estado: "10/10 reservadas",
        pct: 100,
        tono: "amber",
      },
      slotSecundario: {
        icono: "reloj",
        titulo: "4:30 p.m. – 6:30 p.m. · Bloque Sunset",
        detalle: "El mismo equipo vuelve a estar disponible en el siguiente turno.",
        etiqueta: "6/10 libres",
      },
    },
  },
  {
    id: "aventura",
    numero: "02",
    icono: Compass,
    titulo: "Tours y aventura",
    insignia: "Bloqueos por clima",
    resumen:
      "Controla cupos por guía o balsa y pausa salidas en segundos por tormenta o crecida.",
    ejemplos: ["Canopy", "Rafting", "Cabalgatas", "Caminatas"],
    acentoClase: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25",
    pildoraClase: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    simulador: {
      negocio: "Arenal Rafting & Canopy",
      tituloVista: "Salidas fijas y clima en vivo",
      cupoEtiqueta: "Máx. 8 por balsa",
      slotPrincipal: {
        hora: "7:00 a.m.",
        servicio: "Tour de Rafting Clase III-IV",
        estado: "7/8 cupos · 1 libre",
        pct: 88,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "clima",
        titulo: "2:00 p.m. · Salida de tarde pausada",
        detalle: "Pausada en 1 toque sin alterar los horarios de mañana.",
        etiqueta: "Mal clima / Marea",
      },
    },
  },
  {
    id: "guias",
    numero: "03",
    icono: Globe2,
    titulo: "Guías y agroturismo",
    insignia: "Web + WhatsApp unidos",
    resumen:
      "Centraliza reservas con tarjeta y apartados manuales por SINPE o efectivo al instante.",
    ejemplos: ["Tours de café y cacao", "Aves", "Cocina local", "Trapiches"],
    acentoClase: "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/25",
    pildoraClase: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    simulador: {
      negocio: "Monteverde Coffee & Birds",
      tituloVista: "Agenda web y manual sincronizada",
      cupoEtiqueta: "6/6 cupos hoy",
      slotPrincipal: {
        hora: "9:00 a.m.",
        servicio: "Tour de Café y Cacao (ES/EN)",
        estado: "4 web + 2 manuales",
        pct: 100,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "whatsapp",
        titulo: "Reserva manual · WhatsApp de última hora",
        detalle: "Aparta el cupo al instante marcando «Ya pagó» o «Pendiente de cobro».",
        etiqueta: "SINPE / Efectivo",
      },
    },
  },
  {
    id: "escuelas",
    numero: "04",
    icono: Waves,
    titulo: "Escuelas y clases",
    insignia: "Horarios + Hacienda",
    resumen:
      "Organiza clases por hora con CABYS, IVA, tipo de cambio BCCR y CSV para la D-104.",
    ejemplos: ["Clases de surf", "Kitesurf", "Fotografía", "Talleres"],
    acentoClase: "bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/25",
    pildoraClase: "border-teal-400/25 bg-teal-400/10 text-teal-100",
    simulador: {
      negocio: "Santa Teresa Surf School",
      tituloVista: "Clases recurrentes y control fiscal",
      cupoEtiqueta: "CSV D-104 listo",
      slotPrincipal: {
        hora: "8:30 a.m.",
        servicio: "Paquete Semanal de Surf",
        estado: "5/6 alumnos",
        pct: 83,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "hacienda",
        titulo: "Subtotal + IVA · Código CABYS · BCCR",
        detalle: "Consecutivo FE/TE registrado y listo para tu declaración mensual.",
        etiqueta: "Listo para Hacienda",
      },
    },
  },
  {
    id: "marinos",
    numero: "05",
    icono: Anchor,
    titulo: "Charters y marinos",
    insignia: "0% comisión + mareas",
    resumen:
      "Vende por bote privado o cupo compartido sin regalar comisiones en tiquetes altos.",
    ejemplos: ["Pesca deportiva", "Catamarán", "Snorkel y buceo", "Ballenas"],
    acentoClase: "bg-sky-400/15 text-sky-300 ring-1 ring-sky-300/25",
    pildoraClase: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    simulador: {
      negocio: "Papagayo Ocean Charters",
      tituloVista: "Capacidad por embarcación",
      cupoEtiqueta: "0% comisión vuki",
      slotPrincipal: {
        hora: "6:30 a.m.",
        servicio: "Charter Pesca Inshore (Bote privado)",
        estado: "1/1 bote reservado",
        pct: 100,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "clima",
        titulo: "Control de oleaje y marea alta",
        detalle: "Pausa salidas marinas específicas si cambia el pronóstico costero.",
        etiqueta: "100% íntegro para ti",
      },
    },
  },
  {
    id: "parques",
    numero: "06",
    icono: Palmtree,
    titulo: "Parques y Day Pass",
    insignia: "Aforo por hora",
    resumen:
      "Distribuye entradas por turno para evitar filas y saturación en senderos o pozas.",
    ejemplos: ["Aguas termales", "Cataratas", "Puentes colgantes", "Reservas"],
    acentoClase: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25",
    pildoraClase: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    simulador: {
      negocio: "Catarata & Termales Reserva",
      tituloVista: "Ventanas de ingreso escalonadas",
      cupoEtiqueta: "25 cupos por turno",
      slotPrincipal: {
        hora: "10:00 a.m.",
        servicio: "Pase del Día · Senderos y Pozas",
        estado: "21/25 entradas",
        pct: 84,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "hacienda",
        titulo: "11:00 a.m. · Siguiente ventana abierta",
        detalle: "Flujo ordenado de visitantes con CABYS e IVA configurados.",
        etiqueta: "18/25 libres",
      },
    },
  },
  {
    id: "bienestar",
    numero: "07",
    icono: Sparkles,
    titulo: "Bienestar y spas",
    insignia: "Marca propia ES/EN",
    resumen:
      "Agenda sesiones 1 a 1 o ceremonias grupales desde tu bio en español e inglés.",
    ejemplos: ["Yoga y pilates", "Masajes", "Sound healing", "Retiros"],
    acentoClase: "bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/25",
    pildoraClase: "border-cyan-400/25 bg-cyan-400/10 text-cyan-100",
    simulador: {
      negocio: "Nosara Holistic Studio",
      tituloVista: "Sesiones individuales y de grupo",
      cupoEtiqueta: "Enlace ES / EN",
      slotPrincipal: {
        hora: "5:00 p.m.",
        servicio: "Sunset Yoga & Sound Healing",
        estado: "9/10 mats reservados",
        pct: 90,
        tono: "amber",
      },
      slotSecundario: {
        icono: "reloj",
        titulo: "Bloqueo rápido · Evento privado",
        detalle: "Reserva el estudio o terapeuta para un retiro sin borrar tus clases.",
        etiqueta: "1 clic",
      },
    },
  },
  {
    id: "shuttles",
    numero: "08",
    icono: Bus,
    titulo: "Shuttles y traslados",
    insignia: "Asientos exactos",
    resumen:
      "Cada reserva web o por WhatsApp descuenta un asiento real de tu microbús o ruta.",
    ejemplos: ["Shuttles compartidos", "Vans privadas", "Traslados", "Day trips"],
    acentoClase: "bg-teal-400/15 text-teal-200 ring-1 ring-teal-300/25",
    pildoraClase: "border-teal-400/25 bg-teal-400/10 text-teal-100",
    simulador: {
      negocio: "Pura Vida Shuttle CR",
      tituloVista: "Control de asientos por ruta",
      cupoEtiqueta: "Microbús 12 asientos",
      slotPrincipal: {
        hora: "8:00 a.m.",
        servicio: "Ruta La Fortuna → Tamarindo",
        estado: "11/12 asientos",
        pct: 92,
        tono: "amber",
      },
      slotSecundario: {
        icono: "whatsapp",
        titulo: "Cero sobreventa en carretera",
        detalle: "Combina pasajeros con pago en línea y reservas de hoteles por SINPE.",
        etiqueta: "Último asiento",
      },
    },
  },
  {
    id: "ferias",
    numero: "09",
    icono: Store,
    titulo: "Ferias y ventas exprés",
    insignia: "QR + Cupos o ítems",
    resumen:
      "El cliente escanea tu QR y paga sin apps ni registro; rebaja cupos o ítems al instante.",
    ejemplos: ["Ferias y mercados", "Salidas rápidas", "Artesanías", "Pop-ups"],
    acentoClase: "bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/25",
    pildoraClase: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    simulador: {
      negocio: "Coralia & Surf Tamarindo",
      tituloVista: "Cobro rápido en stand y stock en vivo",
      cupoEtiqueta: "QR sin fricción",
      slotPrincipal: {
        hora: "Compra directa",
        servicio: "Ítem de feria / Próxima salida",
        estado: "14 disp. · se rebaja al pagar",
        pct: 78,
        tono: "emerald",
      },
      slotSecundario: {
        icono: "whatsapp",
        titulo: "Panel móvil en feria + ventas online",
        detalle:
          "Registra cobros en el momento (SINPE/efectivo) y evita sobreventas a distancia.",
        etiqueta: "Tiempo real",
      },
    },
  },
];

const COMPARATIVA_PUNTOS = [
  {
    titulo: "Lo que vendes",
    retail: "Catálogos rígidos pensados solo para bodega y carritos largos.",
    vuki: "Cupos por fecha y hora (por defecto) o ítems de feria que solo se rebajan.",
  },
  {
    titulo: "En ferias y turnos",
    retail: "Pide crear cuenta o no conecta ventas del stand con cupos por hora.",
    vuki: "Escanean tu QR y pagan en segundos, o descuentas desde tu celular.",
  },
  {
    titulo: "Clima y operación",
    retail: "Obliga a apagar todo el producto del catálogo cuando llueve.",
    vuki: "Pausa solo la hora afectada («Mal clima / Marea») en segundos.",
  },
  {
    titulo: "WhatsApp y Hacienda",
    retail: "Pedidos aislados de tu agenda y sin enfoque fiscal local.",
    vuki: "Venta manual (SINPE/efectivo) + CABYS, IVA, BCCR y CSV D-104.",
  },
];

function IconoSecundario({
  tipo,
}: {
  tipo: GiroNegocio["simulador"]["slotSecundario"]["icono"];
}) {
  if (tipo === "clima") {
    return <CloudRain className="h-4 w-4 text-sky-700" aria-hidden="true" />;
  }
  if (tipo === "whatsapp") {
    return (
      <MessageCircle className="h-4 w-4 text-emerald-700" aria-hidden="true" />
    );
  }
  if (tipo === "hacienda") {
    return <Receipt className="h-4 w-4 text-emerald-700" aria-hidden="true" />;
  }
  return <CalendarOff className="h-4 w-4 text-sky-700" aria-hidden="true" />;
}

export default function NegociosTuristicos() {
  const { activo } = useMovimientoMarca();
  const [seleccionado, setSeleccionado] = useState<GiroId>("alquiler");

  const giroActivo =
    GIROS_TURISTICOS.find((g) => g.id === seleccionado) ?? GIROS_TURISTICOS[0];
  const sim = giroActivo.simulador;

  return (
    <>
      {/* SECCIÓN OSCURA: Los 8 giros turísticos + Vista interactiva compacta */}
      <section
        id="para-quien"
        aria-labelledby="negocios-titulo"
        className="relative isolate overflow-hidden scroll-mt-20 bg-slate-900 px-5 py-20 text-white sm:px-8 sm:py-24 lg:px-12"
      >
        <FondoMarca className="-z-10" />
        <div className="mx-auto max-w-6xl">
          <div className="grid items-end gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <Aparecer>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Hecho para las pymes turísticas de Costa Rica
              </p>
              <h2
                id="negocios-titulo"
                className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl"
              >
                No vendes cajas en bodega.{" "}
                <span className="text-sky-300">
                  Vendes fecha, hora y cupos reales.
                </span>
              </h2>
            </Aparecer>
            <Aparecer retraso={0.06}>
              <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
                Selecciona tu tipo de negocio y mira cómo{" "}
                <span className="font-semibold text-white">vuki</span> adapta tu
                agenda, tus cupos y tus finanzas en un solo enlace.
              </p>
            </Aparecer>
          </div>

          {/* Tarjeta interactiva compacta */}
          <Aparecer retraso={0.1} className="mt-10">
            <div className="rounded-[2rem] border border-white/15 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7">
              <motion.div
                key={giroActivo.id}
                initial={activo ? { opacity: 0, y: 6 } : false}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: activo ? 0.22 : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="grid items-center gap-6 lg:grid-cols-[1fr_1.05fr]"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${giroActivo.pildoraClase}`}
                    >
                      <giroActivo.icono
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {giroActivo.insignia}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      Giro {giroActivo.numero} / 09
                    </span>
                  </div>

                  <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                    {giroActivo.titulo}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-300">
                    {giroActivo.resumen}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {giroActivo.ejemplos.map((ej) => (
                      <span
                        key={ej}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200"
                      >
                        {ej}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mini panel ilustrativo limpio */}
                <div className="rounded-3xl bg-white p-4 text-slate-900 shadow-xl sm:p-5">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-sky-700">
                        Ejemplo · {sim.negocio}
                      </p>
                      <h4 className="mt-0.5 font-display text-sm font-bold text-slate-900 sm:text-base">
                        {sim.tituloVista}
                      </h4>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-800">
                      {sim.cupoEtiqueta}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2.5">
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900">
                          <Clock
                            className="h-3.5 w-3.5 text-sky-600"
                            aria-hidden="true"
                          />
                          {sim.slotPrincipal.hora} · {sim.slotPrincipal.servicio}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            sim.slotPrincipal.tono === "amber"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {sim.slotPrincipal.estado}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                        <div
                          style={{ width: `${sim.slotPrincipal.pct}%` }}
                          className={`h-full rounded-full ${
                            sim.slotPrincipal.tono === "amber"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex items-start justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 p-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-white shadow-2xs">
                          <IconoSecundario tipo={sim.slotSecundario.icono} />
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {sim.slotSecundario.titulo}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-600">
                            {sim.slotSecundario.detalle}
                          </p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-800 shadow-2xs">
                        {sim.slotSecundario.etiqueta}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </Aparecer>

          {/* Bento Grid de 9 giros: compacto, visual y sin exceso de texto */}
          <div
            role="group"
            aria-label="Tipos de negocios turísticos compatibles con vuki"
            className="mt-6 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {GIROS_TURISTICOS.map((giro, indice) => {
              const Icono = giro.icono;
              const esSeleccionado = seleccionado === giro.id;
              return (
                <Aparecer
                  key={giro.id}
                  retraso={indice * 0.04}
                  className="h-full"
                >
                  <button
                    type="button"
                    aria-pressed={esSeleccionado}
                    onClick={() => setSeleccionado(giro.id)}
                    className={`vuki-focus group flex h-full w-full flex-col justify-between rounded-3xl border p-5 text-left transition duration-200 ${
                      esSeleccionado
                        ? "border-emerald-400/60 bg-white/[0.09] shadow-lg shadow-emerald-950/25"
                        : "border-white/10 bg-white/[0.03] hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[0.06] motion-reduce:transform-none"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-2xl ${giro.acentoClase}`}
                        >
                          <Icono className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                            esSeleccionado
                              ? "bg-emerald-400/20 text-emerald-200"
                              : "bg-white/5 text-slate-400 group-hover:text-slate-200"
                          }`}
                        >
                          {giro.insignia}
                        </span>
                      </div>

                      <h3 className="mt-4 font-display text-base font-bold text-white">
                        {giro.titulo}
                      </h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                        {giro.resumen}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-1 border-t border-white/10 pt-3">
                      {giro.ejemplos.slice(0, 3).map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </button>
                </Aparecer>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN CLARA: Valor único (Comparativa limpia y visual sin exceso de texto) */}
      <section
        id="valor-unico"
        aria-labelledby="comparativa-titulo"
        className="relative isolate overflow-hidden scroll-mt-20 bg-slate-50 px-5 py-20 text-slate-900 sm:px-8 sm:py-24 lg:px-12"
      >
        <FondoMarca tono="claro" className="-z-10" />
        <div className="mx-auto max-w-6xl">
          <Aparecer className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Por qué vuki es diferente
            </p>
            <h2
              id="comparativa-titulo"
              className="mt-3 font-display text-3xl font-bold leading-tight tracking-tight text-slate-900 sm:text-4xl"
            >
              Sin fricción en ferias ni sobreventas en línea.{" "}
              <span className="text-slate-500">
                Cupos por hora o ítems directos en un mismo link.
              </span>
            </h2>
          </Aparecer>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPARATIVA_PUNTOS.map((item, indice) => (
              <Aparecer
                key={item.titulo}
                retraso={indice * 0.06}
                className="h-full"
              >
                <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs">
                  <div>
                    <p className="font-display text-base font-bold text-slate-900">
                      {item.titulo}
                    </p>
                    <div className="mt-3 flex items-start gap-2 rounded-2xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                      <X
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                        aria-hidden="true"
                      />
                      <span>
                        <strong className="font-semibold text-slate-600">
                          Tienda tradicional:{" "}
                        </strong>
                        {item.retail}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-start gap-2 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3 text-xs leading-relaxed text-slate-800">
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600"
                      aria-hidden="true"
                    />
                    <span>
                      <strong className="font-semibold text-emerald-950">
                        En vuki:{" "}
                      </strong>
                      {item.vuki}
                    </span>
                  </div>
                </div>
              </Aparecer>
            ))}
          </div>

          {/* Cinta resumen concisa */}
          <Aparecer retraso={0.16} className="mt-6">
            <div className="flex flex-col items-start justify-between gap-4 rounded-3xl border border-sky-200/80 bg-gradient-to-r from-sky-50/90 via-white to-emerald-50/80 px-6 py-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm font-medium text-slate-800">
                  Ya sea reservando{" "}
                  <strong className="font-bold text-slate-950">
                    fecha, hora y cupo limitado
                  </strong>{" "}
                  o cobrando{" "}
                  <strong className="font-bold text-slate-950">
                    ítems rápidos en una feria
                  </strong>
                  , vuki está construido para tu operación en Costa Rica.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-1.5">
                {["0% comisión", "Reserva manual SINPE", "CSV D-104"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </Aparecer>
        </div>
      </section>
    </>
  );
}
