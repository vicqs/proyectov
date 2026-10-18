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
