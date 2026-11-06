import type {
  Anuncio, Auditoria, BloqueoExcepcion, Comunicado, ConfiguracionPlataforma,
  EstadoSuscripcion, FinancialTransaction, Horario, Negocio, NotaInterna,
  Perfil, Plan, Reembolso, RegistroSistema, ReportePerfil, Reserva, Servicio,
  Ticket, TicketMensaje,
} from "./database";

type Rename<Row, Names extends Partial<Record<keyof Row, string>>> = {
  [K in keyof Row as K extends keyof Names ? Extract<Names[K], string> : K]: Row[K];
};
type Timestamps = { created_at: string; updated_at: string };
type Table<Row, RequiredKeys extends keyof Row, GeneratedKeys extends keyof Row = never> = {
  Row: Row;
  Insert: Partial<Omit<Row, GeneratedKeys>> & Pick<Row, RequiredKeys>;
  Update: Partial<Omit<Row, GeneratedKeys>>;
  Relationships: [];
};
type GeneratedAmounts = "subtotal_amount" | "iva_amount" | "gateway_fee_amount" | "net_amount";

type BusinessRow = Rename<
  Omit<Required<Negocio>, "estado_suscripcion" | "stripe_customer_id" | "plan_id" | "prueba_hasta" | "proximo_cobro">,
  {
    user_id: "owner_id"; nombre: "name"; cuenta_iban: "iban"; descripcion: "description";
    color_tema: "primary_color"; color_secundario: "secondary_color"; imagen_portada_url: "cover_url";
    suspendido: "suspended"; motivo_suspension: "suspension_reason"; eliminado_en: "deleted_at";
    descuento_pct: "discount_pct"; creado_en: "created_at"; email_contacto: "contact_email";
  }
> & Timestamps;

export type SubscriptionRow = Timestamps & {
  id: string;
  business_id: string;
  plan_id: string | null;
  status: EstadoSuscripcion;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_ends_at: string | null;
  next_billing_at: string | null;
};

type ServiceRow = Rename<Required<Servicio>, {
  negocio_id: "business_id"; nombre: "name"; precio_usd: "price_usd";
  duracion_min: "duration_min"; descripcion: "description"; imagen_url: "image_url";
}> & Timestamps;
type BookingRow = Rename<Required<Reserva>, {
  negocio_id: "business_id"; servicio_id: "service_id"; horario_id: "schedule_id";
  fecha_hora: "starts_at"; email_cliente: "client_email"; nombre_cliente: "client_name";
  cupos: "quantity"; token_gestion: "management_token"; estado: "status";
  trx_id: "transaction_ref"; monto_usd: "paid_amount_usd";
}> & Timestamps;

