import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isMockMode } from "./lib/mock/client";
import { MOCK_SESSION_COOKIE } from "./lib/mock/auth";
import { MOCK_USER_ID } from "./lib/mock/data";

/**
 * Protege todas las rutas bajo `/admin`: si no hay sesión de Supabase activa,
 * redirige a `/login`. También refresca el token de sesión en cada request
 * (necesario porque los Server Components no pueden escribir cookies).
 *
 * En modo simulado (`isMockMode`, sin credenciales reales de Supabase) se
 * valida en su lugar la cookie de sesión simulada, en vez de llamar a
 * `@supabase/ssr`.
 *
 * Además, inyecta cabeceras HTTP de autoría en toda respuesta del servidor
 * (invisibles en la UI, visibles para cualquier auditor de red).
 */
function conCabecerasDeAutoria(response: NextResponse): NextResponse {
  response.headers.set("X-Author", "Victor Quiros Suarez");
  response.headers.set("X-Powered-By", "Victor Quiros Suarez - Core System");
  return response;
}

export async function middleware(request: NextRequest) {
  if (isMockMode) {
    const sesion = request.cookies.get(MOCK_SESSION_COOKIE)?.value;
    if (
      sesion !== MOCK_USER_ID &&
      request.nextUrl.pathname.startsWith("/admin")
    ) {
      return conCabecerasDeAutoria(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    return conCabecerasDeAutoria(NextResponse.next());
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && request.nextUrl.pathname.startsWith("/admin")) {
    const loginUrl = new URL("/login", request.url);
    return conCabecerasDeAutoria(NextResponse.redirect(loginUrl));
  }

  return conCabecerasDeAutoria(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
