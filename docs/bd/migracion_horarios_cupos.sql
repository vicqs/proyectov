-- Migración consolidada: horarios, cupos, cancelaciones, contacto y gestión
-- de reservas por el turista. Ejecutar en el SQL Editor de Supabase.
-- Es idempotente: se puede correr más de una vez.

-- 1) Servicios: descripción e imagen
alter table servicios add column if not exists descripcion text;
alter table servicios add column if not exists imagen_url text;

-- 2) Negocios: WhatsApp de contacto (solo dígitos con código de país)
alter table negocios add column if not exists whatsapp text
  check (whatsapp is null or whatsapp ~ '^[0-9]{8,15}$');

-- 3) Reservas: nombre, cupos, token de gestión y estado "cancelada"
alter table reservas add column if not exists nombre_cliente text;
alter table reservas add column if not exists cupos int not null default 1
  check (cupos > 0);
alter table reservas add column if not exists token_gestion text unique;

-- Si `estado` es un enum, descomenta la línea siguiente:
-- alter type estado_reserva add value if not exists 'cancelada';
-- Si es text con CHECK, reemplaza la restricción:
-- alter table reservas drop constraint if exists reservas_estado_check;
-- alter table reservas add constraint reservas_estado_check
--   check (estado in ('pendiente', 'pagada', 'cancelada'));

-- 4) Horarios con cupos totales
create table if not exists horarios (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  servicio_id uuid not null references servicios(id) on delete cascade,
  fecha_hora timestamptz not null,
  cupos_totales int not null check (cupos_totales between 1 and 500),
  created_at timestamptz not null default now(),
  unique (servicio_id, fecha_hora)
);

create index if not exists horarios_negocio_fecha_idx
  on horarios (negocio_id, fecha_hora);

alter table horarios enable row level security;

-- El dueño gestiona solo los horarios de su negocio.
drop policy if exists "horarios_dueno_all" on horarios;
create policy "horarios_dueno_all" on horarios
  for all
  using (
    exists (
      select 1 from negocios n
      where n.id = horarios.negocio_id and n.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from negocios n
      where n.id = horarios.negocio_id and n.user_id = auth.uid()
    )
  );

-- Nota: el perfil público lee con la service role (supabaseAdmin) y las
-- reservas públicas se crean desde Server Actions, por lo que no se requiere
-- política de lectura anónima sobre `horarios` ni `reservas`.

-- 5) Índices para las consultas del panel (rendimiento)
create index if not exists reservas_negocio_fecha_idx on reservas (negocio_id, fecha_hora);
create index if not exists reservas_servicio_idx on reservas (servicio_id);
create index if not exists servicios_negocio_idx on servicios (negocio_id);
create index if not exists bloqueos_negocio_fecha_idx on bloqueos_excepcion (negocio_id, fecha_fin);


-- 6) Monto cobrado guardado al momento del pago (historial financiero estable)
alter table reservas add column if not exists monto_usd numeric(10,2);
update reservas r set monto_usd = s.precio_usd * coalesce(r.cupos, 1) from servicios s where s.id = r.servicio_id and r.estado = 'pagada' and r.monto_usd is null;

