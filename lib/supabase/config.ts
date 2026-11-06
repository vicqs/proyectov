export function isPlaceholder(value: string | undefined): boolean {
  return !value?.trim() ||
    /placeholder|^tu[-_]|^your[-_]|tu-proyecto|your-project|^https:\/\/TU-/i.test(value.trim());
}

export function getSupabasePublicConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missingUrl = isPlaceholder(url);
  const missingKey = isPlaceholder(anonKey);
  if (missingUrl && missingKey) return null;
  if (missingUrl || missingKey) {
    throw new Error("Configuracion incompleta: NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY deben configurarse juntas.");
  }
  if (!url || !anonKey) throw new Error("Falta la configuracion publica de Supabase.");
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe ser una URL valida.");
  }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
    throw new Error("Supabase requiere HTTPS, salvo una instancia local.");
  }
  return { url, anonKey };
}
