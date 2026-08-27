"use client";

/**
 * @copyright © 2026 Victor Quiros Suarez. Todos los derechos reservados.
 * @author Victor Quiros Suarez
 * @license Propietario — prohibida su reproducción, distribución o
 * modificación sin autorización expresa del autor.
 */

import { create } from "zustand";
import { mockNegocio } from "./mockData";

/**
 * Store simulado unificado para todo el panel `/demo/admin/*` (servicios,
 * horarios con cupos, reservas detalladas y suscripción). Estado 100%
 * "in-memory" con Zustand: no se persiste en `localStorage` ni en ninguna
 * base de datos, por lo que se reinicia a los datos semilla con cada
 * recarga de página (F5), tal como corresponde a un prototipo Mock MVP.
 */

export interface DemoServicio {
  id: string;
  nombre: string;
  descripcion: string;
  precioUsd: number;
  duracionMin: number;
  imagenUrl: string;
}

export interface DemoHorario {
  id: string;
  servicioId: string;
  /** Etiqueta legible, ej. "Hoy 2:00 PM" */
  label: string;
  fechaHora: string; // ISO string
  cuposTotales: number;
  cuposDisponibles: number;
}

export type EstadoSuscripcionDemo = "activa" | "inactiva" | "prueba";

export interface DemoReserva {
  id: string;
  horarioId: string;
  servicioId: string;
  nombreCliente: string;
  emailCliente: string;
  cantidadCuposReservados: number;
  montoPagado: number;
  fechaReserva: string; // ISO string
  estado: "pagado";
}

export interface DemoSuscripcion {
  estado: EstadoSuscripcionDemo;
  fechaProximoCobro: string; // ISO string
}

export interface DemoStoreData {
  servicios: DemoServicio[];
  horarios: DemoHorario[];
  reservas: DemoReserva[];
  suscripcion: DemoSuscripcion;
}

function proximoMesIso(): string {
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() + 1);
  return fecha.toISOString();
}

/**
 * Formatea la hora manualmente (en vez de `toLocaleTimeString`) para
 * evitar mismatches de hidratación: Node (servidor) y el navegador pueden
 * usar datos ICU distintos para el mismo locale y producir textos ligeramente
 * diferentes (ej. espacio antes de "a. m."), lo que rompe la hidratación de
 * React al no coincidir el HTML del servidor con el del cliente.
 */
function formatearHora12(hora: number, minutos: number): string {
  const horaNormalizada = hora % 12 === 0 ? 12 : hora % 12;
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  const minutosTexto =
    minutos === 0 ? "" : `:${String(minutos).padStart(2, "0")}`;
  return `${horaNormalizada}${minutosTexto} ${sufijo}`;
}

function horarioSemilla(
  servicioId: string,
  diasDesdeHoy: number,
  hora: number,
  minutos = 0,
  cuposTotales = 6,
  cuposDisponibles: number = cuposTotales,
): DemoHorario {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  fecha.setHours(hora, minutos, 0, 0);

  const etiquetaDia = diasDesdeHoy === 0 ? "Hoy" : "Mañana";
  const etiquetaHora = formatearHora12(hora, minutos);

  return {
    // Incluye el servicioId en el id para evitar colisiones cuando dos
    // servicios distintos comparten exactamente la misma fecha/hora.
    id: `horario-${servicioId}-${fecha.getTime()}`,
    servicioId,
    label: `${etiquetaDia} ${etiquetaHora}`,
    fechaHora: fecha.toISOString(),
    cuposTotales,
    cuposDisponibles,
  };
}

/** Fecha/hora ISO relativa a "ahora", usada para el historial de reservas semilla. */
function haceHoras(horas: number): string {
  const fecha = new Date();
  fecha.setHours(fecha.getHours() - horas);
  return fecha.toISOString();
}

