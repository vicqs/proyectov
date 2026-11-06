"use server";

import { z } from "zod";
import { revalidarAdmin } from "../lib/admin/util";
import { createSupabaseServerClient } from "../lib/supabase/server";
import { accionEmpresa, revalidarEmpresa } from "../lib/empresa";
import type { Negocio } from "../types/database";
import { obtenerConfiguracion } from "../lib/plataforma";
import { obtenerPaisPorIso, totalDigitosPais } from "../lib/telefono";
import { mensajeErrorUsuario } from "../lib/errores";
import {
  HEX_COLOR_SCHEMA,
  IBAN_REGEX,
  campoArchivo,
  campoTexto,
} from "../lib/validaciones";

const STORAGE_BUCKET = "negocios-media";
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg", "image/webp"];

const personalizacionSchema = z
  .object({
    whatsapp: z.string().transform((v) => v.replace(/\D/g, "")),
    whatsapp_pais: z.string().optional(),
    cuenta_iban: z
      .string()
      .optional()
      .transform((v) =>
        v !== undefined ? v.replace(/\s+/g, "").toUpperCase() : undefined,
      ),
    nombre: z
      .string()
      .trim()
      .min(2, "El nombre es muy corto")
      .max(100, "El nombre debe tener menos de 100 caracteres"),
    descripcion: z
      .string()
      .max(1000, "La biografía debe tener menos de 1000 caracteres"),
    color_tema: HEX_COLOR_SCHEMA,
    color_secundario: HEX_COLOR_SCHEMA,
  })
  .superRefine((datos, ctx) => {
    if (datos.cuenta_iban && !IBAN_REGEX.test(datos.cuenta_iban)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cuenta_iban"],
        message:
          "Cuenta IBAN inválida: usa el código de país seguido de los dígitos (ej. CR00 0000 0000 0000 0000 00).",
      });
    }
    if (!datos.whatsapp) return;
    if (datos.whatsapp_pais) {
      const pais = obtenerPaisPorIso(datos.whatsapp_pais);
      const esperados = totalDigitosPais(pais);
      const esperadoTotal = pais.codigo.length + esperados;
      if (
        !datos.whatsapp.startsWith(pais.codigo) ||
        datos.whatsapp.length !== esperadoTotal
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["whatsapp"],
          message: `WhatsApp inválido para ${pais.nombre} (+${pais.codigo}): ingresa los ${esperados} dígitos del número (ej. ${pais.ejemplo}).`,
        });
      }
      return;
    }
    if (!/^\d{8,15}$/.test(datos.whatsapp)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsapp"],
        message:
          "WhatsApp inválido: usa solo números con código de país (ej. +506 8888 7777).",
      });
    }
  });

export interface PersonalizacionActionState {
  error?: string;
  success?: boolean;
  savedAt?: number;
  logoUrl?: string | null;
  portadaUrl?: string | null;
}

/**
 * Server Action que actualiza la biografía, el color de marca, el WhatsApp,
 * la cuenta IBAN y, si el usuario adjuntó archivos o solicitó quitarlos, el
 * logo y/o la imagen de portada del negocio. Todo el flujo ocurre en el
 * servidor con el cliente SSR, respetando RLS.
 */
