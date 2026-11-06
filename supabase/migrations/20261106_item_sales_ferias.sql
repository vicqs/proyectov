-- Migración: Salidas rápidas, ferias y venta de ítems con control de stock en tiempo real
-- Aplica soporte para unit_type ('cupo' | 'item') y stock en public.services y public.bookings

alter table public.services add column if not exists unit_type text not null default 'cupo' check (unit_type in ('cupo', 'item'));
alter table public.services add column if not exists stock integer check (stock is null or (stock between 0 and 100000));
alter table public.services drop constraint if exists services_duration_min_check;
alter table public.services add constraint services_duration_min_check check (duration_min between 0 and 10080);

-- Actualizar índice único de reservas para permitir compras múltiples de ítems y ventas sin horario
drop index if exists public.bookings_active_client_service_idx;
create unique index if not exists bookings_active_client_schedule_idx
  on public.bookings (schedule_id, lower(btrim(client_email)))
  where status <> 'cancelada' and schedule_id is not null and btrim(client_email) <> '';

-- Vista public.servicios
create or replace view public.servicios with (security_invoker = true) as
select id, business_id as negocio_id, name as nombre, price_usd as precio_usd,
  duration_min as duracion_min, description as descripcion, image_url as imagen_url,
  cabys_code, iva_rate, voucher_type, client_id_type, client_tax_id, currency,
  exchange_rate_bccr, subtotal_amount, iva_amount, gross_amount, gateway_fee_rate,
  gateway_fee_amount, net_amount, invoice_status, invoice_consecutive,
  unit_type, stock from public.services;

-- Vista public.booking_details
create or replace view public.booking_details with (security_invoker = true) as
select r.id, r.servicio_id, r.negocio_id, r.fecha_hora, r.email_cliente, r.nombre_cliente,
  r.cupos, r.token_gestion, r.estado, r.trx_id, r.monto_usd, r.cabys_code, r.voucher_type,
  r.client_id_type, r.client_tax_id, r.currency, r.exchange_rate_bccr, r.iva_rate,
  r.invoice_status, r.invoice_consecutive, r.subtotal_amount, r.iva_amount, r.gross_amount,
  r.gateway_fee_rate, r.gateway_fee_amount, r.net_amount, r.horario_id,
  s.name as servicio_nombre, s.price_usd as servicio_precio_usd,
  b.name as negocio_nombre, b.slug as negocio_slug, b.logo_url as negocio_logo_url,
  b.whatsapp as negocio_whatsapp, b.contact_email as negocio_email,
  false as pago_confirmado_ahora, r.creado_en,
  s.currency as servicio_currency, b.currency as negocio_moneda,
  s.unit_type as servicio_tipo_unidad
from public.reservas r join public.services s on s.id = r.servicio_id
join public.businesses b on b.id = r.negocio_id;

-- Triggers y validaciones
create or replace function public.guard_schedule_update()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_occupied integer; v_max_capacity integer; v_unit_type text;
begin
  select max_schedule_capacity into v_max_capacity from public.platform_settings where id = 1;
  if v_max_capacity is not null and new.capacity > v_max_capacity then
    raise exception 'Maximo % cupos por horario.', v_max_capacity using errcode = '23514';
  end if;
  select unit_type into v_unit_type from public.services where id = new.service_id;
  if v_unit_type = 'item' then
    raise exception 'Los servicios por ítems no utilizan horarios.' using errcode = '23514';
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

create or replace function public.guard_block_write()
returns trigger language plpgsql security definer set search_path = pg_catalog, public as $$
begin
  if exists (
    select 1 from public.bookings
    where business_id = new.business_id and schedule_id is not null and starts_at between new.starts_at and new.ends_at
      and (status = 'pagada' or (status = 'pendiente' and (transaction_ref is not null or created_at >= now() - interval '30 minutes')))
  ) then
    raise exception 'Hay reservas activas en ese rango de fechas. Cancelalas primero.' using errcode = '23514';
  end if;
  return new;
end;
$$;

