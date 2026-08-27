"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";

const servicioSchema = z.object({
  nombre: z.string().min(2, "El nombre es muy corto"),
  precio_usd: z.coerce.number().positive("El precio debe ser mayor a 0"),
  duracion_min: z.coerce
    .number()
    .int()
    .positive("La duración debe ser mayor a 0"),
});

export interface CrearServicioActionState {
  error?: string;
  success?: boolean;
}

/**
 * Server Action para crear un servicio. El `negocio_id` NUNCA se toma del
 * formulario: se resuelve en el servidor a partir del usuario autenticado,
 * lo que garantiza el aislamiento multi-tenant incluso si el cliente
 * manipula el payload.
 */
export async function crearServicioAction(
  _prevState: CrearServicioActionState,
  formData: FormData,
): Promise<CrearServicioActionState> {
  const parsed = servicioSchema.safeParse({
    nombre: formData.get("nombre"),
    precio_usd: formData.get("precio_usd"),
    duracion_min: formData.get("duracion_min"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Sesión expirada, vuelve a iniciar sesión." };
  }

  const { data: negocio, error: negocioError } = await supabase
    .from("negocios")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (negocioError || !negocio) {
    return { error: "No se encontró el negocio asociado a tu cuenta." };
  }

  const { error: insertError } = await supabase.from("servicios").insert({
    negocio_id: negocio.id,
    nombre: parsed.data.nombre,
    precio_usd: parsed.data.precio_usd,
    duracion_min: parsed.data.duracion_min,
  });

  if (insertError) {
    return { error: "No se pudo crear el servicio. Intenta de nuevo." };
  }

  revalidatePath("/admin/servicios");
  return { success: true };
}
