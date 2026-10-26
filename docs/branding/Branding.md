Tomando todo el ADN técnico, comercial y visual que ya construimos para **Vuki**, primero dejo autocompletada tu ficha estratégica de marca y enseguida entramos de lleno en las **3 fases de entregables** paso a paso.

---

### 📋 Ficha Fundacional de Marca (ADN de Vuki)

- **Nombre:** **Vuki** _(guiño fonético a "Booking", corto, memorable y bilingüe)_.
- **Sector / Rubro:** SaaS TravelTech — Plataforma de reservas en tiempo real y cobros directos sin comisiones para micro y pequeñas empresas turísticas en Costa Rica (escuelas de surf, operadores de tours, hospedajes boutique y actividades de aventura).

- **Colores Principales:**
- **Deep Slate (`#0f172a` / `slate-900`):** Texto principal, botones primarios y autoridad financiera.

- **Pure White (`#ffffff`) & Soft Slate (`#f8fafc` / `slate-50`):** Fondos limpios y aireados.

- **Ocean Sky (`#0284c7` / `sky-600`):** Color de acento principal inspirado en la costa y el mar.

- **Tropical Emerald (`#10b981` / `emerald-500`):** Confirmación, éxito transaccional (`200 OK`) y naturaleza tica.

- **Público Objetivo:**
- **B2B (Nuestro cliente directo):** Dueños de pymes turísticas en Costa Rica (25 a 50 años), operativos, prácticos, con poco tiempo y sin conocimientos técnicos, que venden por Instagram/WhatsApp y quieren automatizar su agenda sin regalar comisiones.

- **B2C (Usuario final de la interfaz):** Turistas nacionales e internacionales que buscan reservar y pagar desde su celular en segundos y con total confianza.

- **Tono de Voz:** Cercano pero ultra confiable, minimalista (estilo Apple/Airbnb), enérgico, transparente (_"sin letras pequeñas"_) y **"cero fricción"**.

---

## 🎨 FASE 1: IDENTIDAD VISUAL

### 1.1. Concepto y Variantes del Logotipo

La referencia vigente del logo es [logo nuevo.jfif](logo%20nuevo.jfif). El nuevo **monograma VK** sustituye el check de las láminas anteriores; este cambio se limita al logo y no modifica la paleta, la interfaz ni el funcionamiento del producto.

1. **Imagotipo Principal (Símbolo + Tipografía):**

- **El Símbolo (Isotipo):** Monograma **VK** con dos diagonales de corte recto y un arco esmeralda inferior. La diagonal izquierda es slate sobre claro y blanca sobre oscuro; el brazo derecho conserva el azul océano y queda separado del arco verde por un espacio visible.
- **El Logotipo (Wordmark):** Escrito en minúsculas (**`vuki.`**) con contornos de Plus Jakarta Sans ExtraBold, espaciado óptico y ambos puntos —el de la «i» y el final— en esmeralda. Las letras son slate en fondos claros y blancas en fondos oscuros.

2. **Isotipo (App Icon / Favicon / `components/VLogo.tsx`):**

- El monograma **VK** blanco/azul/esmeralda va dentro de un _squircle_ slate oscuro de 512 × 512, con radio del 20 % del lado. Se reutiliza en favicon, icono Apple y cualquier tamaño de aplicación, manteniendo las proporciones del nuevo manual.

3. **Variante de Marca de Agua (`components/Watermark.tsx`):**

- Un sello horizontal minimalista en pie de página: **`⚡ Reservado con vuki`** en tono neutro `slate-400`, diseñado para aparecer discretamente en el perfil público de cada pyme (`/[slug]`) impulsando el crecimiento viral boca a boca.

#### 💻 Originales vectoriales compartidos

La geometría vigente vive en [lib/marca.ts](../../lib/marca.ts) y se renderiza con `IsotipoVuki`, `LogotipoVuki` y `VLogo` en [components/VLogo.tsx](../../components/VLogo.tsx). No duplicar SVG antiguos: las variantes claras/oscuras, el favicon y la vista previa social deben usar las mismas tres piezas del monograma. El archivo JFIF original se conserva intacto como referencia visual.

