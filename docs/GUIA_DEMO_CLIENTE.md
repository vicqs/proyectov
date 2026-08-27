# Guía de la Demo — Cómo probar la plataforma

Esta guía explica, paso a paso, cómo explorar la **demo interactiva** de la plataforma. La demo simula un negocio real (una escuela de surf llamada **"Tamarindo Surf School"**) para que puedas ver exactamente cómo se vería tu propio negocio usando el sistema: tanto la página pública que verían tus clientes, como el panel de administración que usarías tú.

> ⚠️ **Importante:** Esta demo funciona 100% en el navegador (no usa base de datos ni pagos reales). Todo lo que crees, edites o reserves se guarda solo en memoria, así que **al recargar la página (F5) los datos vuelven a su estado inicial**. Esto es intencional: te permite probar libremente sin miedo a "romper" nada.

---

## 1. Enlaces de la demo

| Sección                                                       | Enlace                 |
| ------------------------------------------------------------- | ---------------------- |
| **Página pública del negocio** (lo que ve un cliente)         | `/demo/surf-tamarindo` |
| **Panel de administración** (lo que usa el dueño del negocio) | `/demo/admin`          |

No necesitas crear una cuenta ni iniciar sesión para acceder a la demo: es de acceso libre para que puedas explorarla sin fricción.

---

## 2. Página pública: `/demo/surf-tamarindo`

Esta es la página que verían tus clientes si quisieran reservar un servicio contigo. Incluye:

- **Portada visual** con foto de fondo y logo del negocio, con animaciones suaves.
- **Nombre y descripción** del negocio.
- **Selector de idioma** (Español / Inglés) en la esquina superior.
- **Catálogo de servicios**, mostrando nombre, descripción, precio y duración de cada uno.
- **Flujo de reserva completo**:
  1. El cliente elige un servicio.
  2. Selecciona un horario disponible.
  3. Ingresa su nombre y correo.
  4. Completa un formulario de pago simulado.
  5. Recibe un recibo digital animado como confirmación.

📌 **Dato clave:** si en el panel de administración cancelas la suscripción, esta página dejará de mostrar los servicios y en su lugar aparecerá el mensaje "Enlace no disponible". Esto simula cómo el sistema protege el acceso público según el estado de la suscripción del negocio.

---

## 3. Panel de administración: `/demo/admin`

Es el panel privado donde el dueño del negocio gestiona todo. Tiene un menú lateral (o menú hamburguesa en móvil) con las siguientes secciones:

### 3.1 Inicio (`/demo/admin`)

Resumen general del negocio:

- Total de reservas recibidas.
- Total de ingresos acumulados (en USD).
- Lista de servicios activos.

### 3.2 Horarios (`/demo/admin/horarios`)

Gestión de los horarios/cupos disponibles para cada servicio:

- Ver todos los horarios creados, con cupos totales y disponibles (barra de ocupación visual).
- **Crear nuevo horario**: eliges el servicio, la fecha/hora y la cantidad de cupos.
- **Eliminar horario** (con confirmación).
- Nota: los horarios no se pueden editar una vez creados, para evitar conflictos con reservas ya confirmadas.

### 3.3 Reservas (`/demo/admin/reservas`)

Listado de todas las reservas hechas por clientes:

- Fecha y hora de la reserva, nombre y correo del cliente, servicio, horario elegido, cantidad de cupos, estado ("pagado") y monto pagado.
- En móvil se muestra como tarjetas; en escritorio, como tabla.
- Si no hay reservas, te invita a probar el flujo de reserva desde `/demo/surf-tamarindo`.

### 3.4 Servicios (`/demo/admin/servicios`)

Administración completa (CRUD) de los servicios que ofrece el negocio:

- **Crear** un nuevo servicio: nombre, descripción, precio en USD, duración en minutos e imagen (URL).
- **Editar** un servicio existente (se precargan sus datos actuales).
- **Eliminar** un servicio (con confirmación previa).

### 3.5 Suscripción (`/demo/admin/suscripcion`)

Simula el modelo de suscripción mensual de la plataforma:

- Muestra el estado actual: **Activa** 🟢, **Prueba gratuita** 🟡 o **Inactiva** 🔴.
- Si está activa, indica la próxima fecha de cobro y el monto ($15/mes).
- Si está inactiva o en prueba, muestra los beneficios de suscribirse (enlaces públicos ilimitados, pagos y reservas en línea, panel financiero) y un formulario de pago simulado.
- Botón **"Simular pago"**: activa la suscripción (con una breve animación de carga).
- Botón **"Cancelar suscripción"**: la desactiva inmediatamente — puedes usarlo para ver cómo se bloquea el acceso público y el resto del panel.

---

## 4. Recorrido recomendado

1. Entra a `/demo/admin/suscripcion` y activa la suscripción con **"Simular pago"**.
2. Ve a `/demo/admin/servicios` y crea o edita un servicio para ver cómo se personaliza el catálogo.
3. Ve a `/demo/admin/horarios` y agrega un horario disponible para ese servicio.
4. Abre `/demo/surf-tamarindo` en otra pestaña y completa una reserva como lo haría un cliente real.
5. Vuelve a `/demo/admin/reservas` para ver la reserva reflejada en el panel.
6. Opcional: cancela la suscripción desde `/demo/admin/suscripcion` y recarga `/demo/surf-tamarindo` para ver cómo se bloquea el acceso público.

---

## 5. Preguntas frecuentes

**¿Los pagos son reales?**
No. Tanto el pago de la reserva del cliente como el de la suscripción son simulados, solo para fines de demostración.

**¿Se guardan mis cambios si cierro el navegador?**
No. Todos los datos de la demo viven únicamente en memoria del navegador y se reinician al recargar la página.

**¿Necesito una cuenta para probar la demo?**
No. La demo es de libre acceso, a diferencia del panel real de administración, que sí requiere iniciar sesión.

**¿Esto es lo mismo que tendría mi negocio real?**
Sí, la demo refleja el mismo flujo y las mismas pantallas que tendrías en producción, con la diferencia de que tu negocio real usará una base de datos permanente y pasarelas de pago reales.
