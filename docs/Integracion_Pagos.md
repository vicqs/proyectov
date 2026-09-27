# 💰 Integración de Pagos — Arquitectura de Cobro

Este documento detalla la arquitectura de cobro de Proyecto V: cómo se levanta el modal de pago en el frontend sin tocar datos de tarjeta, cómo se reciben las confirmaciones vía webhook en el backend, y los estados posibles de una transacción.

## 1. 🖼️ Flujo del modal (Frontend) — Cumplimiento PCI

El frontend **nunca captura ni almacena datos de tarjeta directamente**. En lugar de un formulario propio de tarjeta, la integración real con **TiloPay** u **OnvoPay** funciona levantando su **Modal/Iframe seguro** (hosted fields), embebido dentro del mismo paso `"pago"` del flujo de checkout ([components/AnimatedCheckoutSheet.tsx](../components/AnimatedCheckoutSheet.tsx)).

### Cómo funciona

1. El turista completa los pasos previos (servicio, horario, datos personales — ver [docs/Flujo_Reservas.md](Flujo_Reservas.md)).
2. Al llegar al paso de pago, el frontend solicita al backend (Route Handler, ej. [app/api/checkout/route.ts](../app/api/checkout/route.ts)) la creación de una **reserva en estado `pendiente`** y, con esa referencia (`reserva_id`), inicia una sesión/intención de pago con la pasarela.
3. La pasarela (TiloPay/OnvoPay) devuelve un **token o URL de sesión** para renderizar su Modal/Iframe embebido dentro del mismo bottom sheet — el turista introduce los datos de su tarjeta **directamente en los campos de la pasarela** (hosted fields), nunca en un `<input>` controlado por nuestro React.
4. Nuestro frontend solo observa eventos del SDK de la pasarela (éxito, error, cancelación) para avanzar el wizard (`"pago" → "cargando" → "exito"`), sin tener acceso en ningún momento al número de tarjeta, CVC o fecha de expiración completos.

### Por qué esto importa (PCI-DSS)

- Al delegar la captura de datos sensibles al iframe de la pasarela, **el alcance de cumplimiento PCI-DSS de Proyecto V se reduce drásticamente** (SAQ-A en vez de SAQ-D): nuestros servidores y frontend nunca "tocan", transmiten ni almacenan el PAN (número de tarjeta) completo.
- Esto es coherente con el rol de "puente tecnológico, no PayFac" descrito en [docs/Reglas_Negocio.md](Reglas_Negocio.md): Proyecto V no maneja fondos ni datos de pago, solo orquesta la experiencia de usuario.