---

### 1.2. Sistema Tipográfico

Alineado con tu configuración en `app/layout.tsx` y `globals.css`:

- **Tipografía Principal (UI, Checkout y Cuerpo de texto): `Inter**`.

- _Justificación:_ Es el estándar de oro para interfaces digitales; ofrece máxima legibilidad en pantallas móviles pequeñas bajo la luz del sol (fundamental para un turista en la playa o un guía de tour revisando su agenda).

- **Tipografía para Títulos de Marketing y Ads (Display): `Plus Jakarta Sans` o `Inter` en `font-bold` con `tracking-tight**`.

- _Jerarquía:_
- **H1 / Precios destacados:** `text-3xl` a `text-5xl`, `font-bold`, `tracking-tight`.

- **Subtítulos / Cards:** `text-lg` a `text-xl`, `font-semibold`.

- **Cuerpo / Inputs:** `text-sm` a `text-base`, `font-normal` / `font-medium`.

- **Badges / Metadatos (Duración, Cupos):** `text-xs`, `font-medium`, mayúsculas con `tracking-wider`.

---

### 1.3. Patrón Gráfico e Iconografía de Soporte

- **Iconografía:** Familia **Lucide Icons (`lucide-react`)** con grosor de línea constante (`strokeWidth={2}`) y bordes redondeados.

- **Lenguaje de Contenedores ("Soft Bento UI"):**
- Bordes generosos estilo iOS/Airbnb: `rounded-3xl` para tarjetas de experiencia, `rounded-2xl` para el modal de pago y `rounded-full` para píldoras de precio y disponibilidad.

- Efecto _Glassmorphism_: Fondos translúcidos (`bg-white/80 backdrop-blur-md`) en cabeceras flotantes y overlays (`bg-slate-900/40 backdrop-blur-sm`).

- **Elemento Gráfico de Marca ("Las Píldoras de Estado en Vivo"):**
- En piezas gráficas y en la web, Vuki utiliza pequeñas etiquetas flotantes que simulan notificaciones en tiempo real:
- 🟢 `3 cupos disponibles · Hoy 2:00 PM`

- 💳 `Pago aprobado · +$65.00 directo a tu banco`

---

## 📱 FASE 2: LANDING PAGE DE ALTA CONVERSIÓN (UX/UI)

Esta landing page (`vuki.app`) está diseñada bajo enfoque **Mobile-First** para convertir a dueños de negocios turísticos que llegan desde anuncios de Instagram, WhatsApp o recomendaciones.

### 2.1. Wireframe Visual (Estructura Mobile-First)

