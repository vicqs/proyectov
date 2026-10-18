"use server";

import { z } from "zod";
import { accionAdmin, type ResultadoAccion } from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, insertar, leer, leerUno } from "../../lib/admin/db";
import { campo, fechaEnDias, revalidarAdmin } from "../../lib/admin/util";
import { revalidarEmpresa } from "../../lib/empresa";
import { FLAGS_POR_NEGOCIO } from "../../lib/plataforma";
import { isStripeMockMode, stripe } from "../../lib/stripe";

async function negocioODetener(id: string) {
  const negocio = await leerUno("negocios", { eq: { id } });
  if (!negocio) throw new Error("Negocio no encontrado.");
  return negocio;
}

export async function cambiarEstadoManualAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const estado = z
      .enum(["activa", "prueba", "inactiva"])
      .safeParse(campo(datos, "estado"));
    if (!estado.success) return { error: "Estado inválido." };
    const negocio = await negocioODetener(id);
    const parche: Parameters<typeof actualizar<"negocios">>[1] = {
      estado_suscripcion: estado.data,
    };
    if (estado.data === "activa") {
      parche.proximo_cobro = fechaEnDias(30);
    } else if (estado.data === "inactiva") {
      parche.proximo_cobro = null;
    } else if (
      !negocio.prueba_hasta ||
      new Date(negocio.prueba_hasta).getTime() < Date.now()
    ) {
      parche.prueba_hasta = fechaEnDias(14);
    }
    await actualizar("negocios", parche, { id });
    await registrarAuditoria(admin, {
      accion: "suscripcion.estado_manual",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { anterior: negocio.estado_suscripcion, nuevo: estado.data },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Estado de suscripción actualizado." };
  });
}

export async function asignarPlanAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const planId = campo(datos, "plan_id");
    const negocio = await negocioODetener(id);
    if (planId && !(await leerUno("planes", { eq: { id: planId } }))) {
      return { error: "Plan no encontrado." };
    }
    await actualizar("negocios", { plan_id: planId || null }, { id });
    await registrarAuditoria(admin, {
      accion: "suscripcion.plan",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { plan_id: planId || null },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Plan asignado." };
  });
}

export async function aplicarDescuentoAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const pct = z.coerce
      .number()
      .min(0, "El descuento va de 0 a 100.")
      .max(100, "El descuento va de 0 a 100.")
      .safeParse(campo(datos, "descuento_pct") || "0");
    if (!pct.success) return { error: pct.error.issues[0].message };
    const negocio = await negocioODetener(id);
    await actualizar("negocios", { descuento_pct: pct.data }, { id });
    await registrarAuditoria(admin, {
      accion: "suscripcion.descuento",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { descuento_pct: pct.data },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Descuento aplicado (rige desde el próximo cobro)." };
  });
}

export async function extenderPruebaAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const dias = z.coerce
      .number()
      .int("Usa un número entero de días.")
      .min(1, "Mínimo 1 día.")
      .max(365, "Máximo 365 días.")
      .safeParse(campo(datos, "dias"));
    if (!dias.success) return { error: dias.error.issues[0].message };
    const negocio = await negocioODetener(id);
    const base = Math.max(
      Date.now(),
      negocio.prueba_hasta ? new Date(negocio.prueba_hasta).getTime() : 0,
    );
    const pruebaHasta = fechaEnDias(dias.data, base);
    await actualizar(
      "negocios",
      {
        prueba_hasta: pruebaHasta,
        // Una prueba extendida reactiva a quien no tenía suscripción activa.
        ...(negocio.estado_suscripcion === "activa"
          ? {}
          : { estado_suscripcion: "prueba" as const }),
      },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "suscripcion.extender_prueba",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { dias: dias.data, prueba_hasta: pruebaHasta },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: `Prueba extendida hasta ${pruebaHasta.slice(0, 10)}.` };
  });
}

/** Reintenta el cobro de las facturas abiertas del cliente en Stripe. */
export async function reintentarCobroAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const negocio = await negocioODetener(id);
    if (isStripeMockMode || !stripe) {
      return {
        error:
          "Stripe está en modo simulado: no hay cobros reales que reintentar. Usa el estado manual.",
      };
    }
    if (!negocio.stripe_customer_id) {
      return { error: "El negocio aún no tiene cliente en Stripe." };
    }
    const abiertas = await stripe.invoices.list({
      customer: negocio.stripe_customer_id,
      status: "open",
      limit: 5,
    });
    if (abiertas.data.length === 0) {
      return { error: "No hay facturas abiertas que cobrar." };
    }
    let cobradas = 0;
    const fallos: string[] = [];
    for (const factura of abiertas.data) {
      if (!factura.id) continue;
      try {
        await stripe.invoices.pay(factura.id);
        cobradas++;
      } catch (e) {
        fallos.push(e instanceof Error ? e.message : "error desconocido");
      }
    }
    await registrarAuditoria(admin, {
      accion: "suscripcion.reintentar_cobro",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { cobradas, fallos },
    });
    revalidarAdmin();
    if (cobradas === 0)
      return { error: `No se pudo cobrar: ${fallos[0] ?? "sin detalle"}` };
    return {
      ok: `${cobradas} factura(s) cobrada(s). La activación llega por el webhook.`,
    };
  });
}

