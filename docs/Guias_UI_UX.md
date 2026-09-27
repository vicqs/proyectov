# 🎨 Guías de UI/UX — Proyecto V

Este documento resume el sistema visual actual del producto: paleta de colores, tipografía, animaciones y componentes reutilizables, extraído del código real de estilos y componentes (Tailwind CSS 4 + Framer Motion).

> ℹ️ El proyecto usa **Tailwind CSS 4**, que ya no requiere `tailwind.config.ts`: la configuración vive directamente en [app/globals.css](../app/globals.css) mediante `@import "tailwindcss"` y el bloque `@theme inline`.

## 1. 🎨 Paleta de colores

### Base (definida en `globals.css`)

| Token          | Valor                 | Uso                         |
| -------------- | --------------------- | --------------------------- |
| `--background` | `#ffffff`             | Fondo base de la aplicación |
| `--foreground` | `#0f172a` (slate-900) | Color de texto principal    |

### Escala neutra (Tailwind `slate`) — predominante en toda la UI

La paleta de grises usada consistentemente en fondos, bordes, texto secundario y overlays es la escala **`slate`** de Tailwind:

- `slate-900` / `slate-950` — texto principal, botones primarios (fondo negro-azulado), títulos.
- `slate-600` / `slate-500` — texto secundario, íconos.
- `slate-400` — placeholders, texto deshabilitado.
- `slate-100` / `slate-50` — fondos sutiles, bordes de separación (`border-slate-100`), hover de botones de ícono.
- `slate-900/40` — overlay semitransparente detrás de drawers y modales (`bg-slate-900/40 backdrop-blur-sm`).

### Color de acento dinámico (marca del negocio)

Cada negocio tiene su **propio color de marca** (`colorTema`), definido en sus datos (ej. `colorTema: "#0284c7"` — sky-600 — para "Tamarindo Surf School" en [lib/mockData.ts](../lib/mockData.ts)). Este color se inyecta vía estilos inline (`style={{ backgroundColor: colorTema }}`, `--tw-ring-color`) en:

- El precio destacado sobre las tarjetas de servicio ([components/ServicioCard.tsx](../components/ServicioCard.tsx)).
- El anillo de foco (`focus-visible:ring-2`) de elementos interactivos.
- Botones primarios de call-to-action del perfil público.

Esto permite que cada pyme "personalice" su perfil público sin tocar código — pieza clave de la sección **Personalización** del panel admin (`app/admin/personalizacion`).

### Colores semánticos (estado)

| Color                                | Uso                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `emerald-500`                        | Éxito (`CheckCircle2` en confirmaciones de pago/reserva, toast de éxito)      |
| `red` / `rose`                       | Error (toast de error, validaciones de formulario)                            |
| `black/85 → transparent` (gradiente) | Degradado oscuro sobre imágenes de servicio para legibilidad del texto blanco |

## 2. ✍️ Tipografía y espaciado

### Fuente

- Fuente sans definida vía variable de tema: `--font-sans: var(--font-inter)` (Inter, cargada como fuente de Next.js en [app/layout.tsx](../app/layout.tsx)).

### Escala tipográfica predominante

| Clase                   | Uso típico                                               |
| ----------------------- | -------------------------------------------------------- |
| `text-xs`               | Metadatos pequeños (duración del servicio, etiquetas)    |
| `text-sm`               | Texto secundario/descripciones, botones                  |
| `text-base` (implícito) | Cuerpo de texto por defecto                              |
| `text-lg`               | Títulos de sección/modal (`Drawer`, encabezados de card) |
| `text-xl`               | Títulos de tarjetas de servicio                          |
| `text-2xl` / `text-3xl` | Precios destacados, títulos de página                    |

Pesos: `font-medium` (botones, labels), `font-semibold` (títulos de tarjeta, precios), `font-bold` (títulos de página/drawer). Se usa `tracking-tight` en títulos para un look más compacto/premium.

### Espaciado y bordes

- **Padding de contenedores**: `p-6` en drawers/modales, `px-6 py-5` en cabeceras, `px-4 py-3` en botones grandes.
- **Border radius generosos** (estilo Apple/Airbnb): `rounded-3xl` en tarjetas de servicio, `rounded-2xl` en modales/sheets, `rounded-xl` en botones, `rounded-full` en badges de precio y botones de ícono.
- **Sombras**: `shadow-sm` por defecto, `hover:shadow-xl` en hover de tarjetas, `shadow-2xl` en drawers/paneles flotantes.
- **Espaciado entre elementos**: `gap-3`, `gap-1.5` en grupos de íconos + texto; `mt-1.5`, `mt-4`, `mt-6` para separación vertical progresiva.

## 3. 🎬 Animaciones (Framer Motion)

Framer Motion es la librería central de animación, usada de forma consistente para transiciones de vista y micro-interacciones:

