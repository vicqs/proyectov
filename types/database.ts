/**
 * Tipos generados a partir del esquema relacional de Supabase (PostgreSQL).
 * Arquitectura multi-tenant: todo dato de dominio está aislado por `negocio_id`.
 */

export type EstadoReserva = "pendiente" | "pagada" | "cancelada";

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
  /** Segundo color de marca (HEX); si es null se usa el principal. */
  color_secundario?: string | null;
  logo_url: string | null;
  imagen_portada_url: string | null;
  whatsapp?: string | null; // Solo dígitos con código de país, ej. 50688887777
  estado_suscripcion: EstadoSuscripcion;
  stripe_customer_id: string | null;
  /** Suspensión impuesta por la administración global (oculta el perfil y bloquea el panel). */
  suspendido?: boolean;
  motivo_suspension?: string | null;
  /** Borrado lógico: el negocio deja de existir para empresa y público. */
  eliminado_en?: string | null;
  /** Plan contratado; si es null aplica el plan por defecto. */
  plan_id?: string | null;
  /** Descuento (0-100) aplicado por la administración global. */
  descuento_pct?: number;
  /** Funciones forzadas para este negocio (prevalecen sobre las del plan). */
  flags_override?: Record<string, boolean>;
  /** Fin del periodo de prueba; pasado ese instante la suscripción en prueba se considera inactiva. */
  prueba_hasta?: string | null;
  /** Fecha del próximo cobro mensual (suscripción activa); Stripe lo cobra automáticamente. */
  proximo_cobro?: string | null;
  creado_en?: string;
};

/** Roles internos del equipo de administración global. */
export type RolAdmin = "superadmin" | "finanzas" | "soporte";

/** Banderas por usuario gestionadas por la plataforma (rol interno, bloqueo, sesiones). */
export type Perfil = {
  user_id: string;
  email: string;
  rol_admin: RolAdmin | null;
  bloqueado: boolean;
  /** Las sesiones iniciadas hasta este instante dejan de ser válidas. */
  sesiones_revocadas_desde: string | null;
  creado_en?: string;
};

export type Plan = {
  id: string;
  nombre: string;
  precio_usd: number;
  stripe_price_id: string | null;
  activo: boolean;
  por_defecto: boolean;
  /** Funciones incluidas en el plan; las ausentes se consideran activas. */
  flags?: Record<string, boolean>;
  creado_en?: string;
};

export type Auditoria = {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_rol: string;
  accion: string;
  entidad: string;
  entidad_id: string | null;
  negocio_id: string | null;
  detalle: Record<string, unknown> | null;
  creado_en: string;
};

export type PlantillaCorreo = {
  asunto?: string;
  encabezado?: string;
  pie?: string;
};

export type ConfiguracionPlataforma = {
  id: number; // siempre 1 (fila única)
  dias_prueba: number;
  slugs_reservados: string[];
  max_cupos_horario: number;
  max_imagen_mb: number;
  modo_mantenimiento: boolean;
  mensaje_mantenimiento: string | null;
  flags: Record<string, boolean>;
  plantillas_correo: Record<string, PlantillaCorreo>;
  terminos_texto: string | null;
  privacidad_texto: string | null;
  actualizado_en?: string;
};

export type SeveridadAnuncio = "info" | "aviso" | "critico";
export type SegmentoComunicacion = "todas" | "prueba" | "activa" | "inactiva";

export type Anuncio = {
  id: string;
  titulo: string;
  mensaje: string;
  severidad: SeveridadAnuncio;
  segmento: SegmentoComunicacion;
  activo: boolean;
  expira_en: string | null;
  creado_por: string;
  creado_en: string;
};

export type Comunicado = {
  id: string;
  asunto: string;
  mensaje: string;
  segmento: SegmentoComunicacion;
  destinatarios: number;
  enviados: number;
  fallidos: number;
  creado_por: string;
  creado_en: string;
};

export type EstadoTicket = "abierto" | "en_curso" | "resuelto" | "cerrado";
export type PrioridadTicket = "baja" | "normal" | "alta";

export type Ticket = {
  id: string;
  negocio_id: string;
  asunto: string;
  estado: EstadoTicket;
  prioridad: PrioridadTicket;
  creado_por: string;
  creado_en: string;
  actualizado_en: string;
};

export type TicketMensaje = {
  id: string;
  ticket_id: string;
  autor_tipo: "empresa" | "admin";
  autor_email: string;
  mensaje: string;
  creado_en: string;
};

export type NotaInterna = {
  id: string;
  negocio_id: string;
  autor_email: string;
  texto: string;
  creado_en: string;
};

export type EstadoReporte = "pendiente" | "descartado" | "atendido";

export type ReportePerfil = {
  id: string;
  negocio_id: string;
  motivo: string;
  detalle: string | null;
  email_reportante: string | null;
  estado: EstadoReporte;
  resuelto_por: string | null;
  creado_en: string;
};

export type TipoRegistroSistema = "webhook" | "correo" | "error";

