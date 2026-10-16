import type {
  BloqueoExcepcion,
  Horario,
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
    slug: "surf-tamarindo",
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
    monto_usd: 45,
  },
];

export const mockBloqueos: BloqueoExcepcion[] = [];

function horarioSemilla(
  n: number,
  servicio_id: string,
  dias: number,
  hora: number,
  minutos = 0,
): Horario {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  fecha.setHours(hora, minutos, 0, 0);
  return {
    id: `44444444-4444-4444-8444-${String(n).padStart(12, "0")}`,
    negocio_id: "11111111-1111-4111-8111-111111111111",
    servicio_id,
    fecha_hora: fecha.toISOString(),
    cupos_totales: 6,
  };
}

const SERVICIO_CLASE = "22222222-2222-4222-8222-222222222221";
const SERVICIO_TABLA = "22222222-2222-4222-8222-222222222222";

export const mockHorarios: Horario[] = [
  horarioSemilla(1, SERVICIO_CLASE, 1, 8),
  horarioSemilla(2, SERVICIO_CLASE, 1, 11),
  horarioSemilla(3, SERVICIO_CLASE, 1, 15),
  horarioSemilla(4, SERVICIO_CLASE, 2, 9),
  horarioSemilla(5, SERVICIO_TABLA, 1, 9),
  horarioSemilla(6, SERVICIO_TABLA, 2, 9),
];
