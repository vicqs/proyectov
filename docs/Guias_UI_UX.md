# 🎨 Guías de UI/UX — vuki

Este documento reúne la identidad visual de vuki y los patrones de estilos y componentes del producto (Tailwind CSS 4 + Framer Motion). La referencia de marca y sus láminas visuales están en [Branding.md](branding/Branding.md). Para la construcción del logo y el isotipo prevalece el [nuevo manual del monograma VK](branding/logo%20nuevo.jfif), que sustituye el diseño de check anterior.

> ℹ️ El proyecto usa **Tailwind CSS 4**, que ya no requiere `tailwind.config.ts`: la configuración vive directamente en [app/globals.css](../app/globals.css) mediante `@import "tailwindcss"` y el bloque `@theme inline`.

## 1. 🎨 Paleta de colores

### Identidad de la plataforma

- **Nombre y wordmark:** siempre en minúsculas, **vuki**; la variante gráfica puede llevar el punto final **vuki.**.
- **Logo:** monograma **VK** formado por una diagonal slate, un brazo azul independiente y un arco esmeralda inferior, con cortes rectos y un pequeño espacio entre azul y verde. En fondos oscuros, la diagonal slate pasa a blanco. Tanto el punto de la «i» como el punto final del wordmark son **esmeralda**.
- **Isotipo:** contenedor squircle slate oscuro de 512 × 512, con radio del 20 % del lado y el monograma blanco/azul/esmeralda en su interior. El imagotipo horizontal usa el símbolo libre, sin contenedor, alineado al pie del wordmark.
- **Originales compartidos:** geometría y contornos en [lib/marca.ts](../lib/marca.ts), renderizados por `IsotipoVuki` y `LogotipoVuki` en [components/VLogo.tsx](../components/VLogo.tsx). UI y Open Graph usan el mismo wordmark vectorial; el favicon reproduce la misma geometría. Los correos conservan texto compatible con sus clientes y el punto esmeralda.
- **Construcción:** el SVG conserva las proporciones ópticas del [nuevo manual](branding/logo%20nuevo.jfif); sus cotas ilustrativas no se interpretan como un plano CAD. Mantener el margen de seguridad alrededor de la marca y la separación entre sus piezas, sin superponer otros elementos.
- La identidad de vuki no sustituye el nombre, el logo ni el color personalizado de cada negocio.
- **Panel de empresa:** cabecera institucional siempre slate oscuro (`#0f172a`), con textos claros y acentos fijos de vuki en móvil, escritorio y encabezado del menú móvil. La bienvenida, los encabezados de contenido y las tarjetas soft-bento usan los colores `--marca` / `--marca-2` elegidos por el negocio; también se conserva su personalización en la navegación activa. El superadmin mantiene la paleta institucional. Los colores de alerta, error y éxito conservan su significado y no se sustituyen por los del negocio.
- **Documentos legales:** cabecera institucional y lectura amplia sobre blanco; el contenido administrado, las condiciones y la fecha original no se sustituyen por copy comercial.

| Color de marca | Valor     | Uso                                            |
| -------------- | --------- | ---------------------------------------------- |
| Slate          | `#0f172a` | Texto principal y fondos institucionales       |
| Sky            | `#0284c7` | Brazo azul del monograma y acento principal    |
| Emerald        | `#10b981` | Puntos del isotipo/wordmark y acentos de éxito |
| Soft Slate     | `#f8fafc` | Fondos claros y superficies suaves             |
| Blanco         | `#ffffff` | Fondo base y contraste                         |

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

Cada negocio tiene su **propio color de marca** (`colorTema`), definido en sus datos (por ejemplo, en [lib/mock/data.ts](../lib/mock/data.ts)). Este color se inyecta vía estilos inline (`style={{ backgroundColor: colorTema }}`, `--tw-ring-color`) en:

- El precio destacado sobre las tarjetas de servicio ([components/ServicioCard.tsx](../components/ServicioCard.tsx)).
- El anillo de foco (`focus-visible:ring-2`) de elementos interactivos.
- Botones primarios de call-to-action del perfil público.

Esto permite que cada pyme "personalice" su perfil público sin tocar código — pieza clave de la sección **Personalización** del panel de empresa (`/[slug]/admin/personalizacion`), implementada en [app/[slug]/admin/personalizacion/page.tsx](../app/%5Bslug%5D/admin/personalizacion/page.tsx).

En el panel privado, [components/EmpresaShell.tsx](../components/EmpresaShell.tsx) reutiliza los dos colores guardados y deriva variantes `--marca-fondo`, `--marca-borde` y `--marca-texto` (y sus equivalentes `--marca-2-*`). Las superficies mezclan un 8 % del color con blanco, los bordes un 22 % y la tinta un 40 % con slate oscuro para mantener la lectura incluso con colores claros. Estas variables se limitan al panel de esa empresa:

- [components/EncabezadoPanel.tsx](../components/EncabezadoPanel.tsx) las aplica a la bienvenida y a los encabezados de contenido solo en contexto empresa; la administración global conserva su aspecto.
- `KpiCard`, en [components/EmpresaPage.tsx](../components/EmpresaPage.tsx), usa el primario o el secundario en los indicadores de Inicio y Finanzas.
- [components/empresa/InicioView.tsx](../components/empresa/InicioView.tsx) las utiliza en iconos, bordes, estados vacíos y precios de servicios, sin alterar los colores de las reservas pagadas, las advertencias o los errores.
- La cabecera institucional y el logo de vuki no heredan el color seleccionado por el negocio.

### Colores semánticos (estado)

| Color                                | Uso                                                                           |
| ------------------------------------ | ----------------------------------------------------------------------------- |
| `emerald-500`                        | Éxito (`CheckCircle2` en confirmaciones de pago/reserva, toast de éxito)      |
| `red` / `rose`                       | Error (toast de error, validaciones de formulario)                            |
| `black/85 → transparent` (gradiente) | Degradado oscuro sobre imágenes de servicio para legibilidad del texto blanco |

## 2. ✍️ Tipografía y espaciado

### Fuente

- **Inter** para UI, checkout y cuerpo de texto; fuente sans definida vía variable de tema: `--font-sans: var(--font-inter)` (cargada como fuente de Next.js en [app/layout.tsx](../app/layout.tsx)).
- **Plus Jakarta Sans** para titulares de marketing, cargada con `next/font` y expuesta mediante `font-display`; **Inter** actúa como alternativa. El wordmark está trazado desde Plus Jakarta Sans ExtraBold para preservar su forma sin depender de la fuente del dispositivo. Ambas fuentes se configuran en [app/layout.tsx](../app/layout.tsx).

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
- **Toasts de notificación** ([components/Toast.tsx](../components/Toast.tsx)): entrada/salida animada con `AnimatePresence` para confirmar acciones (crear/editar/eliminar) en el panel de empresa.

**Principio de diseño**: usar resortes (`spring`) para interacciones táctiles y curvas suaves para las entradas narrativas. El movimiento acompaña al contenido; nunca debe impedir leer, desplazar la página o utilizar un formulario.

### Landing y acceso: una narrativa propia de vuki

- **Scroll nativo, sin secuestrar la navegación.** La landing conserva su contenido de servidor y sus anclas. El fondo incorpora luz, curvas y órbitas originales con profundidad; una línea discreta muestra el avance de lectura.
- **Contraste entre secciones.** Desde características, alternar «Menos fricción, más vuki» sobre claro → «Diseñado para tu día a día» sobre slate oscuro → suscripción sobre claro → preguntas frecuentes sobre oscuro → llamada final sobre claro. Ajustar títulos, párrafos, iconos, bordes y botones al tono de cada sección; no basta con una tarjeta oscura dentro de un bloque blanco.
- **Fondos en movimiento también sobre claro.** Todas las secciones de la landing reutilizan `FondoMarca`, con luz y curvas ligadas al scroll. La variante clara conserva superficies blancas/soft-slate y acentos azul/esmeralda muy suaves; la oscura mantiene texto claro legible. Las entradas de contenido y las preguntas frecuentes aparecen de forma escalonada; la decoración no desplaza enlaces ni controles.
- **Tres escenas conectadas.** En escritorio de al menos 1024 × 760 px, el recorrido «De tu bio a tu agenda» permanece visible mientras el scroll transforma perfil/enlace → selección de horario → agenda. Los fondos evolucionan de slate a océano y esmeralda oscuros; los controles numerados permiten ir directamente a cada escena con teclado o puntero.
- **Móvil, ventanas bajas, zoom y movimiento reducido.** El mismo relato se convierte en tres bloques de lectura normales, sin mantener una escena fija ni reservar una pantalla vacía. No hay desplazamiento horizontal forzado. El HTML sin JavaScript también muestra todas las escenas y los accesos principales.
- **Sin controles de pausa.** Las animaciones se activan automáticamente, sin botones para pausarlas o reanudarlas ni preferencias de pausa guardadas en la sesión. Se respeta `prefers-reduced-motion` del dispositivo y se conserva la alternativa de lectura sin movimiento.
- **Acceso sin distracciones.** Las tarjetas flotantes, el trazo y la profundidad pertenecen únicamente a la zona de marca. Los campos no cambian de posición. Los bucles se detienen cuando el formulario tiene foco —incluido el `autoFocus` inicial— o la ilustración deja de ser visible. La versión móvil usa una cabecera compacta, no una escena pesada.
- **Mejora progresiva e hidratación.** El estado inicial de servidor y cliente es estático; la preferencia de movimiento del dispositivo se aplica después del montaje. No esconder el contenido de servidor a la espera de una animación.
- **Datos ilustrativos, no promesas.** Las escenas y la vista interactiva están rotuladas como ejemplos. No consultan disponibilidad, crean reservas, procesan cobros ni representan operaciones bancarias. Las webs de referencia inspiran el lenguaje de movimiento, no se reutilizan sus imágenes ni su código.
- **Coste acotado.** Se reutiliza Framer Motion existente, con `MotionValue` para propiedades ligadas al scroll y transformación/opacidad para profundidad y entradas. No se añade WebGL, vídeo de fondo, un motor de smooth-scroll ni dependencias nuevas.

