# 🏝️ Proyecto V — Reservas sin comisiones para pymes turísticas

**Proyecto V** es una plataforma SaaS de reservas diseñada para micro y pequeñas empresas turísticas de Costa Rica (escuelas de surf, tours, hospedajes boutique, actividades de aventura, etc.).

A diferencia de los marketplaces tradicionales, Proyecto V **no cobra comisión por reserva**: el negocio paga una suscripción fija mensual y recibe los pagos de sus clientes de forma **directa**, manteniendo el 100% de sus ingresos por servicio. 💸

## ✨ Propuesta de valor

- 🚫 **Cero comisiones** por transacción — el turista paga, el negocio recibe.
- 🔗 **"Link en bio" transaccional**: un perfil público (`/[slug]`) con servicios, agenda y botón de pago, ideal para compartir en Instagram/WhatsApp.
- 📅 **Agenda y disponibilidad en tiempo real** con bloqueos y excepciones de horario.
- 💳 **Pagos directos** vía pasarela (Stripe) y simulación de pago local para pruebas.
- 📊 **Panel de empresa** para gestionar servicios, reservas, finanzas y personalización de marca.
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

Proyecto V tiene dos grandes superficies, cada una disponible (conectada a Supabase o a la capa mock local):

### 1. Vista pública del negocio

Perfil público donde el turista descubre servicios, revisa disponibilidad y paga:

- Producción: [app/[slug]/page.tsx](app/%5Bslug%5D/page.tsx) (ej. `/surf-tamarindo`)

### 2. Panel de empresa

Donde el dueño del negocio gestiona su operación diaria:

- Producción: [app/[slug]/admin/](app/%5Bslug%5D/admin/) (ruta **`/[slug]/admin`**, ej. **`/surf-tamarindo/admin`**) — agenda, servicios, reservas, finanzas, personalización y suscripción.

**Empresa** sigue siendo el rol del dueño del negocio; el segmento `admin` de `/<slug>/admin` identifica su panel. La ruta raíz **`/admin`** se reserva exclusivamente para un futuro rol **Admin global**, no está implementada y ya no tiene una redirección al panel Empresa. Los segmentos `empresa` y `admin` no deben usarse como slugs públicos de negocios.

- **Compatibilidad, solo GET**: `/empresa` y sus subrutas son alias que resuelven el negocio desde la sesión autenticada, aceptan únicamente una allowlist de secciones y conservan los querystrings al redirigir a `/<slug>/admin`. No son rutas de ejecución de Server Actions.
- **Autorización en servidor**: además del middleware y el layout, cada página del panel y cada Server Action validan `user_id` + `slug` mediante [lib/empresa.ts](lib/empresa.ts). El slug no sustituye la identidad de la sesión. [lib/rutas-empresa.ts](lib/rutas-empresa.ts) centraliza las rutas canónicas y la allowlist de compatibilidad.
- **Retornos e invalidación**: login y Stripe retornan a la ruta canónica del negocio correspondiente. `revalidarEmpresa(slug)` invalida el layout exacto `/<slug>/admin` y el perfil público del mismo negocio, no todos los paneles.

Los componentes siguen en [components/empresa/](components/empresa/), [components/EmpresaPage.tsx](components/EmpresaPage.tsx) y [components/EmpresaShell.tsx](components/EmpresaShell.tsx); se conservan los nombres `*EmpresaClient`. Este cambio de rutas **no requiere migración de base de datos** ni añade un rol global implementado.

```
app/
├── [slug]/          # Perfil público real (Supabase)
│   └── admin/       # Panel Empresa del mismo negocio
├── empresa/
│   └── [[...ruta]]/ # Alias GET resuelto por sesión
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
- `lib/` — Clientes (Supabase, Stripe), utilidades y capa mock local.
- `types/` — Tipos TypeScript del esquema de base de datos.
- `docs/` — Documentación de fases del proyecto.

## 📄 Licencia

Ver [LICENSE](LICENSE).
