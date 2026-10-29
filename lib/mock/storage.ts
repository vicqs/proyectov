/**
 * Simula `supabase.storage` para que la subida de logo/portada en
 * `actions/personalizacion.ts` funcione sin un bucket real: guarda el
 * archivo en memoria como Data URL (`data:image/...;base64,...`) y lo
 * devuelve en `getPublicUrl`, reflejando exactamente la imagen subida.
 */
const globalStorage = globalThis as unknown as {
  __neMockArchivos?: Map<string, string>;
};

const ARCHIVOS: Map<string, string> = (globalStorage.__neMockArchivos ??=
  new Map<string, string>());

export const mockStorage = {
  from(_bucket: string) {
    return {
      async upload(path: string, file: File, _opts?: Record<string, unknown>) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const mime = file.type || "image/jpeg";
        const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;
        ARCHIVOS.set(path, dataUrl);
        return { data: { path }, error: null };
      },
      getPublicUrl(path: string) {
        const guardado = ARCHIVOS.get(path);
        if (guardado) {
          return { data: { publicUrl: guardado } };
        }
        const seed = encodeURIComponent(path);
        return {
          data: { publicUrl: `https://picsum.photos/seed/${seed}/800/400` },
        };
      },
    };
  },
};
