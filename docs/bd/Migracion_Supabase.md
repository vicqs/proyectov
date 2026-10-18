# Migración del modo simulado a Supabase

Guía para pasar de la capa mock (`lib/mock/*`) a un proyecto real de Supabase. Hoy todo corre en memoria; **nada de lo descrito aquí se ha ejecutado aún contra Supabase real**, así que se debe validar cada paso.

## 1. Cómo se elige el modo

- `isMockMode` (`lib/mock/client.ts`) activa el mock si `USE_MOCK_DB=true` o si `NEXT_PUBLIC_SUPABASE_URL` falta o es un placeholder.
- `createSupabaseServerClient` (`lib/supabase/server.ts`) devuelve el cliente real o el mock con la misma interfaz.
- Por eso el código de negocio no cambia: solo cambian las variables de entorno.
- Los datos mock viven en `lib/mock/data.ts` y se reinician al reiniciar el servidor.

## 2. Preparar el proyecto

1. Crear el proyecto en Supabase.
2. Aplicar el esquema base descrito en [Estructura_Datos.md](Estructura_Datos.md) (negocios, servicios, reservas, horarios, bloqueos).
3. Ejecutar en el SQL Editor, en este orden:
   - [migracion_horarios_cupos.sql](migracion_horarios_cupos.sql)
   - [migracion_admin_global.sql](migracion_admin_global.sql): añade columnas a `negocios` (suspensión, plan, descuento, prueba, soft-delete) y crea `perfiles`, `planes`, `auditoria`, `configuracion_plataforma`, `anuncios`, `comunicados`, `tickets`, `ticket_mensajes`, `notas_internas`, `reportes_perfil`, `registro_sistema` y `reembolsos`.
4. Crear el bucket de Storage para las imágenes de personalización (ver [creacion/fase4_personalizacion_storage.md](../creacion/fase4_personalizacion_storage.md)).
5. Revisar que `types/database.ts` coincida con el esquema final.

## 3. Variables de entorno

| Variable                                                    | Uso                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente y middleware                                        |
| `SUPABASE_SERVICE_ROLE_KEY`                                 | Solo servidor: operaciones del admin global (bypass de RLS) |
| `ADMIN_GLOBAL_EMAILS`                                       | Correos (separados por coma) que se tratan como superadmin  |
| `NEXT_PUBLIC_APP_URL`                                       | Base de los enlaces de recuperación de contraseña           |
| `RESEND_API_KEY`, `EMAIL_FROM`                              | Correos transaccionales y comunicados                       |
| `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, webhook secret      | Suscripciones                                               |
| `PAGO_WEBHOOK_SECRET`                                       | Webhook de la pasarela                                      |
| `USE_MOCK_DB`                                               | Dejar sin definir o en `false` en producción                |

Detalle completo en [Variables_y_despliegue.md](../Variables_y_despliegue.md).

## 4. Autenticación

- Crear en Supabase Auth los usuarios de empresa y de equipo. En el mock estaban `demo@`, `admin@`, etc.; **esas credenciales no existen en Supabase**.
- El primer superadmin se define con `ADMIN_GLOBAL_EMAILS`. Los demás roles (finanzas, soporte) se asignan desde `/admin/equipo` y se guardan en `perfiles.rol_admin`.
- Recuperación de contraseña:
  - En Authentication > URL Configuration añadir `<APP_URL>/auth/callback` como Redirect URL.
  - Configurar la plantilla de correo "Reset Password" (o un SMTP propio) para que el enlace apunte al flujo con `code`.
  - Flujo: `/recuperar` → correo → `/auth/callback` (canjea el `code`) → `/restablecer`.
- Las contraseñas temporales del admin (crear negocio, asignar rol, restablecer) usan `auth.admin`; con Supabase real conviene reemplazarlas por invitación o enlace por correo.

## 5. Seguridad (RLS)

- El panel global usa la service role en el servidor; nunca exponerla al cliente.
- Activar RLS en todas las tablas y definir políticas:
  - Empresa: solo filas de su `negocio_id` / `user_id`.
  - Público: lectura de `negocios` (no suspendidos ni eliminados), `servicios` y `horarios` activos; inserción de reservas mediante la acción del servidor.
  - Tablas del admin (`auditoria`, `configuracion_plataforma`, `tickets`, etc.): sin acceso desde anon/authenticated, solo service role.
- Las políticas finales **no están escritas en el repo**: hay que redactarlas y probarlas.

## 6. Servicios externos

- **Stripe:** hoy el checkout usa `STRIPE_PRICE_ID`. El precio por plan (`planes.stripe_price_id`, `precioDelNegocio`) aún no está conectado. Configurar el webhook en `/api/webhooks/stripe`.
- **Resend:** verificar el dominio de `EMAIL_FROM`. Los comunicados masivos están limitados a 200 negocios.
- **Webhook de pago:** configurar `PAGO_WEBHOOK_SECRET`. Reprocesar un webhook desde el admin no reenvía correos.

## 7. Orden recomendado de verificación

1. Con `USE_MOCK_DB=false` y variables reales, arrancar y comprobar que `/login` autentica.
2. Iniciar sesión como superadmin y revisar que cada página de `/admin/*` carga (algunas tablas estarán vacías).
3. Crear un negocio desde `/admin/negocios/nuevo` y entrar a su panel.
4. Probar: reserva pública, bloqueo de usuario, suspensión, anuncio visible en el panel de empresa, mantenimiento, reembolso, exportación CSV, auditoría.
5. Probar la recuperación de contraseña de punta a punta.
6. Revisar los logs de `registro_sistema` y de Supabase por errores de columnas o de RLS.

## 8. Riesgos conocidos

- Consultas del admin (`lib/admin/db.ts`) validadas contra los tipos, no contra una base real: pueden aparecer diferencias en nombres de columnas o permisos.
- Filtros, ordenamientos y agregados que el mock resuelve en memoria deben comprobarse con el volumen real de datos.
- El mock se comporta como un solo proceso; en Vercel (serverless) cada función es independiente, por lo que la persistencia debe ser siempre la base de datos.