> ⚠️ **Estado actual (demo)**: el paso `"pago"` de `AnimatedCheckoutSheet.tsx` hoy simula estos campos con inputs propios (`numeroTarjeta`, `vencimiento`, `cvc`) únicamente para fines de demostración visual — **no se conecta a ninguna pasarela real todavía** y no debe usarse en producción tal cual. Ver [docs/Roapmap.md](Roapmap.md#⚙️-fase-2-mvp-técnico).

## 2. 🔔 Manejo de webhooks (Backend)

La confirmación real del pago **nunca depende de lo que ocurra en el navegador del turista** (que podría cerrar la pestaña, perder conexión, etc.). La fuente de verdad es el **webhook asíncrono** que la pasarela envía al servidor.

### Flujo del webhook

Ya existe un precedente funcional de este patrón en [app/api/webhooks/pago/route.ts](../app/api/webhooks/pago/route.ts) (y su equivalente [app/api/webhooks/stripe/route.ts](../app/api/webhooks/stripe/route.ts)), implementado como **Route Handler de Next.js** (`app/api/.../route.ts`, método `POST`):

1. **Recepción**: la pasarela (TiloPay/OnvoPay) hace un `POST` a un endpoint público, ej. `app/api/webhooks/tilopay/route.ts`, con el resultado de la transacción (`reserva_id` o referencia externa, estado, `trx_id`).
2. **Verificación de firma (seguridad crítica)**: antes de procesar cualquier dato, se valida que la notificación provenga realmente de la pasarela:
   - Se lee el **cuerpo crudo** (`request.text()`) — nunca se parsea a JSON antes de verificar la firma.
   - Se calcula un **HMAC-SHA256** del cuerpo crudo usando un secreto compartido (`PAGO_WEBHOOK_SECRET` o equivalente específico de la pasarela) y se compara contra la firma recibida en un header (ej. `x-signature`) usando `crypto.timingSafeEqual` para evitar ataques de _timing attack_.
   - Si la firma no es válida, se responde `401` y **no se procesa nada más**.
3. **Validación del payload**: se usa `zod` para validar la forma exacta del cuerpo (ej. `reserva_id` como UUID, `estado` limitado a un enum conocido), rechazando con `400` cualquier payload malformado.
4. **Actualización idempotente**: se actualiza el registro de la reserva/transacción (`estado`, `trx_id`) buscando por su identificador único. Si la reserva no existe, se responde `404`. La operación debe ser **idempotente** — recibir el mismo webhook dos veces (reintentos de la pasarela) no debe duplicar reservas ni notificaciones.
5. **Efectos secundarios post-confirmación**: solo cuando el pago se marca como aprobado se disparan acciones dependientes, como el envío de correos de confirmación (`enviarCorreosConfirmacion`, vía [lib/email.ts](../lib/email.ts) + Resend) y el bloqueo definitivo del cupo (decremento de `cupos_disponibles`).
6. **Respuesta `200 OK`**: se responde `200` a la pasarela **únicamente después de procesar exitosamente** el webhook, confirmando su recepción. Si no se responde `200` (o hay timeout/error), la mayoría de pasarelas **reintentan el envío automáticamente** — por eso la idempotencia del paso 4 es indispensable.

### Buenas prácticas aplicadas

- Nunca confiar en datos enviados desde el cliente (ej. `negocio_id`) — siempre derivarlos de la base de datos a partir de una referencia validada (ej. `servicio_id`), como ya hace [app/api/checkout/route.ts](../app/api/checkout/route.ts).
- Usar `supabaseAdmin` (cliente con service role) solo dentro de Route Handlers server-side, nunca expuesto al navegador.
- Registrar (`console.error` / logging estructurado) cualquier firma inválida o payload rechazado, para auditoría y detección de intentos de fraude.

## 3. 🔄 Estados de transacción

Todo pago dentro del sistema transita por un conjunto acotado de estados, reflejados tanto en la reserva (`Booking.estado_pago`, ver [docs/Estructura_Datos.md](Estructura_Datos.md)) como en la UI:

| Estado          | Significado                                                                                                                                                               | Disparador                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Pendiente**   | La reserva fue creada y se inició la intención de pago, pero la pasarela aún no confirma el resultado.                                                                    | Creación inicial vía `app/api/checkout/route.ts` (paso 3 del flujo, antes de abrir el modal de la pasarela). |
| **Aprobado**    | La pasarela confirmó el pago exitosamente. El cupo queda bloqueado en firme y se notifica a la pyme y al turista.                                                         | Webhook de la pasarela con resultado exitoso (paso 6, respuesta `200 OK`).                                   |
| **Rechazado**   | La pasarela informó que el cobro falló (fondos insuficientes, tarjeta inválida, fraude detectado, etc.). El cupo **no** se bloquea y se le permite al turista reintentar. | Webhook de la pasarela con resultado fallido.                                                                |
| **Reembolsado** | Un pago previamente aprobado fue revertido (solicitud de la pyme, disputa, cancelación). El cupo se libera nuevamente.                                                    | Acción manual desde el panel admin o webhook de reembolso de la pasarela.                                    |

### Reglas de negocio asociadas a los estados

- Solo las reservas en estado **Aprobado** cuentan para el control de cupos (`cupos_disponibles`) de forma definitiva — evita bloquear cupos por intentos de pago fallidos o abandonados.
- Los correos de confirmación (Resend/React Email) solo se envían al pasar a **Aprobado**.
- Un cambio a **Reembolsado** debe liberar el cupo correspondiente en `Schedule`, permitiendo que otro turista lo reserve.
- La UI del turista solo debe mostrar la pantalla de éxito (paso `"exito"` del checkout) tras confirmar el estado **Aprobado** — nunca de forma optimista antes de la confirmación real del webhook, para evitar mostrar una reserva como exitosa cuando en realidad fue rechazada.
