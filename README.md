# 🏝️ Proyecto V — Reservas sin comisiones para pymes turísticas

**Proyecto V** es una plataforma SaaS de reservas diseñada para micro y pequeñas empresas turísticas de Costa Rica (escuelas de surf, tours, hospedajes boutique, actividades de aventura, etc.).

A diferencia de los marketplaces tradicionales, Proyecto V **no cobra comisión por reserva**: el negocio paga una suscripción fija mensual y recibe los pagos de sus clientes de forma **directa**, manteniendo el 100% de sus ingresos por servicio. 💸

## ✨ Propuesta de valor

- 🚫 **Cero comisiones** por transacción — el turista paga, el negocio recibe.
- 🔗 **"Link en bio" transaccional**: un perfil público (`/[slug]`) con servicios, agenda y botón de pago, ideal para compartir en Instagram/WhatsApp.
- 📅 **Agenda y disponibilidad en tiempo real** con bloqueos y excepciones de horario.
- 💳 **Pagos directos** vía pasarela (Stripe) y simulación de pago local para pruebas.
- 📊 **Panel de administración** para gestionar servicios, reservas, finanzas y personalización de marca.
- ✉️ **Notificaciones automáticas** por correo (Resend + React Email) a negocio y turista.
- 🌐 **Multi-idioma** (i18n) y arquitectura multi-tenant vía `negocio_id`.

## 🛠️ Stack tecnológico

| Categoría     | Tecnología                                            |
| ------------- | ----------------------------------------------------- |
| Framework     | **Next.js 15** (App Router, Server/Client Components) |
| UI            | **React 19** + **TypeScript** (strict)                |
| Estilos       | **Tailwind CSS 4**                                    |
| Estado global | **Zustand**                                           |
| Animaciones   | **Framer Motion**                                     |
| Backend / DB  | **Supabase** (PostgreSQL, `@supabase/ssr`)            |
| Pagos         | **Stripe** (suscripciones y checkout)                 |
| Emails        | **Resend** + **React Email**                          |
| Validación    | **Zod**                                               |
| Utilidades    | `clsx`, `tailwind-merge`, `lucide-react`              |
| Analytics     | Vercel Analytics                                      |

## 🏗️ Estructura de la aplicación

Proyecto V tiene dos grandes superficies, cada una disponible tanto en su versión **real** (conectada a Supabase) como en una versión **demo** (100% frontend, sin backend, para presentaciones comerciales):

### 1. Vista pública del negocio

Perfil público donde el turista descubre servicios, revisa disponibilidad y paga:

- Producción: `app/[slug]/page.tsx` (ej. `/tamarindo-surf-school`)
- Demo (sin backend, ideal para mostrar a clientes): `app/demo/[slug]/page.tsx` (ej. **`/demo/surf-tamarindo`**)

### 2. Panel de administración

Donde el dueño del negocio gestiona su operación diaria:

- Producción: `app/admin/` — agenda, servicios, reservas, finanzas, personalización y suscripción.
- Demo: `app/demo/admin/` (ej. **`/demo/admin`**) — misma experiencia, con datos simulados en `lib/mockData.ts` / `lib/demoStore.ts`.

```
app/
├── [slug]/          # Perfil público real (Supabase)
├── admin/           # Panel de administración real
├── demo/
│   ├── [slug]/      # Perfil público de demostración
│   └── admin/       # Panel de administración de demostración
└── api/             # Endpoints (checkout, webhooks de pago/Stripe)
```

## 🚀 Instalación y ejecución local

### Requisitos previos

- Node.js 18+
- Cuenta de Supabase (para el modo producción)
- Cuenta de Stripe y Resend (opcional, para pagos y emails reales)

### Pasos

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env.local
# Completar credenciales de Supabase, Stripe y Resend en .env.local

# 3. Levantar el servidor de desarrollo
npm run dev
```

La aplicación quedará disponible en [http://localhost:3000](http://localhost:3000).

> 💡 **Tip:** Si solo quieres ver la demo comercial sin configurar Supabase, visita directamente `/demo/surf-tamarindo` y `/demo/admin` — funcionan con datos simulados en el navegador.

### Otros comandos útiles

```bash
npm run build      # Compilación de producción
npm run start      # Levantar build de producción
npm run lint        # Linter (ESLint)
npm run email:dev   # Previsualizar plantillas de correo (React Email)
```

## 📁 Estructura del proyecto

- `actions/` — Server Actions (agenda, auth, billing, servicios, pagos simulados).
- `app/` — Rutas de la aplicación (App Router de Next.js).
- `components/` — Componentes UI reutilizables.
- `emails/` — Plantillas de correo transaccional (React Email).
- `lib/` — Clientes (Supabase, Stripe), utilidades y capa mock para demos.
- `types/` — Tipos TypeScript del esquema de base de datos.
- `docs/` — Documentación de fases del proyecto y guías de demo.

## 📄 Licencia

Ver [LICENSE](LICENSE).
