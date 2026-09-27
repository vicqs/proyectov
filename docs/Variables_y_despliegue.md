# 🔧 Variables de Entorno y Despliegue — Proyecto V

Este documento detalla las variables de entorno requeridas, la diferencia entre el entorno de desarrollo (mock/Zustand) y producción, y la estrategia recomendada para desplegar en Vercel.

## 1. 🔑 Variables de entorno (`.env`)

| Variable                             | Descripción                                                                                                                                                                                  |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`           | URL del proyecto de Supabase (pública, expuesta al cliente). Usada para inicializar el cliente de Supabase en browser y servidor.                                                            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Clave anónima (pública) de Supabase, usada por el cliente/middleware para operaciones respetando Row Level Security (RLS).                                                                   |
| `SUPABASE_SERVICE_ROLE_KEY`          | Clave de servicio (privada, **solo servidor**) de Supabase con permisos elevados, usada en Route Handlers para operaciones administrativas (bypass de RLS). Nunca debe exponerse al cliente. |
| `USE_MOCK_DB`                        | Flag booleano (`"true"/"false"`) que fuerza el uso de la capa mock (`lib/mock/*`) en vez de Supabase real, incluso si hay credenciales configuradas. Útil para desarrollo local sin backend. |
| `NEXT_PUBLIC_APP_URL`                | URL pública base de la aplicación (ej. `https://proyecto-v.app`), usada para construir URLs absolutas (retorno de checkout, links en emails).                                                |
| `RESEND_API_KEY`                     | Clave de API de Resend, usada para el envío de correos transaccionales (confirmaciones de reserva, alertas a la pyme).                                                                       |
| `EMAIL_FROM`                         | Dirección "From" usada en los correos enviados vía Resend (ej. `Proyecto V <notificaciones@proyectov.app>`).                                                                                 |
| `STRIPE_SECRET_KEY`                  | Clave secreta de Stripe (servidor), usada para gestionar la suscripción SaaS de las pymes.                                                                                                   |
| `STRIPE_PRICE_ID`                    | Identificador del precio/plan de Stripe usado al crear sesiones de checkout de suscripción.                                                                                                  |
| `STRIPE_WEBHOOK_SECRET`              | Secreto usado para verificar la firma de los webhooks entrantes de Stripe (confirmación de suscripción).                                                                                     |
| `PAGO_WEBHOOK_SECRET`                | Secreto compartido (HMAC) para verificar la firma de los webhooks de confirmación de pago de reservas (pasarela bancaria/TiloPay/OnvoPay).                                                   |
| `TILOPAY_SECRET_KEY` _(futuro)_      | Clave secreta de la API de TiloPay, para iniciar sesiones de pago desde el servidor (ver [docs/Integracion_Pagos.md](Integracion_Pagos.md)).                                                 |
| `ONVOPAY_SECRET_KEY` _(futuro)_      | Clave secreta de la API de OnvoPay (alternativa a TiloPay), según la pasarela elegida por la pyme o el mercado.                                                                              |
| `DATABASE_URL` _(futuro / opcional)_ | Cadena de conexión directa a PostgreSQL, si se requiere acceso fuera del cliente de Supabase (ej. migraciones, scripts de administración).                                                   |

> 🔒 Ninguna clave secreta (`*_SECRET_KEY`, `*_SERVICE_ROLE_KEY`, `*_WEBHOOK_SECRET`) debe llevar el prefijo `NEXT_PUBLIC_` — ese prefijo hace que Next.js la incluya en el bundle del navegador. Solo las variables explícitamente públicas (URL, IDs no sensibles) deben usarlo.

## 2. 🌎 Entornos: Desarrollo (Mock/Zustand) vs. Producción

### Desarrollo (Mock)

- Las rutas `/demo/[slug]` y `/demo/admin/*` funcionan **completamente sin variables de entorno**, ya que su estado vive en memoria en [lib/demoStore.ts](../lib/demoStore.ts) (Zustand), sin tocar Supabase ni ninguna pasarela de pago.
- Las rutas de producción (`/[slug]`, `/admin/*`) pueden ejecutarse localmente en modo mock activando `USE_MOCK_DB=true` (o simplemente dejando `NEXT_PUBLIC_SUPABASE_URL` sin configurar/con placeholder), lo que hace que [lib/mock/client.ts](../lib/mock/client.ts) sirva datos simulados (`lib/mock/data.ts`) en vez de conectarse a una base de datos real — así se puede desarrollar sin depender de credenciales externas.
- No se requieren claves reales de Stripe/Resend/pasarelas para trabajar en este modo; los emails y pagos también pueden simularse.

### Producción

- Se conecta a una instancia real de **Supabase** (`NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` reales, `USE_MOCK_DB` ausente o `false`), persistiendo negocios, servicios, horarios y reservas de forma duradera.
- Los pagos de la suscripción SaaS pasan por **Stripe** con claves reales, y los pagos de las reservas turísticas pasan por la pasarela real (**TiloPay/OnvoPay**) una vez completada la Fase 2 del roadmap (ver [docs/Roapmap.md](Roapmap.md)).
- Los webhooks (`STRIPE_WEBHOOK_SECRET`, `PAGO_WEBHOOK_SECRET`) deben apuntar a URLs públicas HTTPS reales y verificarse estrictamente antes de procesar cualquier evento (ver [docs/Integracion_Pagos.md](Integracion_Pagos.md#2-🔔-manejo-de-webhooks-backend)).
- Los correos se envían realmente a turistas y pymes vía Resend, usando un dominio verificado en `EMAIL_FROM`.

## 3. 🚀 Estrategia de despliegue en Vercel

Next.js 15 se beneficia directamente de la infraestructura de **Vercel** (su creador), aprovechando **Edge Network** y **Functions Serverless** sin configuración adicional.

### Pasos recomendados

1. **Conectar el repositorio**: importar el repositorio de Proyecto V en el dashboard de Vercel (vía GitHub/GitLab), seleccionando el framework detectado automáticamente como Next.js.
2. **Configurar variables de entorno**: cargar todas las variables de la sección 1 en _Project Settings → Environment Variables_, diferenciando entre entornos **Production**, **Preview** y **Development** (ej. usar credenciales de prueba de Stripe/TiloPay en Preview, y credenciales reales solo en Production).
3. **Build settings**: usar los comandos por defecto (`next build` / `next start`) — no requieren ajuste manual, Vercel los detecta automáticamente desde `package.json`.
4. **Aprovechar Server Components y Route Handlers como Serverless Functions**: cada `route.ts` bajo `app/api/*` (checkout, webhooks) se despliega automáticamente como una función serverless independiente, con escalado automático según demanda — ideal para picos de tráfico ante campañas de una pyme en redes sociales.
5. **Edge Runtime donde aplique**: evaluar mover el `middleware.ts` (autenticación/Supabase SSR) y páginas públicas de solo lectura (perfil `/ [slug]`) a **Edge Runtime** para reducir la latencia percibida por turistas que acceden desde distintas regiones, especialmente relevante para una audiencia internacional (turistas).
6. **Dominios personalizados**: configurar el dominio de producción (ej. `proyectov.app`) y asegurarse de que `NEXT_PUBLIC_APP_URL` coincida exactamente, ya que se usa para construir URLs de retorno de checkout y enlaces en correos.
7. **Previews por Pull Request**: aprovechar los _Preview Deployments_ automáticos de Vercel en cada PR para validar cambios (incluyendo la demo `/demo/*`) antes de fusionar a producción, usando credenciales de prueba/mock en ese entorno.
8. **Webhooks apuntando al dominio de producción**: una vez desplegado, actualizar en los dashboards de Stripe y de la pasarela de pago (TiloPay/OnvoPay) las URLs de webhook para que apunten a `https://<dominio>/api/webhooks/*`.
9. **Monitoreo**: habilitar **Vercel Analytics** (ya integrado vía `@vercel/analytics` en el proyecto) y revisar los logs de Functions para detectar errores en Route Handlers críticos (checkout, webhooks) tempranamente.
