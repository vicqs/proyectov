import type {
  Anuncio,
  Auditoria,
  BloqueoExcepcion,
  Comunicado,
  ConfiguracionPlataforma,
  Horario,
  NotaInterna,
  Negocio,
  Perfil,
  Plan,
  Reembolso,
  Reserva,
  RegistroSistema,
  ReportePerfil,
  Servicio,
  Ticket,
  TicketMensaje,
} from "../../types/database";
import {
  MOCK_ADMIN_EMAIL,
  MOCK_FINANZAS_EMAIL,
  MOCK_SOPORTE_EMAIL,
  MOCK_USER_EMAIL_2,
  MOCK_ADMIN_ID,
  MOCK_FINANZAS_ID,
  MOCK_SOPORTE_ID,
  MOCK_USER_ID,
  MOCK_USER_ID_2,
  MOCK_USER_ID_3,
} from "./usuarios";

export { MOCK_USER_EMAIL, MOCK_USER_ID } from "./usuarios";

/**
 * Datos de simulación en memoria. Se reinician cada vez que el servidor de
 * desarrollo se reinicia (no persisten en disco). Sirven para poder navegar
 * y probar toda la aplicación sin tener un proyecto Supabase real todavía.
 */

const ID_NEGOCIO_1 = "11111111-1111-4111-8111-111111111111";
const ID_NEGOCIO_2 = "11111111-1111-4111-8111-111111111112";
const ID_NEGOCIO_3 = "11111111-1111-4111-8111-111111111113";

const ID_PLAN = "55555555-5555-4555-8555-555555555555";

function enDias(dias: number): string {
  return new Date(Date.now() + dias * 86_400_000).toISOString();
}

export const mockNegocios: Negocio[] = [
  {
    id: ID_NEGOCIO_1,
    user_id: MOCK_USER_ID,
    nombre: "Escuela de Surf Pura Vida",
    slug: "surf-tamarindo",
    cuenta_iban: "CR00000000000000000000",
    descripcion:
      "Clases de surf para todos los niveles frente a la playa. ¡Reserva tu cupo!",
    color_tema: "#0284c7",
    logo_url: null,
    imagen_portada_url: null,
    estado_suscripcion: "prueba",
    stripe_customer_id: null,
    prueba_hasta: enDias(14),
    creado_en: enDias(-20),
  },
  {
    id: ID_NEGOCIO_2,
    user_id: MOCK_USER_ID_2,
    nombre: "Kayak Manglar Tours",
    slug: "kayak-manglar",
    cuenta_iban: "CR11111111111111111111",
    descripcion: "Paseos en kayak por el manglar al amanecer.",
    color_tema: "#059669",
    logo_url: null,
    imagen_portada_url: null,
    estado_suscripcion: "activa",
    stripe_customer_id: "mock_cus_kayak",
    creado_en: enDias(-60),
  },
  {
    id: ID_NEGOCIO_3,
    user_id: MOCK_USER_ID_3,
    nombre: "Tour de Café Monteverde",
    slug: "cafe-monteverde",
    cuenta_iban: "CR22222222222222222222",
    descripcion: "Del grano a la taza: recorrido por una finca cafetalera.",
    color_tema: "#b45309",
    logo_url: null,
    imagen_portada_url: null,
    estado_suscripcion: "inactiva",
    stripe_customer_id: null,
    creado_en: enDias(-90),
  },
];

const SERVICIO_CLASE = "22222222-2222-4222-8222-222222222221";
const SERVICIO_TABLA = "22222222-2222-4222-8222-222222222222";
const SERVICIO_KAYAK = "22222222-2222-4222-8222-222222222223";
const SERVICIO_CAFE = "22222222-2222-4222-8222-222222222224";

export const mockServicios: Servicio[] = [
  {
    id: SERVICIO_CLASE,
    negocio_id: ID_NEGOCIO_1,
    nombre: "Clase de surf 1h",
    precio_usd: 45,
    duracion_min: 60,
  },
  {
    id: SERVICIO_TABLA,
    negocio_id: ID_NEGOCIO_1,
    nombre: "Alquiler de tabla (día completo)",
    precio_usd: 20,
    duracion_min: 480,
  },
  {
    id: SERVICIO_KAYAK,
    negocio_id: ID_NEGOCIO_2,
    nombre: "Kayak al amanecer",
    precio_usd: 35,
    duracion_min: 120,
  },
  {
    id: SERVICIO_CAFE,
    negocio_id: ID_NEGOCIO_3,
    nombre: "Tour de café",
    precio_usd: 30,
    duracion_min: 150,
  },
];