/** Datos semilla para "Tamarindo Surf School" (slug: surf-tamarindo). */
function datosSemilla(): DemoStoreData {
  const [servicioSurf, servicioTabla] = mockNegocio.servicios;

  // Servicios adicionales para que la demo de ventas luzca activa y variada.
  const servicioPrivada: DemoServicio = {
    id: "servicio-privada-1on1",
    nombre: "Clase Privada de Surf (1-on-1)",
    descripcion:
      "Clase individual con instructor dedicado 100% a ti. Ideal para progresar rápido o para quienes prefieren atención personalizada.",
    precioUsd: 90,
    duracionMin: 90,
    imagenUrl:
      "https://images.unsplash.com/photo-1455729552865-3658a5d39692?q=80&w=1200&auto=format&fit=crop",
  };

  const servicioAtardecer: DemoServicio = {
    id: "servicio-atardecer-foto",
    nombre: "Sesión de Surf al Atardecer + Fotografía",
    descripcion:
      "Clase grupal al atardecer con un fotógrafo profesional que captura tus mejores olas. Incluye galería digital.",
    precioUsd: 85,
    duracionMin: 120,
    imagenUrl:
      "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1200&auto=format&fit=crop",
  };

  const servicioInfantil: DemoServicio = {
    id: "servicio-infantil-groms",
    nombre: "Clase de Surf Infantil (Groms 5-12 años)",
    descripcion:
      "Clase grupal diseñada para niños, con instructores certificados en enseñanza infantil y equipo adaptado a su tamaño.",
    precioUsd: 65,
    duracionMin: 90,
    imagenUrl:
      "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=1200&auto=format&fit=crop",
  };

  const servicioTablaPremium: DemoServicio = {
    id: "servicio-tabla-premium",
    nombre: "Alquiler Tabla Premium (Día Completo)",
    descripcion:
      "Alquiler de tabla de gama alta por el día completo (8 horas), incluye leash, quilla y funda protectora.",
    precioUsd: 35,
    duracionMin: 480,
    imagenUrl:
      "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?q=80&w=1200&auto=format&fit=crop",
  };

  // --- Horarios (con cupos ya descontados según las reservas semilla) ---
  const horarioSurfHoy9am = horarioSemilla(servicioSurf.id, 0, 9, 0, 5, 3); // 2 cupos ya reservados (Emma Wilson)
  const horarioSurfHoy2pm = horarioSemilla(servicioSurf.id, 0, 14, 0, 5);
  const horarioSurfManana8am = horarioSemilla(servicioSurf.id, 1, 8, 0, 4);
  const horarioTablaHoy10am = horarioSemilla(servicioTabla.id, 0, 10, 0, 8);
  const horarioTablaManana330pm = horarioSemilla(
    servicioTabla.id,
    1,
    15,
    30,
    8,
  );
  const horarioPrivadaHoy11am = horarioSemilla(
    servicioPrivada.id,
    0,
    11,
    0,
    1,
    0,
  ); // cuposTotales: 1, agotado (Mike Johnson)
  const horarioAtardecerHoy5pm = horarioSemilla(
    servicioAtardecer.id,
    0,
    17,
    0,
    8,
    6,
  ); // 2 cupos ya reservados (Sarah Connor)
  const horarioInfantilManana10am = horarioSemilla(
    servicioInfantil.id,
    1,
    10,
    0,
    6,
    3,
  ); // 3 cupos ya reservados (Familia Dubois)
  const horarioTablaPremiumHoy930am = horarioSemilla(
    servicioTablaPremium.id,
    0,
    9,
    30,
    3,
  );

  return {
    servicios: [
      ...mockNegocio.servicios.map((s) => ({ ...s })),
      servicioPrivada,
      servicioAtardecer,
      servicioInfantil,
      servicioTablaPremium,
    ],
    horarios: [
      horarioSurfHoy9am,
      horarioSurfHoy2pm,
      horarioSurfManana8am,
      horarioTablaHoy10am,
      horarioTablaManana330pm,
      horarioPrivadaHoy11am,
      horarioAtardecerHoy5pm,
      horarioInfantilManana10am,
      horarioTablaPremiumHoy930am,
    ],
    reservas: [
      {
        id: "reserva-semilla-emma-wilson",
        horarioId: horarioSurfHoy9am.id,
        servicioId: servicioSurf.id,
        nombreCliente: "Emma Wilson (GBR)",
        emailCliente: "emma.wilson@example.com",
        cantidadCuposReservados: 2,
        montoPagado: servicioSurf.precioUsd * 2,
        fechaReserva: haceHoras(20),
        estado: "pagado",
      },
      {
        id: "reserva-semilla-sarah-connor",
        horarioId: horarioAtardecerHoy5pm.id,
        servicioId: servicioAtardecer.id,
        nombreCliente: "Sarah Connor (USA)",
        emailCliente: "sarah.connor@example.com",
        cantidadCuposReservados: 2,
        montoPagado: servicioAtardecer.precioUsd * 2,
        fechaReserva: haceHoras(6),
        estado: "pagado",
      },
      {
        id: "reserva-semilla-mike-johnson",
        horarioId: horarioPrivadaHoy11am.id,
        servicioId: servicioPrivada.id,
        nombreCliente: "Mike Johnson (CAN)",
        emailCliente: "mike.johnson@example.com",
        cantidadCuposReservados: 1,
        montoPagado: servicioPrivada.precioUsd,
        fechaReserva: haceHoras(3),
        estado: "pagado",
      },
      {
        id: "reserva-semilla-familia-dubois",
        horarioId: horarioInfantilManana10am.id,
        servicioId: servicioInfantil.id,
        nombreCliente: "Familia Dubois (FRA)",
        emailCliente: "dubois.famille@example.com",
        cantidadCuposReservados: 3,
        montoPagado: servicioInfantil.precioUsd * 3,
        fechaReserva: haceHoras(15),
        estado: "pagado",
      },
    ],
    suscripcion: { estado: "prueba", fechaProximoCobro: proximoMesIso() },
  };
}

