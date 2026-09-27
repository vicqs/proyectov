# Fase 6 — Dashboard Financiero y Suscripción SaaS (Billing)

## 1. Resumen

Esta fase añade dos piezas de negocio nuevas sobre lo construido en las
Fases 1–5:

1. **Dashboard Financiero** (`/admin/finanzas`): permite a la pyme ver
   cuánto ha facturado, cuánto se lleva la plataforma/banco en comisiones,
   y cuánto le corresponde liquidar en neto.
2. **Suscripción SaaS** (`/admin/suscripcion`): cobro recurrente de
   **$15 USD/mes** a la pyme por el uso del software, vía Stripe
   Checkout + Billing Portal (suscripciones).

## 2. Cambios en el esquema de `negocios`

Se asumen dos columnas nuevas en la tabla `negocios` de Supabase:

```sql
alter table negocios
  add column estado_suscripcion text not null default 'prueba'
    check (estado_suscripcion in ('activa', 'inactiva', 'prueba')),
  add column stripe_customer_id text;
```

- `estado_suscripcion`: controla si la pyme tiene acceso pleno a la
  plataforma. En un futuro se puede usar en middleware para bloquear
  `/admin/*` si está `inactiva` (no implementado en esta fase para no
  bloquear el uso durante desarrollo/pruebas).
- `stripe_customer_id`: se guarda la primera vez que la pyme inicia un
  checkout, para reutilizar el mismo Customer de Stripe en renovaciones.

Reflejado en TypeScript en [types/database.ts](../types/database.ts)
(`EstadoSuscripcion`, campos en `Negocio`).

## 3. Cálculo de ingresos netos (Dashboard Financiero)

Sobre cada reserva con `estado = 'pagada'` del negocio:

```
ingresoBruto        = Σ precio_usd de cada reserva pagada
comisionPlataforma  = ingresoBruto × 1.5%
comisionBanco       = ingresoBruto × 4.25%
comisionesEstimadas = comisionPlataforma + comisionBanco
ingresoNeto         = ingresoBruto − comisionesEstimadas
```

Estas tasas están centralizadas como constantes
(`COMISION_PLATAFORMA`, `COMISION_BANCO`) en
[app/admin/finanzas/page.tsx](../app/admin/finanzas/page.tsx) para
ajustarse fácilmente si cambian los acuerdos comerciales. El monto de
cada reserva se obtiene mediante un JOIN a `servicios` (mismo patrón que
`/admin/reservas`): `select("*, servicio:servicios(nombre, precio_usd)")`.

La tabla de "últimos pagos" muestra las 10 reservas pagadas más recientes
(`order("fecha_hora", { ascending: false })`, luego `.slice(0, 10)`).

## 4. Flujo de suscripción (Stripe)

### Variables de entorno nuevas

| Variable                | Descripción                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| `STRIPE_SECRET_KEY`     | Clave secreta de Stripe (server-side). Si falta, la app opera en **modo simulado** (ver más abajo). |
| `STRIPE_WEBHOOK_SECRET` | Secreto para verificar la firma de `stripe.webhooks.constructEvent`.                                |
| `STRIPE_PRICE_ID`       | ID del Price de Stripe para el plan mensual de $15 USD.                                             |
| `NEXT_PUBLIC_APP_URL`   | URL base pública de la app, usada para construir `success_url`/`cancel_url` del Checkout.           |

### Server Action: `actions/billing.ts`

- `crearCheckoutSuscripcionAction()`:
  1. Verifica sesión activa vía `createSupabaseServerClient().auth.getUser()`; si no hay sesión, redirige a `/login`.
  2. Busca el negocio del usuario autenticado.
  3. Si no hay `stripe_customer_id`, crea un `Customer` en Stripe y lo guarda.
  4. Crea una `checkout.sessions.create({ mode: "subscription", ... })` con el `price` de `STRIPE_PRICE_ID`, y redirige al usuario a `session.url`.
- La suscripción se activa **solo** cuando llega el webhook de Stripe (no en la Server Action), siguiendo el flujo real de pagos asíncronos.

### Webhook: `app/api/webhooks/stripe/route.ts`