create or replace function public.prepare_booking()
returns trigger language plpgsql set search_path = pg_catalog, public as $$
declare v_service public.services; v_slot public.schedules; v_occupied integer;
begin
  if tg_op = 'INSERT' then
    select * into strict v_service from public.services where id = new.service_id and business_id = new.business_id for update;
    new.client_email := lower(btrim(coalesce(new.client_email, '')));
    if current_user = 'authenticated' then
      new.currency := coalesce(nullif(upper(btrim(new.currency)), ''), v_service.currency);
      new.exchange_rate_bccr := public.default_exchange_rate_bccr(new.currency);
      new.cabys_code := v_service.cabys_code;
      new.iva_rate := v_service.iva_rate;
      new.gross_amount := public.convert_currency_amount(v_service.price_usd * new.quantity, v_service.currency, new.currency);
      new.paid_amount_usd := case when new.status = 'pagada' then new.gross_amount else null end;
    else
      new.currency := coalesce(nullif(upper(btrim(new.currency)), ''), v_service.currency);
      new.exchange_rate_bccr := coalesce(new.exchange_rate_bccr, public.default_exchange_rate_bccr(new.currency));
      new.cabys_code := coalesce(new.cabys_code, v_service.cabys_code);
      new.iva_rate := coalesce(new.iva_rate, v_service.iva_rate);
      new.gross_amount := coalesce(
        new.gross_amount,
        public.convert_currency_amount(v_service.price_usd * new.quantity, v_service.currency, new.currency)
      );
      if new.status = 'pagada' then
        new.paid_amount_usd := coalesce(new.paid_amount_usd, new.gross_amount);
      end if;
    end if;

    if v_service.unit_type = 'item' then
      new.schedule_id := null;
      new.starts_at := coalesce(new.starts_at, now());
      if coalesce(v_service.stock, 0) < new.quantity then
        raise exception 'Stock insuficiente para este ítem.' using errcode = '23514';
      end if;
      update public.services set stock = stock - new.quantity where id = v_service.id;
      if current_user = 'authenticated' then
        new.transaction_ref := coalesce(nullif(btrim(new.transaction_ref), ''), 'manual_' || gen_random_uuid()::text);
        if left(new.transaction_ref, 7) <> 'manual_' then
          raise exception 'Las reservas manuales requieren una referencia de pago manual.' using errcode = '42501';
        end if;
      end if;
    else
      select * into v_slot from public.schedules
      where service_id = new.service_id and starts_at = new.starts_at for update;
      new.schedule_id := coalesce(new.schedule_id, v_slot.id);
      perform public.cleanup_expired_pending_bookings(new.service_id);

      if current_user = 'authenticated' then
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
    end if;

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

    if old.status <> 'cancelada' and new.status = 'cancelada' then
      if old.schedule_id is null then
        update public.services set stock = least(100000, coalesce(stock, 0) + old.quantity) where id = old.service_id;
      end if;
    end if;

    if new.schedule_id is not null then
      select * into v_slot from public.schedules where id = new.schedule_id for update;
    end if;
  end if;
  return new;
end;
$$;

-- Funciones RPC públicas
drop function if exists public.get_public_services(uuid);
create or replace function public.get_public_services(p_business_id uuid)
returns table (
  id uuid, negocio_id uuid, nombre text, precio_usd numeric, duracion_min integer,
  descripcion text, imagen_url text, cabys_code text, iva_rate numeric, currency text,
  unit_type text, stock integer
) language sql stable security definer set search_path = pg_catalog, public as $$
  select s.id, s.business_id, s.name, s.price_usd, s.duration_min, s.description,
    s.image_url, s.cabys_code, s.iva_rate, s.currency, s.unit_type, s.stock from public.services s
  join public.businesses b on b.id = s.business_id
  where b.id = p_business_id and not b.suspended and b.deleted_at is null
  order by s.created_at, s.id;
$$;

drop function if exists public.create_public_booking(uuid, timestamptz, text, text, integer, text);
drop function if exists public.create_public_booking(uuid, timestamptz, text, text, integer);
create or replace function public.create_public_booking(
  p_service_id uuid, p_starts_at timestamptz default null, p_client_email text default null,
  p_client_name text default null, p_quantity integer default 1, p_currency text default null
) returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_service public.services; v_business public.businesses; v_subscription public.subscriptions;
  v_settings public.platform_settings; v_slot public.schedules; v_id uuid;
  v_currency text; v_rate numeric(12,4); v_gross numeric(12,2);
