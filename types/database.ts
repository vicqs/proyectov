/**
 * Tipos generados a partir del esquema relacional de Supabase (PostgreSQL).
 * Arquitectura multi-tenant: todo dato de dominio está aislado por `negocio_id`.
 */

export type EstadoReserva = "pendiente" | "pagada";

/** Estado de la suscripción SaaS de la pyme (cobro de $15 USD/mes). */
export type EstadoSuscripcion = "activa" | "inactiva" | "prueba";

export type Negocio = {
  id: string; // UUID
  user_id: string; // UUID (FK -> auth.users.id) - dueño de la pyme, usado por RLS
  nombre: string;
  slug: string; // único, usado en la ruta pública /[slug]
  cuenta_iban: string;
  descripcion: string | null; // Biografía del negocio
  color_tema: string | null; // HEX, ej. "#0284c7"
  logo_url: string | null;
  imagen_portada_url: string | null;
  estado_suscripcion: EstadoSuscripcion;
  stripe_customer_id: string | null;
};

export type Servicio = {
  id: string; // UUID
  negocio_id: string; // UUID (FK -> negocios.id)
  nombre: string;
  precio_usd: number; // Decimal
  duracion_min: number;
};

export type Reserva = {
  id: string; // UUID
  servicio_id: string; // UUID (FK -> servicios.id)
  negocio_id: string; // UUID (FK -> negocios.id)
  fecha_hora: string; // Timestamptz (ISO string)
  email_cliente: string;
  estado: EstadoReserva;
  trx_id?: string | null;
};

/** Reserva extendida con el nombre del servicio (JOIN reservas + servicios). */
export interface ReservaConServicio extends Reserva {
  servicio: Pick<Servicio, "nombre"> | null;
}

export type BloqueoExcepcion = {
  id: string; // UUID
  negocio_id: string; // UUID (FK -> negocios.id)
  fecha_inicio: string; // Timestamptz (ISO string)
  fecha_fin: string; // Timestamptz (ISO string)
  motivo: string;
};

/**
 * Definición de tablas para tipar el cliente de Supabase (`Database['public']['Tables']`).
 * Permite tipado estricto en `.from('tabla')` con @supabase/supabase-js.
 */
export type Database = {
  public: {
    Tables: {
      negocios: {
        Row: Negocio;
        Insert: Partial<Negocio> &
          Pick<Negocio, "user_id" | "nombre" | "slug" | "cuenta_iban">;
        Update: Partial<Negocio>;
        Relationships: [];
      };
      servicios: {
        Row: Servicio;
        Insert: Partial<Servicio> &
          Pick<
            Servicio,
            "negocio_id" | "nombre" | "precio_usd" | "duracion_min"
          >;
        Update: Partial<Servicio>;
        Relationships: [];
      };
      reservas: {
        Row: Reserva;
        Insert: Partial<Reserva> &
          Pick<
            Reserva,
            | "servicio_id"
            | "negocio_id"
            | "fecha_hora"
            | "email_cliente"
            | "estado"
          >;
        Update: Partial<Reserva>;
        Relationships: [];
      };
      bloqueos_excepcion: {
        Row: BloqueoExcepcion;
        Insert: Partial<BloqueoExcepcion> &
          Pick<
            BloqueoExcepcion,
            "negocio_id" | "fecha_inicio" | "fecha_fin" | "motivo"
          >;
        Update: Partial<BloqueoExcepcion>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
