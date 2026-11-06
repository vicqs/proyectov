-- Supabase SQL Editor: ejecutar este archivo antes de seed.sql.
-- Esquema para un proyecto nuevo; no ejecutar las migraciones antiguas de docs/bd.
begin;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  admin_role text check (admin_role in ('superadmin', 'finanzas', 'soporte')),
  blocked boolean not null default false,
  sessions_revoked_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_usd numeric(12,2) not null check (price_usd >= 0),
  stripe_price_id text,
  active boolean not null default true,
  is_default boolean not null default false,
  flags jsonb not null default '{}'::jsonb check (jsonb_typeof(flags) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists plans_one_default_idx on public.plans (is_default) where is_default;

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references public.profiles(user_id) on delete restrict,
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9_-]{0,48}$'),
  iban text not null default '',
  contact_email text,
  description text,
  primary_color text check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text check (secondary_color is null or secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text,
  cover_url text,
  whatsapp text check (whatsapp is null or whatsapp = '' or whatsapp ~ '^[0-9]{8,15}$'),
  suspended boolean not null default false,
  suspension_reason text,
  deleted_at timestamptz,
  discount_pct numeric(5,2) not null default 0 check (discount_pct between 0 and 100),
  flags_override jsonb not null default '{}'::jsonb check (jsonb_typeof(flags_override) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete restrict,
  status text not null default 'prueba' check (status in ('activa', 'inactiva', 'prueba')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  trial_ends_at timestamptz,
  next_billing_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.platform_settings (
  id integer primary key default 1 check (id = 1),
  trial_days integer not null default 14 check (trial_days between 0 and 365),
  reserved_slugs text[] not null default '{}',
  max_schedule_capacity integer not null default 500 check (max_schedule_capacity between 1 and 10000),
  max_image_mb numeric(5,2) not null default 2 check (max_image_mb > 0 and max_image_mb <= 20),
  maintenance_mode boolean not null default false,
  maintenance_message text,
  simulated_payments_enabled boolean not null default false,
  flags jsonb not null default '{"reservas_publicas":true,"soporte_empresas":true,"reportes_publicos":true}'::jsonb,
  email_templates jsonb not null default '{}'::jsonb,
  terms_text text,
  privacy_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(flags) = 'object' and jsonb_typeof(email_templates) = 'object')
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  price_usd numeric(12,2) not null check (price_usd > 0),
  duration_min integer not null check (duration_min between 1 and 10080),
  description text,
  image_url text,
  cabys_code text not null default '9291200000000' check (cabys_code ~ '^[0-9]{13}$'),
  iva_rate numeric(6,5) not null default 0.13 check (iva_rate between 0 and 1),
  voucher_type text not null default 'TE' check (voucher_type in ('TE', 'FE')),
  client_id_type text check (client_id_type in ('fisica', 'juridica', 'dimex', 'nite', 'extranjero')),
  client_tax_id text,
  currency text not null default 'USD' check (currency in ('USD', 'CRC')),
  exchange_rate_bccr numeric(12,4) not null default 515 check (exchange_rate_bccr > 0),
  gateway_fee_rate numeric(7,6) not null default 0.0425 check (gateway_fee_rate between 0 and 1),
  subtotal_amount numeric(12,2) generated always as (round(price_usd / (1 + iva_rate), 2)) stored,
  iva_amount numeric(12,2) generated always as (price_usd - round(price_usd / (1 + iva_rate), 2)) stored,
  gross_amount numeric(12,2) generated always as (price_usd) stored,
  gateway_fee_amount numeric(12,2) generated always as (round(price_usd * gateway_fee_rate, 2)) stored,
  net_amount numeric(12,2) generated always as (price_usd - round(price_usd * gateway_fee_rate, 2)) stored,
  invoice_status text not null default 'pending' check (invoice_status in ('pending', 'issued')),
  invoice_consecutive text check (invoice_consecutive is null or invoice_consecutive ~ '^[0-9]{20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, business_id)
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  service_id uuid not null,
  starts_at timestamptz not null,
  capacity integer not null check (capacity between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.services(id, business_id) on delete cascade,
  unique (service_id, starts_at),
  unique (id, service_id, business_id)
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  service_id uuid not null,
  schedule_id uuid,
  starts_at timestamptz not null,
  client_email text not null,
  client_name text,
  quantity integer not null default 1 check (quantity between 1 and 50),
  management_token uuid unique default gen_random_uuid(),
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada', 'cancelada')),
  transaction_ref text unique,
  paid_amount_usd numeric(12,2) check (paid_amount_usd >= 0),
  cabys_code text not null check (cabys_code ~ '^[0-9]{13}$'),
  iva_rate numeric(6,5) not null check (iva_rate between 0 and 1),
  voucher_type text not null default 'TE' check (voucher_type in ('TE', 'FE')),
  client_id_type text check (client_id_type in ('fisica', 'juridica', 'dimex', 'nite', 'extranjero')),
  client_tax_id text,
  currency text not null default 'USD' check (currency in ('USD', 'CRC')),
  exchange_rate_bccr numeric(12,4) not null default 515 check (exchange_rate_bccr > 0),
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  gateway_fee_rate numeric(7,6) not null default 0.0425 check (gateway_fee_rate between 0 and 1),
  subtotal_amount numeric(12,2) generated always as (round(gross_amount / (1 + iva_rate), 2)) stored,
  iva_amount numeric(12,2) generated always as (gross_amount - round(gross_amount / (1 + iva_rate), 2)) stored,
  gateway_fee_amount numeric(12,2) generated always as (round(gross_amount * gateway_fee_rate, 2)) stored,
  net_amount numeric(12,2) generated always as (gross_amount - round(gross_amount * gateway_fee_rate, 2)) stored,
  invoice_status text not null default 'pending' check (invoice_status in ('pending', 'issued')),
  invoice_consecutive text check (invoice_consecutive is null or invoice_consecutive ~ '^[0-9]{20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.services(id, business_id) on delete restrict,
  foreign key (schedule_id, service_id, business_id) references public.schedules(id, service_id, business_id) on delete restrict,
  unique (id, business_id),
  check (voucher_type <> 'FE' or (nullif(btrim(client_name), '') is not null and client_id_type is not null and nullif(btrim(client_tax_id), '') is not null))
);
create unique index if not exists bookings_active_client_service_idx
  on public.bookings (service_id, lower(btrim(client_email))) where status <> 'cancelada';

create table if not exists public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete restrict,
  booking_id uuid unique,
  service_id uuid,
  service_date timestamptz not null,
  quantity integer not null default 1 check (quantity > 0),
  transaction_ref text not null unique,
  service_name text not null,
  cabys_code text not null check (cabys_code ~ '^[0-9]{13}$'),
  voucher_type text not null default 'TE' check (voucher_type in ('TE', 'FE')),
  client_email text not null,
  client_name text,
  client_id_type text check (client_id_type in ('fisica', 'juridica', 'dimex', 'nite', 'extranjero')),
  client_tax_id text,
  currency text not null default 'USD' check (currency in ('USD', 'CRC')),
  exchange_rate_bccr numeric(12,4) not null default 515 check (exchange_rate_bccr > 0),
  iva_rate numeric(6,5) not null check (iva_rate between 0 and 1),
  gross_amount numeric(12,2) not null check (gross_amount >= 0),
  gateway_fee_rate numeric(7,6) not null default 0.0425 check (gateway_fee_rate between 0 and 1),
  subtotal_amount numeric(12,2) generated always as (round(gross_amount / (1 + iva_rate), 2)) stored,
  iva_amount numeric(12,2) generated always as (gross_amount - round(gross_amount / (1 + iva_rate), 2)) stored,
  gateway_fee_amount numeric(12,2) generated always as (round(gross_amount * gateway_fee_rate, 2)) stored,
  net_amount numeric(12,2) generated always as (gross_amount - round(gross_amount * gateway_fee_rate, 2)) stored,
  invoice_status text not null default 'pending' check (invoice_status in ('pending', 'issued')),
  invoice_consecutive text check (invoice_consecutive is null or invoice_consecutive ~ '^[0-9]{20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (service_id, business_id) references public.services(id, business_id) on delete restrict,
  foreign key (booking_id, business_id) references public.bookings(id, business_id) on delete restrict,
  check (voucher_type <> 'FE' or (nullif(btrim(client_name), '') is not null and client_id_type is not null and nullif(btrim(client_tax_id), '') is not null))
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  subject text not null check (char_length(subject) between 4 and 150),
  status text not null default 'abierto' check (status in ('abierto', 'en_curso', 'resuelto', 'cerrado')),
  priority text not null default 'normal' check (priority in ('baja', 'normal', 'alta')),
  created_by uuid references public.profiles(user_id) on delete set null default auth.uid(),
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null default auth.uid(),
  author_type text not null check (author_type in ('empresa', 'admin')),
  author_email text not null default '',
  message text not null check (char_length(message) between 2 and 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_notes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  author_id uuid references public.profiles(user_id) on delete set null,
  author_email text not null default '',
  message text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_reports (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  reason text not null,
  detail text check (char_length(detail) <= 1000),
  reporter_email text,
  status text not null default 'pendiente' check (status in ('pendiente', 'descartado', 'atendido')),
  resolved_by uuid references public.profiles(user_id) on delete set null,
  resolved_by_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  message text not null,
  severity text not null default 'info' check (severity in ('info', 'aviso', 'critico')),
  segment text not null default 'todas' check (segment in ('todas', 'prueba', 'activa', 'inactiva')),
  active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_broadcasts (
  id uuid primary key default gen_random_uuid(),
  subject text not null,
  message text not null,
  segment text not null default 'todas' check (segment in ('todas', 'prueba', 'activa', 'inactiva')),
  recipients integer not null default 0 check (recipients >= 0),
  sent integer not null default 0 check (sent >= 0),
  failed integer not null default 0 check (failed >= 0),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sent + failed <= recipients)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(user_id) on delete set null,
  actor_email text not null default 'sistema',
  actor_role text not null default 'sistema',
  action text not null,
  entity text not null,
  entity_id text,
  business_id uuid references public.businesses(id) on delete set null,
  detail jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.system_logs (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('webhook', 'correo', 'error')),
  source text not null,
  status text not null check (status in ('ok', 'error')),
  detail text,
  payload jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique,
  business_id uuid not null references public.businesses(id) on delete restrict,
  amount_usd numeric(12,2) not null check (amount_usd >= 0),
  reason text not null default '',
  status text not null default 'pendiente' check (status in ('pendiente', 'completado')),
  created_by uuid references public.profiles(user_id) on delete set null,
  created_by_email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (booking_id, business_id) references public.bookings(id, business_id) on delete restrict
);

create index if not exists businesses_status_idx on public.businesses (suspended, deleted_at);
create index if not exists subscriptions_status_date_idx on public.subscriptions (status, next_billing_at);
create index if not exists subscriptions_plan_idx on public.subscriptions (plan_id);
create index if not exists services_business_idx on public.services (business_id);
create index if not exists schedules_business_date_idx on public.schedules (business_id, starts_at);
create index if not exists blocks_business_date_idx on public.blocks (business_id, ends_at);
create index if not exists bookings_business_status_date_idx on public.bookings (business_id, status, starts_at);
create index if not exists bookings_service_date_idx on public.bookings (service_id, starts_at);
create index if not exists bookings_active_slot_idx
  on public.bookings (service_id, starts_at) include (quantity) where status <> 'cancelada';
create index if not exists bookings_date_idx on public.bookings (starts_at);
create index if not exists financial_transactions_business_date_idx on public.financial_transactions (business_id, service_date);
create index if not exists financial_transactions_invoice_idx on public.financial_transactions (business_id, invoice_status);
create index if not exists support_tickets_business_status_date_idx on public.support_tickets (business_id, status, updated_at);
create index if not exists ticket_messages_ticket_date_idx on public.ticket_messages (ticket_id, created_at);
create index if not exists internal_notes_business_date_idx on public.internal_notes (business_id, created_at);
create index if not exists profile_reports_business_status_date_idx on public.profile_reports (business_id, status, created_at);
create index if not exists announcements_active_date_idx on public.announcements (active, expires_at);
create index if not exists email_broadcasts_date_idx on public.email_broadcasts (created_at desc);
create index if not exists audit_logs_business_date_idx on public.audit_logs (business_id, created_at desc);
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_id);
create index if not exists system_logs_status_date_idx on public.system_logs (status, created_at desc);
create index if not exists refunds_business_status_date_idx on public.refunds (business_id, status, created_at);
create unique index if not exists refunds_booking_idx on public.refunds (booking_id);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'profiles', 'plans', 'businesses', 'subscriptions', 'platform_settings',
    'services', 'schedules', 'blocks', 'bookings', 'financial_transactions',
    'support_tickets', 'ticket_messages', 'internal_notes', 'profile_reports',
    'announcements', 'email_broadcasts', 'audit_logs', 'system_logs', 'refunds'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t);
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end;
$$;

create or replace function public.sync_auth_profile()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, lower(new.email))
  on conflict (user_id) do update set email = excluded.email;
  if tg_op = 'UPDATE' then
    update public.businesses set contact_email = lower(new.email)
    where owner_id = new.id and (contact_email is null or lower(contact_email) = lower(old.email));
  end if;
  return new;
end;
$$;
drop trigger if exists vuki_sync_auth_profile on auth.users;
create trigger vuki_sync_auth_profile after insert or update of email on auth.users
  for each row when (new.email is not null) execute function public.sync_auth_profile();
insert into public.profiles (user_id, email)
select id, lower(email) from auth.users where email is not null
on conflict (user_id) do nothing;

create or replace function public.session_is_valid()
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.user_id
    where p.user_id = auth.uid() and not p.blocked
      and (p.sessions_revoked_since is null or u.last_sign_in_at > p.sessions_revoked_since)
  );
$$;

create or replace function public.owns_business(p_business_id uuid, p_operational boolean default false)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select public.session_is_valid() and exists (
    select 1 from public.businesses b
    where b.id = p_business_id and b.owner_id = auth.uid()
      and (
        not p_operational
        or (
          not b.suspended
          and b.deleted_at is null
          and not coalesce((select maintenance_mode from public.platform_settings where id = 1), false)
        )
      )
  );
$$;

create or replace function public.business_flag_enabled(p_business_id uuid, p_flag text)
returns boolean language sql stable security definer set search_path = pg_catalog, public as $$
  select coalesce((c.flags ->> p_flag)::boolean, true)
    and coalesce((b.flags_override ->> p_flag)::boolean, (p.flags ->> p_flag)::boolean, true)
  from public.businesses b
  join public.subscriptions s on s.business_id = b.id
  cross join public.platform_settings c
  left join public.plans p on p.id = coalesce(s.plan_id, (select id from public.plans where is_default))
  where b.id = p_business_id and c.id = 1;
$$;

create or replace function public.guard_business_update()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user in ('anon', 'authenticated') and
    row(new.owner_id, new.slug, new.suspended, new.suspension_reason, new.deleted_at, new.discount_pct, new.flags_override, new.created_at)
    is distinct from
    row(old.owner_id, old.slug, old.suspended, old.suspension_reason, old.deleted_at, old.discount_pct, old.flags_override, old.created_at)
  then
    raise exception 'Solo la administracion puede modificar los campos protegidos del negocio.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_business_update on public.businesses;
create trigger guard_business_update before update on public.businesses
  for each row execute function public.guard_business_update();

-- Las vistas conservan los nombres de dominio de TypeScript; RLS sigue aplicado
-- en las tablas inglesas gracias a security_invoker (PostgreSQL 15+).
create or replace view public.negocios with (security_invoker = true) as
select b.id, b.owner_id as user_id, b.name as nombre, b.slug, b.iban as cuenta_iban,
  b.description as descripcion, b.primary_color as color_tema, b.secondary_color as color_secundario,
  b.logo_url, b.cover_url as imagen_portada_url, b.whatsapp,
  s.status as estado_suscripcion, s.stripe_customer_id, b.suspended as suspendido,
  b.suspension_reason as motivo_suspension, b.deleted_at as eliminado_en, s.plan_id,
  b.discount_pct as descuento_pct, b.flags_override, s.trial_ends_at as prueba_hasta,
  s.next_billing_at as proximo_cobro, b.created_at as creado_en,
  b.contact_email as email_contacto
from public.businesses b join public.subscriptions s on s.business_id = b.id;

create or replace function public.write_negocios()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare v_id uuid; v_email text;
begin
  if tg_op = 'DELETE' then
    delete from public.businesses where id = old.id;
    return old;
  elsif tg_op = 'INSERT' then
    v_id := coalesce(new.id, gen_random_uuid());
    select email into v_email from public.profiles where user_id = new.user_id;
    insert into public.businesses (
      id, owner_id, name, slug, iban, contact_email, description, primary_color,
      secondary_color, logo_url, cover_url, whatsapp, suspended, suspension_reason,
      deleted_at, discount_pct, flags_override, created_at
    ) values (
      v_id, new.user_id, new.nombre, new.slug, coalesce(new.cuenta_iban, ''),
      coalesce(new.email_contacto, v_email), new.descripcion, new.color_tema,
      new.color_secundario, new.logo_url, new.imagen_portada_url, new.whatsapp,
      coalesce(new.suspendido, false), new.motivo_suspension, new.eliminado_en,
      coalesce(new.descuento_pct, 0), coalesce(new.flags_override, '{}'::jsonb),
      coalesce(new.creado_en, now())
    );
    insert into public.subscriptions (business_id, plan_id, status, stripe_customer_id, trial_ends_at, next_billing_at)
    values (v_id, new.plan_id, coalesce(new.estado_suscripcion, 'prueba'), new.stripe_customer_id, new.prueba_hasta, new.proximo_cobro);
    select * into new from public.negocios where id = v_id;
    return new;
  end if;

  if new.id is distinct from old.id then
    raise exception 'No se puede cambiar el identificador del negocio.' using errcode = '42501';
  end if;
  update public.businesses set
    owner_id = new.user_id, name = new.nombre, slug = new.slug, iban = new.cuenta_iban,
    contact_email = new.email_contacto, description = new.descripcion,
    primary_color = new.color_tema, secondary_color = new.color_secundario,
    logo_url = new.logo_url, cover_url = new.imagen_portada_url, whatsapp = new.whatsapp,
    suspended = new.suspendido, suspension_reason = new.motivo_suspension,
    deleted_at = new.eliminado_en, discount_pct = new.descuento_pct,
    flags_override = new.flags_override, created_at = new.creado_en
  where id = old.id;
  if row(new.plan_id, new.estado_suscripcion, new.stripe_customer_id, new.prueba_hasta, new.proximo_cobro)
    is distinct from row(old.plan_id, old.estado_suscripcion, old.stripe_customer_id, old.prueba_hasta, old.proximo_cobro)
  then
    update public.subscriptions set plan_id = new.plan_id, status = new.estado_suscripcion,
      stripe_customer_id = new.stripe_customer_id, trial_ends_at = new.prueba_hasta,
      next_billing_at = new.proximo_cobro
    where business_id = old.id;
  end if;
  return new;
end;
$$;
drop trigger if exists write_negocios on public.negocios;
create trigger write_negocios instead of insert or update or delete on public.negocios
  for each row execute function public.write_negocios();

create or replace view public.perfiles with (security_invoker = true) as
select user_id, email, admin_role as rol_admin, blocked as bloqueado,
  sessions_revoked_since as sesiones_revocadas_desde, created_at as creado_en from public.profiles;

create or replace view public.planes with (security_invoker = true) as
select id, name as nombre, price_usd as precio_usd, stripe_price_id, active as activo,
  is_default as por_defecto, flags, created_at as creado_en from public.plans;

create or replace view public.servicios with (security_invoker = true) as
select id, business_id as negocio_id, name as nombre, price_usd as precio_usd,
  duration_min as duracion_min, description as descripcion, image_url as imagen_url,
  cabys_code, iva_rate, voucher_type, client_id_type, client_tax_id, currency,
  exchange_rate_bccr, subtotal_amount, iva_amount, gross_amount, gateway_fee_rate,
  gateway_fee_amount, net_amount, invoice_status, invoice_consecutive from public.services;

create or replace view public.horarios with (security_invoker = true) as
select id, business_id as negocio_id, service_id as servicio_id, starts_at as fecha_hora,
  capacity as cupos_totales from public.schedules;

create or replace view public.bloqueos_excepcion with (security_invoker = true) as
select id, business_id as negocio_id, starts_at as fecha_inicio, ends_at as fecha_fin,
  reason as motivo from public.blocks;

create or replace view public.reservas with (security_invoker = true) as
select id, service_id as servicio_id, business_id as negocio_id, starts_at as fecha_hora,
  client_email as email_cliente, client_name as nombre_cliente, quantity as cupos,
  management_token as token_gestion, status as estado, transaction_ref as trx_id,
  paid_amount_usd as monto_usd, cabys_code, voucher_type, client_id_type, client_tax_id,
  currency, exchange_rate_bccr, iva_rate, invoice_status, invoice_consecutive,
  subtotal_amount, iva_amount, gross_amount, gateway_fee_rate, gateway_fee_amount, net_amount,
  schedule_id as horario_id, created_at as creado_en from public.bookings;

create or replace view public.transacciones_financieras with (security_invoker = true) as
select id, business_id as negocio_id, booking_id as reserva_id, service_id as servicio_id,
  service_date, quantity as cupos, transaction_ref, service_name, cabys_code, voucher_type,
  client_email, client_name, client_id_type, client_tax_id, currency, exchange_rate_bccr,
  iva_rate, subtotal_amount, iva_amount, gross_amount, gateway_fee_rate, gateway_fee_amount,
  net_amount, invoice_status, invoice_consecutive, created_at from public.financial_transactions;

create or replace view public.configuracion_plataforma with (security_invoker = true) as
select id, trial_days as dias_prueba, reserved_slugs as slugs_reservados,
  max_schedule_capacity as max_cupos_horario, max_image_mb as max_imagen_mb,
  maintenance_mode as modo_mantenimiento, maintenance_message as mensaje_mantenimiento,
  flags, email_templates as plantillas_correo, terms_text as terminos_texto,
  privacy_text as privacidad_texto, updated_at as actualizado_en,
  simulated_payments_enabled as pagos_simulados from public.platform_settings;

create or replace view public.anuncios with (security_invoker = true) as
select id, title as titulo, message as mensaje, severity as severidad, segment as segmento,
  active as activo, expires_at as expira_en, created_by_email as creado_por, created_at as creado_en
from public.announcements;

create or replace view public.comunicados with (security_invoker = true) as
select id, subject as asunto, message as mensaje, segment as segmento, recipients as destinatarios,
  sent as enviados, failed as fallidos, created_by_email as creado_por, created_at as creado_en
from public.email_broadcasts;

create or replace view public.tickets with (security_invoker = true) as
select id, business_id as negocio_id, subject as asunto, status as estado, priority as prioridad,
  created_by_email as creado_por, created_at as creado_en, updated_at as actualizado_en
from public.support_tickets;

create or replace view public.ticket_mensajes with (security_invoker = true) as
select id, ticket_id, author_type as autor_tipo, author_email as autor_email,
  message as mensaje, created_at as creado_en from public.ticket_messages;

create or replace view public.notas_internas with (security_invoker = true) as
select id, business_id as negocio_id, author_email as autor_email, message as texto,
  created_at as creado_en from public.internal_notes;

create or replace view public.reportes_perfil with (security_invoker = true) as
select id, business_id as negocio_id, reason as motivo, detail as detalle,
  reporter_email as email_reportante, status as estado, resolved_by_email as resuelto_por,
  created_at as creado_en from public.profile_reports;

create or replace view public.registro_sistema with (security_invoker = true) as
select id, type as tipo, source as origen, status as estado, detail as detalle,
  payload, resolved as resuelto, created_at as creado_en from public.system_logs;

create or replace view public.reembolsos with (security_invoker = true) as
select id, booking_id as reserva_id, business_id as negocio_id, amount_usd as monto_usd,
  reason as motivo, status as estado, created_by_email as creado_por, created_at as creado_en
from public.refunds;

create or replace view public.auditoria with (security_invoker = true) as
select id, coalesce(actor_id::text, 'sistema') as actor_id, actor_email, actor_role as actor_rol,
  action as accion, entity as entidad, entity_id as entidad_id, business_id as negocio_id,
  detail as detalle, created_at as creado_en from public.audit_logs;

create or replace function public.write_auditoria()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  new.id := coalesce(new.id, gen_random_uuid());
  new.creado_en := coalesce(new.creado_en, now());
  insert into public.audit_logs (id, actor_id, actor_email, actor_role, action, entity, entity_id, business_id, detail, created_at)
  values (
    new.id, nullif(new.actor_id, 'sistema')::uuid,
    new.actor_email, new.actor_rol, new.accion, new.entidad, new.entidad_id,
    new.negocio_id, new.detalle, new.creado_en
  );
  return new;
end;
$$;
drop trigger if exists write_auditoria on public.auditoria;
create trigger write_auditoria instead of insert on public.auditoria
  for each row execute function public.write_auditoria();

create or replace view public.booking_details with (security_invoker = true) as
select r.id, r.servicio_id, r.negocio_id, r.fecha_hora, r.email_cliente, r.nombre_cliente,
  r.cupos, r.token_gestion, r.estado, r.trx_id, r.monto_usd, r.cabys_code, r.voucher_type,
  r.client_id_type, r.client_tax_id, r.currency, r.exchange_rate_bccr, r.iva_rate,
  r.invoice_status, r.invoice_consecutive, r.subtotal_amount, r.iva_amount, r.gross_amount,
  r.gateway_fee_rate, r.gateway_fee_amount, r.net_amount, r.horario_id,
  s.name as servicio_nombre, s.price_usd as servicio_precio_usd,
  b.name as negocio_nombre, b.slug as negocio_slug, b.logo_url as negocio_logo_url,
  b.whatsapp as negocio_whatsapp, b.contact_email as negocio_email,
  false as pago_confirmado_ahora, r.creado_en
from public.reservas r join public.services s on s.id = r.servicio_id
join public.businesses b on b.id = r.negocio_id;

create or replace function public.cleanup_expired_pending_bookings(p_service_id uuid)
returns void language sql security definer set search_path = pg_catalog, public as $$
  update public.bookings set status = 'cancelada'
  where service_id = p_service_id and status = 'pendiente'
    and transaction_ref is null and created_at < now() - interval '30 minutes';
$$;

create or replace function public.guard_schedule_update()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_occupied integer; v_max_capacity integer;
begin
  select max_schedule_capacity into v_max_capacity from public.platform_settings where id = 1;
  if v_max_capacity is not null and new.capacity > v_max_capacity then
    raise exception 'Maximo % cupos por horario.', v_max_capacity using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' and new.starts_at <= now() then
      raise exception 'No puedes crear horarios en el pasado.' using errcode = '23514';
    end if;
    return new;
  end if;
  if row(new.business_id, new.service_id) is distinct from row(old.business_id, old.service_id) then
    raise exception 'No puedes cambiar el servicio o negocio de un horario existente.' using errcode = '23514';
  end if;
  select coalesce(sum(quantity), 0)::integer into v_occupied from public.bookings
  where (schedule_id = old.id or (service_id = old.service_id and starts_at = old.starts_at))
    and (status = 'pagada' or (status = 'pendiente' and (transaction_ref is not null or created_at >= now() - interval '30 minutes')));
  if new.starts_at is distinct from old.starts_at and v_occupied > 0 then
    raise exception 'No puedes cambiar la fecha u hora de un horario con reservas activas.' using errcode = '23514';
  end if;
  if new.capacity < v_occupied then
    raise exception 'La capacidad no puede ser menor a los cupos ya reservados (%).', v_occupied using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_schedule_update on public.schedules;
create trigger guard_schedule_update before insert or update on public.schedules
  for each row execute function public.guard_schedule_update();

create or replace function public.prepare_schedule_delete()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  perform public.cleanup_expired_pending_bookings(old.service_id);
  if exists (
    select 1 from public.bookings
    where (schedule_id = old.id or (service_id = old.service_id and starts_at = old.starts_at))
      and status <> 'cancelada'
  ) then
    raise exception 'No puedes eliminar un horario con reservas activas. Cancelalas primero.' using errcode = '23503';
  end if;
  update public.bookings set schedule_id = null
  where schedule_id = old.id and status = 'cancelada';
  return old;
end;
$$;
drop trigger if exists prepare_schedule_delete on public.schedules;
create trigger prepare_schedule_delete before delete on public.schedules
  for each row execute function public.prepare_schedule_delete();

create or replace function public.guard_block_write()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if exists (
    select 1 from public.bookings
    where business_id = new.business_id and starts_at between new.starts_at and new.ends_at
      and (status = 'pagada' or (status = 'pendiente' and (transaction_ref is not null or created_at >= now() - interval '30 minutes')))
  ) then
    raise exception 'Hay reservas activas en ese rango de fechas. Cancelalas primero.' using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_block_write on public.blocks;
create trigger guard_block_write before insert or update on public.blocks
  for each row execute function public.guard_block_write();

create or replace function public.prepare_booking()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare v_service public.services; v_slot public.schedules; v_occupied integer;
begin
  if tg_op = 'INSERT' then
    select * into strict v_service from public.services where id = new.service_id and business_id = new.business_id;
    new.client_email := lower(btrim(new.client_email));
    if current_user = 'authenticated' then
      new.cabys_code := v_service.cabys_code;
      new.iva_rate := v_service.iva_rate;
      new.gross_amount := v_service.price_usd * new.quantity;
      new.paid_amount_usd := case when new.status = 'pagada' then new.gross_amount else null end;
    else
      new.cabys_code := coalesce(new.cabys_code, v_service.cabys_code);
      new.iva_rate := coalesce(new.iva_rate, v_service.iva_rate);
      new.gross_amount := coalesce(new.gross_amount, v_service.price_usd * new.quantity);
      if new.status = 'pagada' then
        new.paid_amount_usd := coalesce(new.paid_amount_usd, new.gross_amount);
      end if;
    end if;
    select * into v_slot from public.schedules
    where service_id = new.service_id and starts_at = new.starts_at for update;
    new.schedule_id := coalesce(new.schedule_id, v_slot.id);
    perform public.cleanup_expired_pending_bookings(new.service_id);
  else
    if current_user = 'authenticated' and
      row(new.business_id, new.service_id, new.schedule_id, new.starts_at, new.client_email, new.quantity,
        new.management_token, new.transaction_ref, new.paid_amount_usd, new.gross_amount, new.iva_rate,
        new.cabys_code, new.exchange_rate_bccr, new.gateway_fee_rate, new.currency)
      is distinct from
      row(old.business_id, old.service_id, old.schedule_id, old.starts_at, old.client_email, old.quantity,
        old.management_token, old.transaction_ref, old.paid_amount_usd, old.gross_amount, old.iva_rate,
        old.cabys_code, old.exchange_rate_bccr, old.gateway_fee_rate, old.currency)
    then
      raise exception 'Solo se puede cancelar la reserva o actualizar su comprobante.' using errcode = '42501';
    end if;
    if current_user = 'authenticated' and new.status is distinct from old.status and new.status <> 'cancelada' then
      raise exception 'El pago debe confirmarse por el flujo autorizado.' using errcode = '42501';
    end if;
    if new.status = 'pagada' and old.status <> 'pagada' then
      new.paid_amount_usd := coalesce(new.paid_amount_usd, new.gross_amount);
    end if;
    if new.schedule_id is not null then
      select * into v_slot from public.schedules where id = new.schedule_id for update;
    end if;
  end if;
  if current_user = 'authenticated' and tg_op = 'INSERT' then
    if v_slot.id is null or v_slot.starts_at <= now() or exists (
      select 1 from public.blocks where business_id = new.business_id and new.starts_at between starts_at and ends_at
    ) then
      raise exception 'El horario no esta disponible.';
    end if;
    new.transaction_ref := coalesce(nullif(btrim(new.transaction_ref), ''), 'manual_' || gen_random_uuid()::text);
    if left(new.transaction_ref, 7) <> 'manual_' then
      raise exception 'Las reservas manuales requieren una referencia de pago manual.' using errcode = '42501';
    end if;
  end if;
  if new.status <> 'cancelada' and v_slot.id is not null then
    select coalesce(sum(quantity), 0)::integer into v_occupied from public.bookings
    where service_id = new.service_id and starts_at = new.starts_at and id <> new.id
      and (status = 'pagada' or (status = 'pendiente' and (transaction_ref is not null or created_at >= now() - interval '30 minutes')));
    if v_occupied + new.quantity > v_slot.capacity then
      raise exception 'El horario se agoto mientras reservabas.' using errcode = '23514';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists prepare_booking on public.bookings;
create trigger prepare_booking before insert or update on public.bookings
  for each row execute function public.prepare_booking();

create or replace function public.guard_refund_write()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.bookings; v_max numeric(12,2);
begin
  select * into v_booking from public.bookings
  where id = new.booking_id and business_id = new.business_id;
  if not found then
    raise exception 'La reserva asociada al reembolso no existe.' using errcode = 'P0002';
  end if;
  if v_booking.transaction_ref is null or left(v_booking.transaction_ref, 7) = 'manual_' then
    raise exception 'Solo se reembolsan reservas pagadas por pasarela.' using errcode = '23514';
  end if;
  v_max := coalesce(v_booking.paid_amount_usd, v_booking.gross_amount);
  if new.amount_usd > v_max + 0.01 then
    raise exception 'El reembolso no puede superar el monto pagado (% USD).', v_max using errcode = '23514';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_refund_write on public.refunds;
create trigger guard_refund_write before insert or update on public.refunds
  for each row execute function public.guard_refund_write();

-- Un pago conserva su tarifa y precio historicos; editar un servicio no los altera.
-- Si una reserva pagada por pasarela pasa a cancelada, registra el reembolso pendiente automaticamente.
create or replace function public.sync_booking_transaction()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.status = 'pagada' and new.transaction_ref is not null and left(new.transaction_ref, 7) <> 'manual_' then
    insert into public.financial_transactions (
      business_id, booking_id, service_id, service_date, quantity, transaction_ref, service_name,
      cabys_code, voucher_type, client_email, client_name, client_id_type, client_tax_id, currency,
      exchange_rate_bccr, iva_rate, gross_amount, gateway_fee_rate, invoice_status, invoice_consecutive
    )
    select new.business_id, new.id, new.service_id, new.starts_at, new.quantity, new.transaction_ref, s.name,
      new.cabys_code, new.voucher_type, new.client_email, new.client_name, new.client_id_type, new.client_tax_id,
      new.currency, new.exchange_rate_bccr, new.iva_rate, new.gross_amount, new.gateway_fee_rate,
      new.invoice_status, new.invoice_consecutive from public.services s where s.id = new.service_id
    on conflict (booking_id) do update set
      voucher_type = excluded.voucher_type, client_name = excluded.client_name,
      client_id_type = excluded.client_id_type, client_tax_id = excluded.client_tax_id,
      invoice_status = excluded.invoice_status, invoice_consecutive = excluded.invoice_consecutive;
  elsif new.status = 'cancelada' and new.transaction_ref is not null and left(new.transaction_ref, 7) <> 'manual_' then
    insert into public.refunds (booking_id, business_id, amount_usd, reason, status, created_by_email)
    values (
      new.id, new.business_id, coalesce(new.paid_amount_usd, new.gross_amount),
      'Cancelacion de reserva pagada por pasarela', 'pendiente',
      coalesce(nullif(auth.jwt() ->> 'email', ''), 'sistema')
    )
    on conflict (booking_id) do nothing;
  end if;
  return new;
end;
$$;
drop trigger if exists sync_booking_transaction on public.bookings;
create trigger sync_booking_transaction after insert or update on public.bookings
  for each row execute function public.sync_booking_transaction();

create or replace function public.guard_transaction_update()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if current_user = 'authenticated' and
    row(new.id, new.business_id, new.booking_id, new.service_id, new.service_date, new.quantity, new.transaction_ref,
      new.service_name, new.cabys_code, new.client_email, new.currency, new.exchange_rate_bccr,
      new.iva_rate, new.gross_amount, new.gateway_fee_rate, new.created_at)
    is distinct from
    row(old.id, old.business_id, old.booking_id, old.service_id, old.service_date, old.quantity, old.transaction_ref,
      old.service_name, old.cabys_code, old.client_email, old.currency, old.exchange_rate_bccr,
      old.iva_rate, old.gross_amount, old.gateway_fee_rate, old.created_at)
  then
    raise exception 'Los importes de una transaccion no se pueden editar.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_transaction_update on public.financial_transactions;
create trigger guard_transaction_update before update on public.financial_transactions
  for each row execute function public.guard_transaction_update();

create or replace function public.sync_transaction_invoice()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if new.booking_id is not null then
    update public.bookings set voucher_type = new.voucher_type, client_name = new.client_name,
      client_id_type = new.client_id_type, client_tax_id = new.client_tax_id,
      invoice_status = new.invoice_status, invoice_consecutive = new.invoice_consecutive
    where id = new.booking_id and
      row(voucher_type, client_name, client_id_type, client_tax_id, invoice_status, invoice_consecutive)
      is distinct from row(new.voucher_type, new.client_name, new.client_id_type, new.client_tax_id, new.invoice_status, new.invoice_consecutive);
  end if;
  return new;
end;
$$;
drop trigger if exists sync_transaction_invoice on public.financial_transactions;
create trigger sync_transaction_invoice after update on public.financial_transactions
  for each row execute function public.sync_transaction_invoice();

create or replace function public.guard_ticket_update()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
begin
  if tg_op = 'INSERT' then
    if current_user = 'authenticated' and (
      select count(*) from public.support_tickets
      where business_id = new.business_id and status in ('abierto', 'en_curso')
    ) >= 10 then
      raise exception 'Tienes demasiados tickets abiertos. Espera la respuesta de soporte.' using errcode = '23514';
    end if;
    return new;
  end if;
  if current_user = 'authenticated' and (
    row(new.id, new.business_id, new.subject, new.priority, new.created_by, new.created_by_email, new.created_at)
    is distinct from
    row(old.id, old.business_id, old.subject, old.priority, old.created_by, old.created_by_email, old.created_at)
    or (new.status is distinct from old.status and new.status <> 'abierto')
  ) then
    raise exception 'Solo soporte puede modificar los campos protegidos del ticket.' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_ticket_update on public.support_tickets;
create trigger guard_ticket_update before insert or update on public.support_tickets
  for each row execute function public.guard_ticket_update();

create or replace function public.touch_ticket()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  update public.support_tickets set updated_at = now(),
    status = case when new.author_type = 'empresa' and status in ('resuelto', 'cerrado') then 'abierto' else status end
  where id = new.ticket_id and (
    updated_at < new.created_at or (new.author_type = 'empresa' and status in ('resuelto', 'cerrado'))
  );
  return new;
end;
$$;
drop trigger if exists touch_ticket on public.ticket_messages;
create trigger touch_ticket after insert on public.ticket_messages
  for each row execute function public.touch_ticket();

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select to authenticated using (user_id = auth.uid());
drop policy if exists businesses_owner_read on public.businesses;
create policy businesses_owner_read on public.businesses for select to authenticated using (public.owns_business(id));
drop policy if exists businesses_owner_update on public.businesses;
create policy businesses_owner_update on public.businesses for update to authenticated
  using (public.owns_business(id, true)) with check (owner_id = auth.uid());
drop policy if exists subscriptions_owner_read on public.subscriptions;
create policy subscriptions_owner_read on public.subscriptions for select to authenticated using (public.owns_business(business_id));
drop policy if exists plans_public_read on public.plans;
create policy plans_public_read on public.plans for select to anon, authenticated using (true);
drop policy if exists settings_public_read on public.platform_settings;
create policy settings_public_read on public.platform_settings for select to anon, authenticated using (id = 1);

do $$
declare t text;
begin
  foreach t in array array['services', 'schedules', 'blocks'] loop
    execute format('drop policy if exists owner_read on public.%I', t);
    execute format('create policy owner_read on public.%I for select to authenticated using (public.owns_business(business_id))', t);
    execute format('drop policy if exists owner_insert on public.%I', t);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check (public.owns_business(business_id, true))', t);
    execute format('drop policy if exists owner_update on public.%I', t);
    execute format('create policy owner_update on public.%I for update to authenticated using (public.owns_business(business_id, true)) with check (public.owns_business(business_id, true))', t);
    execute format('drop policy if exists owner_delete on public.%I', t);
    execute format('create policy owner_delete on public.%I for delete to authenticated using (public.owns_business(business_id, true))', t);
  end loop;
end;
$$;
drop policy if exists bookings_owner_read on public.bookings;
create policy bookings_owner_read on public.bookings for select to authenticated using (public.owns_business(business_id));
drop policy if exists bookings_owner_insert on public.bookings;
create policy bookings_owner_insert on public.bookings for insert to authenticated with check (public.owns_business(business_id, true));
drop policy if exists bookings_owner_update on public.bookings;
create policy bookings_owner_update on public.bookings for update to authenticated
  using (public.owns_business(business_id, true)) with check (public.owns_business(business_id, true));
drop policy if exists transactions_owner_read on public.financial_transactions;
create policy transactions_owner_read on public.financial_transactions for select to authenticated using (public.owns_business(business_id));
drop policy if exists transactions_owner_update on public.financial_transactions;
create policy transactions_owner_update on public.financial_transactions for update to authenticated
  using (public.owns_business(business_id, true)) with check (public.owns_business(business_id, true));

drop policy if exists tickets_owner_read on public.support_tickets;
create policy tickets_owner_read on public.support_tickets for select to authenticated using (public.owns_business(business_id));
drop policy if exists tickets_owner_insert on public.support_tickets;
create policy tickets_owner_insert on public.support_tickets for insert to authenticated with check (
  public.owns_business(business_id, true) and public.business_flag_enabled(business_id, 'soporte_empresas')
  and created_by = auth.uid() and lower(created_by_email) = lower(auth.jwt() ->> 'email')
);
drop policy if exists tickets_owner_update on public.support_tickets;
create policy tickets_owner_update on public.support_tickets for update to authenticated
  using (public.owns_business(business_id, true)) with check (public.owns_business(business_id, true));
drop policy if exists messages_owner_read on public.ticket_messages;
create policy messages_owner_read on public.ticket_messages for select to authenticated using (
  exists (select 1 from public.support_tickets t where t.id = ticket_id and public.owns_business(t.business_id))
);
drop policy if exists messages_owner_insert on public.ticket_messages;
create policy messages_owner_insert on public.ticket_messages for insert to authenticated with check (
  author_type = 'empresa' and author_id = auth.uid() and lower(author_email) = lower(auth.jwt() ->> 'email')
  and exists (
    select 1 from public.support_tickets t
    where t.id = ticket_id and public.owns_business(t.business_id, true)
      and public.business_flag_enabled(t.business_id, 'soporte_empresas')
  )
);
drop policy if exists announcements_owner_read on public.announcements;
create policy announcements_owner_read on public.announcements for select to authenticated using (
  public.session_is_valid() and active and (expires_at is null or expires_at > now())
  and exists (
    select 1 from public.businesses b join public.subscriptions s on s.business_id = b.id
    where b.owner_id = auth.uid() and b.deleted_at is null
      and (segment = 'todas' or segment = case when s.status = 'prueba' and (s.trial_ends_at is null or s.trial_ends_at <= now()) then 'inactiva' else s.status end)
  )
);
drop policy if exists audit_owner_insert on public.audit_logs;
create policy audit_owner_insert on public.audit_logs for insert to authenticated with check (
  actor_id = auth.uid() and actor_role = 'empresa' and public.owns_business(business_id)
  and lower(actor_email) = lower(auth.jwt() ->> 'email')
);
drop policy if exists refunds_owner_read on public.refunds;
create policy refunds_owner_read on public.refunds for select to authenticated using (public.owns_business(business_id));

grant select on public.profiles, public.businesses, public.subscriptions, public.refunds to authenticated;
grant update on public.businesses to authenticated;
grant select on public.plans, public.platform_settings to anon, authenticated;
grant select, insert, update, delete on public.services, public.schedules, public.blocks to authenticated;
grant select, insert, update on public.bookings, public.support_tickets to authenticated;
grant select, update on public.financial_transactions to authenticated;
grant select, insert on public.ticket_messages to authenticated;
grant select on public.announcements to authenticated;
grant insert on public.audit_logs to authenticated;

do $$
declare v text;
begin
  foreach v in array array[
    'negocios', 'perfiles', 'planes', 'servicios', 'horarios', 'bloqueos_excepcion',
    'reservas', 'transacciones_financieras', 'configuracion_plataforma', 'anuncios',
    'comunicados', 'tickets', 'ticket_mensajes', 'notas_internas', 'reportes_perfil',
    'registro_sistema', 'reembolsos', 'auditoria', 'booking_details'
  ] loop
    execute format('revoke all on public.%I from anon, authenticated', v);
    execute format('grant all on public.%I to service_role', v);
  end loop;
end;
$$;
grant select on public.negocios, public.perfiles, public.booking_details, public.reembolsos to authenticated;
grant update on public.negocios to authenticated;
grant select on public.planes, public.configuracion_plataforma to anon, authenticated;
grant select, insert, update, delete on public.servicios, public.horarios, public.bloqueos_excepcion to authenticated;
grant select, insert, update on public.reservas, public.tickets to authenticated;
grant select, update on public.transacciones_financieras to authenticated;
grant select, insert on public.ticket_mensajes to authenticated;
grant select on public.anuncios to authenticated;
grant insert on public.auditoria to authenticated;

-- RPC publicas: proyecciones sin IBAN, roles, tokens ajenos ni datos de otros turistas.
create or replace function public.get_public_business(p_slug text)
returns table (
  id uuid, nombre text, slug text, descripcion text, color_tema text, color_secundario text,
  logo_url text, imagen_portada_url text, whatsapp text, estado_suscripcion text,
  prueba_hasta timestamptz, suspendido boolean, eliminado_en timestamptz,
  plan_id uuid, descuento_pct numeric, flags_override jsonb
) language sql stable security definer set search_path = pg_catalog, public as $$
  select b.id, b.name, b.slug, b.description, b.primary_color, b.secondary_color,
    b.logo_url, b.cover_url, b.whatsapp, s.status, s.trial_ends_at, b.suspended,
    b.deleted_at, s.plan_id, b.discount_pct, b.flags_override
  from public.businesses b join public.subscriptions s on s.business_id = b.id
  where b.slug = lower(p_slug) and b.deleted_at is null;
$$;

create or replace function public.get_public_services(p_business_id uuid)
returns table (
  id uuid, negocio_id uuid, nombre text, precio_usd numeric, duracion_min integer,
  descripcion text, imagen_url text, cabys_code text, iva_rate numeric
) language sql stable security definer set search_path = pg_catalog, public as $$
  select s.id, s.business_id, s.name, s.price_usd, s.duration_min, s.description,
    s.image_url, s.cabys_code, s.iva_rate from public.services s
  join public.businesses b on b.id = s.business_id
  where b.id = p_business_id and not b.suspended and b.deleted_at is null
  order by s.created_at, s.id;
$$;

create or replace function public.get_public_availability(p_business_id uuid)
returns table (id uuid, servicio_id uuid, fecha_hora timestamptz, cupos_totales integer, cupos_ocupados integer)
language sql stable security definer set search_path = pg_catalog, public as $$
  select h.id, h.service_id, h.starts_at, h.capacity,
    (select coalesce(sum(r.quantity), 0)::integer from public.bookings r
      where r.service_id = h.service_id and r.starts_at = h.starts_at
        and (r.status = 'pagada' or (r.status = 'pendiente' and (r.transaction_ref is not null or r.created_at >= now() - interval '30 minutes'))))
  from public.schedules h join public.businesses b on b.id = h.business_id
  where b.id = p_business_id and not b.suspended and b.deleted_at is null and h.starts_at > now()
    and not exists (select 1 from public.blocks x where x.business_id = b.id and h.starts_at between x.starts_at and x.ends_at)
  order by h.starts_at, h.id;
$$;

create or replace function public.get_booking_by_token(p_token uuid)
returns setof public.booking_details language sql stable security definer set search_path = pg_catalog, public as $$
  select * from public.booking_details where token_gestion = p_token;
$$;

create or replace function public.create_public_booking(
  p_service_id uuid, p_starts_at timestamptz, p_client_email text,
  p_client_name text default null, p_quantity integer default 1
) returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_service public.services; v_business public.businesses; v_subscription public.subscriptions;
  v_settings public.platform_settings; v_slot public.schedules; v_id uuid;
begin
  if p_quantity is null or p_quantity not between 1 and 50 or p_starts_at is null or p_client_email is null or
    p_client_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or
    char_length(p_client_email) > 254 or char_length(p_client_name) > 100
  then raise exception 'Datos de reserva invalidos.' using errcode = '22023'; end if;
  select * into v_service from public.services where id = p_service_id;
  if not found then raise exception 'Servicio no encontrado.' using errcode = 'P0002'; end if;
  select * into v_business from public.businesses where id = v_service.business_id;
  select * into strict v_settings from public.platform_settings where id = 1;
  select * into strict v_subscription from public.subscriptions where business_id = v_business.id;
  if v_settings.maintenance_mode then
    raise exception '%', coalesce(v_settings.maintenance_message, 'La plataforma esta en mantenimiento.');
  end if;
  if not coalesce(public.business_flag_enabled(v_business.id, 'reservas_publicas'), false) or v_business.suspended or
    v_business.deleted_at is not null or v_subscription.status = 'inactiva' or
    (v_subscription.status = 'prueba' and (v_subscription.trial_ends_at is null or v_subscription.trial_ends_at <= now()))
  then raise exception 'Este negocio no acepta reservas por ahora.'; end if;
  select * into v_slot from public.schedules where service_id = p_service_id and starts_at = p_starts_at for update;
  if not found or v_slot.starts_at <= now() or exists (
    select 1 from public.blocks where business_id = v_business.id and p_starts_at between starts_at and ends_at
  ) then raise exception 'El horario ya no esta disponible.'; end if;
  -- Liberar checkouts abandonados (> 30 min sin pago) para no bloquear cupos ni el correo del turista.
  update public.bookings set status = 'cancelada'
  where service_id = p_service_id and status = 'pendiente'
    and transaction_ref is null and created_at < now() - interval '30 minutes';
  insert into public.bookings (business_id, service_id, schedule_id, starts_at, client_email, client_name, quantity)
  values (v_business.id, p_service_id, v_slot.id, p_starts_at, lower(btrim(p_client_email)), nullif(btrim(p_client_name), ''), p_quantity)
  returning id into v_id;
  return query select * from public.booking_details where id = v_id;
exception when unique_violation then
  raise exception 'Este correo ya tiene una reserva para este servicio.' using errcode = '23505';
end;
$$;

create or replace function public.cancel_public_booking(p_token uuid)
returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.bookings;
begin
  select * into v_booking from public.bookings where management_token = p_token for update;
  if not found then raise exception 'No se encontro la reserva.' using errcode = 'P0002'; end if;
  if v_booking.status = 'cancelada' then raise exception 'Esta reserva ya estaba cancelada.'; end if;
  if v_booking.status <> 'pendiente' and v_booking.starts_at < now() + interval '24 hours' then
    raise exception 'Solo puedes cancelar con 24 horas de anticipacion. Contacta al negocio.';
  end if;
  update public.bookings set status = 'cancelada' where id = v_booking.id;
  return query select * from public.booking_details where id = v_booking.id;
end;
$$;

create or replace function public.create_simulated_booking(
  p_service_id uuid, p_starts_at timestamptz, p_client_email text,
  p_client_name text default null, p_quantity integer default 1
) returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.booking_details;
begin
  if not coalesce((select simulated_payments_enabled from public.platform_settings where id = 1), false) then
    raise exception 'Los pagos simulados estan deshabilitados.' using errcode = '42501';
  end if;
  select * into strict v_booking from public.create_public_booking(
    p_service_id, p_starts_at, p_client_email, p_client_name, p_quantity
  );
  return query select * from public.complete_simulated_booking(v_booking.token_gestion);
end;
$$;

create or replace function public.complete_simulated_booking(p_token uuid)
returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.bookings; v_business public.businesses; v_settings public.platform_settings;
  v_details public.booking_details; v_changed boolean;
begin
  select * into strict v_settings from public.platform_settings where id = 1;
  if v_settings.maintenance_mode then
    raise exception '%', coalesce(v_settings.maintenance_message, 'La plataforma esta en mantenimiento.');
  end if;
  if not coalesce(v_settings.simulated_payments_enabled, false) then
    raise exception 'Los pagos simulados estan deshabilitados.' using errcode = '42501';
  end if;
  select * into v_booking from public.bookings where management_token = p_token for update;
  if not found then raise exception 'No se encontro la reserva.' using errcode = 'P0002'; end if;
  if v_booking.status = 'cancelada' then raise exception 'La reserva fue cancelada.'; end if;
  v_changed := v_booking.status = 'pendiente';
  if v_changed then
    select * into v_business from public.businesses where id = v_booking.business_id;
    if not found or v_business.suspended or v_business.deleted_at is not null then
      raise exception 'Este negocio no acepta reservas por ahora.';
    end if;
    if v_booking.starts_at <= now() then
      raise exception 'El horario de esta reserva ya paso.';
    end if;
    update public.bookings set status = 'pagada', transaction_ref = 'trx_sim_' || gen_random_uuid()::text,
      paid_amount_usd = gross_amount where id = v_booking.id;
  end if;
  select * into strict v_details from public.booking_details where id = v_booking.id;
  v_details.pago_confirmado_ahora := v_changed;
  return next v_details;
end;
$$;

-- Solo service_role puede confirmar eventos que el servidor ya verifico.
create or replace function public.record_gateway_payment(p_booking_id uuid, p_status text, p_transaction_ref text default null)
returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.bookings; v_details public.booking_details; v_changed boolean := false;
begin
  if p_status is null or p_status not in ('pendiente', 'pagada', 'cancelada') or
    (p_status = 'pagada' and (p_transaction_ref is null or btrim(p_transaction_ref) = '' or left(p_transaction_ref, 7) = 'manual_'))
  then raise exception 'Datos de pago invalidos.' using errcode = '22023'; end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Reserva no encontrada.' using errcode = 'P0002'; end if;
  if v_booking.status = 'cancelada' then
    if p_status = 'cancelada' then
      select * into strict v_details from public.booking_details where id = v_booking.id;
      v_details.pago_confirmado_ahora := false;
      return next v_details;
    end if;
    raise exception 'La reserva fue cancelada.';
  end if;
  if v_booking.status = 'pagada' then
    if p_status = 'cancelada' then
      raise exception 'No se puede cancelar por webhook una reserva ya pagada; usa el flujo de reembolso.' using errcode = '23514';
    end if;
    if p_status = 'pagada' and v_booking.transaction_ref is distinct from p_transaction_ref then
      raise exception 'La reserva ya tiene otra referencia de pago.' using errcode = '23505';
    end if;
  else
    v_changed := p_status = 'pagada';
    update public.bookings set status = p_status,
      transaction_ref = coalesce(nullif(btrim(p_transaction_ref), ''), transaction_ref),
      paid_amount_usd = case when p_status = 'pagada' then gross_amount else paid_amount_usd end
    where id = v_booking.id;
  end if;
  select * into strict v_details from public.booking_details where id = v_booking.id;
  v_details.pago_confirmado_ahora := v_changed;
  return next v_details;
end;
$$;

create or replace function public.set_simulated_subscription(p_business_id uuid, p_active boolean)
returns setof public.negocios language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if p_active is null then raise exception 'Estado invalido.' using errcode = '22023'; end if;
  if not public.owns_business(p_business_id, true) then
    raise exception 'No tienes acceso a este negocio.' using errcode = '42501';
  end if;
  if not coalesce((select simulated_payments_enabled from public.platform_settings where id = 1), false) then
    raise exception 'Las suscripciones simuladas estan deshabilitadas.' using errcode = '42501';
  end if;
  update public.subscriptions set status = case when p_active then 'activa' else 'inactiva' end,
    stripe_customer_id = case when p_active then 'mock_cus_' || p_business_id::text else stripe_customer_id end,
    next_billing_at = case when not p_active then next_billing_at
      when status = 'prueba' and trial_ends_at > now() then trial_ends_at else now() + interval '30 days' end
  where business_id = p_business_id;
  return query select * from public.negocios where id = p_business_id;
end;
$$;

create or replace function public.register_profile_report(p_slug text, p_reason text, p_detail text default null, p_email text default null)
returns uuid language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_business public.businesses; v_id uuid;
begin
  if p_reason is null or p_reason not in ('contenido', 'fraude', 'suplantacion', 'otro') or
    char_length(p_detail) > 1000 or (p_email is not null and
      (char_length(p_email) > 254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'))
  then raise exception 'Datos invalidos.' using errcode = '22023'; end if;
  if (select maintenance_mode from public.platform_settings where id = 1) then
    raise exception 'Los reportes estan deshabilitados por ahora.' using errcode = '42501';
  end if;
  select * into v_business from public.businesses where slug = lower(p_slug) and not suspended and deleted_at is null for update;
  if not found then raise exception 'Negocio no encontrado.' using errcode = 'P0002'; end if;
  if not coalesce(public.business_flag_enabled(v_business.id, 'reportes_publicos'), false) then
    raise exception 'Los reportes estan deshabilitados por ahora.' using errcode = '42501';
  end if;
  if (select count(*) from public.profile_reports where business_id = v_business.id
      and status = 'pendiente' and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Este perfil ya recibio varios reportes recientes. Gracias.';
  end if;
  insert into public.profile_reports (business_id, reason, detail, reporter_email)
  values (v_business.id, p_reason, nullif(btrim(p_detail), ''), nullif(btrim(p_email), '')) returning id into v_id;
  return v_id;
end;
$$;

-- Revocar el EXECUTE implicito de PUBLIC: solo se publican las capacidades necesarias.
do $$
declare f record;
begin
  for f in select p.oid::regprocedure as signature from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(array[
      'set_updated_at', 'sync_auth_profile', 'session_is_valid', 'owns_business',
      'business_flag_enabled', 'guard_business_update', 'write_negocios', 'write_auditoria',
      'cleanup_expired_pending_bookings', 'guard_schedule_update', 'prepare_schedule_delete',
      'guard_block_write', 'prepare_booking', 'guard_refund_write', 'sync_booking_transaction',
      'guard_transaction_update', 'sync_transaction_invoice', 'guard_ticket_update', 'touch_ticket',
      'get_public_business', 'get_public_services', 'get_public_availability', 'get_booking_by_token',
      'create_public_booking', 'create_simulated_booking', 'cancel_public_booking', 'complete_simulated_booking',
      'record_gateway_payment', 'set_simulated_subscription', 'register_profile_report'
    ])
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.signature);
    execute format('grant execute on function %s to service_role', f.signature);
  end loop;
end;
$$;
grant execute on function public.session_is_valid(), public.owns_business(uuid, boolean), public.business_flag_enabled(uuid, text),
  public.cleanup_expired_pending_bookings(uuid), public.set_simulated_subscription(uuid, boolean) to authenticated;
grant execute on function public.get_public_business(text), public.get_public_services(uuid),
  public.get_public_availability(uuid), public.get_booking_by_token(uuid),
  public.create_public_booking(uuid, timestamptz, text, text, integer),
  public.create_simulated_booking(uuid, timestamptz, text, text, integer),
  public.cancel_public_booking(uuid), public.complete_simulated_booking(uuid),
  public.register_profile_report(text, text, text, text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('negocios-media', 'negocios-media', true, 20971520, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists vuki_media_public_read on storage.objects;
create policy vuki_media_public_read on storage.objects for select to anon, authenticated using (bucket_id = 'negocios-media');
drop policy if exists vuki_media_owner_insert on storage.objects;
create policy vuki_media_owner_insert on storage.objects for insert to authenticated with check (
  bucket_id = 'negocios-media'
  and coalesce((storage.objects.metadata ->> 'size')::bigint, 0) <= coalesce((select (max_image_mb * 1048576)::bigint from public.platform_settings where id = 1), 20971520)
  and exists (
    select 1 from public.businesses b where b.id::text = (storage.foldername(storage.objects.name))[1] and public.owns_business(b.id, true)
  )
);
drop policy if exists vuki_media_owner_update on storage.objects;
create policy vuki_media_owner_update on storage.objects for update to authenticated using (
  bucket_id = 'negocios-media' and exists (
    select 1 from public.businesses b where b.id::text = (storage.foldername(storage.objects.name))[1] and public.owns_business(b.id, true)
  )
) with check (
  bucket_id = 'negocios-media'
  and coalesce((storage.objects.metadata ->> 'size')::bigint, 0) <= coalesce((select (max_image_mb * 1048576)::bigint from public.platform_settings where id = 1), 20971520)
  and exists (
    select 1 from public.businesses b where b.id::text = (storage.foldername(storage.objects.name))[1] and public.owns_business(b.id, true)
  )
);
drop policy if exists vuki_media_owner_delete on storage.objects;
create policy vuki_media_owner_delete on storage.objects for delete to authenticated using (
  bucket_id = 'negocios-media' and exists (
    select 1 from public.businesses b where b.id::text = (storage.foldername(storage.objects.name))[1] and public.owns_business(b.id, true)
  )
);

notify pgrst, 'reload schema';
commit;
