import type {
  BloqueoExcepcion,
  Negocio,
  Reserva,
  Servicio,
} from "../../types/database";

/**
 * Datos de simulación en memoria. Se reinician cada vez que el servidor de
 * desarrollo se reinicia (no persisten en disco). Sirven para poder navegar
 * y probar toda la aplicación sin tener un proyecto Supabase real todavía.
 */

export const MOCK_USER_ID = "mock-user-id-0001";
export const MOCK_USER_EMAIL = "demo@turismolink.dev";
export const MOCK_USER_PASSWORD = "demo1234";

export const mockNegocios: Negocio[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    user_id: MOCK_USER_ID,
    nombre: "Escuela de Surf Pura Vida",
    slug: "mi-escuela-de-surf",
    cuenta_iban: "CR00000000000000000000",
    descripcion:
      "Clases de surf para todos los niveles frente a la playa. ¡Reserva tu cupo!",
    color_tema: "#0284c7",
    logo_url: null,
    imagen_portada_url: null,
    estado_suscripcion: "prueba",
    stripe_customer_id: null,
  },
];

export const mockServicios: Servicio[] = [
  {
    id: "22222222-2222-4222-8222-222222222221",
    negocio_id: "11111111-1111-4111-8111-111111111111",
    nombre: "Clase de surf 1h",
    precio_usd: 45,
    duracion_min: 60,
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    negocio_id: "11111111-1111-4111-8111-111111111111",
    nombre: "Alquiler de tabla (día completo)",
    precio_usd: 20,
    duracion_min: 480,
  },
];

export const mockReservas: Reserva[] = [
  {
    id: "33333333-3333-4333-8333-333333333333",
    servicio_id: "22222222-2222-4222-8222-222222222221",
    negocio_id: "11111111-1111-4111-8111-111111111111",
    fecha_hora: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    email_cliente: "turista.demo@example.com",
    estado: "pagada",
    trx_id: "trx_mock_demo_1",
  },
];

export const mockBloqueos: BloqueoExcepcion[] = [];
