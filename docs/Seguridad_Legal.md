# ⚖️ Seguridad y Marco Legal — Proyecto V (Costa Rica)

Este documento define la postura legal y de seguridad de Proyecto V dentro del marco regulatorio de Costa Rica, complementando lo descrito en [docs/Reglas_Negocio.md](Reglas_Negocio.md) y [docs/Integracion_Pagos.md](Integracion_Pagos.md).

## 1. 🔒 Arquitectura "Zero-Touch" de fondos

Proyecto V se diseña deliberadamente bajo una arquitectura **"zero-touch" de fondos**: en ningún punto del flujo de pago la plataforma recibe, custodia, agrega o transfiere dinero de terceros.

- **Rol declarado**: Proyecto V es exclusivamente un **proveedor de software (SaaS)** — una capa tecnológica de agenda, catálogo y checkout — nunca un intermediario financiero.
- **Flujo de fondos**: el dinero del turista viaja **directamente desde la pasarela de pago (TiloPay/OnvoPay) hacia la cuenta bancaria de la pyme**. Proyecto V solo orquesta la experiencia de usuario (levantar el modal, recibir el webhook de confirmación) — ver [docs/Integracion_Pagos.md](Integracion_Pagos.md#1-🖼️-flujo-del-modal-frontend--cumplimiento-pci).
- **Sin cuenta transitoria/pooled**: la plataforma **no mantiene una cuenta bancaria propia donde se depositen fondos de múltiples pymes** para luego distribuirlos (patrón típico de un _Payment Facilitator_ o _PayFac_). Cada pyme cobra bajo su propio contrato con la pasarela.
- **Consecuencia regulatoria bajo la Ley 8204**: al no administrar, transferir ni intermediar fondos de terceros, Proyecto V **queda fuera del ámbito de supervisión de la SUGEF** (Superintendencia General de Entidades Financieras) como sujeto obligado bajo la Ley 8204 (Ley sobre Estupefacientes, Sustancias Psicotrópicas, Drogas de Uso no Autorizado, Legitimación de Capitales y Financiamiento al Terrorismo). Esa responsabilidad recae en las pasarelas de pago (TiloPay/OnvoPay), que sí son las entidades reguladas y supervisadas para el procesamiento de pagos.
- **Implicación técnica**: esta postura debe mantenerse en cualquier evolución futura de la arquitectura — no debe introducirse ningún mecanismo (billetera interna, saldo acumulado, "wallet" de la pyme dentro de Proyecto V, etc.) que implique la custodia temporal de fondos de terceros, ya que eso cambiaría la clasificación regulatoria de la plataforma.

## 2. 🛡️ Cumplimiento de privacidad (Ley 8968)

Proyecto V procesa datos personales de turistas (nombre, correo electrónico, y en algunos flujos cantidad de acompañantes) al momento de la reserva. Este tratamiento se alinea con las buenas prácticas de la **Ley N.º 8968 — Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales** de Costa Rica.

### Principios aplicados

- **Minimización de datos**: solo se recolectan los campos estrictamente necesarios para completar y confirmar la reserva — nombre y correo del turista (ver paso 3 de [docs/Flujo_Reservas.md](Flujo_Reservas.md#3-📝-recopilación-de-datos)). No se solicitan datos sensibles innecesarios (identificación, dirección, etc.) para el flujo básico de reserva.
- **Finalidad definida**: los datos del turista se usan exclusivamente para gestionar la reserva (confirmación, recordatorios, contacto ante cambios) y no se reutilizan para fines distintos sin una base legítima adicional.
- **No captura de datos de pago**: los datos financieros de la tarjeta nunca son recolectados ni almacenados por Proyecto V — quedan exclusivamente en el dominio de la pasarela de pago (ver arquitectura PCI en [docs/Integracion_Pagos.md](Integracion_Pagos.md)), reduciendo significativamente el riesgo y alcance de la Ley 8968 sobre datos sensibles.
- **Seguridad de la información**: las comunicaciones con servicios externos (webhooks) se validan mediante firma HMAC (ver [docs/Integracion_Pagos.md](Integracion_Pagos.md#2-🔔-manejo-de-webhooks-backend)), y el acceso a datos en la base de datos (Supabase) debe protegerse mediante políticas de acceso a nivel de fila (RLS) por `company_id`/`negocio_id`, evitando que una pyme pueda ver datos de turistas de otra pyme.
- **Responsable del tratamiento**: cada pyme es, frente a sus propios turistas, la responsable directa de la relación comercial y del uso posterior de esos datos de contacto (ej. para reenviar el recibo o coordinar la actividad); Proyecto V actúa como **encargado del tratamiento** (procesador técnico) de esos datos en nombre de la pyme, no como dueño de la relación con el turista final.
- **Derechos ARCO**: la arquitectura debe permitir, a futuro, atender solicitudes de acceso, rectificación, cancelación u oposición sobre los datos personales almacenados de un turista (ej. eliminar su información de una reserva pasada a solicitud).

## 3. 🧾 Responsabilidad fiscal

Proyecto V **no emite ni participa en la emisión de comprobantes electrónicos por los servicios turísticos vendidos** por las pymes a sus clientes finales.

- **Factura electrónica al turista**: es **responsabilidad exclusiva de la pyme**, quien debe emitirla usando sus propias herramientas de facturación electrónica autorizadas por el **Ministerio de Hacienda** de Costa Rica (facturador propio, o herramientas externas de terceros), bajo su propia cédula jurídica/física y régimen tributario.
- **Facturación de Proyecto V**: la plataforma **únicamente factura a la pyme el uso del software** — es decir, la suscripción mensual del plan Esencial ($25) o Pro ($40) descrito en [docs/Reglas_Negocio.md](Reglas_Negocio.md#2-💳-modelo-de-suscripción-tiers) — como cualquier proveedor de SaaS B2B.
- **Separación clara de responsabilidades tributarias**:
  - El **ingreso por la venta del servicio turístico** (clase de surf, tour, etc.) es ingreso de la pyme, declarado y facturado por la pyme ante Hacienda.
  - El **ingreso por la suscripción SaaS** es ingreso de Proyecto V, declarado y facturado por Proyecto V ante Hacienda, de forma completamente independiente.
- Esta separación es consistente con la arquitectura "zero-touch" de fondos descrita en la sección 1: como el dinero del turista nunca pasa por Proyecto V, tampoco existe obligación ni base fáctica para que Proyecto V facture esa transacción en nombre de la pyme.
