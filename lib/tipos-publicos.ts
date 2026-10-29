export interface ServicioPublico {
  id: string;
  nombre: string;
  descripcion: string;
  precioUsd: number;
  duracionMin: number;
  imagenUrl: string;
}

export interface HorarioPublico {
  id: string;
  servicioId: string;
  /** Etiqueta legible, ej. "Hoy 2:00 PM" */
  label: string;
  fechaHora: string; // ISO string
  cuposTotales: number;
  cuposDisponibles: number;
}

export interface ReservaPublica {
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

export const PORTADA_POR_DEFECTO =
  "https://images.unsplash.com/photo-1502680390469-be75c86b636f?q=80&w=1600&auto=format&fit=crop";
export const LOGO_POR_DEFECTO =
  "https://images.unsplash.com/photo-1502933691298-84fc14542831?q=80&w=200&auto=format&fit=crop";

const HOSTS_OPTIMIZABLES = ["images.unsplash.com", "picsum.photos"];

/**
 * Indica si `next/image` puede optimizar la URL directamente (hosts propios o
 * de stock). Para URLs externas arbitrarias ingresadas por las empresas se usa
 * `unoptimized` para evitar errores de host no configurado o bloqueos 403.
 */
export function esImagenOptimizable(url: string): boolean {
  if (!url || url.startsWith("/")) return true;
  try {
    const { hostname } = new URL(url);
    return (
      HOSTS_OPTIMIZABLES.includes(hostname) || hostname.endsWith(".supabase.co")
    );
  } catch {
    return false;
  }
}
