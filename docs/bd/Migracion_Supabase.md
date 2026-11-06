# Migración de los mocks a Supabase

El esquema ejecutable está en [schema.sql](../../supabase/schema.sql) y la demostración actual en [seed.sql](../../supabase/seed.sql). Los modelos de la aplicación mantienen sus nombres españoles mediante vistas compatibles sobre tablas relacionales en inglés.

## 1. Preparar la base de datos

En un proyecto nuevo de Supabase, ejecutar en el SQL Editor:

1. [schema.sql](../../supabase/schema.sql), completo.
2. [seed.sql](../../supabase/seed.sql), únicamente si se quieren los datos de demostración.

El esquema incluye tablas, relaciones, índices, RLS, funciones públicas limitadas, sincronización fiscal y el bucket `negocios-media`. Requiere PostgreSQL 15 o superior para las vistas `security_invoker`; Supabase proporciona los esquemas Auth y Storage.

**No ejecutar después las migraciones históricas de esta carpeta.** Sus nombres españoles ahora corresponden a vistas, no a las tablas antiguas. Estos archivos nuevos son una inicialización, no una conversión automática de una base previamente poblada con el esquema legado.

La semilla reproduce:

- Escuela de Surf Pura Vida, Kayak Manglar Tours y Tour de Café Monteverde.
- Plan vuki de **$15 USD**, 4 servicios, 9 horarios y 3 reservas.
- 2 registros financieros, 1 ticket con su mensaje y 1 reporte público.
- Configuración actual; anuncios, bloqueos, comunicados y demás colecciones inicialmente vacías.

Los horarios se generan con `America/Costa_Rica`. Volver a ejecutar la semilla no duplica registros, cambia contraseñas ni desplaza los horarios existentes. No se transfieren automáticamente las modificaciones realizadas posteriormente en los mocks: su almacenamiento es temporal.

## 2. Configurar la conexión

Copiar los valores de API del proyecto en el entorno privado:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Las variables están preparadas en [.env.example](../../.env.example). La base de datos opera exclusivamente con Supabase (el emulador mock en memoria fue retirado). Si falta la configuración pública en cualquier entorno, la aplicación falla explícitamente sin fallbacks silenciosos.

**La contraseña de PostgreSQL no sustituye las claves de API anónima y service role.** Ninguna contraseña local ni clave secreta se incluye en los SQL o en archivos versionados.

## 3. Usuarios de demostración

La semilla crea seis usuarios confirmados de Auth y sus identidades de correo, con contraseñas aleatorias desconocidas. Sus UUID son estables y sustituyen únicamente en PostgreSQL los identificadores del mock.

| Correo | UUID | Uso |
| --- | --- | --- |
| `demo@vuki.cr` | `00000000-0000-4000-8000-000000000001` | Surf |
| `kayak@vuki.cr` | `00000000-0000-4000-8000-000000000002` | Kayak |
| `cafe@vuki.cr` | `00000000-0000-4000-8000-000000000003` | Café |
| `admin@vuki.cr` | `00000000-0000-4000-8000-000000000101` | Superadministración |
| `finanzas@vuki.cr` | `00000000-0000-4000-8000-000000000102` | Finanzas |
| `soporte@vuki.cr` | `00000000-0000-4000-8000-000000000103` | Soporte |

Las contraseñas de demostración locales documentadas en `CREDENCIALES_LOCALES.md` fueron establecidas mediante Auth Admin `updateUserById` desde el entorno local seguro, conservando sus UUID, perfiles, identidades y roles. La recuperación por correo solo es útil si se controla la dirección de destino. No guardar contraseñas ni claves secretas en el repositorio ni en archivos versionados.

Si alguno de los correos ya existe con otro UUID, la semilla aborta explícitamente: no sobrescribe esa cuenta. Los perfiles se sincronizan desde Auth y los roles demo se asignan solo al crear sus cuentas.

Para recuperación habitual, configurar `<APP_URL>/auth/callback` en Authentication > URL Configuration y el envío de correos de Supabase. `ADMIN_GLOBAL_EMAILS` permite el bootstrap del administrador; los roles del equipo se administran en el panel global.

