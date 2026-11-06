"use server";

import { z } from "zod";
import { revalidarAdmin } from "../lib/admin/util";
import { accionEmpresa, revalidarEmpresa } from "../lib/empresa";
import { esUuidValido } from "../lib/validaciones";

const servicioSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(100, "El nombre es muy largo"),
  precio_usd: z.coerce
    .number()
    .positive("El precio debe ser mayor a 0")
    .max(100000, "El precio es demasiado alto"),
  duracion_min: z.coerce
    .number()
    .int()
    .positive("La duración debe ser mayor a 0")
    .max(10080, "La duración es demasiado larga"),
  descripcion: z
    .string()
    .max(500, "La descripción debe tener menos de 500 caracteres")
    .optional()
    .transform((v) => (v && v.trim() ? v.trim() : null)),
  imagen_url: z
    .union([
      z.string().url("La imagen debe ser una URL válida"),
      z.literal(""),
    ])
    .optional()
    .transform((v) => (v ? v : null)),
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
  slug: string,
  _prevState: CrearServicioActionState,
  formData: FormData,
): Promise<CrearServicioActionState> {
  const parsed = servicioSchema.safeParse({
    nombre: formData.get("nombre"),
    precio_usd: formData.get("precio_usd"),
    duracion_min: formData.get("duracion_min"),
    descripcion: formData.get("descripcion") ?? undefined,
    imagen_url: formData.get("imagen_url") ?? undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  return accionEmpresa(
    slug,
    "No se pudo crear el servicio. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { error: insertError } = await supabase.from("servicios").insert({
        negocio_id: negocio.id,
        nombre: parsed.data.nombre,
        precio_usd: parsed.data.precio_usd,
        duracion_min: parsed.data.duracion_min,
        descripcion: parsed.data.descripcion,
        imagen_url: parsed.data.imagen_url,
      });

      if (insertError) {
        return { error: "No se pudo crear el servicio. Intenta de nuevo." };
      }

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}

export interface ServicioMutacionResult {
  error?: string;
  success?: boolean;
}

/** Edita un servicio del negocio autenticado (filtra siempre por `negocio_id`). */
export async function editarServicioAction(
  slug: string,
  servicioId: string,
  datos: {
    nombre: string;
    precio_usd: number;
    duracion_min: number;
    descripcion?: string;
    imagen_url?: string;
  },
): Promise<ServicioMutacionResult> {
  if (!esUuidValido(servicioId)) {
    return { error: "Servicio inválido." };
  }
  const parsed = servicioSchema.safeParse(datos);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  return accionEmpresa(
    slug,
    "No se pudo actualizar el servicio. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { error } = await supabase
        .from("servicios")
        .update(parsed.data)
        .eq("id", servicioId)
        .eq("negocio_id", negocio.id);

      if (error) return { error: "No se pudo actualizar el servicio." };

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}

/**
 * Elimina un servicio del negocio autenticado. Se rechaza si ya tiene
 * reservas asociadas, para no perder el historial financiero.
 */
export async function eliminarServicioAction(
  slug: string,
  servicioId: string,
): Promise<ServicioMutacionResult> {
  if (!esUuidValido(servicioId)) {
    return { error: "Servicio inválido." };
  }
  return accionEmpresa(
    slug,
    "No se pudo eliminar el servicio. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { data: reservas, error: reservasError } = await supabase
        .from("reservas")
        .select("id")
        .eq("servicio_id", servicioId)
        .eq("negocio_id", negocio.id)
        .limit(1);
      if (reservasError) {
        return {
          error:
            "No se pudieron verificar las reservas del servicio. Intenta de nuevo.",
        };
      }

      if (reservas && reservas.length > 0) {
        return {
          error:
            "No se puede eliminar: el servicio tiene reservas asociadas.",
        };
      }

      const { error } = await supabase
        .from("servicios")
        .delete()
        .eq("id", servicioId)
        .eq("negocio_id", negocio.id);

      if (error) {
        // 23503: la BD protege el historial (FK `on delete restrict`) aunque haya carreras.
        return {
          error:
            error.code === "23503"
              ? "No se puede eliminar: el servicio tiene reservas asociadas."
              : "No se pudo eliminar el servicio.",
        };
      }

      revalidarEmpresa(negocio.slug);
      revalidarAdmin();
      return { success: true };
    },
  );
}