```text
+-------------------------------------------------------------------+
| [vuki.]                                   [Ver Demo] [Empezar ->] | <- Navbar Sticky (Glass)
+-------------------------------------------------------------------+
| 🇨🇷 CREADO PARA EL TURISMO DE COSTA RICA                          |
|                                                                   |
| Tu agenda y tu datáfono virtual en un solo link.                  | <- H1 (Impacto directo)
| Cero comisiones por venta.                                        |
|                                                                   |
| Tus turistas reservan y pagan en 3 toques desde Instagram o       | <- Subcopy claro
| WhatsApp. El cupo se bloquea solito y el dinero cae directo a     |
| tu cuenta bancaria tica.                                          |
|                                                                   |
| [ 🚀 Probar Demo Interactiva ]   [ 🎛️ Ver Panel de Dueño ]        | <- Doble CTA interactivo
|                                                                   |
|      +-----------------------------------------------------+      |
|      |  📱 MOCKUP INTERACTIVO (Vista: /demo/surf-tamarindo)|      |
|      |  [Foto Surf] Clase Grupal de Surf          [$45 USD]|      |
|      |  ---------------------------------------------------|      |
|      |  🟢 Pago Aprobado (TL-984210)                       |      |
|      |  "1 cupo bloqueado · Fondos enviados a tu cuenta"   |      |
|      +-----------------------------------------------------+      |
+-------------------------------------------------------------------+
| EL PROBLEMA ACTUAL VS. EL ESTÁNDAR VUKI                           |
|                                                                   |
| ❌ Lo que te frena hoy          | ✅ Cómo lo resuelve Vuki         |
| • Links del banco que cobran    | • Cobro y bloqueo de cupo       |
|   pero NO bloquean la hora.     |   automático al instante.       |
| • Agencias y OTAs que te quitan | • 0% de comisión. Lo que vendes |
|   entre 20% y 30% por reserva.  |   es 100% tuyo.                 |
| • Plata atrapada en PayPal.     | • Directo a tu cuenta local.    |
+-------------------------------------------------------------------+
| CÓMO FUNCIONA (3 PASOS SIN ENREDOS)                               |
|                                                                   |
| [1. Pega tu link] -> [2. El turista paga] -> [3. Plata en banco]  |
| Pon vuki.app/tu-tour  Se abre un modal seguro  Recibes el 100% vía|
| en tu Instagram/WA.   sin salir de tu página.  TiloPay / OnvoPay. |
+-------------------------------------------------------------------+
| 🔒 SEGURIDAD BANCARIA Y CERO ENREDOS LEGALES                      |
|                                                                   |
| [ Turista ] ===(Pago Encriptado HTTPS)===> [ Tu Banco en CR ]     |
|                       ^                                           |
|        (Vuki solo bloquea el cupo y avisa)                        |
|                                                                   |
| "Nunca tocamos ni retenemos tu dinero. Funcionamos como tu        |
|  puente tecnológico directo con TiloPay y OnvoPay."               |
+-------------------------------------------------------------------+
| PLANES SIMPLES, SIN LETRAS PEQUEÑAS                               |
|                                                                   |
| +-------------------------------+ +-----------------------------+ |
| | 🌱 PLAN ESENCIAL              | | 🔥 PLAN PRO (Más elegido)   | |
| | $25 USD / mes                 | | $40 USD / mes               | |
| | Ideal para micro-pymes y      | | Para operadores de alto     | |
| | operadores en zonas rurales.  | | volumen y zonas densas.     | |
| | • 0% comisión por venta       | | • 0% comisión por venta     | |
| | • Link público personalizable | | • Servicios y cupos ilimit. | |
| | [ Empezar con Esencial ]      | | [ Empezar con Pro ]         | |
| +-------------------------------+ +-----------------------------+ |
+-------------------------------------------------------------------+
| ¿LISTO PARA DEJAR DE PERDER RESERVAS EN WHATSAPP?                 |
| [ Crear mi cuenta en Vuki ]  [ Hablar por WhatsApp con un asesor ]|
+-------------------------------------------------------------------+

```

### 2.2. Distribución de Secciones, Copywriting y CTAs

1. **Sección 1 — Hero (Primera impresión en 3 segundos):**

- **Objetivo:** Dejar claro que no somos una agencia que cobra comisión, sino su propio sistema de reservas y cobro directo.

- **Copy Principal (H1):** _"Tu agenda y tu datáfono virtual en un solo link. 0% de comisión por venta."_
- **Subtítulo:** _"Convierte tus seguidores de Instagram y chats de WhatsApp en reservas pagadas. El turista paga sin salir de tu página, tu cupo se bloquea automáticamente y el dinero viaja directo a tu banco en Costa Rica."_

- **CTAs:**
- Botón Primario (`bg-slate-900 text-white rounded-xl`): **`Probar Demo de Cliente →`** (redirige en vivo a `/demo/surf-tamarindo`).

- Botón Secundario (`bg-slate-100 text-slate-900 rounded-xl`): **`Explorar Panel Admin`** (redirige a `/demo/admin`).

2. **Sección 2 — Comparativa de Dolor ("Por qué creamos Vuki"):**

- **Copy de Encabezado:** _"Cobrar por link de pago suelto es un peligro. Vender por plataformas internacionales sale carísimo."_
- **Estructura:** Tres tarjetas comparativas que atacan las tres objeciones reales del mercado costarricense: (1) sobreventa por links bancarios manuales, (2) comisiones abusivas del 20%-30%, y (3) fricción de retirar fondos de pasarelas extranjeras.

