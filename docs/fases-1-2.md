# Turismo Link — Documentación técnica

Micro-SaaS B2B2C tipo "link en bio" transaccional para pymes turísticas costeras.
Permite a una pyme (ej. escuela de surf) tener un perfil público donde los
turistas ven sus servicios, agendan y pagan con tarjeta, y ofrece un panel de
administración para que el dueño gestione su negocio.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 · Supabase (PostgreSQL + Auth) · Zod · React Email · Lucide React.

---

## Fase 1 — Perfil público y flujo de pago

Objetivo: que un turista pueda ver los servicios de una pyme por su `slug` y
pagar, y que el sistema confirme el pago vía webhook.

### Esquema de base de datos (Supabase)

- `negocios`: `id`, `user_id` (dueño, FK a `auth.users`), `nombre`, `slug` (único), `cuenta_iban`.
- `servicios`: `id`, `negocio_id`, `nombre`, `precio_usd`, `duracion_min`.
- `reservas`: `id`, `servicio_id`, `negocio_id`, `fecha_hora`, `email_cliente`, `estado` (`pendiente` | `pagada`), `trx_id` (opcional).

Arquitectura **multi-tenant**: todos los datos de dominio están aislados por `negocio_id`.

### Archivos generados

| Archivo                                                             | Descripción                                                                                                                               |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [types/database.ts](../types/database.ts)                           | Interfaces TypeScript del esquema y tipado `Database` para el cliente de Supabase.                                                        |
| [lib/supabase.ts](../lib/supabase.ts)                               | Cliente Supabase con **service role key**, solo para uso en servidor (bypassa RLS).                                                       |
| [app/[slug]/page.tsx](../app/%5Bslug%5D/page.tsx)                   | Server Component público: busca el negocio por `slug`, lista sus servicios. Retorna 404 si no existe.                                     |
| [app/[slug]/BookingButton.tsx](../app/%5Bslug%5D/BookingButton.tsx) | Client Component (`"use client"`) con el formulario de reserva/pago, usa `useFormStatus`.                                                 |
| [app/api/checkout/route.ts](../app/api/checkout/route.ts)           | Route Handler: valida el payload con Zod, crea la reserva en estado `pendiente` y retorna un mock de la pasarela de pagos (tipo Tilopay). |
| [app/api/webhooks/pago/route.ts](../app/api/webhooks/pago/route.ts) | Route Handler: recibe la notificación asíncrona del banco y actualiza la reserva a `pagada`.                                              |

### Decisiones clave

- Server Components por defecto (SEO/rendimiento); `"use client"` solo donde hay interactividad.
- `negocio_id` siempre se resuelve en servidor a partir del `servicio_id`, nunca se confía en el valor enviado por el cliente.
- Manejo de errores con `try/catch` y códigos HTTP semánticos (404, 500).

---

## Fase 2 — Panel de administración (Dashboard)

Objetivo: que el dueño de la pyme inicie sesión y gestione su negocio
(servicios, reservas) protegido por autenticación y Row Level Security (RLS).

### Autenticación y protección de rutas

- Autenticación vía **Supabase Auth** (email/password) usando Server Actions.
- [middleware.ts](../middleware.ts) protege todas las rutas bajo `/admin`: si no hay sesión, redirige a `/login`. También refresca el token de sesión en cada request.
- Todas las consultas dentro de `/admin` usan el cliente SSR ([lib/supabase/server.ts](../lib/supabase/server.ts)), que respeta la sesión del usuario (cookies) y por tanto las políticas RLS — a diferencia del cliente de la Fase 1, que usa la service role key.

### Archivos generados

| Archivo                                                                                   | Descripción                                                                                                          |
| ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [lib/supabase/server.ts](../lib/supabase/server.ts)                                       | Cliente Supabase SSR (`@supabase/ssr`) basado en cookies, respeta RLS.                                               |
| [actions/auth.ts](../actions/auth.ts)                                                     | Server Actions `loginAction` (valida con Zod y llama `signInWithPassword`) y `logoutAction`.                         |
| [app/login/page.tsx](../app/login/page.tsx)                                               | Formulario de login, Client Component con `useActionState` + `useFormStatus`.                                        |
| [app/admin/layout.tsx](../app/admin/layout.tsx)                                           | Layout del dashboard: sidebar (desktop), carga el `negocio` del usuario autenticado, botón de logout.                |
| [app/admin/AdminMobileNav.tsx](../app/admin/AdminMobileNav.tsx)                           | Menú hamburguesa para mobile (Client Component).                                                                     |
| [app/admin/page.tsx](../app/admin/page.tsx)                                               | Overview: próximas 5 reservas `pendiente`/`pagada` del negocio.                                                      |
| [actions/servicios.ts](../actions/servicios.ts)                                           | Server Action `crearServicioAction`: valida con Zod y resuelve `negocio_id` en servidor (nunca desde el formulario). |
| [app/admin/servicios/page.tsx](../app/admin/servicios/page.tsx)                           | Lista de servicios del negocio en grid de tarjetas.                                                                  |
| [app/admin/servicios/NuevoServicioForm.tsx](../app/admin/servicios/NuevoServicioForm.tsx) | Formulario de creación de servicio (`useActionState`).                                                               |

### Decisiones clave / asunciones

- Se asumió una columna `negocios.user_id` (FK a `auth.users.id`) para vincular cada negocio con su dueño; no estaba en el esquema original de la Fase 1. Si el esquema real usa otro nombre, hay que actualizar `types/database.ts` y las consultas que filtran por `user_id`.
- El aislamiento multi-tenant en el dashboard se refuerza dos veces: por RLS (en Supabase) y por resolver siempre `negocio_id` en el servidor a partir del usuario autenticado.
- Variables de entorno nuevas: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (cliente SSR) además de `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (ver [.env.example](../.env.example)).
- Dependencia añadida: `@supabase/ssr`.

---

## Pendientes / próximos pasos

- Ejecutar `npm install` para materializar dependencias (`@supabase/ssr`, Tailwind v4, etc.).
- Definir y aplicar las políticas RLS reales en Supabase para `negocios`, `servicios` y `reservas`.
- Página `/admin/agenda` (bloqueos de calendario) mencionada en la navegación, aún no implementada.
- Integración real con la pasarela de pago (reemplazar el mock del checkout).
