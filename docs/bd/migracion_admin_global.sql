-- Migración: administración global (rol Admin).
-- Ejecutar en el SQL Editor de Supabase. Es idempotente.
-- Todas las tablas nuevas se usan solo desde el servidor con la service role,
-- por eso tienen RLS activado y NINGUNA política (el cliente anónimo/autenticado
-- no puede leerlas ni escribirlas).

-- 1) Negocios: suspensión, borrado lógico, plan, descuento y prueba
alter table negocios add column if not exists suspendido boolean not null default false;
alter table negocios add column if not exists motivo_suspension text;
alter table negocios add column if not exists eliminado_en timestamptz;
alter table negocios add column if not exists plan_id uuid;
alter table negocios add column if not exists descuento_pct numeric not null default 0
  check (descuento_pct >= 0 and descuento_pct <= 100);
alter table negocios add column if not exists prueba_hasta timestamptz;
alter table negocios add column if not exists proximo_cobro timestamptz;
alter table negocios add column if not exists color_secundario text
  check (color_secundario is null or color_secundario ~ '^#[0-9a-fA-F]{6}$');
alter table negocios add column if not exists flags_override jsonb not null default '{}'::jsonb;
alter table negocios add column if not exists creado_en timestamptz not null default now();

-- 2) Perfiles de plataforma (rol interno, bloqueo, revocación de sesiones)
create table if not exists perfiles (
  user_id uuid primary key,
  email text not null,
  rol_admin text check (rol_admin in ('superadmin', 'finanzas', 'soporte')),
  bloqueado boolean not null default false,
  sesiones_revocadas_desde timestamptz,
  creado_en timestamptz not null default now()
);

-- 3) Planes
create table if not exists planes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  precio_usd numeric not null check (precio_usd >= 0),
  stripe_price_id text,
  activo boolean not null default true,
  por_defecto boolean not null default false,
  flags jsonb not null default '{}'::jsonb,
  creado_en timestamptz not null default now()
);

create unique index if not exists planes_un_defecto_idx
  on planes (por_defecto) where por_defecto;
alter table planes add column if not exists flags jsonb not null default '{}'::jsonb;

insert into planes (nombre, precio_usd, por_defecto)
select 'Plan Turismo Link', 15, true
where not exists (select 1 from planes);

alter table negocios drop constraint if exists negocios_plan_id_fkey;
alter table negocios add constraint negocios_plan_id_fkey
  foreign key (plan_id) references planes(id) on delete set null;

-- 4) Auditoría
create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null,
  actor_email text not null,
  actor_rol text not null,
  accion text not null,
  entidad text not null,
  entidad_id text,
  negocio_id uuid,
  detalle jsonb,
  creado_en timestamptz not null default now()
);
create index if not exists auditoria_creado_idx on auditoria (creado_en desc);

-- 5) Configuración global (fila única)
create table if not exists configuracion_plataforma (
  id int primary key check (id = 1),
  dias_prueba int not null default 14,
  slugs_reservados text[] not null default '{}',
  max_cupos_horario int not null default 500,
  max_imagen_mb int not null default 2,
  modo_mantenimiento boolean not null default false,
  mensaje_mantenimiento text,
  flags jsonb not null default '{"reservas_publicas": true, "soporte_empresas": true, "reportes_publicos": true}',
  plantillas_correo jsonb not null default '{}',
  terminos_texto text,
  privacidad_texto text,
  actualizado_en timestamptz not null default now()
);
insert into configuracion_plataforma (id) values (1) on conflict (id) do nothing;

-- 6) Comunicación
create table if not exists anuncios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  mensaje text not null,
  severidad text not null default 'info' check (severidad in ('info', 'aviso', 'critico')),
  segmento text not null default 'todas' check (segmento in ('todas', 'prueba', 'activa', 'inactiva')),
  activo boolean not null default true,
  expira_en timestamptz,
  creado_por text not null default '',
  creado_en timestamptz not null default now()
);

create table if not exists comunicados (
  id uuid primary key default gen_random_uuid(),
  asunto text not null,
  mensaje text not null,
  segmento text not null default 'todas',
  destinatarios int not null default 0,
  enviados int not null default 0,
  fallidos int not null default 0,
  creado_por text not null default '',
  creado_en timestamptz not null default now()
);

-- 7) Soporte
create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  asunto text not null,
  estado text not null default 'abierto' check (estado in ('abierto', 'en_curso', 'resuelto', 'cerrado')),
  prioridad text not null default 'normal' check (prioridad in ('baja', 'normal', 'alta')),
  creado_por text not null default '',
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table if not exists ticket_mensajes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  autor_tipo text not null check (autor_tipo in ('empresa', 'admin')),
  autor_email text not null default '',
  mensaje text not null,
  creado_en timestamptz not null default now()
);

create table if not exists notas_internas (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  autor_email text not null default '',
  texto text not null,
  creado_en timestamptz not null default now()
);

-- 8) Moderación
create table if not exists reportes_perfil (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references negocios(id) on delete cascade,
  motivo text not null,
  detalle text,
  email_reportante text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'descartado', 'atendido')),
  resuelto_por text,
  creado_en timestamptz not null default now()
);

-- 9) Registro del sistema (webhooks, correos, errores)
create table if not exists registro_sistema (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('webhook', 'correo', 'error')),
  origen text not null,
  estado text not null check (estado in ('ok', 'error')),
  detalle text,
  payload jsonb,
  resuelto boolean not null default false,
  creado_en timestamptz not null default now()
);
create index if not exists registro_sistema_creado_idx on registro_sistema (creado_en desc);

-- 10) Reembolsos (registro manual)
create table if not exists reembolsos (
  id uuid primary key default gen_random_uuid(),
  reserva_id uuid not null references reservas(id) on delete cascade,
  negocio_id uuid not null references negocios(id) on delete cascade,
  monto_usd numeric not null check (monto_usd >= 0),
  motivo text not null default '',
  estado text not null default 'pendiente' check (estado in ('pendiente', 'completado')),
  creado_por text not null default '',
  creado_en timestamptz not null default now()
);

-- RLS activado sin políticas: solo accesible con la service role.
alter table perfiles enable row level security;
alter table planes enable row level security;
alter table auditoria enable row level security;
alter table configuracion_plataforma enable row level security;
alter table anuncios enable row level security;
alter table comunicados enable row level security;
alter table tickets enable row level security;
alter table ticket_mensajes enable row level security;
alter table notas_internas enable row level security;
alter table reportes_perfil enable row level security;
alter table registro_sistema enable row level security;
alter table reembolsos enable row level security;

-- Para el primer superadmin, define ADMIN_GLOBAL_EMAILS en el entorno o:
-- insert into perfiles (user_id, email, rol_admin)
-- values ('<uuid de auth.users>', 'tu@correo.com', 'superadmin')
-- on conflict (user_id) do update set rol_admin = 'superadmin';