## 4. Clientes y datos

- [client.ts](../../lib/supabase/client.ts): cliente real del navegador con clave pública. No importa mocks ni service role.
- [server.ts](../../lib/supabase/server.ts): cliente SSR asociado a las cookies de la sesión. Empresa y acciones ordinarias respetan RLS.
- [admin.ts](../../lib/supabase/admin.ts): service role exclusivamente después de validar una sesión administrativa o una firma de webhook.
- [db.ts](../../lib/data/db.ts) y [server.ts](../../lib/data/server.ts): consultas tipadas, filtros y paginación; errores explícitos.
- [public.ts](../../lib/data/public.ts): catálogo, disponibilidad, reservas por token y operaciones públicas mediante RPC.
- [db.ts](../../lib/admin/db.ts): acceso global protegido y API administrativa de Auth.

Los upserts de configuración apuntan a `platform_settings`: PostgreSQL no admite `ON CONFLICT` sobre una vista. El adaptador conserva el nombre español de la aplicación.

La empresa solo accede a sus filas. Anon no puede consultar reservas, perfiles o datos bancarios directamente. Los enlaces de gestión y checkout requieren un token privado: conocer el UUID de una reserva no da acceso.

## 5. Pagos y fiscalidad

`platform_settings.simulated_payments_enabled` empieza en `false`; la primera carga demo lo activa. Puede cambiarse en la configuración global como **Pagos de demostración**. Desactivarlo bloquea los RPC de cobro y suscripción simulados sin dejar nuevas reservas pendientes.

Los pagos de turistas siguen siendo una demostración: no hay una integración implementada con TiloPay/OnvoPay. El checkout lo indica expresamente y pide usar solo datos de tarjeta ficticios. El recibo no afirma un envío por correo en modo mock o cuando falla la notificación. El checkout pendiente también exige este flag mientras no exista una pasarela real.

El webhook genérico verifica HMAC-SHA256 antes de obtener un cliente privilegiado. Una confirmación pagada requiere `trx_id`, no acepta el prefijo reservado `manual_`, no revive cancelaciones, conserva el precio histórico y no degrada pagos ya confirmados. La confirmación y el registro financiero son transaccionales; los reintentos no duplican notificaciones. Si falla el procesamiento, solo se conserva el payload validado (`reserva_id`, `estado`, `trx_id`) para reprocesarlo desde el panel global, nunca el cuerpo sin validar ni la firma.

Stripe conserva `metadata.negocio_id`. Su customer se persiste únicamente al recibir un checkout firmado; los cambios de suscripción no usan service role desde acciones ordinarias de empresa.

Servicios y reservas incluyen los campos fiscales solicitados. Los precios incluyen IVA; subtotal, impuesto, comisión y neto se redondean en PostgreSQL. Las reservas conservan la configuración fiscal y el precio del momento de creación.

**515 CRC/USD y 4,25 % de comisión son referencias de demostración, no una consulta BCCR ni una liquidación bancaria real.** Registrar un consecutivo o marcar una factura como emitida solo guarda trazabilidad externa/demo; no envía documentos a Hacienda. El botón que genera consecutivos de prueba solo aparece con pagos demo habilitados.

Resend es independiente de la conexión: si faltan sus variables, las notificaciones fallan explícitamente y se registran, sin impedir importar el cliente de base de datos ni simular entregas reales.

## 6. Verificación de despliegue

El SQL se valida localmente con PostgreSQL, incluyendo semilla, RLS, tokens, cupos y sincronización fiscal. **La preparación del repositorio no ejecuta cambios en el proyecto remoto.**

Después de aplicar los SQL y configurar Auth:

1. Ingresar con empresa y equipo; comprobar catálogo y las páginas de ambos paneles.
2. Intentar acceder a otro negocio: debe rechazarse.
3. Reservar el último cupo y comprobar que otra petición no excede la capacidad.
4. Guardar un comprobante y recargar: datos fiscales y reserva deben conservarse.
5. Probar firmas inválidas, reintentos de pago y desactivación del modo demo.
6. Configurar URLs de Auth, Resend y Stripe si se utilizarán esos servicios.
