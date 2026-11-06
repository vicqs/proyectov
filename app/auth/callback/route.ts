import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { obtenerPerfil } from "@/lib/sesion";

/**
 * Destino del enlace del correo de recuperación. Canjea el código por una
 * sesión temporal y lleva al usuario a elegir su nueva contraseña.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const fallo = NextResponse.redirect(`${origin}/recuperar?error=enlace`);
  const code = searchParams.get("code");
  if (!code) return fallo;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return fallo;

  const perfil = await obtenerPerfil(data.user.id);
  if (perfil?.bloqueado) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login`);
  }

  return NextResponse.redirect(`${origin}/restablecer`);
}