interface DemoStoreState {
  /** Datos por negocio (por slug), 100% en memoria. */
  negocios: Record<string, DemoStoreData>;
  _asegurarNegocio: (slug: string) => DemoStoreData;
  crearServicio: (
    slug: string,
    datos: Omit<DemoServicio, "id">,
  ) => DemoServicio;
  editarServicio: (
    slug: string,
    servicioId: string,
    cambios: Omit<DemoServicio, "id">,
  ) => void;
  eliminarServicio: (slug: string, servicioId: string) => void;
  crearHorario: (
    slug: string,
    datos: { servicioId: string; fechaHoraIso: string; cuposTotales: number },
  ) => DemoHorario;
  eliminarHorario: (slug: string, horarioId: string) => void;
  crearReserva: (
    slug: string,
    datos: {
      horarioId: string;
      servicioId: string;
      nombreCliente: string;
      emailCliente: string;
      cantidadCuposReservados: number;
      montoPagado: number;
    },
  ) => DemoReserva;
  activarSuscripcion: (slug: string) => void;
  cancelarSuscripcion: (slug: string) => void;
}

/**
 * Store Zustand interno. No se expone directamente: la app consume la
 * data reactiva a través del hook `useDemoStore(slug)` y las acciones
 * exportadas como funciones sueltas (mismo patrón que antes, ahora
 * respaldado por Zustand en vez de `useSyncExternalStore` + localStorage).
 */
