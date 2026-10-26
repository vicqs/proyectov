## NE Changelog

Upgraders: for a fresh start, consider running these commands

- `git clean -xdf`
- `npm install`

## 2026-10-26 — Rebranding a vuki

- Sustitución exclusivamente del logo por el monograma VK de [logo nuevo.jfif](docs/branding/logo%20nuevo.jfif): diagonales slate/blanco y azul, arco esmeralda, puntos verdes en la «i» y al final del wordmark. Original vectorial compartido, favicon, icono Apple y Open Graph coherentes; paleta, interfaz, marcas de cada negocio y funcionamiento conservados. Este diseño reemplaza el check de las referencias anteriores.
- Ritmo de contraste en la landing: características claras, «Diseñado para tu día a día» en oscuro, suscripción clara, FAQ oscura y cierre claro. Fondos de marca con variantes claras/oscuras y movimiento ligado al scroll en todas las secciones; preguntas frecuentes con entrada escalonada. Textos, iconos y botones adaptados a cada fondo, sin recuperar controles de pausa ni alterar contenido, precios o rutas.
- Verificación de este ajuste: 8 vistas responsive (360/390/768/1440 px, movimiento normal/reducido), 18 auditorías automáticas WCAG A/AA y 16 comprobaciones funcionales sin incidencias. Verificados los siete fondos en movimiento, contenido sin JavaScript, FAQ por teclado y vista previa interactiva; compilación, TypeScript y diagnósticos correctos, sin errores JavaScript/hidratación.
- Retirados los botones de pausa/reanudación de la landing y del acceso por solicitud de diseño, junto con su estado y persistencia en sesión. Las preferencias antiguas de pausa ya no bloquean las animaciones; se conservan `prefers-reduced-motion`, la alternativa móvil y los campos de acceso estables.
- Landing con narrativa original ligada al scroll: perfil/enlace, horario y agenda; escenas fijas solo en escritorio amplio, transiciones de color slate/océano/esmeralda, curvas en profundidad, progreso de lectura y entradas escalonadas. Scroll nativo y contenido visible sin JavaScript.
- Acceso con ilustración de marca animada y profundidad sutil, sin mover los campos ni alterar autenticación. La decoración se detiene al escribir; se respeta `prefers-reduced-motion` y se mantiene una versión ligera en móvil/ventanas bajas. Sin nuevas dependencias ni recursos copiados de las referencias.
- Ajustes de QA de paneles: tablas contenidas en tarjetas estrechas, contraste de slugs, nombre accesible del filtro de soporte y botones nativos independientes para editar/quitar servicios. Controles primarios de servicios/suscripción coherentes y con foco visible; acciones y datos preservados.
- Validación inicial de movimiento y extensión de marca (antes de retirar los controles de pausa): 76 vistas responsive, 22 auditorías automáticas WCAG A/AA y 104 comprobaciones funcionales sin incidencias; sin errores de JavaScript o hidratación. Comprobados scroll/colores/escenas, pausa persistente, almacenamiento bloqueado, movimiento reducido, HTML sin JavaScript, error de acceso, teclado y menús móviles. Producción y TypeScript correctos; QA aislado con datos simulados, sin operar sobre datos reales.
- Extensión de la identidad a términos/privacidad con un marco legal compartido, sin modificar los textos ni la fecha de los documentos. Refuerzo de ambos paneles a través de cabeceras, navegación, KPIs, tarjetas, tablas y controles reutilizables; colores propios de cada negocio y permisos preservados.
- Acabado de marca coherente en reportes públicos, gestión privada de reservas, pagos/suscripciones simulados, avisos de cuenta y estado de carga del superadmin. Sin cambios en acciones, precios, importes, tokens, integraciones ni reglas de suscripción.
- Ajuste del logo/isotipo conforme a [LogoDetallado.jfif](docs/branding/LogoDetallado.jfif): check recto redondeado, punto flotante separado, squircle con radio del 20 % y punto final esmeralda. Wordmark vectorial compartido entre la aplicación y Open Graph, sin sustituir la fuente por la del sistema; favicon, icono Apple, sellos y correos coherentes.
- Verificación del ajuste: 16 comprobaciones responsive de marca, cuatro auditorías AA sin incidencias, sello ES/EN, favicon/Apple/Open Graph y render HTML de ambos correos. Compilación de producción y TypeScript correctos; sin nuevas dependencias en la aplicación.
- Cambio de denominación del producto de **Proyecto V / Turismo Link** a **vuki** en la documentación vigente, preservando el historial y la autoría.
- Nueva landing responsive con vista previa ilustrativa del producto, características, funcionamiento, suscripción y preguntas frecuentes; todos los accesos apuntan a rutas existentes.
- Logo vectorial check/punto esmeralda, icono de navegador, icono Apple y vista previa social. Inter y Plus Jakarta Sans cargadas con `next/font`.
- Identidad aplicada al login, recuperación/restablecimiento, paneles de empresa y administración, perfil público, reservas, checkout, errores y correos transaccionales.
- Sello bilingüe «Reservado con vuki» / «Booked with vuki», conservando logos y colores propios de cada negocio, accesibilidad y atribución original.
- Nombre del paquete privado y nombres raíz equivalentes del lockfile: `vuki`, sin cambios de versiones, dependencias ni resoluciones.
- Referencia a la identidad aprobada en [docs/branding/Branding.md](docs/branding/Branding.md): minúsculas, símbolo check/punto esmeralda, paleta slate/sky/emerald y tipografía Inter/Plus Jakarta Sans.
- Sin cambios en precios, planes, reglas económicas ni integración actual con Stripe. Los planes de $25/$40 y TiloPay/OnvoPay se distinguen como propuestas, no como capacidades implementadas.
- Se documenta la revisión manual del nombre visible de `EMAIL_FROM` y de textos/plantillas administrados en BD, sin cambiar dominios reales, claves de entorno ni sustituir contenido en runtime.
- La integración de pagos reales y el despliegue no forman parte de este cambio de identidad.
- Verificación: compilación de producción y TypeScript correctos; navegación y diseño comprobados a 360, 390, 768 y 1440 px, incluidos menús, idioma, errores y checkout simulado aislado. Sin incidencias automáticas WCAG AA en las siete superficies examinadas; ambos correos renderizados sin enviarse.
- `npm run lint` sigue bloqueado por la ausencia previa de configuración de ESLint; no se modificó el tooling ni se añadieron dependencias de pruebas al proyecto.

<a name="0.0.1"></a>

# 0.1.1 (2017-02-07)

- updates modules
  - NE beta 1
  - add module patients
  - add module food

## Admin global

- Nuevo rol Administrador en /admin (negocios, suscripciones, finanzas, reservas, usuarios, soporte, moderación, configuración, sistema, comunicación, auditoría, equipo).
- Conectado con Empresa y público: suspensión, mantenimiento, flags, anuncios, textos legales.
