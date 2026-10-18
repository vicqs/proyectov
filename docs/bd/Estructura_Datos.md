# 🗄️ Estructura de Datos — Esquema Relacional Proyectado

Este documento describe el **esquema relacional** de Proyecto V en Supabase/PostgreSQL, tal como lo modela [types/database.ts](../../types/database.ts) (`negocios`, `servicios`, `reservas`, `horarios`).


## 1. 🏢 `Company` (Pyme)

Representa a cada negocio turístico suscrito a la plataforma (equivalente a `Negocio` / `negocios` en el modelo actual).

| Campo                  | Tipo                                          | Descripción                                                                                                                                                                                                                                                                                             |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | `uuid` (PK)                                   | Identificador único del negocio                                                                                                                                                                                                                                                                         |
| `slug`                 | `text` (unique)                               | Identificador legible en la URL pública (ej. `surf-tamarindo`)                                                                                                                                                                                                                                          |
| `nombre`               | `text`                                        | Nombre comercial del negocio                                                                                                                                                                                                                                                                            |
| `email_contacto`       | `text`                                        | Correo de contacto/administración                                                                                                                                                                                                                                                                       |
| `color_tema`           | `text`                                        | Color de marca (hex) usado para personalizar el perfil público                                                                                                                                                                                                                                          |
| `plan_suscripcion`     | `text` (`"esencial" \| "pro"`)                | Plan contratado ($25 o $40/mes — ver [docs/Reglas_Negocio.md](../Reglas_Negocio.md))                                                                                                                                                                                                                       |
| `estado_suscripcion`   | `text` (`"activa" \| "inactiva" \| "prueba"`) | Estado actual del pago de la suscripción SaaS                                                                                                                                                                                                                                                           |
| `fecha_proximo_cobro`  | `timestamp`                                   | Próxima fecha de cobro de la suscripción                                                                                                                                                                                                                                                                |
| `cuenta_bancaria_info` | `jsonb`                                       | Metadatos de la cuenta/credenciales de la pasarela (TiloPay/OnvoPay) del negocio — **nunca** número de tarjeta ni datos sensibles; solo referencias/tokens de la pasarela, ya que los fondos nunca pasan por Proyecto V (ver [docs/Reglas_Negocio.md](../Reglas_Negocio.md#3-🏦-flujo-financiero-y-legal)) |
| `created_at`           | `timestamp`                                   | Fecha de creación del registro                                                                                                                                                                                                                                                                          |

## 2. 🏄 `Service` (Servicio, ej. Clase de Surf)

Catálogo de servicios ofrecidos por cada negocio.

| Campo          | Tipo                       | Descripción                                                |
| -------------- | -------------------------- | ---------------------------------------------------------- |
| `id`           | `uuid` (PK)                | Identificador único del servicio                           |
| `company_id`   | `uuid` (FK → `Company.id`) | Negocio dueño del servicio                                 |
| `titulo`       | `text`                     | Nombre del servicio (ej. "Clase Grupal de Surf")           |
| `descripcion`  | `text`                     | Descripción visible en el perfil público                   |
| `precio`       | `numeric(10,2)`            | Precio en USD                                              |
| `duracion_min` | `integer`                  | Duración en minutos                                        |
| `imagen_url`   | `text`                     | URL de la imagen principal del servicio                    |
| `activo`       | `boolean`                  | Si el servicio se muestra actualmente en el perfil público |
| `created_at`   | `timestamp`                | Fecha de creación del registro                             |

## 3. 🎟️ `Booking` (Reserva)

Reservas confirmadas y pagadas por turistas.

| Campo                     | Tipo                                                             | Descripción                                                      |
| ------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `id`                      | `uuid` (PK)                                                      | Identificador único de la reserva                                |
| `service_id`              | `uuid` (FK → `Service.id`)                                       | Servicio reservado                                               |
| `schedule_id`             | `uuid` (FK → `Schedule.id`)                                      | Horario/cupo específico reservado                                |
| `fecha`                   | `date`                                                           | Fecha de la reserva                                              |
| `hora`                    | `time`                                                           | Hora de la reserva                                               |
| `nombre_turista`          | `text`                                                           | Nombre del cliente final                                         |
| `email`                   | `text`                                                           | Correo del cliente (para envío de recibo/confirmación)           |
| `cantidad_cupos`          | `integer`                                                        | Número de cupos reservados (ej. personas)                        |
| `monto_pagado`            | `numeric(10,2)`                                                  | Monto total cobrado                                              |
| `estado_pago`             | `text` (`"pendiente" \| "pagado" \| "fallido" \| "reembolsado"`) | Estado de la transacción, actualizado vía webhook de la pasarela |
| `id_transaccion_pasarela` | `text`                                                           | Referencia externa del pago (TiloPay/OnvoPay/Stripe)             |
| `created_at`              | `timestamp`                                                      | Fecha de creación de la reserva                                  |

## 4. 📅 `Schedule` (Horarios/Cupos)

Franjas horarias disponibles por servicio, con control de capacidad.

| Campo               | Tipo                       | Descripción                                                                                       |
| ------------------- | -------------------------- | ------------------------------------------------------------------------------------------------- |
| `id`                | `uuid` (PK)                | Identificador único del horario                                                                   |
| `service_id`        | `uuid` (FK → `Service.id`) | Servicio al que pertenece el horario                                                              |
| `dia_semana`        | `integer` (`0`–`6`)        | Día de la semana (para horarios recurrentes) o `null` si es fecha específica                      |
| `fecha_hora`        | `timestamp`                | Fecha y hora exacta de la sesión (para instancias puntuales) |
| `horas_disponibles` | `text[]` / `jsonb`         | Lista de horas disponibles cuando el horario es recurrente por día de semana                      |
| `max_capacidad`     | `integer`                  | Cupos totales disponibles (equivalente a `cuposTotales`)                                          |
| `cupos_disponibles` | `integer`                  | Cupos aún no reservados (se decrementa con cada `Booking`)                                        |
| `created_at`        | `timestamp`                | Fecha de creación del registro                                                                    |

## 🔗 Relaciones

```
Company (1) ──< Service (N) ──< Schedule (N) ──< Booking (N)
```

- Un `Company` tiene muchos `Service`.
- Un `Service` tiene muchos `Schedule` (franjas horarias).
- Un `Schedule` tiene muchas `Booking` (hasta agotar `max_capacidad`).
- `Booking.service_id` se mantiene como referencia directa además de `schedule_id` para simplificar reportes y queries de finanzas sin necesidad de join adicional.