3. **Sección 3 — Demostración del Flujo ("Cero Fricción para el Turista"):**

- **Copy de Encabezado:** _"De 'Info porfa' a 'Reserva Pagada' en menos de 45 segundos."_
- **Contenido Visual:** Muestra los pasos reales de `AnimatedCheckoutSheet.tsx`: **1. Elige el tour → 2. Selecciona hora con cupo real → 3. Paga en el modal seguro → 4. Recibo instantáneo**.

4. **Sección 4 — Bloque de Confianza Financiera ("Tu dinero nunca pasa por Vuki"):**

- **Copy de Encabezado:** _"100% transparente con tu banco y con Hacienda."_

- **Texto de Soporte:** _"En Vuki nunca retenemos ni custodiamos tus ventas. Conectamos tu catálogo directamente con tu propia cuenta de TiloPay u OnvoPay para que cada dólar caiga directo en tu cuenta bancaria."_

5. **Sección 5 — Precios Claros (Tiers):**

- Tarjetas limpias mostrando el **Plan Esencial ($25 USD/mes)** y el **Plan Pro ($40 USD/mes)**, destacando en grande una insignia verde (`emerald-500`): **"Con una sola reserva que no pierdas al mes, Vuki se paga solo"**.

---

## 📣 FASE 3: PIEZAS DE MARKETING DIGITAL Y ANUNCIO

### 3.1. Tres Plantillas para Redes Sociales (Instagram / LinkedIn)

#### 📸 Plantilla 1: Post Educativo / Problema Oculto (Formato 4:5 - 1080x1350px)

- **Objetivo:** Hacer consciente al dueño del tour o escuela de surf de que el link de pago suelto del banco no controla su agenda.
- **Diseño Visual:**
- Fondo oscuro `slate-900` (`#0f172a`) con tipografía blanca en `Inter Bold`.

- Dividido en dos tarjetas flotantes (`rounded-3xl`):

- _Arriba (Rojo suave / Alerta):_ Ícono de WhatsApp + Link bancario suelto → _"Cobró $60... pero ya no tenías espacio a las 9:00 AM. Toca devolver la plata y quedar mal."_
- _Abajo (Esmeralda `#10b981` / Solución Vuki):_ Ícono de Vuki → _"Muestra solo horas disponibles, cobra en la misma pantalla y bloquea el cupo al instante."_

- **Texto en imagen (Titular):** _"El link del banco sabe cobrar, pero NO sabe llevar tu agenda."_

#### 📊 Plantilla 2: Post de Impacto Financiero / "Calculadora de Comisiones" (Formato 4:5 - 1080x1350px)

- **Objetivo:** Atacar el dolor del 20%-25% de comisión de las plataformas internacionales frente a la tarifa plana de Vuki.

- **Diseño Visual:**
- Fondo claro `slate-50` (`#f8fafc`) estilo minimalista.

- Gráfico de barras comparativo basado en **$3,000 USD en ventas mensuales de tours**:
- Barra Gris/Roja (_Plataformas tradicionales al 20%_): **Pierdes $600 USD cada mes** ($7,200 al año).
- Barra Azul Océano (`#0284c7`, _Vuki Plan Esencial_): **Pagas $25 USD fijos.** Te quedas con el 100% de tus ventas.

- **Texto en imagen (Titular):** _"¿Por qué pagar un 'impuesto' del 20% por tus propios clientes de Instagram?"_
- **Footer de la plantilla:** Logo `vuki.` + píldora `"0% comisión por reserva"`.

#### 📱 Plantilla 3: Demostración de Producto / Estilo Mockup (Formato 1:1 o Portada de Reel 9:16)

- **Objetivo:** Mostrar la estética premium del perfil público (`/demo/surf-tamarindo`) y la personalización de color (`colorTema`).

- **Diseño Visual:**
- Fotografía de fondo real de Costa Rica (una clase de surf en Tamarindo o un puente colgante en Monteverde) con un degradado oscuro inferior (`black/85 → transparent`).