- **Modal de pago / checkout animado** ([components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx)): el flujo completo (`horario → datos → pago → cargando → éxito`) se anima con `AnimatePresence` + variantes (`variantesPaso`) que deslizan cada paso lateralmente (`x: 40 → 0 → -40`) con fundido de opacidad, dando sensación de asistente tipo wizard nativo.
- **Drawers/paneles laterales** ([components/Drawer.tsx](../components/Drawer.tsx)): entrada/salida con física de resorte (`type: "spring", stiffness: 280, damping: 32`), deslizando desde `x: "100%"` hasta `x: 0`, con overlay que se desvanece (`opacity` con `easeOut`).
- **Tarjetas de servicio** ([components/ServicioCard.tsx](../components/ServicioCard.tsx)): micro-interacción de elevación (`whileHover={{ y: -6 }}`) y compresión al tocar (`whileTap={{ scale: 0.97 }}`), con resorte suave (`stiffness: 300, damping: 22`) — refuerza la sensación táctil "premium".
- **Botones de ícono** ([components/AnimatedIconButton.tsx](../components/AnimatedIconButton.tsx)): micro-animación "identidad" de giro de 90° (hover/tap) consistente en toda la app para abrir/cerrar menús y paneles.
- **Toasts de notificación** ([components/Toast.tsx](../components/Toast.tsx)): entrada/salida animada con `AnimatePresence` para confirmar acciones (crear/editar/eliminar) en el panel admin.

**Principio de diseño**: todas las transiciones usan física de resorte (`spring`) en vez de curvas de tiempo fijas, para que la interfaz se sienta natural y responsiva — patrón inspirado en las interacciones de iOS/Apple y Airbnb.

## 4. 🧱 Componentes clave (UI reutilizable)

| Componente                | Archivo                                                                         | Variantes / notas                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **ServicioCard**          | [components/ServicioCard.tsx](../components/ServicioCard.tsx)                   | Tarjeta de servicio con imagen a sangre, degradado y precio con color de marca dinámico.                                                       |
| **AnimatedCheckoutSheet** | [components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx) | Bottom sheet multi-paso (horario/datos/pago/cargando/éxito), con trampa de foco y soporte de teclado (Escape).                                 |
| **CheckoutMock**          | [components/CheckoutMock.tsx](../components/CheckoutMock.tsx)                   | Modal de checkout simplificado (versión ligera, un solo paso) para el perfil público.                                                          |
| **Drawer**                | [components/Drawer.tsx](../components/Drawer.tsx)                               | Slide-over lateral derecho reutilizable para formularios de crear/editar en `/demo/admin`.                                                     |
| **ConfirmDialog**         | [components/ConfirmDialog.tsx](../components/ConfirmDialog.tsx)                 | Modal de confirmación (ej. antes de eliminar un servicio u horario).                                                                           |
| **AnimatedIconButton**    | [components/AnimatedIconButton.tsx](../components/AnimatedIconButton.tsx)       | Botón de ícono con variantes `"abrir"` / `"cerrar"` y animación de giro consistente.                                                           |
| **Toast / ToastViewport** | [components/Toast.tsx](../components/Toast.tsx)                                 | Sistema de notificaciones globales (`toast.success()`, `toast.error()`) vía store externo (`useSyncExternalStore`), sin dependencias externas. |
| **Footer**                | [components/Footer.tsx](../components/Footer.tsx)                               | Pie de página institucional (legal, marca).                                                                                                    |
| **VLogo**                 | [components/VLogo.tsx](../components/VLogo.tsx)                                 | Logotipo de marca de la plataforma (Proyecto V).                                                                                               |
| **Watermark**             | [components/Watermark.tsx](../components/Watermark.tsx)                         | Marca de agua discreta (probablemente para planes/demo sin marca blanca).                                                                      |

Todos los componentes interactivos comparten la utilidad [lib/cn.ts](../lib/cn.ts) (`clsx` + `tailwind-merge`) para componer clases condicionales sin conflictos de especificidad de Tailwind.

## 5. 🥇 Regla de oro UX

> **Cero fricción para el turista, no-code/intuitivo para la pyme.**

- **Turista (perfil público / checkout)**: el flujo de reserva y pago debe completarse en el menor número de pasos posible, sin necesidad de crear cuenta, con feedback visual inmediato (animaciones de carga, confirmación clara) y funcionando perfectamente en móvil (mobile-first), ya que la mayoría de las reservas llegan desde un enlace compartido en redes sociales.
- **Pyme (panel de administración)**: la dueña o el dueño del negocio —típicamente sin conocimientos técnicos— debe poder gestionar servicios, horarios y ver sus reservas/finanzas usando formularios simples (Drawers), confirmaciones claras (`ConfirmDialog`) y notificaciones inmediatas (`Toast`), **sin tocar código ni configuración técnica**. Toda la personalización de marca (color, textos) se resuelve desde la UI, nunca editando archivos.

Esta regla debe primar sobre cualquier decisión de diseño futura: ante la duda entre una solución "más completa" pero más compleja, y una más simple pero inmediata de usar, **se prioriza la simplicidad**.