export type SupabaseTables = {
  businesses: Table<BusinessRow, "owner_id" | "name" | "slug">;
  profiles: Table<Rename<Required<Perfil>, {
    rol_admin: "admin_role"; bloqueado: "blocked";
    sesiones_revocadas_desde: "sessions_revoked_since"; creado_en: "created_at";
  }> & Timestamps, "user_id" | "email">;
  plans: Table<Rename<Required<Plan>, {
    nombre: "name"; precio_usd: "price_usd"; activo: "active";
    por_defecto: "is_default"; creado_en: "created_at";
  }> & Timestamps, "name" | "price_usd">;
  subscriptions: Table<SubscriptionRow, "business_id">;
  services: Table<ServiceRow, "business_id" | "name" | "price_usd" | "duration_min", GeneratedAmounts | "gross_amount">;
  schedules: Table<Rename<Horario, {
    negocio_id: "business_id"; servicio_id: "service_id"; fecha_hora: "starts_at"; cupos_totales: "capacity";
  }> & Timestamps, "business_id" | "service_id" | "starts_at" | "capacity">;
  blocks: Table<Rename<BloqueoExcepcion, {
    negocio_id: "business_id"; fecha_inicio: "starts_at"; fecha_fin: "ends_at"; motivo: "reason";
  }> & Timestamps, "business_id" | "starts_at" | "ends_at" | "reason">;
  bookings: Table<BookingRow, "business_id" | "service_id" | "starts_at" | "client_email", GeneratedAmounts>;
  financial_transactions: Table<Rename<Required<FinancialTransaction>, {
    negocio_id: "business_id"; reserva_id: "booking_id"; servicio_id: "service_id"; cupos: "quantity";
  }> & Timestamps, "business_id" | "service_date" | "transaction_ref" | "service_name" | "cabys_code" | "client_email" | "iva_rate" | "gross_amount", GeneratedAmounts>;
  support_tickets: Table<Rename<Ticket, {
    negocio_id: "business_id"; asunto: "subject"; estado: "status"; prioridad: "priority";
    creado_por: "created_by_email"; creado_en: "created_at"; actualizado_en: "updated_at";
  }> & { created_by: string | null }, "business_id" | "subject">;
  ticket_messages: Table<Rename<TicketMensaje, {
    autor_tipo: "author_type"; autor_email: "author_email"; mensaje: "message"; creado_en: "created_at";
  }> & Timestamps & { author_id: string | null }, "ticket_id" | "author_type" | "message">;
  internal_notes: Table<Rename<NotaInterna, {
    negocio_id: "business_id"; autor_email: "author_email"; texto: "message"; creado_en: "created_at";
  }> & Timestamps & { author_id: string | null }, "business_id" | "message">;
  profile_reports: Table<Rename<ReportePerfil, {
    negocio_id: "business_id"; motivo: "reason"; detalle: "detail"; email_reportante: "reporter_email";
    estado: "status"; resuelto_por: "resolved_by_email"; creado_en: "created_at";
  }> & Timestamps & { resolved_by: string | null }, "business_id" | "reason">;
  announcements: Table<Rename<Anuncio, {
    titulo: "title"; mensaje: "message"; severidad: "severity"; segmento: "segment"; activo: "active";
    expira_en: "expires_at"; creado_por: "created_by_email"; creado_en: "created_at";
  }> & Timestamps & { created_by: string | null }, "title" | "message">;
  email_broadcasts: Table<Rename<Comunicado, {
    asunto: "subject"; mensaje: "message"; segmento: "segment"; destinatarios: "recipients";
    enviados: "sent"; fallidos: "failed"; creado_por: "created_by_email"; creado_en: "created_at";
  }> & Timestamps & { created_by: string | null }, "subject" | "message">;
  platform_settings: Table<Rename<Required<ConfiguracionPlataforma>, {
    dias_prueba: "trial_days"; slugs_reservados: "reserved_slugs"; max_cupos_horario: "max_schedule_capacity";
    max_imagen_mb: "max_image_mb"; modo_mantenimiento: "maintenance_mode";
    mensaje_mantenimiento: "maintenance_message"; pagos_simulados: "simulated_payments_enabled";
    plantillas_correo: "email_templates"; terminos_texto: "terms_text"; privacidad_texto: "privacy_text";
    actualizado_en: "updated_at";
  }> & Timestamps, never>;
  audit_logs: Table<Rename<Omit<Auditoria, "actor_id">, {
    actor_rol: "actor_role"; accion: "action"; entidad: "entity"; entidad_id: "entity_id";
    negocio_id: "business_id"; detalle: "detail"; creado_en: "created_at";
  }> & Timestamps & { actor_id: string | null }, "action" | "entity">;
  system_logs: Table<Rename<RegistroSistema, {
    tipo: "type"; origen: "source"; estado: "status"; detalle: "detail";
    resuelto: "resolved"; creado_en: "created_at";
  }> & Timestamps, "type" | "source" | "status">;
  refunds: Table<Rename<Reembolso, {
    reserva_id: "booking_id"; negocio_id: "business_id"; monto_usd: "amount_usd"; motivo: "reason";
    estado: "status"; creado_por: "created_by_email"; creado_en: "created_at";
  }> & Timestamps & { created_by: string | null }, "booking_id" | "business_id" | "amount_usd">;
};