export async function actualizarPersonalizacionAction(
  slug: string,
  _prevState: PersonalizacionActionState,
  formData: FormData,
): Promise<PersonalizacionActionState> {
  const colorTema = campoTexto(formData, "color_tema");
  const colorSecundario = campoTexto(formData, "color_secundario");

  const parsed = personalizacionSchema.safeParse({
    nombre: campoTexto(formData, "nombre") ?? "",
    descripcion: campoTexto(formData, "descripcion") ?? "",
    color_tema: colorTema,
    color_secundario: colorSecundario || colorTema,
    whatsapp: campoTexto(formData, "whatsapp") ?? "",
    whatsapp_pais: campoTexto(formData, "whatsapp_pais"),
    cuenta_iban: formData.has("cuenta_iban")
      ? (campoTexto(formData, "cuenta_iban") ?? "")
      : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  return accionEmpresa<PersonalizacionActionState>(
    slug,
    "No se pudo guardar la personalización. Intenta de nuevo.",
    async ({ supabase, negocio }) => {
      const { max_imagen_mb } = await obtenerConfiguracion();
      const maxBytes = max_imagen_mb * 1024 * 1024;
      const logoFile = campoArchivo(formData, "logo");
      const portadaFile = campoArchivo(formData, "portada");
      const eliminarLogo = campoTexto(formData, "eliminar_logo") === "true";
      const eliminarPortada =
        campoTexto(formData, "eliminar_portada") === "true";

      const updatePayload: Partial<Negocio> = {
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        color_tema: parsed.data.color_tema,
        color_secundario: parsed.data.color_secundario,
        whatsapp: parsed.data.whatsapp || null,
        ...(parsed.data.cuenta_iban !== undefined
          ? { cuenta_iban: parsed.data.cuenta_iban }
          : {}),
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
        } else if (eliminarLogo) {
          updatePayload.logo_url = null;
        }

        if (portadaFile && portadaFile.size > 0) {
          updatePayload.imagen_portada_url = await subirImagen(
            supabase,
            negocio.id,
            portadaFile,
            "portada",
            maxBytes,
          );
        } else if (eliminarPortada) {
          updatePayload.imagen_portada_url = null;
        }
      } catch (uploadError) {
        console.error(
          "Error al subir imagen a Supabase Storage:",
          uploadError,
        );
        return {
          error: mensajeErrorUsuario(
            uploadError,
            "No se pudo subir la imagen. Intenta de nuevo.",
          ),
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
      revalidarAdmin();
      return {
        success: true,
        savedAt: Date.now(),
        logoUrl:
          updatePayload.logo_url !== undefined
            ? updatePayload.logo_url
            : negocio.logo_url,
        portadaUrl:
          updatePayload.imagen_portada_url !== undefined
            ? updatePayload.imagen_portada_url
            : negocio.imagen_portada_url,
      };
    },
  );
}

export interface CambiarContrasenaEmpresaState {
  error?: string;
  success?: boolean;
  savedAt?: number;
}

const cambiarContrasenaSchema = z
  .object({
    actual: z.string().min(1, "Ingresa tu contraseña actual."),
    nueva: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(72, "La contraseña es demasiado larga."),
    confirmar: z.string(),
  })
  .refine((v) => v.nueva === v.confirmar, {
    message: "La confirmación no coincide con la nueva contraseña.",
    path: ["confirmar"],
  })
  .refine((v) => v.nueva !== v.actual, {
    message: "La nueva contraseña debe ser diferente a la actual.",
    path: ["nueva"],
  });

/**
 * Permite al dueño autenticado actualizar su contraseña desde el panel sin
 * cerrar sesión, verificando primero su contraseña actual.
 */
export async function cambiarContrasenaEmpresaAction(
  slug: string,
  _prevState: CambiarContrasenaEmpresaState,
  formData: FormData,
): Promise<CambiarContrasenaEmpresaState> {
  const parsed = cambiarContrasenaSchema.safeParse({
    actual: campoTexto(formData, "actual") ?? "",
    nueva: campoTexto(formData, "nueva") ?? "",
    confirmar: campoTexto(formData, "confirmar") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  return accionEmpresa<CambiarContrasenaEmpresaState>(
    slug,
    "No se pudo actualizar la contraseña. Intenta de nuevo.",
    async ({ supabase, user }) => {
      if (!user.email) {
        return { error: "No se pudo verificar el correo de tu sesión." };
      }

      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.actual,
      });

      if (verifyError) {
        return { error: "Tu contraseña actual no es correcta." };
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.nueva,
      });

      if (updateError) {
        return {
          error: "No se pudo actualizar la contraseña. Intenta de nuevo.",
        };
      }

      return { success: true, savedAt: Date.now() };
    },
  );
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
