# 🧩 Arquitectura Técnica — Proyecto V

Este documento describe cómo está construido el prototipo/demo actual (`/demo/*`) en tres frentes: manejo de estado, organización del frontend y el flujo de pago (actual vs. futuro).

## 1. 🗃️ Patrón de estado: Zustand en memoria

El store central de la demo vive en [lib/demoStore.ts](../lib/demoStore.ts) y usa **Zustand** (`create<DemoStoreState>()`) como única fuente de verdad para el panel `/demo/admin/*` y el perfil público `/demo/[slug]`.

### Características clave

- **100% en memoria, sin persistencia real**: no usa `localStorage`, `sessionStorage` ni ninguna base de datos. Al recargar la página (F5), el estado se reinicia a los datos semilla (`datosSemilla()`), simulando un negocio de ejemplo ("Tamarindo Surf School").
- **Multi-tenant simulado por `slug`**: el store guarda un diccionario `negocios: Record<string, DemoStoreData>`, donde cada negocio (identificado por su slug) tiene su propio conjunto independiente de datos. `_asegurarNegocio(slug)` crea los datos semilla la primera vez que se accede a un slug nuevo.
- **Forma de los datos (`DemoStoreData`)**:
  - `servicios: DemoServicio[]` — catálogo de servicios ofrecidos (precio, duración, imagen).
  - `horarios: DemoHorario[]` — franjas horarias por servicio, con `cuposTotales` / `cuposDisponibles`.
  - `reservas: DemoReserva[]` — reservas confirmadas (cliente, monto pagado, horario asociado).
  - `suscripcion: DemoSuscripcion` — estado del plan del negocio (`"activa" | "inactiva" | "prueba"`) y fecha de próximo cobro.
- **Acciones expuestas** (mutaciones inmutables vía `set`): `crearServicio`, `editarServicio`, `eliminarServicio`, `crearHorario`, `eliminarHorario`, `crearReserva`, `activarSuscripcion`, `cancelarSuscripcion`. Todas operan sobre el slice del negocio correspondiente sin afectar a otros negocios.
- **Consumo**: los componentes de UI leen el estado reactivamente mediante el hook interno del store (`useStoreInterno`, envuelto como `useDemoStore(slug)` en el resto de la app) y disparan las acciones anteriores para mutar el estado — el mismo patrón que tendría una app conectada a una API real, lo que facilita reemplazar esta capa por Supabase sin rediseñar los componentes.

> 💡 Este patrón permite que la demo comercial (`/demo/surf-tamarindo`, `/demo/admin`) se sienta completamente funcional e interactiva (crear servicios, reservar cupos, activar suscripción) sin requerir backend ni configuración de Supabase.

## 2. 🏗️ Arquitectura Frontend (Next.js App Router)

La aplicación usa el **App Router** de Next.js 15, con una clara separación entre rutas de producción (conectadas a Supabase) y rutas de demo (sin backend):

```
app/
├── [slug]/              # Perfil público real — Server Component + Supabase
├── admin/               # Panel de administración real
│   ├── agenda/
│   ├── finanzas/
│   ├── personalizacion/
│   ├── reservas/
│   └── servicios/
├── demo/
│   ├── [slug]/          # Perfil público de demo (usa lib/demoStore.ts)
│   └── admin/           # Panel de administración de demo
│       ├── horarios/
│       ├── reservas/
│       ├── servicios/
│       └── suscripcion/
└── api/                 # Route Handlers (checkout, webhooks de pago/Stripe)
```

- **Server Components por defecto**: las páginas (`page.tsx`) obtienen datos en el servidor cuando es posible (rutas reales vía Supabase).
- **Client Components (`"use client"`)** para todo lo interactivo: formularios, modales de checkout, animaciones. Ejemplos: [components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx), [components/CheckoutMock.tsx](../components/CheckoutMock.tsx), [components/ConfirmDialog.tsx](../components/ConfirmDialog.tsx).
- **Componentes reutilizables** en [components/](../components/): `ServicioCard`, `Drawer`, `Toast`, `AnimatedIconButton`, `Footer`, `VLogo`, `Watermark` — consumidos tanto por las rutas de producción como por las de demo.
- **Estilos**: Tailwind CSS 4 utilitario, con `cn()` ([lib/cn.ts](../lib/cn.ts)) combinando `clsx` + `tailwind-merge` para componer clases condicionales sin conflictos.
- **Animaciones**: Framer Motion gestiona las transiciones del bottom sheet de checkout (pasos: `horario → datos → pago → cargando → éxito`) y otros micro-interacciones.
- **i18n**: [lib/i18n.tsx](../lib/i18n.tsx) expone `LocaleProvider` + `useTranslations()` mediante Context de React, permitiendo textos multi-idioma en toda la UI.

## 3. 💳 Flujo de pago: Mock actual vs. futuro con TiloPay/OnvoPay

### Estado actual (Mock)

El pago se simula completamente en el frontend, sin ninguna llamada a una pasarela real:

- **[components/CheckoutMock.tsx](../components/CheckoutMock.tsx)**: modal simple usado en el perfil público de demo (`/demo/[slug]`). Al confirmar, hace un `setTimeout` de ~1.2s y muestra un estado de "éxito" — no se envían datos de tarjeta a ningún servicio externo.
- **[components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx)**: versión más completa (bottom sheet animado) que incluye un paso `"pago"` con campos de número de tarjeta, vencimiento y CVC formateados en el cliente, y un paso `"cargando"` que simula el procesamiento antes de pasar a `"exito"`. Al confirmar, invoca `onReservaConfirmada(...)`, que llama a `crearReserva(...)` en el `demoStore` — es decir, el "pago" solo actualiza el estado local en memoria, sin transacción real.
- El identificador de transacción (`trxIdSimulado`, con formato `TL-XXXXXXXX`) se genera localmente solo para fines de UI (recibo/confirmación visual).

### Arquitectura preparada para pagos reales

El flujo está diseñado en pasos discretos (`horario → datos → pago → cargando → exito`) precisamente para que el paso `"pago"` pueda reemplazarse por una integración real **sin reestructurar el resto del componente**:

- El paso `"pago"` de `AnimatedCheckoutSheet` es candidato directo para sustituirse por el **Modal/Checkout embebido de TiloPay u OnvoPay** (pasarelas de pago costarricenses), manteniendo al usuario dentro del mismo flujo y sin redirigirlo a un dominio externo.
- El callback `onReservaConfirmada` ya actúa como el punto de integración: en el futuro, en lugar de dispararse tras un `setTimeout` simulado, se llamaría desde el **webhook de confirmación de pago** (ver [app/api/webhooks/pago/route.ts](../app/api/webhooks/pago/route.ts) y [app/api/webhooks/stripe/route.ts](../app/api/webhooks/stripe/route.ts) como precedente de este patrón con Stripe), garantizando que la reserva solo se cree cuando el pago fue efectivamente confirmado por la pasarela.
- El endpoint [app/api/checkout/route.ts](../app/api/checkout/route.ts) ya existe como Route Handler para iniciar el proceso de checkout del lado del servidor, rol que asumiría la creación de la orden/intención de pago con TiloPay/OnvoPay antes de abrir su modal.
- **Objetivo de negocio**: mantener el flujo de "cero comisiones y pagos directos" — el dinero pasa por la pasarela directo a la cuenta del negocio, y Proyecto V únicamente orquesta la UI y la confirmación de la reserva, sin retener fondos ni redirigir al usuario fuera de la web.
