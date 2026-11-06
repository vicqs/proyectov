import "server-only";

import { cache } from "react";
import type { ConfiguracionPlataforma, Negocio, Plan } from "../types/database";
import { leer, leerUno } from "./data/server";

export const PRECIO_POR_DEFECTO_USD = 15;

/** Rutas de primer nivel que un negocio nunca puede usar como slug. */
export const SLUGS_RESERVADOS_BASE = [
  "admin",
  "empresa",
  "login",
  "recuperar",
  "restablecer",
  "auth",
  "api",
  "reserva",
  "pago-simulado",
  "privacidad",
  "terminos",
  "humans.txt",
  "robots.txt",
  "sitemap.xml",
  "favicon.ico",
  "icon.svg",
  "apple-icon",
  "opengraph-image",
  "_next",
  "static",
  "public",
];

/** Banderas de funcionalidad conocidas (todas activas por defecto). */
export const FLAGS_CONOCIDOS: {
  clave: string;
  etiqueta: string;
  ayuda: string;
  /** Se puede ajustar por plan y por negocio (si no, es solo global). */
  porNegocio?: boolean;
}[] = [
  {
    clave: "reservas_publicas",
    etiqueta: "Reservas públicas",
    ayuda:
      "Permite a los turistas reservar. Desactivar bloquea todas las reservas nuevas.",
  },
  {
    clave: "soporte_empresas",
    etiqueta: "Soporte para empresas",
    porNegocio: true,
    ayuda: "Muestra la sección de tickets de soporte en el panel de empresa.",
  },
  {
    clave: "reportes_publicos",
    etiqueta: "Reportes de perfiles",
    porNegocio: true,
    ayuda: "Muestra el enlace «Reportar este perfil» en la página pública.",
  },
];

export const CONFIG_POR_DEFECTO: ConfiguracionPlataforma = {
  id: 1,
  dias_prueba: 14,
  slugs_reservados: [],
  max_cupos_horario: 500,
  max_imagen_mb: 2,
  modo_mantenimiento: false,
  mensaje_mantenimiento: null,
  pagos_simulados: false,
  flags: {},
  plantillas_correo: {},
  terminos_texto: null,
  privacidad_texto: null,
};

/**
 * Una configuración ausente o inaccesible debe detener la operación, no
 * reactivar reservas ni ignorar mantenimiento con valores de respaldo.
 */
export const obtenerConfiguracion = cache(
  async (): Promise<ConfiguracionPlataforma> => {
    const fila = await leerUno("configuracion_plataforma", { eq: { id: 1 } });
    if (!fila) throw new Error("Falta la configuracion de plataforma. Ejecuta supabase/schema.sql y supabase/seed.sql.");
    return fila;
  },
);

export function flagActiva(
  config: ConfiguracionPlataforma,
  clave: string,
): boolean {
  return config.flags[clave] ?? true;
}

/** Claves de funciones configurables por plan y por negocio. */
export const FLAGS_POR_NEGOCIO = FLAGS_CONOCIDOS.filter((f) => f.porNegocio);

/**
 * Resuelve si una función está activa para un negocio. Orden: la bandera
 * global apagada vence a todo; luego el ajuste del negocio; luego el del
 * plan; por defecto, activa.
 */
export function funcionActiva(
  config: ConfiguracionPlataforma,
  negocio: Pick<Negocio, "plan_id" | "descuento_pct" | "flags_override">,
  planes: Plan[],
  clave: string,
): boolean {
  if (!flagActiva(config, clave)) return false;
  const propio = negocio.flags_override?.[clave];
  if (propio !== undefined) return propio;
  const { plan } = calcularPrecio(negocio, planes);
  return plan.flags?.[clave] ?? true;
}

/** Versión asíncrona que carga configuración y planes (cacheados por request). */
export async function funcionActivaNegocio(
  negocio: Pick<Negocio, "plan_id" | "descuento_pct" | "flags_override">,
  clave: string,
): Promise<boolean> {
  const [config, planes] = await Promise.all([
    obtenerConfiguracion(),
    listarPlanes(),
  ]);
  return funcionActiva(config, negocio, planes, clave);
}

/** `true` si el slug choca con una ruta de la app o con la lista configurable. */
export async function slugReservado(slug: string): Promise<boolean> {
  const config = await obtenerConfiguracion();
  const s = slug.toLowerCase();
  return (
    SLUGS_RESERVADOS_BASE.includes(s) ||
    config.slugs_reservados.map((x) => x.toLowerCase()).includes(s)
  );
}

const PLAN_RESPALDO: Plan = {
  id: "respaldo",
  nombre: "Plan vuki",
  precio_usd: PRECIO_POR_DEFECTO_USD,
  stripe_price_id: null,
  activo: true,
  por_defecto: true,
};

export const listarPlanes = cache(async (): Promise<Plan[]> => {
  return leer("planes");
});

export interface PrecioNegocio {
  plan: Plan;
  /** Precio de lista del plan. */
  precioLista: number;
  descuentoPct: number;
  /** Precio mensual a cobrar tras el descuento. */
  precio: number;
}

/** Plan efectivo del negocio (el suyo o el predeterminado) con su descuento. */
export async function precioDelNegocio(
  negocio: Pick<Negocio, "plan_id" | "descuento_pct">,
): Promise<PrecioNegocio> {
  return calcularPrecio(negocio, await listarPlanes());
}

/** Versión síncrona para cálculos masivos con los planes ya cargados. */
export function calcularPrecio(
  negocio: Pick<Negocio, "plan_id" | "descuento_pct">,
  planes: Plan[],
): PrecioNegocio {
  const plan =
    planes.find((p) => p.id === negocio.plan_id) ??
    planes.find((p) => p.por_defecto) ??
    PLAN_RESPALDO;
  const descuentoPct = Math.min(Math.max(negocio.descuento_pct ?? 0, 0), 100);
  const precio = Math.round(plan.precio_usd * (100 - descuentoPct)) / 100;
  return { plan, precioLista: plan.precio_usd, descuentoPct, precio };
}
