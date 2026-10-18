"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerEmpresaAutenticada } from "../lib/empresa";
import { funcionActivaNegocio } from "../lib/plataforma";
import { insertar, leer, leerUno, actualizar } from "../lib/admin/db";
import { registrarEventoNegocio } from "../lib/admin/auditoria";
import type { ResultadoAccion } from "../lib/admin/auth";

const texto = (datos: FormData, clave: string) =>
  String(datos.get(clave) ?? "").trim();

export async function crearTicketAction(
  slug: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  const ctx = await obtenerEmpresaAutenticada(slug);
  if ("error" in ctx) return { error: ctx.error };
  if (!(await funcionActivaNegocio(ctx.negocio, "soporte_empresas"))) {
    return { error: "El soporte no está disponible para tu plan." };
  }
  const parsed = z
    .object({
      asunto: z.string().min(4, "El asunto es muy corto.").max(150),
      mensaje: z.string().min(5, "Describe el problema.").max(4000),
    })
    .safeParse({
      asunto: texto(datos, "asunto"),
      mensaje: texto(datos, "mensaje"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  // Tope de tickets abiertos por negocio para evitar abuso.
  const abiertos = (
    await leer("tickets", { eq: { negocio_id: ctx.negocio.id } })
  ).filter((t) => t.estado === "abierto" || t.estado === "en_curso");
  if (abiertos.length >= 10) {
    return {
      error:
        "Tienes demasiados tickets abiertos. Espera la respuesta de soporte.",
    };
  }

  const ticket = await insertar("tickets", {
    negocio_id: ctx.negocio.id,
    asunto: parsed.data.asunto,
    estado: "abierto",
    prioridad: "normal",
    creado_por: ctx.user.email ?? "",
  });
  await insertar("ticket_mensajes", {
    ticket_id: ticket.id,
    autor_tipo: "empresa",
    autor_email: ctx.user.email ?? "",
    mensaje: parsed.data.mensaje,
  });
  await registrarEventoNegocio(
    { id: ctx.user.id, email: ctx.user.email ?? "" },
    {
      accion: "ticket.crear",
      entidad: "ticket",
      entidad_id: ticket.id,
      negocio_id: ctx.negocio.id,
    },
  );
  revalidatePath("/admin/soporte");
  revalidatePath(`/${slug}/admin/soporte`);
  return { ok: "Ticket enviado. Te responderemos pronto." };
}

export async function responderTicketAction(
  slug: string,
  ticketId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  const ctx = await obtenerEmpresaAutenticada(slug);
  if ("error" in ctx) return { error: ctx.error };
  const mensaje = texto(datos, "mensaje");
  if (mensaje.length < 2 || mensaje.length > 4000) {
    return { error: "Escribe un mensaje de hasta 4000 caracteres." };
  }
  // El ticket debe pertenecer al negocio de la sesión.
  const ticket = await leerUno("tickets", {
    eq: { id: ticketId, negocio_id: ctx.negocio.id },
  });
  if (!ticket) return { error: "Ticket no encontrado." };
  await insertar("ticket_mensajes", {
    ticket_id: ticketId,
    autor_tipo: "empresa",
    autor_email: ctx.user.email ?? "",
    mensaje,
  });
  await actualizar(
    "tickets",
    {
      estado:
        ticket.estado === "cerrado" || ticket.estado === "resuelto"
          ? "abierto"
          : ticket.estado,
      actualizado_en: new Date().toISOString(),
    },
    { id: ticketId },
  );
  revalidatePath("/admin/soporte");
  revalidatePath(`/admin/soporte/${ticketId}`);
  revalidatePath(`/${slug}/admin/soporte`);
  return { ok: "Mensaje enviado." };
}
