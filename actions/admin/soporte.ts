"use server";

import { z } from "zod";
import {
  accionAdmin,
  requerirAdmin,
  type ResultadoAccion,
} from "../../lib/admin/auth";
import { registrarAuditoria } from "../../lib/admin/auditoria";
import { actualizar, insertar, leer, leerUno } from "../../lib/admin/db";
import { campo, esUuid, revalidarAdmin } from "../../lib/admin/util";
import { revalidatePath } from "next/cache";
import type { TicketMensaje } from "../../types/database";

const ESTADOS = ["abierto", "en_curso", "resuelto", "cerrado"] as const;
const PRIORIDADES = ["baja", "normal", "alta"] as const;

const estadoSchema = z.enum(ESTADOS);
const prioridadSchema = z.enum(PRIORIDADES);

export async function cargarMensajesTicketAction(
  ticketId: string,
): Promise<TicketMensaje[]> {
  await requerirAdmin("soporte");
  if (!esUuid(ticketId)) return [];
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
    if (!esUuid(id)) return { error: "Identificador de ticket inválido." };
    const mensajeParsed = z
      .string()
      .trim()
      .min(2, "Escribe una respuesta.")
      .max(4000, "La respuesta es demasiado larga.")
      .safeParse(campo(datos, "mensaje"));
    if (!mensajeParsed.success)
      return { error: mensajeParsed.error.issues[0].message };
    const mensaje = mensajeParsed.data;
    const ticket = await leerUno("tickets", { eq: { id } });
    if (!ticket) return { error: "Ticket no encontrado." };
    await insertar("ticket_mensajes", {
      ticket_id: id,
      autor_tipo: "admin",
      autor_email: admin.email,
      mensaje,
    });

    const estadoParsed = estadoSchema.safeParse(campo(datos, "estado"));
    const prioridadParsed = prioridadSchema.safeParse(
      campo(datos, "prioridad"),
    );

    const estadoFinal = estadoParsed.success
      ? estadoParsed.data
      : ticket.estado === "abierto"
        ? "en_curso"
        : ticket.estado;

    const prioridadFinal = prioridadParsed.success
      ? prioridadParsed.data
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
    if (!esUuid(id)) return { error: "Identificador de ticket inválido." };
    const parsed = z
      .object({ estado: estadoSchema, prioridad: prioridadSchema })
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