- Verifica la firma con `stripe.webhooks.constructEvent(rawBody, firma, STRIPE_WEBHOOK_SECRET)` (usa el cuerpo **crudo**, requisito de Stripe).
- Eventos manejados:
  - `checkout.session.completed`: activa la suscripción usando `session.metadata.negocio_id`.
  - `invoice.paid`: activa la suscripción (renovación mensual) buscando el negocio por `stripe_customer_id`.
- Siempre responde 200 rápido, salvo error de firma (400) o error interno (500), para que Stripe no reintente indefinidamente por errores ya manejados.

### Modo simulado (sin Stripe real)

Mientras no existan credenciales reales de Stripe (`STRIPE_SECRET_KEY` no
configurada, o la app corriendo con `USE_MOCK_DB=true`), `lib/stripe.ts`
expone `isStripeMockMode = true` y **no** inicializa el SDK de Stripe.

En ese caso:

- `crearCheckoutSuscripcionAction()` redirige a
  `/admin/suscripcion/simulado/[negocioId]`, una pantalla que imita
  Stripe Checkout dentro de la propia app.
- Al confirmar, `confirmarSuscripcionSimuladaAction()` actualiza
  directamente `estado_suscripcion = 'activa'` (equivalente a lo que
  haría el webhook real), sin necesidad de firmar/verificar nada.
- El endpoint `/api/webhooks/stripe` responde `503` en este modo, ya que
  no participa del flujo simulado.

## 5. Cómo probar el webhook de Stripe localmente (con Stripe real)

1. Instala el [Stripe CLI](https://stripe.com/docs/stripe-cli) y autentica: `stripe login`.
2. Redirige los eventos a tu servidor local:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Este comando imprime un `whsec_...`: cópialo en `STRIPE_WEBHOOK_SECRET` en `.env.local`.
3. Crea un producto y un Price recurrente de $15 USD/mes en el
   [Dashboard de Stripe](https://dashboard.stripe.com/test/products) (modo test) y copia el `price_id` en `STRIPE_PRICE_ID`.
4. Con el servidor (`npm run dev`) y `stripe listen` corriendo, inicia sesión en `/login`, ve a `/admin/suscripcion` y haz clic en "Suscribirse ahora". Usa la tarjeta de prueba `4242 4242 4242 4242` con cualquier fecha futura y CVC.
5. Al completar el pago, Stripe CLI reenvía `checkout.session.completed` (y luego `invoice.paid`) a tu endpoint local, que actualizará `estado_suscripcion` a `activa` en Supabase.
6. También puedes disparar eventos manualmente para pruebas puntuales:
   ```bash
   stripe trigger checkout.session.completed
   ```

## 6. Archivos de esta fase

- [actions/billing.ts](../actions/billing.ts)
- [app/admin/finanzas/page.tsx](../app/admin/finanzas/page.tsx)
- [app/admin/suscripcion/page.tsx](../app/admin/suscripcion/page.tsx)
- [app/admin/suscripcion/SuscribirseButton.tsx](../app/admin/suscripcion/SuscribirseButton.tsx)
- [app/admin/suscripcion/simulado/[negocioId]/page.tsx](../app/admin/suscripcion/simulado/%5BnegocioId%5D/page.tsx)
- [app/api/webhooks/stripe/route.ts](../app/api/webhooks/stripe/route.ts)
- [lib/stripe.ts](../lib/stripe.ts)
- Actualizaciones en [types/database.ts](../types/database.ts), [lib/mock/data.ts](../lib/mock/data.ts) y [app/admin/layout.tsx](../app/admin/layout.tsx) (nuevos links de navegación).

## 7. Pendientes / decisiones asumidas

- No se implementó bloqueo automático de `/admin/*` cuando
  `estado_suscripcion = 'inactiva'` (queda para una fase futura, para no
  interferir con las pruebas manuales del resto de la app).
- No se implementó un Billing Portal de Stripe (`billingPortal.sessions.create`) para que la pyme cancele/actualice su método de pago; solo el checkout inicial.
- El período de "prueba" (`estado_suscripcion = 'prueba'`) es solo un
  valor por defecto; no hay lógica de expiración automática de prueba.
