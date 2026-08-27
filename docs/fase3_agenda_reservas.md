# Fase 3 — Agenda (bloqueos) y Reservas (data table)

## Qué se construyó

### 1. Agenda / Bloqueos de horario (`/admin/agenda`)

Permite al dueño de la pyme declarar rangos de fecha/hora en los que **no**
está disponible (vacaciones, mantenimiento, etc.), para excluirlos del
calendario de reservas de cara al turista.

- [app/admin/agenda/page.tsx](../app/admin/agenda/page.tsx) — Server Component: obtiene el `negocio` del usuario autenticado y lista los bloqueos con `fecha_fin >= ahora`, ordenados por `fecha_inicio`.
- [app/admin/agenda/NuevoBloqueoForm.tsx](../app/admin/agenda/NuevoBloqueoForm.tsx) — Client Component con `useActionState` + `useFormStatus`, formulario de fecha inicio, fecha fin y motivo.
- [actions/agenda.ts](../actions/agenda.ts) — Server Action `crearBloqueoAction`:
  - Normaliza los valores de `<input type="datetime-local">` a ISO 8601.
  - Valida con `zod`, incluyendo la regla `fecha_fin >= fecha_inicio` (vía `.refine`).
  - Resuelve `negocio_id` en el servidor a partir del usuario autenticado (nunca confía en el formulario).
  - Inserta en `bloqueos_excepcion` y llama a `revalidatePath('/admin/agenda')`.

### 2. Reservas (`/admin/reservas`)

Data table con todas las reservas del negocio, incluyendo el nombre del
servicio asociado.

- [app/admin/reservas/page.tsx](../app/admin/reservas/page.tsx) — Server Component que hace una consulta anidada de Supabase:
  ```ts
  supabase.from("reservas").select("*, servicio:servicios(nombre)");
  ```
  Esto resuelve el JOIN `reservas` ⟶ `servicios` a través de la FK `servicio_id`, sin necesitar una vista SQL aparte.
- Columnas: Fecha/Hora, Cliente (email), Servicio, Estado (badge verde = `pagada`, ámbar = `pendiente`), ID Transacción.
- Tabla responsive con scroll horizontal (`overflow-x-auto`) en mobile.

### 3. Tipos nuevos

En [types/database.ts](../types/database.ts):

- `BloqueoExcepcion` y su tabla `bloqueos_excepcion` en `Database`.
- `ReservaConServicio` — extiende `Reserva` con `servicio: Pick<Servicio, 'nombre'> | null`, usado por el `select` anidado.

## Interacción con Supabase

- Todas las consultas usan el cliente **SSR** ([lib/supabase/server.ts](../lib/supabase/server.ts)), que respeta la sesión (cookies) y por tanto las políticas RLS: un dueño solo puede ver/crear filas de su propio `negocio_id`.
- **Esquema esperado de `bloqueos_excepcion`** (no existía antes de esta fase, asumido igual que el resto de tablas multi-tenant):

  ```sql
  create table bloqueos_excepcion (
    id uuid primary key default gen_random_uuid(),
    negocio_id uuid not null references negocios(id) on delete cascade,
    fecha_inicio timestamptz not null,
    fecha_fin timestamptz not null,
    motivo text not null,
    check (fecha_fin >= fecha_inicio)
  );

  alter table bloqueos_excepcion enable row level security;

  create policy "Dueño gestiona sus bloqueos"
    on bloqueos_excepcion
    for all
    using (negocio_id in (select id from negocios where user_id = auth.uid()))
    with check (negocio_id in (select id from negocios where user_id = auth.uid()));
  ```

- Se asume que `reservas` y `servicios` ya tienen políticas RLS equivalentes (filtrando por `negocio_id` perteneciente al `user_id` autenticado), definidas en la Fase 2.

## Cómo probarlo (QA / siguiente desarrollador)

### Preparación

1. `npm install` (agrega `@supabase/ssr` si aún no está instalado).
2. Completar `.env.local` a partir de [.env.example](../.env.example).
3. Crear la tabla `bloqueos_excepcion` en Supabase con el DDL de arriba (o su equivalente) y sus políticas RLS.
4. Tener al menos un usuario de Supabase Auth con una fila en `negocios` (`user_id` = ese usuario) y algunos `servicios` y `reservas` de prueba.

### Casos a probar — Agenda

1. Iniciar sesión en `/login` y navegar a `/admin/agenda`.
2. Verificar que la lista muestra solo bloqueos futuros (`fecha_fin >= ahora`) del negocio propio.
3. Crear un bloqueo con fecha fin **anterior** a fecha inicio → debe mostrar el error "La fecha de fin no puede ser anterior a la fecha de inicio." sin llegar a insertar en la BD.
4. Crear un bloqueo válido → el botón muestra el spinner de carga (`useFormStatus`), al terminar el formulario se limpia y el nuevo bloqueo aparece en la lista (gracias a `revalidatePath`).
5. Confirmar en Supabase que la fila insertada tiene el `negocio_id` correcto (no manipulable desde el cliente).

### Casos a probar — Reservas

1. Navegar a `/admin/reservas`.
2. Verificar que aparecen todas las reservas del negocio (pendientes y pagadas), más recientes primero.
3. Confirmar que la columna "Servicio" muestra el nombre correcto (JOIN) y no un ID.
4. Verificar los colores de estado: `pagada` en verde, `pendiente` en ámbar.
5. Con una reserva sin `trx_id`, confirmar que la columna muestra `—` en vez de vacío o `undefined`.
6. Probar en viewport mobile que la tabla se puede desplazar horizontalmente sin romper el layout.

### Seguridad (RLS)

- Con dos negocios distintos (dos usuarios), confirmar que el dueño del negocio A **no** puede ver bloqueos ni reservas del negocio B, incluso intentando manipular el request manualmente (las políticas RLS deben bloquearlo a nivel de base de datos, no solo en el frontend).