const esquemaPlan = z.object({
  nombre: z.string().trim().min(2, "Nombre demasiado corto").max(60),
  precio_usd: z.coerce.number().min(0, "Precio inválido").max(10000),
  stripe_price_id: z.string().trim().max(80).optional(),
});

/** Funciones del plan: casilla marcada = incluida, sin marcar = excluida. */
function flagsDePlan(datos: FormData): Record<string, boolean> {
  return Object.fromEntries(
    FLAGS_POR_NEGOCIO.map((f) => [
      f.clave,
      datos.get(`flag_${f.clave}`) === "on",
    ]),
  );
}

/** Ajustes por negocio: "on"/"off" fuerzan; vacío hereda del plan. */
export async function actualizarFuncionesNegocioAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const negocio = await negocioODetener(id);
    const override: Record<string, boolean> = {};
    for (const f of FLAGS_POR_NEGOCIO) {
      const v = campo(datos, `flag_${f.clave}`);
      if (v === "on") override[f.clave] = true;
      else if (v === "off") override[f.clave] = false;
    }
    await actualizar("negocios", { flags_override: override }, { id });
    await registrarAuditoria(admin, {
      accion: "negocio.funciones",
      entidad: "negocio",
      entidad_id: id,
      negocio_id: id,
      detalle: { flags_override: override },
    });
    revalidarAdmin();
    revalidarEmpresa(negocio.slug);
    return { ok: "Funciones actualizadas." };
  });
}

export async function crearPlanAction(
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const parsed = esquemaPlan.safeParse({
      nombre: campo(datos, "nombre"),
      precio_usd: campo(datos, "precio_usd"),
      stripe_price_id: campo(datos, "stripe_price_id") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const plan = await insertar("planes", {
      nombre: parsed.data.nombre,
      precio_usd: parsed.data.precio_usd,
      stripe_price_id: parsed.data.stripe_price_id ?? null,
      flags: flagsDePlan(datos),
      activo: true,
      por_defecto: false,
    });
    await registrarAuditoria(admin, {
      accion: "plan.crear",
      entidad: "plan",
      entidad_id: plan.id,
      detalle: { nombre: plan.nombre, precio_usd: plan.precio_usd },
    });
    revalidarAdmin();
    return { ok: "Plan creado." };
  });
}

export async function actualizarPlanAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const parsed = esquemaPlan.safeParse({
      nombre: campo(datos, "nombre"),
      precio_usd: campo(datos, "precio_usd"),
      stripe_price_id: campo(datos, "stripe_price_id") || undefined,
    });
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const plan = await leerUno("planes", { eq: { id } });
    if (!plan) return { error: "Plan no encontrado." };
    const activo = datos.get("activo") === "on";
    if (!activo && plan.por_defecto) {
      return { error: "El plan por defecto no se puede desactivar." };
    }
    await actualizar(
      "planes",
      {
        nombre: parsed.data.nombre,
        precio_usd: parsed.data.precio_usd,
        stripe_price_id: parsed.data.stripe_price_id ?? null,
        flags: flagsDePlan(datos),
        activo,
      },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "plan.actualizar",
      entidad: "plan",
      entidad_id: id,
      detalle: {
        precio_usd: parsed.data.precio_usd,
        anterior: plan.precio_usd,
        activo,
      },
    });
    revalidarAdmin();
    return { ok: "Plan actualizado (afecta a los próximos cobros)." };
  });
}

export async function marcarPlanDefectoAction(
  id: string,
  _previo: ResultadoAccion,
  _datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("facturacion", async (admin) => {
    const plan = await leerUno("planes", { eq: { id } });
    if (!plan) return { error: "Plan no encontrado." };
    if (!plan.activo)
      return { error: "Activa el plan antes de hacerlo predeterminado." };
    for (const otro of await leer("planes", { eq: { por_defecto: true } })) {
      if (otro.id !== id)
        await actualizar("planes", { por_defecto: false }, { id: otro.id });
    }
    await actualizar("planes", { por_defecto: true }, { id });
    await registrarAuditoria(admin, {
      accion: "plan.predeterminado",
      entidad: "plan",
      entidad_id: id,
    });
    revalidarAdmin();
    return { ok: "Plan predeterminado actualizado." };
  });
}