export const mockReservas: Reserva[] = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    servicio_id: SERVICIO_CLASE,
    negocio_id: ID_NEGOCIO_1,
    fecha_hora: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    email_cliente: "turista.demo@example.com",
    estado: "pagada",
    trx_id: "trx_mock_demo_1",
    monto_usd: 45,
  },
  {
    id: "33333333-3333-4333-8333-333333333334",
    servicio_id: SERVICIO_KAYAK,
    negocio_id: ID_NEGOCIO_2,
    fecha_hora: enDias(3),
    email_cliente: "viajera@example.com",
    nombre_cliente: "Viajera Demo",
    cupos: 2,
    estado: "pagada",
    trx_id: "trx_mock_demo_2",
    monto_usd: 70,
  },
  {
    id: "33333333-3333-4333-8333-333333333335",
    servicio_id: SERVICIO_KAYAK,
    negocio_id: ID_NEGOCIO_2,
    fecha_hora: enDias(-2),
    email_cliente: "pendiente@example.com",
    estado: "pendiente",
  },
];

export const mockBloqueos: BloqueoExcepcion[] = [];

function horarioSemilla(
  n: number,
  servicio_id: string,
  dias: number,
  hora: number,
  minutos = 0,
  negocio_id = ID_NEGOCIO_1,
): Horario {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, minutos, 0, 0);
  return {
    id: `44444444-4444-4444-8444-${String(n).padStart(12, "0")}`,
    negocio_id,
    servicio_id,
    fecha_hora: fecha.toISOString(),
    cupos_totales: 6,
  };
}

export const mockHorarios: Horario[] = [
  horarioSemilla(1, SERVICIO_CLASE, 1, 8),
  horarioSemilla(2, SERVICIO_CLASE, 1, 11),
  horarioSemilla(3, SERVICIO_CLASE, 1, 15),
  horarioSemilla(4, SERVICIO_CLASE, 2, 9),
  horarioSemilla(5, SERVICIO_TABLA, 1, 9),
  horarioSemilla(6, SERVICIO_TABLA, 2, 9),
  horarioSemilla(7, SERVICIO_KAYAK, 3, 6, 0, ID_NEGOCIO_2),
];

// ---------------------------------------------------------------------------
// Plataforma (administración global)
// ---------------------------------------------------------------------------

export const mockPerfiles: Perfil[] = [
  {
    user_id: MOCK_ADMIN_ID,
    email: MOCK_ADMIN_EMAIL,
    rol_admin: "superadmin",
    bloqueado: false,
    sesiones_revocadas_desde: null,
  },
  {
    user_id: MOCK_FINANZAS_ID,
    email: MOCK_FINANZAS_EMAIL,
    rol_admin: "finanzas",
    bloqueado: false,
    sesiones_revocadas_desde: null,
  },
  {
    user_id: MOCK_SOPORTE_ID,
    email: MOCK_SOPORTE_EMAIL,
    rol_admin: "soporte",
    bloqueado: false,
    sesiones_revocadas_desde: null,
  },
];

export const mockPlanes: Plan[] = [
  {
    id: ID_PLAN,
    nombre: "Plan Turismo Link",
    precio_usd: 15,
    stripe_price_id: null,
    activo: true,
    por_defecto: true,
  },
];

export const mockAuditoria: Auditoria[] = [];

export const mockConfiguracion: ConfiguracionPlataforma[] = [
  {
    id: 1,
    dias_prueba: 14,
    slugs_reservados: [],
    max_cupos_horario: 500,
    max_imagen_mb: 2,
    modo_mantenimiento: false,
    mensaje_mantenimiento: null,
    flags: {
      reservas_publicas: true,
      soporte_empresas: true,
      reportes_publicos: true,
    },
    plantillas_correo: {},
    terminos_texto: null,
    privacidad_texto: null,
  },
];

export const mockAnuncios: Anuncio[] = [];
export const mockComunicados: Comunicado[] = [];

export const mockTickets: Ticket[] = [
  {
    id: "66666666-6666-4666-8666-666666666661",
    negocio_id: ID_NEGOCIO_2,
    asunto: "No puedo subir mi logo",
    estado: "abierto",
    prioridad: "normal",
    creado_por: MOCK_USER_EMAIL_2,
    creado_en: enDias(-1),
    actualizado_en: enDias(-1),
  },
];

export const mockTicketMensajes: TicketMensaje[] = [
  {
    id: "66666666-6666-4666-8666-666666666662",
    ticket_id: "66666666-6666-4666-8666-666666666661",
    autor_tipo: "empresa",
    autor_email: MOCK_USER_EMAIL_2,
    mensaje: "Al subir el logo aparece un error. ¿Pueden revisarlo?",
    creado_en: enDias(-1),
  },
];

export const mockNotas: NotaInterna[] = [];

export const mockReportes: ReportePerfil[] = [
  {
    id: "77777777-7777-4777-8777-777777777771",
    negocio_id: ID_NEGOCIO_3,
    motivo: "Información engañosa",
    detalle: "El precio publicado no coincide con el cobrado.",
    email_reportante: "cliente@example.com",
    estado: "pendiente",
    resuelto_por: null,
    creado_en: enDias(-3),
  },
];

export const mockRegistroSistema: RegistroSistema[] = [];
export const mockReembolsos: Reembolso[] = [];
