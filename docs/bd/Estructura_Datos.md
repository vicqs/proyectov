# Estructura de datos de Supabase

La fuente ejecutable es [schema.sql](../../supabase/schema.sql). [seed.sql](../../supabase/seed.sql) contiene la demostración actual; no implementa los tiers proyectados de $25/$40. El plan operativo de la semilla es **Plan vuki, $15 USD**.

## Tablas y compatibilidad

Todas las entidades tienen UUID, marcas temporales y relaciones, excepto el singleton de configuración, identificado por `id = 1`.

| Tabla canónica | Vista/modelo de la aplicación | Relación principal |
| --- | --- | --- |
| `profiles` | `perfiles` | `auth.users`; rol administrativo nullable |
| `businesses` | `negocios` | Propietario en Auth |
| `plans` | `planes` | Planes comerciales y flags |
| `subscriptions` | Integrada en `negocios` | Una por negocio; plan opcional |
| `services` | `servicios` | Negocio |
| `schedules` | `horarios` | Negocio y servicio |
| `blocks` | `bloqueos_excepcion` | Negocio y rango temporal |
| `bookings` | `reservas` | Negocio, servicio y horario opcional |
| `financial_transactions` | `transacciones_financieras` | Reserva, negocio y servicio |
| `support_tickets` | `tickets` | Negocio |
| `ticket_messages` | `ticket_mensajes` | Ticket y autor |
| `internal_notes` | `notas_internas` | Negocio y autor administrativo |
| `profile_reports` | `reportes_perfil` | Negocio y resolución |
| `announcements` | `anuncios` | Segmentación y caducidad |
| `email_broadcasts` | `comunicados` | Segmentación y resultados de envío |
| `platform_settings` | `configuracion_plataforma` | Configuración singleton |
| `audit_logs` | `auditoria` | Actor, entidad y negocio |
| `system_logs` | `registro_sistema` | Webhooks y errores operativos |
| `refunds` | `reembolsos` | Reserva y negocio |

Las vistas usan `security_invoker`, por lo que no eluden RLS. `negocios` combina los datos comerciales con su suscripción y tiene un trigger de escritura. No utilizar las migraciones históricas que intentan alterar estos nombres como tablas.

Los contratos están en [database.ts](../../types/database.ts), y los tipos canónicos de conexión en [supabase.ts](../../types/supabase.ts).

## Reservas, horarios e índices

- Fechas en `timestamptz`; etiquetas y horarios de demostración en Costa Rica.
- Capacidad almacenada en horarios; ocupación derivada de reservas pendientes/pagadas.
- Bloqueo de horario y validación de capacidad dentro de PostgreSQL.
- FK compuestas evitan asociar servicios, horarios, pagos o reembolsos de otro negocio.
- Se conserva la regla actual: un correo no puede tener dos reservas activas para el mismo servicio, aunque cambie de horario.
- Token de gestión aleatorio independiente del UUID de reserva.
- Índices por slug, propietario/negocio, estado, fechas de servicio y referencias de pago.

## Fiscalidad

Servicios y reservas contienen:

`cabys_code`, `iva_rate`, `voucher_type`, `client_id_type`, `client_tax_id`,
`exchange_rate_bccr`, `subtotal_amount`, `iva_amount`, `gross_amount`,
`gateway_fee_amount`, `net_amount`, `invoice_status`, `invoice_consecutive`.

También se conserva moneda, tasa de comisión, nombre y correo del receptor. CABYS tiene 13 dígitos; el consecutivo, cuando se informa, tiene 20. FE exige los datos del receptor. Los importes incluyen IVA y usan columnas calculadas con redondeo monetario.

La reserva captura el precio y la configuración fiscal para no recalcular ventas históricas después de editar el servicio. Los pagos por pasarela generan registros financieros; los pagos con prefijo literal `manual_` permanecen fuera de las liquidaciones por pasarela.

Los cambios de receptor/comprobante se sincronizan entre reserva y registro financiero. Guardar estos datos no equivale a emitir o validar un documento ante Hacienda. El cambio BCCR de 515 y la comisión de 4,25 % de la semilla son referencias demo.

## Acceso

- RLS activa en las 19 tablas.
- Empresa: sesión válida, propiedad del negocio y restricciones para campos administrativos/fiscales protegidos.
- Público: solo proyecciones limitadas y operaciones RPC; no lectura directa de reservas, IBAN, perfiles o datos de otros clientes.
- Superadministración: cliente service role protegido por autorización de servidor.
- Webhooks: cliente privilegiado después de verificar la firma; confirmación de pago transaccional e idempotente.
- Storage: lectura pública del bucket multimedia y escritura restringida a la carpeta del negocio propio.

Ver [Migracion_Supabase.md](Migracion_Supabase.md) para ejecución, credenciales de API, usuarios demo y comprobaciones.
