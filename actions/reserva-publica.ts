"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { HORAS_LIMITE_CANCELACION } from "../lib/horarios";
import { revalidarEmpresa } from "../lib/empresa";

export interface CancelacionPublicaResultado {
  error?: string;
  success?: boolean;
}

/**
 * Cancela una reserva a partir de su token secreto de gestión (enlace del
 * correo). Solo permite cancelar con al menos 24 h de anticipación; después
 * el turista debe contactar al negocio.
 */
export async function cancelarReservaPublicaAction(
  token: string,
): Promise<CancelacionPublicaResultado> {
  if (!z.string().min(8).max(100).safeParse(token).success) {
    return { error: "Enlace inválido." };
  }

  const { data: reserva } = await supabaseAdmin
    .from("reservas")
    .select("id, estado, fecha_hora, negocio_id")
    .eq("token_gestion", token)
    .single();
  if (!reserva) return { error: "No se encontró la reserva." };
  if (reserva.estado === "cancelada") {
    return { error: "Esta reserva ya estaba cancelada." };
  }

  const msRestantes = new Date(reserva.fecha_hora).getTime() - Date.now();
  if (msRestantes < HORAS_LIMITE_CANCELACION * 3_600_000) {
    return {
      error: `Solo puedes cancelar con ${HORAS_LIMITE_CANCELACION} horas de anticipación. Contacta al negocio.`,
    };
  }

  const { error } = await supabaseAdmin
    .from("reservas")
    .update({ estado: "cancelada" })
    .eq("id", reserva.id);
  if (error) return { error: "No se pudo cancelar la reserva." };

  revalidatePath(`/reserva/${token}`);
  const { data: negocio } = await supabaseAdmin
    .from("negocios")
    .select("slug")
    .eq("id", reserva.negocio_id)
    .single();
  if (negocio) revalidarEmpresa(negocio.slug);
  return { success: true };
}
