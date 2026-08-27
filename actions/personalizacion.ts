"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";
import type { Negocio } from "../types/database";

const STORAGE_BUCKET = "negocios-media";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

const personalizacionSchema = z.object({
  descripcion: z
    .string()
    .max(1000, "La biografía debe tener menos de 1000 caracteres"),
  color_tema: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{6})$/,
      "El color debe estar en formato HEX (ej. #0284c7)",
    ),
});

export interface PersonalizacionActionState {
  error?: string;
  success?: boolean;
}

/**
 * Server Action que actualiza la biografía, el color de marca y, si el
 * usuario adjuntó archivos, el logo y/o la imagen de portada del negocio.
 * Todo el flujo (validación, subida a Storage y update en la tabla) ocurre
 * en el servidor con el cliente SSR, respetando RLS.
 */
export async function actualizarPersonalizacionAction(
  _prevState: PersonalizacionActionState,
  formData: FormData,
): Promise<PersonalizacionActionState> {
  const parsed = personalizacionSchema.safeParse({
    descripcion: formData.get("descripcion") ?? "",
    color_tema: formData.get("color_tema"),
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

  const logoFile = formData.get("logo") as File | null;
  const portadaFile = formData.get("portada") as File | null;

  const updatePayload: Partial<Negocio> = {
    descripcion: parsed.data.descripcion,
    color_tema: parsed.data.color_tema,
  };

  try {
    if (logoFile && logoFile.size > 0) {
      updatePayload.logo_url = await subirImagen(
        supabase,
        negocio.id,
        logoFile,
        "logo",
      );
    }

    if (portadaFile && portadaFile.size > 0) {
      updatePayload.imagen_portada_url = await subirImagen(
        supabase,
        negocio.id,
        portadaFile,
        "portada",
      );
    }
  } catch (uploadError) {
    console.error("Error al subir imagen a Supabase Storage:", uploadError);
    return {
      error:
        uploadError instanceof Error
          ? uploadError.message
          : "No se pudo subir la imagen. Intenta de nuevo.",
    };
  }

  const { error: updateError } = await supabase
    .from("negocios")
    .update(updatePayload)
    .eq("id", negocio.id);

  if (updateError) {
    console.error("Error al actualizar el negocio:", updateError);
    return {
      error: "No se pudo guardar la personalización. Intenta de nuevo.",
    };
  }

  revalidatePath("/admin/personalizacion");
  return { success: true };
}

/**
 * Valida tipo y tamaño del archivo, lo sube al bucket público
 * `negocios-media` bajo una ruta aislada por negocio (`{negocio_id}/{tipo}-{timestamp}.ext`)
 * y retorna la URL pública resultante.
 */
async function subirImagen(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  negocioId: string,
  file: File,
  tipo: "logo" | "portada",
): Promise<string> {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Solo se permiten imágenes en formato PNG, JPEG o WEBP.");
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("La imagen no puede superar los 5 MB.");
  }

  const extension =
    file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${negocioId}/${tipo}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    throw new Error(
      `No se pudo subir el archivo "${tipo}": ${uploadError.message}`,
    );
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return publicUrl;
}
