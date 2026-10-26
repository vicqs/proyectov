"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { obtenerEmpresaOperativa, revalidarEmpresa } from "../lib/empresa";
import type { Negocio } from "../types/database";
import { obtenerConfiguracion } from "../lib/plataforma";

const STORAGE_BUCKET = "negocios-media";
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

const personalizacionSchema = z.object({
  whatsapp: z
    .string()
    .transform((v) => v.replace(/[\s()+-]/g, ""))
    .refine((v) => v === "" || /^\d{8,15}$/.test(v), {
      message:
        "WhatsApp inválido: usa solo números con código de país (ej. 50688887777)",
    }),
  nombre: z
    .string()
    .trim()
    .min(2, "El nombre es muy corto")
    .max(100, "El nombre debe tener menos de 100 caracteres"),
  descripcion: z
    .string()
    .max(1000, "La biografía debe tener menos de 1000 caracteres"),
  color_tema: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{6})$/,
      "El color debe estar en formato HEX (ej. #0284c7)",
    ),
  color_secundario: z
    .string()
    .regex(
      /^#([0-9a-fA-F]{6})$/,
      "El color secundario debe estar en formato HEX",
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
  slug: string,
  _prevState: PersonalizacionActionState,
  formData: FormData,
): Promise<PersonalizacionActionState> {
  const parsed = personalizacionSchema.safeParse({
    nombre: formData.get("nombre") ?? "",
    descripcion: formData.get("descripcion") ?? "",
    color_tema: formData.get("color_tema"),
    color_secundario:
      formData.get("color_secundario") || formData.get("color_tema"),
    whatsapp: formData.get("whatsapp") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const ctx = await obtenerEmpresaOperativa(slug);
  if ("error" in ctx) return { error: ctx.error };
  const { supabase, negocio } = ctx;
  const { max_imagen_mb } = await obtenerConfiguracion();
  const maxBytes = max_imagen_mb * 1024 * 1024;
  const logoFile = formData.get("logo") as File | null;
  const portadaFile = formData.get("portada") as File | null;

  const updatePayload: Partial<Negocio> = {
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion,
    color_tema: parsed.data.color_tema,
    color_secundario: parsed.data.color_secundario,
    whatsapp: parsed.data.whatsapp || null,
  };

  try {
    if (logoFile && logoFile.size > 0) {
      updatePayload.logo_url = await subirImagen(
        supabase,
        negocio.id,
        logoFile,
        "logo",
        maxBytes,
      );
    }

    if (portadaFile && portadaFile.size > 0) {
      updatePayload.imagen_portada_url = await subirImagen(
        supabase,
        negocio.id,
        portadaFile,
        "portada",
        maxBytes,
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

  revalidarEmpresa(negocio.slug);
  return { success: true };
}

/** Comprueba los primeros bytes (firma) para que el contenido coincida con el MIME declarado. */
function firmaCoincide(tipo: string, b: Uint8Array): boolean {
  const ascii = (desde: number, hasta: number) =>
    String.fromCharCode(...b.slice(desde, hasta));
  if (tipo === "image/png") {
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  }
  if (tipo === "image/jpeg") {
    return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  }
  if (tipo === "image/webp") {
    return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
  }
  return false;
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
  maxBytes: number,
): Promise<string> {
  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error("Solo se permiten imágenes en formato PNG, JPEG o WEBP.");
  }

  if (file.size > maxBytes) {
    throw new Error(
      `La imagen no puede superar los ${Math.round(maxBytes / 1024 / 1024)} MB.`,
    );
  }

  const extension =
    file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const cabecera = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!firmaCoincide(file.type, cabecera)) {
    throw new Error("El archivo no es una imagen válida.");
  }
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
