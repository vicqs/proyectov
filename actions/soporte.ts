"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { obtenerEmpresaOperativa } from "../lib/empresa";
import { funcionActivaNegocio } from "../lib/plataforma";
import { contar, insertar, leerUno } from "../lib/data/server";
import { registrarEventoNegocio } from "../lib/admin/auditoria";
import type { ResultadoAccion } from "../lib/admin/auth";
import { revalidarAdmin } from "../lib/admin/util";
import { esRedireccionNext, mensajeErrorUsuario } from "../lib/errores";

const texto = (datos: FormData, clave: string) =>
  String(datos.get(clave) ?? "").trim();

export async function crearTicketAction(
  slug: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  try {
    const ctx = await obtenerEmpresaOperativa(slug);
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
    const abiertos = await contar("tickets", {
      eq: { negocio_id: ctx.negocio.id },
      en: { estado: ["abierto", "en_curso"] },
    });
    if (abiertos >= 10) {
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
    revalidarAdmin();
    revalidatePath(`/${slug}/admin/soporte`);
    return { ok: "Ticket enviado. Te responderemos pronto." };
  } catch (error) {
    if (esRedireccionNext(error)) throw error;
    console.error("[soporte] Error en crearTicketAction:", error);
    return {
      error: mensajeErrorUsuario(
        error,
        "No se pudo enviar el ticket. Intenta de nuevo.",
      ),
    };
  }
}

export async function responderTicketAction(
  slug: string,
  ticketId: string,
  _previo: ResultadoAccion,
  datos: FormData,
): Promise<ResultadoAccion> {
  if (!z.string().uuid().safeParse(ticketId).success) {
    return { error: "Ticket inválido." };
  }
  try {
    const ctx = await obtenerEmpresaOperativa(slug);
    if ("error" in ctx) return { error: ctx.error };
    if (!(await funcionActivaNegocio(ctx.negocio, "soporte_empresas"))) {
      return { error: "El soporte no está disponible para tu plan." };
    }
    const parsed = z
      .string()
      .trim()
      .min(2, "Escribe un mensaje de hasta 4000 caracteres.")
      .max(4000, "Escribe un mensaje de hasta 4000 caracteres.")
      .safeParse(texto(datos, "mensaje"));
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }
    const mensaje = parsed.data;
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
    // El trigger `touch_ticket` en PostgreSQL actualiza `updated_at` y reabre el ticket si estaba cerrado/resuelto.
    revalidarAdmin();
    revalidatePath(`/${slug}/admin/soporte`);
    return { ok: "Mensaje enviado." };
  } catch (error) {
    if (esRedireccionNext(error)) throw error;
    console.error("[soporte] Error en responderTicketAction:", error);
    return {
      error: mensajeErrorUsuario(
        error,
        "No se pudo enviar el mensaje. Intenta de nuevo.",
      ),
    };
  }
}
