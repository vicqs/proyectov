"use server";

import { z } from "zod";
import {
  accionAdmin,
  requerirAdmin,
  type ResultadoAccion,
} from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, insertar, leer, leerUno } from "../../lib/admin/db";
import { campo, revalidarAdmin } from "../../lib/admin/util";
import { revalidatePath } from "next/cache";
import type { TicketMensaje } from "../../types/database";

const ESTADOS = ["abierto", "en_curso", "resuelto", "cerrado"] as const;
const PRIORIDADES = ["baja", "normal", "alta"] as const;

export async function cargarMensajesTicketAction(
  ticketId: string,
): Promise<TicketMensaje[]> {
  await requerirAdmin("soporte");
  return leer("ticket_mensajes", {
    eq: { ticket_id: ticketId },
    orden: ["creado_en", true],
  });
}

export async function responderTicketAdminAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("soporte", async (admin) => {
    const mensaje = campo(datos, "mensaje");
    if (mensaje.length < 2) return { error: "Escribe una respuesta." };
    if (mensaje.length > 4000)
      return { error: "La respuesta es demasiado larga." };
    const ticket = await leerUno("tickets", { eq: { id } });
    if (!ticket) return { error: "Ticket no encontrado." };
    await insertar("ticket_mensajes", {
      ticket_id: id,
      autor_tipo: "admin",
      autor_email: admin.email,
      mensaje,
    });

    const estadoCrudo = campo(datos, "estado");
    const prioridadCruda = campo(datos, "prioridad");

    const estadoFinal = (ESTADOS as readonly string[]).includes(estadoCrudo)
      ? (estadoCrudo as (typeof ESTADOS)[number])
      : ticket.estado === "abierto"
        ? "en_curso"
        : ticket.estado;

    const prioridadFinal = (PRIORIDADES as readonly string[]).includes(prioridadCruda)
      ? (prioridadCruda as (typeof PRIORIDADES)[number])
      : ticket.prioridad;

    await actualizar(
      "tickets",
      {
        estado: estadoFinal,
        prioridad: prioridadFinal,
        actualizado_en: new Date().toISOString(),
      },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "ticket.responder",
      entidad: "ticket",
      entidad_id: id,
      negocio_id: ticket.negocio_id,
      detalle: { estado: estadoFinal, prioridad: prioridadFinal },
    });
    revalidarAdmin();
    revalidatePath("/[slug]/admin/soporte", "page");
    return { ok: "Respuesta enviada." };
  });
}

export async function actualizarTicketAction(
  id: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  return accionAdmin("soporte", async (admin) => {
    const parsed = z
      .object({ estado: z.enum(ESTADOS), prioridad: z.enum(PRIORIDADES) })
      .safeParse({
        estado: campo(datos, "estado"),
        prioridad: campo(datos, "prioridad"),
      });
    if (!parsed.success) return { error: "Estado o prioridad inválidos." };
    const ticket = await leerUno("tickets", { eq: { id } });
    if (!ticket) return { error: "Ticket no encontrado." };
    await actualizar(
      "tickets",
      { ...parsed.data, actualizado_en: new Date().toISOString() },
      { id },
    );
    await registrarAuditoria(admin, {
      accion: "ticket.actualizar",
      entidad: "ticket",
      entidad_id: id,
      negocio_id: ticket.negocio_id,
      detalle: parsed.data,
    });
    revalidarAdmin();
    revalidatePath("/[slug]/admin/soporte", "page");
    return { ok: "Ticket actualizado." };
  });
}