export type RegistroSistema = {
  id: string;
  tipo: TipoRegistroSistema;
  origen: string;
  estado: "ok" | "error";
  detalle: string | null;
  payload: Record<string, unknown> | null;
  resuelto: boolean;
  creado_en: string;
};

export type Reembolso = {
  id: string;
  reserva_id: string;
  negocio_id: string;
  monto_usd: number;
  motivo: string;
  estado: "pendiente" | "completado";
  creado_por: string;
  creado_en: string;
};

export type Servicio = {
  id: string; // UUID
  negocio_id: string; // UUID (FK -> negocios.id)
  nombre: string;
  precio_usd: number; // Decimal
  duracion_min: number;
  descripcion?: string | null;
  imagen_url?: string | null;
};

export type Reserva = {
  id: string; // UUID
  servicio_id: string; // UUID (FK -> servicios.id)
  negocio_id: string; // UUID (FK -> negocios.id)
  fecha_hora: string; // Timestamptz (ISO string)
  email_cliente: string;
  nombre_cliente?: string | null;
  cupos?: number; // Cupos reservados (por defecto 1)
  token_gestion?: string | null; // Token secreto para que el turista gestione su reserva
  estado: EstadoReserva;
  trx_id?: string | null;
  monto_usd?: number | null; // Monto cobrado al momento del pago (precio × cupos)
};

/** Reserva extendida con el nombre del servicio (JOIN reservas + servicios). */
export interface ReservaConServicio extends Reserva {
  servicio: Pick<Servicio, "nombre" | "precio_usd"> | null;
}

export type BloqueoExcepcion = {
  id: string; // UUID
  negocio_id: string; // UUID (FK -> negocios.id)
  fecha_inicio: string; // Timestamptz (ISO string)
  fecha_fin: string; // Timestamptz (ISO string)
  motivo: string;
};

/** Franja horaria reservable de un servicio, con cupos totales. */
export type Horario = {
  id: string; // UUID
  negocio_id: string; // UUID (FK -> negocios.id)
  servicio_id: string; // UUID (FK -> servicios.id)
  fecha_hora: string; // Timestamptz (ISO string)
  cupos_totales: number;
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
      horarios: {
        Row: Horario;
        Insert: Partial<Horario> &
          Pick<
            Horario,
            "negocio_id" | "servicio_id" | "fecha_hora" | "cupos_totales"
          >;
        Update: Partial<Horario>;
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
      perfiles: {
        Row: Perfil;
        Insert: Partial<Perfil> & Pick<Perfil, "user_id" | "email">;
        Update: Partial<Perfil>;
        Relationships: [];
      };
      planes: {
        Row: Plan;
        Insert: Partial<Plan> & Pick<Plan, "nombre" | "precio_usd">;
        Update: Partial<Plan>;
        Relationships: [];
      };
      auditoria: {
        Row: Auditoria;
        Insert: Partial<Auditoria> &
          Pick<
            Auditoria,
            "actor_id" | "actor_email" | "actor_rol" | "accion" | "entidad"
          >;
        Update: Partial<Auditoria>;
        Relationships: [];
      };
      configuracion_plataforma: {
        Row: ConfiguracionPlataforma;
        Insert: Partial<ConfiguracionPlataforma>;
        Update: Partial<ConfiguracionPlataforma>;
        Relationships: [];
      };
      anuncios: {
        Row: Anuncio;
        Insert: Partial<Anuncio> & Pick<Anuncio, "titulo" | "mensaje">;
        Update: Partial<Anuncio>;
        Relationships: [];
      };
      comunicados: {
        Row: Comunicado;
        Insert: Partial<Comunicado> & Pick<Comunicado, "asunto" | "mensaje">;
        Update: Partial<Comunicado>;
        Relationships: [];
      };
      tickets: {
        Row: Ticket;
        Insert: Partial<Ticket> & Pick<Ticket, "negocio_id" | "asunto">;
        Update: Partial<Ticket>;
        Relationships: [];
      };
      ticket_mensajes: {
        Row: TicketMensaje;
        Insert: Partial<TicketMensaje> &
          Pick<TicketMensaje, "ticket_id" | "autor_tipo" | "mensaje">;
        Update: Partial<TicketMensaje>;
        Relationships: [];
      };
      notas_internas: {
        Row: NotaInterna;
        Insert: Partial<NotaInterna> &
          Pick<NotaInterna, "negocio_id" | "texto">;
        Update: Partial<NotaInterna>;
        Relationships: [];
      };
      reportes_perfil: {
        Row: ReportePerfil;
        Insert: Partial<ReportePerfil> &
          Pick<ReportePerfil, "negocio_id" | "motivo">;
        Update: Partial<ReportePerfil>;
        Relationships: [];
      };
      registro_sistema: {
        Row: RegistroSistema;
        Insert: Partial<RegistroSistema> &
          Pick<RegistroSistema, "tipo" | "origen" | "estado">;
        Update: Partial<RegistroSistema>;
        Relationships: [];
      };
      reembolsos: {
        Row: Reembolso;
        Insert: Partial<Reembolso> &
          Pick<Reembolso, "reserva_id" | "negocio_id" | "monto_usd">;
        Update: Partial<Reembolso>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
