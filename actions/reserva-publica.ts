"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { revalidarAdmin } from "../lib/admin/util";
import { cancelarReservaPorToken } from "../lib/data/public";
import { DataError } from "../lib/data/db";
import { revalidarEmpresa } from "../lib/empresa";

export interface CancelacionPublicaResultado {
  error?: string;
  success?: boolean;
}

/**
 * Cancela una reserva a partir de su token secreto de gestión (enlace del
 * correo). Permite cancelar en cualquier momento si aún está pendiente de pago,
 * o con al menos 24 h de anticipación si ya fue pagada.
 */
export async function cancelarReservaPublicaAction(
  token: string,
): Promise<CancelacionPublicaResultado> {
  if (!z.string().uuid().safeParse(token).success) {
    return { error: "Enlace inválido." };
  }

  try {
    const reserva = await cancelarReservaPorToken(token);
    revalidatePath(`/reserva/${token}`);
    revalidarEmpresa(reserva.negocio_slug);
    revalidarAdmin();
    return { success: true };
  } catch (error) {
    console.error("[cancelación pública]", error);
    return {
      error:
        error instanceof DataError
          ? error.message
          : "No se pudo cancelar la reserva.",
    };
  }
}
