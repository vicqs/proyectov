import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/mock/client";

/**
 * Destino del enlace del correo de recuperación. Canjea el código por una
 * sesión temporal y lleva al usuario a elegir su nueva contraseña.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const fallo = NextResponse.redirect(`${origin}/recuperar?error=enlace`);
  const supabase = await createSupabaseServerClient();

  if (isMockMode) {
    const correo = searchParams.get("mock_recovery");
    if (!correo || process.env.NODE_ENV === "production") return fallo;
    const auth = supabase.auth as unknown as {
      iniciarRecuperacionMock(correo: string): Promise<boolean>;
    };
    return (await auth.iniciarRecuperacionMock(correo))
      ? NextResponse.redirect(`${origin}/restablecer`)
      : fallo;
  }

  const code = searchParams.get("code");
  if (!code) return fallo;
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return error ? fallo : NextResponse.redirect(`${origin}/restablecer`);
}