## 4. 🧱 Componentes clave (UI reutilizable)

| Componente                | Archivo                                                                                   | Variantes / notas                                                                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **ServicioCard**          | [components/ServicioCard.tsx](../components/ServicioCard.tsx)                             | Tarjeta de servicio con imagen a sangre, degradado y precio con color de marca dinámico.                                                       |
| **AnimatedCheckoutSheet** | [components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx)           | Bottom sheet multi-paso (horario/datos/pago/cargando/éxito), con trampa de foco y soporte de teclado (Escape).                                 |
| **MarcaReserva**          | [components/MarcaReserva.tsx](../components/MarcaReserva.tsx)                             | Sello visible «Reservado con vuki» / «Booked with vuki», independiente del contexto de idioma.                                                 |
| **Drawer**                | [components/Drawer.tsx](../components/Drawer.tsx)                                         | Slide-over lateral derecho reutilizable para formularios de crear/editar en el panel de empresa.                                               |
| **ConfirmDialog**         | [components/ConfirmDialog.tsx](../components/ConfirmDialog.tsx)                           | Modal de confirmación (ej. antes de eliminar un servicio u horario).                                                                           |
| **AnimatedIconButton**    | [components/AnimatedIconButton.tsx](../components/AnimatedIconButton.tsx)                 | Botón de ícono con variantes `"abrir"` / `"cerrar"` y animación de giro consistente.                                                           |
| **Toast / ToastViewport** | [components/Toast.tsx](../components/Toast.tsx)                                           | Sistema de notificaciones globales (`toast.success()`, `toast.error()`) vía store externo (`useSyncExternalStore`), sin dependencias externas. |
| **Footer**                | [components/Footer.tsx](../components/Footer.tsx)                                         | Pie de página institucional (legal, marca).                                                                                                    |
| **VLogo**                 | [components/VLogo.tsx](../components/VLogo.tsx)                                           | Identidad de vuki: monograma VK y wordmark en minúsculas con puntos esmeralda; se conserva el nombre técnico del componente.                   |
| **EncabezadoPanel**       | [components/EncabezadoPanel.tsx](../components/EncabezadoPanel.tsx)                       | Cabecera de empresa y superadmin: título, descripción y acciones existentes, con acentos de marca sin añadir estados ficticios.                |
| **LegalPage**             | [components/LegalPage.tsx](../components/LegalPage.tsx)                                   | Marco servidor de términos/privacidad, navegación entre documentos y contenido legal intacto.                                                  |
| **PaginaPublica**         | [components/PaginaPublica.tsx](../components/PaginaPublica.tsx)                           | Marco de trámites, reportes, gestión de reservas, estados de cuenta y pantallas de pago simulado.                                              |
| **MovimientoMarca**       | [components/marketing/MovimientoMarca.tsx](../components/marketing/MovimientoMarca.tsx)   | Preferencia del dispositivo, entradas, fondo animado claro/oscuro y progreso de lectura; sin controles de pausa ni ocultar el HTML inicial.    |
| **HistoriaProducto**      | [components/marketing/HistoriaProducto.tsx](../components/marketing/HistoriaProducto.tsx) | Tres escenas de producto ligadas al scroll, con alternativa estática de lectura y ejemplos claramente identificados.                           |
| **EscenaAcceso**          | [components/marketing/EscenaAcceso.tsx](../components/marketing/EscenaAcceso.tsx)         | Ilustración de marca del login/recuperación; pausa al escribir, fuera de pantalla o según preferencia de movimiento.                           |
| **Watermark**             | [components/Watermark.tsx](../components/Watermark.tsx)                                   | Atribución técnica en la consola del navegador; no es el sello visual de reservas.                                                             |

Todos los componentes interactivos comparten la utilidad [lib/cn.ts](../lib/cn.ts) (`clsx` + `tailwind-merge`) para componer clases condicionales sin conflictos de especificidad de Tailwind.

## 5. 🥇 Regla de oro UX

> **Cero fricción para el turista, no-code/intuitivo para la pyme.**

- **Turista (perfil público / checkout)**: el flujo de reserva y pago debe completarse en el menor número de pasos posible, sin necesidad de crear cuenta, con feedback visual inmediato (animaciones de carga, confirmación clara) y funcionando perfectamente en móvil (mobile-first), ya que la mayoría de las reservas llegan desde un enlace compartido en redes sociales.
- **Empresa (panel del negocio)**: la dueña o el dueño del negocio —típicamente sin conocimientos técnicos— debe poder gestionar servicios, horarios y ver sus reservas/finanzas usando formularios simples (Drawers), confirmaciones claras (`ConfirmDialog`) y notificaciones inmediatas (`Toast`), **sin tocar código ni configuración técnica**. Toda la personalización de marca (color, textos) se resuelve desde la UI, nunca editando archivos.

Esta regla debe primar sobre cualquier decisión de diseño futura: ante la duda entre una solución "más completa" pero más compleja, y una más simple pero inmediata de usar, **se prioriza la simplicidad**.
