# Turismo Link — Micro-SaaS B2B2C

"Link en bio" transaccional para pymes turísticas costeras: perfil web público con
servicios, agenda y cobro con tarjeta.

## Stack

- Next.js 15 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS 4
- Supabase (PostgreSQL) — arquitectura multi-tenant vía `negocio_id`
- Zod, React Email, Lucide React

## Estructura

- `types/database.ts` — tipos del esquema (`negocios`, `servicios`, `reservas`).
- `lib/supabase.ts` — cliente Supabase (server-only).
- `app/[slug]/page.tsx` — perfil público del negocio (Server Component).
- `app/[slug]/BookingButton.tsx` — botón de reserva/pago (Client Component).
- `app/api/checkout/route.ts` — crea la reserva y simula el checkout de la pasarela de pagos.
- `app/api/webhooks/pago/route.ts` — confirma el pago vía webhook del banco.

## Desarrollo

```bash
npm install
cp .env.example .env.local # completar credenciales de Supabase
npm run dev
```
