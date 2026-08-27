/**
 * Datos 100% simulados en memoria para el prototipo de demo (sin base de
 * datos real). Pensado para mostrar el flujo completo a clientes
 * potenciales (dueños de pymes turísticas) sin depender de Supabase.
 */

export interface MockServicio {
  id: string;
  nombre: string;
  descripcion: string;
  precioUsd: number;
  duracionMin: number;
  imagenUrl: string;
}

export interface MockHorario {
  id: string;
  /** Etiqueta legible, ej. "Hoy 2:00 PM" */
  label: string;
  fechaHora: string; // ISO string
}

export interface MockNegocio {
  slug: string;
  nombre: string;
  descripcion: string;
  portadaUrl: string;
  logoUrl: string;
  colorTema: string;
  servicios: MockServicio[];
}

/**
 * Formatea la hora manualmente (en vez de `toLocaleTimeString`) para evitar
 * mismatches de hidratación entre servidor y navegador (ICU distinto para
 * el mismo locale).
 */
function formatearHora12(hora: number, minutos: number): string {
  const horaNormalizada = hora % 12 === 0 ? 12 : hora % 12;
  const sufijo = hora < 12 ? "a.m." : "p.m.";
  const minutosTexto =
    minutos === 0 ? "" : `:${String(minutos).padStart(2, "0")}`;
  return `${horaNormalizada}${minutosTexto} ${sufijo}`;
}

function horarioEn(
  diasDesdeHoy: number,
  hora: number,
  minutos = 0,
): MockHorario {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + diasDesdeHoy);
  fecha.setHours(hora, minutos, 0, 0);

  const etiquetaDia = diasDesdeHoy === 0 ? "Hoy" : "Mañana";
  const etiquetaHora = formatearHora12(hora, minutos);

  return {
    id: `${fecha.toISOString()}`,
    label: `${etiquetaDia} ${etiquetaHora}`,
    fechaHora: fecha.toISOString(),
  };
}

/** Horarios ficticios disponibles para hoy y mañana. */
export const mockHorariosDisponibles: MockHorario[] = [
  horarioEn(0, 9),
  horarioEn(0, 14),
  horarioEn(0, 16, 30),
  horarioEn(1, 8),
  horarioEn(1, 11),
  horarioEn(1, 15),
];

export const mockNegocio: MockNegocio = {
  slug: "surf-tamarindo",
  nombre: "Tamarindo Surf School",
  descripcion:
    "Clases de surf y alquiler de equipo frente a la playa de Tamarindo. Instructores certificados, todos los niveles.",
  portadaUrl:
    "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1600&auto=format&fit=crop",
  logoUrl:
    "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=200&auto=format&fit=crop",
  colorTema: "#0284c7",
  servicios: [
    {
      id: "servicio-surf-principiantes",
      nombre: "Clase de Surf para Principiantes",
      descripcion:
        "Clase grupal de 2 horas con tabla e instructor incluido. Ideal si nunca has surfeado.",
      precioUsd: 50,
      duracionMin: 120,
      imagenUrl:
        "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=1200&auto=format&fit=crop",
    },
    {
      id: "servicio-alquiler-tabla",
      nombre: "Alquiler de Tabla Medio Día",
      descripcion:
        "Alquiler de tabla de surf por 4 horas, incluye leash y quilla. Retiro en tienda.",
      precioUsd: 20,
      duracionMin: 240,
      imagenUrl:
        "https://images.unsplash.com/photo-1531722569936-825d3dd91b15?q=80&w=1200&auto=format&fit=crop",
    },
  ],
};

/** Busca un negocio simulado por su slug (equivalente a una consulta a BD). */
export function buscarNegocioPorSlug(slug: string): MockNegocio | null {
  return mockNegocio.slug === slug ? mockNegocio : null;
}
