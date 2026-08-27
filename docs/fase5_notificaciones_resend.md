# Fase 5 — Notificaciones Transaccionales (Resend + React Email)

## Qué se construyó

Cuando el webhook de la pasarela de pagos confirma un pago (`estado: 'pagada'`),
el sistema envía automáticamente dos correos: un recibo al turista y una alerta
de nueva venta al dueño de la pyme.

- [emails/ReciboTurista.tsx](../emails/ReciboTurista.tsx) — plantilla del recibo (servicio, fecha/hora, monto, ID de transacción, logo/nombre de la pyme).
- [emails/AlertaPyme.tsx](../emails/AlertaPyme.tsx) — plantilla de alerta de venta (badge "PAGADA", servicio, fecha, email del cliente, ingreso).
- [lib/email.ts](../lib/email.ts) — cliente de Resend + `enviarCorreosConfirmacion()`, envía ambos correos en paralelo con `Promise.allSettled` (nunca lanza excepción).
- [app/api/webhooks/pago/route.ts](../app/api/webhooks/pago/route.ts) — actualizado: valida firma HMAC, actualiza la reserva, resuelve negocio/servicio y dispara los correos sin bloquear la respuesta al banco.

## Variables de entorno necesarias

Ver [.env.example](../.env.example):

| Variable              | Uso                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------- |
| `RESEND_API_KEY`      | Autenticación con la API de Resend.                                                                            |
| `EMAIL_FROM`          | Remitente verificado en Resend, ej. `"Turismo Link <notificaciones@tudominio.com>"`.                           |
| `PAGO_WEBHOOK_SECRET` | Secreto compartido con el banco/pasarela para validar la firma HMAC-SHA256 del webhook (header `x-signature`). |

El correo del dueño de la pyme **no** se guarda en `negocios`; se obtiene en
tiempo real con `supabaseAdmin.auth.admin.getUserById(negocio.user_id)`
(requiere la service role key, ya usada por `lib/supabase.ts`).

## Cómo probar los correos en local

1. Instalar dependencias (`resend`, `react-email`, `@react-email/components` ya están en [package.json](../package.json)).
2. Correr el modo preview de React Email, que levanta un servidor local con
   todas las plantillas de la carpeta `emails/`:
   ```bash
   npm run email:dev
   ```
   Esto abre `http://localhost:3000` (puerto propio de React Email, distinto
   al de Next.js) mostrando `ReciboTurista` y `AlertaPyme` con datos de
   ejemplo (`PreviewProps` definidos en cada archivo), permitiendo ver el
   render exacto sin necesidad de enviar un correo real.
3. Para probar el envío real end-to-end sin depender del banco: hacer un
   `POST` manual a `/api/webhooks/pago` firmando el body con el mismo
   `PAGO_WEBHOOK_SECRET`:
   ```bash
   node -e "
   const crypto = require('crypto');
   const body = JSON.stringify({ reserva_id: 'UUID_DE_UNA_RESERVA', estado: 'pagada', trx_id: 'trx_test_1' });
   const firma = crypto.createHmac('sha256', process.env.PAGO_WEBHOOK_SECRET).update(body).digest('hex');
   console.log('x-signature:', firma);
   console.log('body:', body);
   "
   ```
   Luego enviar ese `body` con el header `x-signature` calculado (ej. con
   `curl` o Postman) a `http://localhost:3000/api/webhooks/pago`.
4. Revisar los logs del servidor: si `RESEND_API_KEY` es de modo test/sandbox,
   Resend permite verificar el envío desde su dashboard sin necesidad de un
   dominio verificado en producción.

## Arquitectura asíncrona del webhook

El banco espera una respuesta HTTP 200 rápida (idealmente < 2s). El envío de
correos (llamadas de red a Resend, render de las plantillas) no debe retrasar
esa respuesta. El flujo implementado:

1. **Validar firma** (`firmaValida`): HMAC-SHA256 del cuerpo crudo comparado
   con `timingSafeEqual` contra el header `x-signature`. Si falla, se
   responde `401` de inmediato sin tocar la base de datos.
2. **Actualizar `reservas`** a `pagada` (operación rápida, una sola escritura).
3. **Resolver `servicio` y `negocio`** en paralelo (`Promise.all`) — son
   lecturas puntuales por `id`, de bajo costo.
4. **Programar el envío de correos con `after()`** (API estable de Next.js
   15/`next/server`): la función pasada a `after()` se ejecuta **después**
   de que la respuesta HTTP ya fue enviada al cliente (el banco), pero el
   runtime de Next.js mantiene el proceso vivo hasta que esa función
   termine. Esto evita dos problemas:
   - Que el banco tenga que esperar la latencia de Resend.
   - Que un entorno serverless mate el proceso antes de que el correo salga
     (a diferencia de simplemente no hacer `await`, que en muchas plataformas
     serverless puede cortar la ejecución en cuanto se envía la respuesta).
5. **`enviarCorreosConfirmacion()`** nunca lanza: usa `Promise.allSettled`
   para intentar ambos envíos de forma independiente (si falla uno, el otro
   igual se intenta) y solo registra errores por consola (`console.error`),
   devolviendo un resumen (`reciboTuristaOk`, `alertaPymeOk`) para logging.
6. La respuesta `{ ok: true, reserva_id }` con status `200` se devuelve
   inmediatamente después del paso 3, sin esperar los correos.

## Cómo probarlo (QA)

1. Configurar `RESEND_API_KEY`, `EMAIL_FROM` y `PAGO_WEBHOOK_SECRET` en `.env.local`.
2. Crear una reserva de prueba (vía `/api/checkout` o directo en Supabase) en estado `pendiente`.
3. Enviar el webhook firmado correctamente con `estado: "pagada"` → debe responder `200` casi de inmediato.
4. Confirmar en los logs (o en el dashboard de Resend) que ambos correos se enviaron: recibo al `email_cliente` y alerta al dueño del negocio.
5. Enviar el mismo webhook **sin** header `x-signature` o con una firma incorrecta → debe responder `401` y no debe actualizarse la reserva ni enviarse correos.
6. Simular un negocio sin usuario válido (`user_id` inexistente) → debe registrar el error en logs y no crashear el endpoint (sigue respondiendo `200` porque la reserva sí se actualizó).
7. Revisar visualmente ambas plantillas con `npm run email:dev` para validar que se ven bien en mobile (usar el modo "mobile preview" del propio visor de React Email).