- En el centro, la tarjeta `ServicioCard` flotando con su sombra `shadow-2xl`, el precio en azul `#0284c7` y la notificación flotante en verde `#10b981`: **`✓ Reserva confirmada · Laura M. (2 cupos)`**.

- **Texto en imagen (Titular):** _"Convierte tu 'Link en Bio' en una máquina de reservas 24/7."_

---

### 3.2. Concepto Visual para Anuncio Publicitario Digital (Meta Ads: Instagram & Facebook)

- **Público en Meta Ads:** Administradores de páginas de Facebook/Instagram en Costa Rica (Guanacaste, Puntarenas, Limón, La Fortuna, Monteverde) con intereses en _Turismo, Escuela de Surf, Operador Turístico, Airbnb Host, Pequeñas Empresas_.
- **Formato recomendado:** Video corto vertical (Reel/Story 9:16 de 20 segundos) o Imagen estática de alto contraste (4:5).
- **Concepto Visual del Anuncio ("Mientras estás en el agua, Vuki vende por vos"):**
- **Escena / Imagen Principal:** Un instructor de surf o guía turístico en una playa de Costa Rica dejando su teléfono sobre una mesa rústica. En primer plano se ve la pantalla del celular encendiéndose con dos notificaciones seguidas:

1. **Vuki:** _"🏄‍♂️ Nueva reserva pagada: Clase de Surf 10:00 AM (2 cupos bloqueados)."_
2. **TiloPay / Banco:** _"💵 Depósito confirmado: +$90.00 USD."_

- **Superposición gráfica (UI Overlay):** El sello de Vuki en la esquina superior y una etiqueta en verde esmeralda: **`0% Comisión · Plata directo a tu banco tico`**.

- **Copy del Anuncio (Texto Principal):**

  > ¿Cuántos turistas se enfriaron hoy porque estabas dando un tour y no pudiste responder el WhatsApp a tiempo? 🌊📱
  > Con **Vuki**, tu link de Instagram trabaja 24/7 por vos:
  > ✅ El turista ve tus horarios con cupos reales.
  > ✅ Paga con tarjeta dentro de tu misma página (conectado con TiloPay / OnvoPay).
  > ✅ El cupo se bloquea solito para evitar sobreventas.
  > ✅ **0% de comisión por venta** (solo una mensualidad fija desde $25).
  > Tocá el botón de abajo y probá nuestra Demo Interactiva en vivo sin registrarte. 👇

- **Título del Anuncio (Headline):** `Tu Agenda + Datáfono Virtual en un solo Link 🇨🇷`
- **Descripción:** `0% comisiones. Pagos directos a tu banco.`

- **Botón de Llamada a la Acción (CTA de Meta):** **`Probar ahora`** o **`Más información`** (apuntando directo a una landing con acceso inmediato a `/demo/surf-tamarindo`).

---

### 🖼️ Prompts listos para generar las fotografías publicitarias (Midjourney / Canva / ImageFX)

_(Nota: En este entorno tengo habilitadas las herramientas de código y generación de documentos PDF/Markdown, por lo que te dejo los prompts fotográficos exactos por si quieres generar las fotos de fondo para tus plantillas en un generador de imágenes o en Canva)_:

1. **Prompt para la Foto del Anuncio (Surf / Costa Rica):**

   > _"Commercial lifestyle photography in Tamarindo beach Costa Rica, a smiling local surf instructor holding a surfboard in the background out of focus, while in the sharp foreground a smartphone rests on a wooden table showing a clean modern white and ocean-blue booking confirmation screen with a green checkmark, warm golden hour tropical lighting, shot on Sony A7R IV, 35mm lens, photorealistic, high contrast."_

2. **Prompt para el Hero / Mockup de Aventura (Canopy / La Fortuna):**
   > _"Clean UI product photography, hand holding a modern frameless smartphone in a lush Costa Rican rainforest setting with Arenal volcano softly blurred in the background, screen displaying a minimalist SaaS booking app interface in slate dark blue and emerald green accents, natural daylight, Apple-style product photography."_
