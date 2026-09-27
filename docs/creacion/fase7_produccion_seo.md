# Fase 7 — Producción, SEO y Pulido Final (Go-to-Market)

## 1. Resumen

Última fase antes de despliegue: SEO dinámico para compartir enlaces,
manejo global de errores (sin pantallas blancas), páginas legales
estáticas requeridas por pasarelas de pago/bancos, y analíticas básicas.

## 2. SEO dinámico (`generateMetadata`)

En [app/[slug]/page.tsx](../app/%5Bslug%5D/page.tsx) se exporta
`generateMetadata({ params })`, una función especial de Next.js (App
Router) que:

1. Se ejecuta **en el servidor**, antes del render de la página, recibiendo
   los mismos `params` que el componente de página (`{ slug }`).
2. Hace un fetch liviano a Supabase (`select("nombre, descripcion, logo_url")`)
   solo con las columnas necesarias para los metadatos (no trae servicios
   ni datos innecesarios).
3. Si el negocio no existe, devuelve un `title`/`description` genérico de
   "no encontrado" (la página en sí seguirá llamando a `notFound()` para
   mostrar el 404 real).
4. Si existe, arma un objeto `Metadata` con:
   - `title` / `description` (SEO estándar, aparece en la pestaña del
     navegador y buscadores).
   - `openGraph.title/description/images` — usado por WhatsApp, Instagram,
     Facebook, LinkedIn, etc. al generar la vista previa de un link
     compartido.
   - `twitter.card = "summary_large_image"` — vista previa enriquecida en X/Twitter.

Next.js deduplica automáticamente el fetch si el mismo dato ya se pidió en
`generateMetadata` y en el componente de página (usando el cache de
`fetch`/Data Cache), por lo que no se duplica la carga a la base de datos
de forma significativa.

## 3. Jerarquía de Error Boundaries

Next.js (App Router) resuelve los límites de error de adentro hacia
afuera. En este proyecto:

```
app/global-error.tsx        ← captura errores fatales de TODA la app,
                               incluyendo fallos en app/layout.tsx.
                               Define su propio <html>/<body> porque
                               reemplaza al layout raíz completo.
   └─ app/layout.tsx          (layout raíz normal)
        └─ app/[slug]/error.tsx   ← captura errores solo dentro de
                                     /[slug]/** (ej. falla de Supabase
                                     o de la simulación de pago), sin
                                     tumbar el resto del sitio (ej.
                                     /admin sigue funcionando).
              └─ app/[slug]/page.tsx / layout.tsx
```

Adicionalmente:

- `app/not-found.tsx`: se muestra cuando se llama a `notFound()` (ej.
  negocio con slug inexistente) o cuando ninguna ruta coincide. No es un
  Error Boundary de React; es la convención de Next.js para 404.

Todos los boundaries (`error.tsx`, `global-error.tsx`) son
**Client Components** (`"use client"`), requisito de Next.js porque usan
`useEffect` (para loguear el error) y reciben `reset()` como función
interactiva.

## 4. Páginas legales

- [app/terminos/page.tsx](../app/terminos/page.tsx)
- [app/privacidad/page.tsx](../app/privacidad/page.tsx)

Contenido genérico (mockeado) pero con estructura real y secciones
estándar (uso del servicio, pagos, cancelaciones, datos, cookies, etc.),
suficientes para que las pasarelas de pago (Tilopay/Stripe) y bancos
verifiquen que el negocio tiene políticas publicadas. **Deben ser
revisadas por un abogado antes de producción real.**

## 5. Analíticas

Se integró `@vercel/analytics/react` en [app/layout.tsx](../app/layout.tsx)
(`<Analytics />` dentro de `<body>`, después de `{children}`). Sin
configuración adicional: si el proyecto se despliega en Vercel, empieza a
recolectar automáticamente vistas de página y Web Vitals. En otros hosts,
el componente no falla, simplemente no envía datos (no requiere API key).

## 6. Checklist de despliegue

1. **Variables de entorno reales configuradas** en el hosting de
   producción: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`,
   `PAGO_WEBHOOK_SECRET`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
   `STRIPE_PRICE_ID`, `NEXT_PUBLIC_APP_URL` — y confirmar que
   `USE_MOCK_DB` **no** esté en `true`.
2. **Dominios permitidos configurados en Supabase**: agregar la URL de
   producción en Authentication → URL Configuration (Site URL y Redirect
   URLs), y en CORS si aplica, para que el login y las cookies de sesión
   funcionen correctamente.
3. **Webhooks apuntando a producción**: actualizar la URL del webhook de
   la pasarela de pagos (`/api/webhooks/pago`) y el endpoint de Stripe
   (`/api/webhooks/stripe`, con su `STRIPE_WEBHOOK_SECRET` de producción)
   en sus respectivos paneles.
4. **Row Level Security (RLS) verificado**: confirmar que las políticas de
   `negocios`, `servicios`, `reservas` y `bloqueos_excepcion` están
   activas y probadas contra al menos dos cuentas distintas (aislamiento
   multi-tenant).
5. **Auditoría de dependencias y build de producción**: ejecutar
   `npm audit` y `npm run build` localmente antes de desplegar, revisando
   que no haya vulnerabilidades críticas sin atender ni errores de
   compilación/TypeScript.
