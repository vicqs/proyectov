import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types/database";
import { getSupabasePublicConfig } from "./lib/supabase/config";

/**
 * Protege `/{slug}/admin` y el acceso antiguo `/empresa`: sin sesión activa,
 * redirige a `/login`. También refresca el token de sesión en cada request
 * (necesario porque los Server Components no pueden escribir cookies).
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
  const pathname = request.nextUrl.pathname;
  const esAccesoAnterior =
    pathname === "/empresa" || pathname.startsWith("/empresa/");
  if (
    esAccesoAnterior &&
    request.method !== "GET" &&
    request.method !== "HEAD"
  ) {
    return conCabecerasDeAutoria(
      new NextResponse(null, { status: 405, headers: { Allow: "GET, HEAD" } }),
    );
  }
  const esPanelEmpresa =
    /^\/[^/]+\/admin(?:\/|$)/.test(pathname) || esAccesoAnterior;
  // Administración global: la autorización por rol se valida en el servidor.
  const esPanelAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const requiereSesion = esPanelEmpresa || esPanelAdmin;

  let response = NextResponse.next({ request: { headers: request.headers } });

  const publicConfig = getSupabasePublicConfig();
  if (!publicConfig) {
    throw new Error("La conexion de Supabase no esta configurada.");
  }

  const tieneCookieAuth = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-"));
  if (!tieneCookieAuth) {
    if (requiereSesion) {
      return conCabecerasDeAutoria(
        NextResponse.redirect(new URL("/login", request.url)),
      );
    }
    return conCabecerasDeAutoria(response);
  }

  const supabase = createServerClient<Database>(
    publicConfig.url,
    publicConfig.anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request: { headers: request.headers } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error && error.name !== "AuthSessionMissingError") {
    console.error("[supabase sesion]", error.name, error.status);
    if (error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500) {
      return conCabecerasDeAutoria(
        new NextResponse("No se pudo validar la sesion. Intenta de nuevo.", {
          status: 503,
        }),
      );
    }
  }

  if (!user && requiereSesion) {
    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    for (const cookie of response.cookies.getAll()) redirectResponse.cookies.set(cookie);
    return conCabecerasDeAutoria(redirectResponse);
  }

  return conCabecerasDeAutoria(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