begin
  if p_quantity is null or p_quantity not between 1 and 50 or p_client_email is null or
    p_client_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' or
    char_length(p_client_email) > 254 or char_length(p_client_name) > 100
  then raise exception 'Datos de reserva invalidos.' using errcode = '22023'; end if;
  select * into v_service from public.services where id = p_service_id;
  if not found then raise exception 'Servicio no encontrado.' using errcode = 'P0002'; end if;
  if v_service.unit_type = 'cupo' and p_starts_at is null then
    raise exception 'Debes seleccionar un horario.' using errcode = '22023';
  end if;
  v_currency := coalesce(nullif(upper(btrim(p_currency)), ''), v_service.currency);
  if v_currency not in ('USD', 'CRC', 'CAD', 'EUR', 'GBP') then
    raise exception 'Moneda no soportada.' using errcode = '22023';
  end if;
  v_rate := public.default_exchange_rate_bccr(v_currency);
  v_gross := public.convert_currency_amount(v_service.price_usd * p_quantity, v_service.currency, v_currency);
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
  
  if v_service.unit_type = 'item' then
    if coalesce(v_service.stock, 0) < p_quantity then
      raise exception 'No hay suficiente stock disponible para este ítem.' using errcode = '23514';
    end if;
    p_starts_at := coalesce(p_starts_at, now());
    v_slot := null;
  else
    select * into v_slot from public.schedules where service_id = p_service_id and starts_at = p_starts_at for update;
    if not found or v_slot.starts_at <= now() or exists (
      select 1 from public.blocks where business_id = v_business.id and p_starts_at between starts_at and ends_at
    ) then raise exception 'El horario ya no esta disponible.'; end if;
  end if;

  -- Liberar checkouts abandonados (> 30 min sin pago) para no bloquear cupos ni el correo del turista.
  update public.bookings set status = 'cancelada'
  where service_id = p_service_id and status = 'pendiente'
    and transaction_ref is null and created_at < now() - interval '30 minutes';
  insert into public.bookings (
    business_id, service_id, schedule_id, starts_at, client_email, client_name, quantity,
    currency, exchange_rate_bccr, gross_amount
  )
  values (
    v_business.id, p_service_id, case when v_service.unit_type = 'item' then null else v_slot.id end,
    p_starts_at, lower(btrim(p_client_email)), nullif(btrim(p_client_name), ''), p_quantity,
    v_currency, v_rate, v_gross
  )
  returning id into v_id;
  return query select * from public.booking_details where id = v_id;
exception when unique_violation then
  raise exception 'Este correo ya tiene una reserva para este horario.' using errcode = '23505';
end;
$$;

drop function if exists public.create_simulated_booking(uuid, timestamptz, text, text, integer, text);
drop function if exists public.create_simulated_booking(uuid, timestamptz, text, text, integer);
create or replace function public.create_simulated_booking(
  p_service_id uuid, p_starts_at timestamptz default null, p_client_email text default null,
  p_client_name text default null, p_quantity integer default 1, p_currency text default null
) returns setof public.booking_details language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_booking public.booking_details;
begin
  if not coalesce((select simulated_payments_enabled from public.platform_settings where id = 1), false) then
    raise exception 'Los pagos simulados estan deshabilitados.' using errcode = '42501';
  end if;
  select * into strict v_booking from public.create_public_booking(
    p_service_id, p_starts_at, p_client_email, p_client_name, p_quantity, p_currency
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
    if v_booking.schedule_id is not null and v_booking.starts_at <= now() then
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

grant execute on function public.get_public_services(uuid),
  public.create_public_booking(uuid, timestamptz, text, text, integer, text),
  public.create_simulated_booking(uuid, timestamptz, text, text, integer, text),
  public.complete_simulated_booking(uuid) to anon, authenticated;

-- Actualizar productos artesanos existentes de Coralia CR a tipo ítem con stock 12
update public.services
set unit_type = 'item', stock = coalesce(stock, 12), duration_min = 0
where business_id = '11111111-1111-4111-8111-111111111114'
  and id in (
    '22222222-2222-4222-8222-222222222231',
    '22222222-2222-4222-8222-222222222232',
    '22222222-2222-4222-8222-222222222233',
    '22222222-2222-4222-8222-222222222234',
    '22222222-2222-4222-8222-222222222235',
    '22222222-2222-4222-8222-222222222236',
    '22222222-2222-4222-8222-222222222237',
    '22222222-2222-4222-8222-222222222238',
    '22222222-2222-4222-8222-222222222239'
  );

-- Eliminar horarios futuros innecesarios que hayan sido creados para estos ítems de Coralia
delete from public.schedules
where business_id = '11111111-1111-4111-8111-111111111114'
  and service_id in (
    '22222222-2222-4222-8222-222222222231',
    '22222222-2222-4222-8222-222222222232',
    '22222222-2222-4222-8222-222222222233',
    '22222222-2222-4222-8222-222222222234',
    '22222222-2222-4222-8222-222222222235',
    '22222222-2222-4222-8222-222222222236',
    '22222222-2222-4222-8222-222222222237',
    '22222222-2222-4222-8222-222222222238',
    '22222222-2222-4222-8222-222222222239'
  )
  and not exists (
    select 1 from public.bookings b where b.schedule_id = schedules.id and b.status <> 'cancelada'
  );