const useStoreInterno = create<DemoStoreState>()((set, get) => ({
  negocios: {},

  _asegurarNegocio: (slug) => {
    const existente = get().negocios[slug];
    if (existente) return existente;
    const semilla = datosSemilla();
    set((estado) => ({
      negocios: { ...estado.negocios, [slug]: semilla },
    }));
    return semilla;
  },

  crearServicio: (slug, datos) => {
    get()._asegurarNegocio(slug);
    const nuevo: DemoServicio = { ...datos, id: `servicio-${Date.now()}` };
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: { ...previo, servicios: [...previo.servicios, nuevo] },
        },
      };
    });
    return nuevo;
  },

  editarServicio: (slug, servicioId, cambios) => {
    get()._asegurarNegocio(slug);
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: {
            ...previo,
            servicios: previo.servicios.map((s) =>
              s.id === servicioId ? { ...s, ...cambios } : s,
            ),
          },
        },
      };
    });
  },

  eliminarServicio: (slug, servicioId) => {
    get()._asegurarNegocio(slug);
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: {
            ...previo,
            servicios: previo.servicios.filter((s) => s.id !== servicioId),
            horarios: previo.horarios.filter(
              (h) => h.servicioId !== servicioId,
            ),
          },
        },
      };
    });
  },

  crearHorario: (slug, datos) => {
    get()._asegurarNegocio(slug);
    const fecha = new Date(datos.fechaHoraIso);
    const label = fecha.toLocaleString("es-CR", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const nuevo: DemoHorario = {
      id: fecha.toISOString(),
      servicioId: datos.servicioId,
      label,
      fechaHora: fecha.toISOString(),
      cuposTotales: datos.cuposTotales,
      cuposDisponibles: datos.cuposTotales,
    };
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: {
            ...previo,
            horarios: [...previo.horarios, nuevo].sort(
              (a, b) =>
                new Date(a.fechaHora).getTime() -
                new Date(b.fechaHora).getTime(),
            ),
          },
        },
      };
    });
    return nuevo;
  },

  eliminarHorario: (slug, horarioId) => {
    get()._asegurarNegocio(slug);
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: {
            ...previo,
            horarios: previo.horarios.filter((h) => h.id !== horarioId),
          },
        },
      };
    });
  },

  crearReserva: (slug, datos) => {
    get()._asegurarNegocio(slug);
    const nueva: DemoReserva = {
      ...datos,
      id: `reserva-${Date.now()}`,
      fechaReserva: new Date().toISOString(),
      estado: "pagado",
    };
    set((estado) => {
      const previo = estado.negocios[slug];
      return {
        negocios: {
          ...estado.negocios,
          [slug]: {
            ...previo,
            reservas: [nueva, ...previo.reservas],
            horarios: previo.horarios.map((h) =>
              h.id === datos.horarioId
                ? {
                    ...h,
                    cuposDisponibles: Math.max(
                      0,
                      h.cuposDisponibles - datos.cantidadCuposReservados,
                    ),
                  }
                : h,
            ),
          },
        },
      };
    });
    return nueva;
  },

  activarSuscripcion: (slug) => {
    get()._asegurarNegocio(slug);
    set((estado) => ({
      negocios: {
        ...estado.negocios,
        [slug]: {
          ...estado.negocios[slug],
          suscripcion: {
            estado: "activa",
            fechaProximoCobro: proximoMesIso(),
          },
        },
      },
    }));
  },

  cancelarSuscripcion: (slug) => {
    get()._asegurarNegocio(slug);
    set((estado) => ({
      negocios: {
        ...estado.negocios,
        [slug]: {
          ...estado.negocios[slug],
          suscripcion: {
            ...estado.negocios[slug].suscripcion,
            estado: "inactiva",
          },
        },
      },
    }));
  },
}));

/** Snapshot semilla estable (misma referencia) para evitar renders extra. */
const SEMILLA_ESTABLE = datosSemilla();

/** Hook de lectura reactiva del store simulado (Zustand) de un negocio. */
export function useDemoStore(slug: string = mockNegocio.slug): DemoStoreData {
  return useStoreInterno((estado) => estado.negocios[slug] ?? SEMILLA_ESTABLE);
}

// --- Acciones: Servicios ---

export function crearServicio(
  slug: string,
  datos: Omit<DemoServicio, "id">,
): DemoServicio {
  return useStoreInterno.getState().crearServicio(slug, datos);
}

export function editarServicio(
  slug: string,
  servicioId: string,
  cambios: Omit<DemoServicio, "id">,
) {
  useStoreInterno.getState().editarServicio(slug, servicioId, cambios);
}

export function eliminarServicio(slug: string, servicioId: string) {
  useStoreInterno.getState().eliminarServicio(slug, servicioId);
}

// --- Acciones: Horarios ---

export function crearHorario(
  slug: string,
  datos: { servicioId: string; fechaHoraIso: string; cuposTotales: number },
): DemoHorario {
  return useStoreInterno.getState().crearHorario(slug, datos);
}

export function eliminarHorario(slug: string, horarioId: string) {
  useStoreInterno.getState().eliminarHorario(slug, horarioId);
}

// --- Acciones: Reservas (usadas por el checkout público) ---

export function crearReserva(
  slug: string,
  datos: {
    horarioId: string;
    servicioId: string;
    nombreCliente: string;
    emailCliente: string;
    cantidadCuposReservados: number;
    montoPagado: number;
  },
): DemoReserva {
  return useStoreInterno.getState().crearReserva(slug, datos);
}

// --- Acciones: Suscripción ---

export function activarSuscripcion(slug: string) {
  useStoreInterno.getState().activarSuscripcion(slug);
}

export function cancelarSuscripcion(slug: string) {
  useStoreInterno.getState().cancelarSuscripcion(slug);
}
