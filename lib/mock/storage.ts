/**
 * Simula `supabase.storage` para que la subida de logo/portada en
 * `actions/personalizacion.ts` funcione sin un bucket real: "sube" el
 * archivo (no-op) y devuelve una URL pública de una imagen de stock
 * determinística según el path, solo para fines de simulación visual.
 */
export const mockStorage = {
  from(_bucket: string) {
    return {
      async upload(path: string, _file: File, _opts?: Record<string, unknown>) {
        return { data: { path }, error: null };
      },
      getPublicUrl(path: string) {
        const seed = encodeURIComponent(path);
        return {
          data: { publicUrl: `https://picsum.photos/seed/${seed}/800/400` },
        };
      },
    };
  },
};
