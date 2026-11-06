-- Solo demostracion: los datos son los de lib/mock/data.ts.
-- Ejecutar despues de schema.sql. No contiene contrasenas locales ni claves API.
-- Las seis cuentas Auth reciben claves aleatorias desconocidas; establecerlas
-- posteriormente desde Supabase Auth. Reejecutar no cambia sus contrasenas.
begin;
set local timezone = 'America/Costa_Rica';

create temporary table vuki_seed_clock on commit drop as
select now() as anchor, not exists (
  select 1 from public.businesses where id = '11111111-1111-4111-8111-111111111111'
) as first_seed;

create temporary table vuki_seed_users (
  id uuid primary key, email text not null, admin_role text, last_login_minutes integer
) on commit drop;
insert into vuki_seed_users values
  ('00000000-0000-4000-8000-000000000001', 'demo@vuki.cr', null, 1692),
  ('00000000-0000-4000-8000-000000000002', 'kayak@vuki.cr', null, 4715),
  ('00000000-0000-4000-8000-000000000003', 'cafe@vuki.cr', null, 7865),
  ('00000000-0000-4000-8000-000000000004', 'coraliasurfandbeachstyle@gmail.com', null, 120),
  ('00000000-0000-4000-8000-000000000101', 'admin@vuki.cr', 'superadmin', 14),
  ('00000000-0000-4000-8000-000000000102', 'finanzas@vuki.cr', 'finanzas', 198),
  ('00000000-0000-4000-8000-000000000103', 'soporte@vuki.cr', 'soporte', 42);

do $$
begin
  if exists (
    select 1 from auth.users u join vuki_seed_users s on lower(u.email) = s.email where u.id <> s.id
  ) then
    raise exception 'Ya existe una cuenta demo con otro UUID. Vincular sus IDs antes de ejecutar el seed; no se sobrescriben cuentas existentes.';
  end if;
end;
$$;

create temporary table vuki_seed_new_users (id uuid primary key) on commit drop;
with inserted as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select '00000000-0000-0000-0000-000000000000'::uuid, s.id, 'authenticated', 'authenticated',
    s.email, extensions.crypt(gen_random_uuid()::text, extensions.gen_salt('bf')),
    c.anchor, c.anchor - make_interval(mins => s.last_login_minutes),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '2026-01-15T12:00:00Z'::timestamptz, c.anchor, '', '', '', ''
  from vuki_seed_users s cross join vuki_seed_clock c
  on conflict (id) do nothing returning id
) insert into vuki_seed_new_users select id from inserted;

update public.profiles p set admin_role = s.admin_role, created_at = '2026-01-15T12:00:00Z'
from vuki_seed_users s join vuki_seed_new_users n on n.id = s.id where p.user_id = s.id;

insert into auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), s.id::text, s.id,
  jsonb_build_object('sub', s.id::text, 'email', s.email, 'email_verified', true, 'phone_verified', false),
  'email', c.anchor - make_interval(mins => s.last_login_minutes),
  '2026-01-15T12:00:00Z'::timestamptz, c.anchor
from vuki_seed_users s cross join vuki_seed_clock c
on conflict (provider_id, provider) do nothing;

insert into public.plans (id, name, price_usd, stripe_price_id, active, is_default)
values ('55555555-5555-4555-8555-555555555555', 'Plan vuki', 15, null, true, true)
on conflict (id) do nothing;

insert into public.businesses (
  id, owner_id, name, slug, whatsapp, iban, contact_email, description, primary_color, secondary_color, logo_url, cover_url, currency, created_at
)
select '11111111-1111-4111-8111-111111111111'::uuid, '00000000-0000-4000-8000-000000000001'::uuid,
  'Escuela de Surf Pura Vida', 'surf-tamarindo', '50688887777', 'CR00000000000000000000', 'demo@vuki.cr',
  'Clases de surf para todos los niveles frente a la playa. ¡Reserva tu cupo!', '#0284c7', '#0284c7', null, null, 'USD', anchor - interval '20 days'
from vuki_seed_clock
union all
select '11111111-1111-4111-8111-111111111112'::uuid, '00000000-0000-4000-8000-000000000002'::uuid,
  'Kayak Manglar Tours', 'kayak-manglar', '50688887777', 'CR11111111111111111111', 'kayak@vuki.cr',
  'Paseos en kayak por el manglar al amanecer.', '#059669', '#059669', null, null, 'USD', anchor - interval '60 days'
from vuki_seed_clock
union all
select '11111111-1111-4111-8111-111111111113'::uuid, '00000000-0000-4000-8000-000000000003'::uuid,
  'Tour de Café Monteverde', 'cafe-monteverde', '50688887777', 'CR22222222222222222222', 'cafe@vuki.cr',
  'Del grano a la taza: recorrido por una finca cafetalera.', '#b45309', null, null, null, 'USD', anchor - interval '90 days'
from vuki_seed_clock
union all
select '11111111-1111-4111-8111-111111111114'::uuid, '00000000-0000-4000-8000-000000000004'::uuid,
  'Coralia CR', 'coralia', '50685667363', 'CR28015202001327568368', 'coraliasurfandbeachstyle@gmail.com',
  E'Emprendimiento costarricense desde la Costa Pacífica de Guanacaste 🪸🌴🌊🧜🏽‍♀️\n\n🪸 Por favor ingresa la dirección completa con número de teléfono, provincia, cantón y distrito.\n🐚 También se puede enviar directamente a una sucursal de Correos de Costa Rica.\n🌊 Los envíos se hacen los viernes por medio de Correos de Costa Rica. El tiempo estimado de entrega es de 2-5 días hábiles. 🧜🏽‍♀️',
  '#1ba39c', '#10625e',
  'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/logo-coralia.jpg',
  'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/portada-playa-guanacaste.jpg',
  'CRC',
  anchor - interval '10 days'
from vuki_seed_clock
on conflict (id) do nothing;

insert into public.subscriptions (id, business_id, status, stripe_customer_id, trial_ends_at, next_billing_at)
select '99999999-9999-4999-8999-999999999991'::uuid, '11111111-1111-4111-8111-111111111111'::uuid,
  'prueba', null, anchor + interval '14 days', null::timestamptz from vuki_seed_clock
union all
select '99999999-9999-4999-8999-999999999992'::uuid, '11111111-1111-4111-8111-111111111112'::uuid,
  'activa', 'mock_cus_kayak', null, '2026-12-03T12:00:00Z'::timestamptz from vuki_seed_clock
union all
select '99999999-9999-4999-8999-999999999993'::uuid, '11111111-1111-4111-8111-111111111113'::uuid,
  'inactiva', null, null, null from vuki_seed_clock
union all
select '99999999-9999-4999-8999-999999999994'::uuid, '11111111-1111-4111-8111-111111111114'::uuid,
  'activa', 'mock_cus_coralia', null, '2026-12-06T12:00:00Z'::timestamptz from vuki_seed_clock
on conflict (business_id) do nothing;

insert into public.services (id, business_id, name, description, image_url, price_usd, currency, exchange_rate_bccr, duration_min, cabys_code, iva_rate, unit_type, stock) values
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'Clase de surf 1h', null, null, 45, 'USD', 515, 60, '9291200000000', 0.13, 'cupo', null),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Alquiler de tabla (día completo)', null, null, 20, 'USD', 515, 480, '7324001000000', 0.13, 'cupo', null),
  ('22222222-2222-4222-8222-222222222223', '11111111-1111-4111-8111-111111111112', 'Kayak al amanecer', null, null, 35, 'USD', 515, 120, '8554000000000', 0.04, 'cupo', null),
  ('22222222-2222-4222-8222-222222222224', '11111111-1111-4111-8111-111111111113', 'Tour de café', null, null, 30, 'USD', 515, 150, '8554000000000', 0.04, 'cupo', null),
  ('22222222-2222-4222-8222-222222222231', '11111111-1111-4111-8111-111111111114', 'Arete circular de Mimbre trenzado', 'Fibra Natural (mimbre) · Arete circular mediano. Material: mimbre. Color: Fibra natural.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-arete-mimbre.jpg', 2000, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222232', '11111111-1111-4111-8111-111111111114', 'Aretes Coralia', 'Arete artesanal Coralia · Forma: Espiral boho. Color: Dorado.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-aretes-coralia.jpg', 1600, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222233', '11111111-1111-4111-8111-111111111114', 'Aretes Coralito Serpiente', 'Un par · Aretes tipo Stud. Color: Dorado. Material: Acero inoxidable.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-aretes-coralito-serpiente.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222234', '11111111-1111-4111-8111-111111111114', 'Pulsera Costa Rica', 'Unisex · Pulsera artesanal. Materiales: Fibra natural de Caña Flecha.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-pulsera-costa-rica.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222235', '11111111-1111-4111-8111-111111111114', 'Pulsera Espiral', 'Unisex · Pulsera color café con detalles en naranja, verde y amarillo. Fibra natural de Caña Flecha.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-pulsera-espiral.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222236', '11111111-1111-4111-8111-111111111114', 'Pulsera Rasta', 'Unisex · Pulsera artesanal en fibra natural de Caña Flecha.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-pulsera-rasta.jpg', 3000, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222237', '11111111-1111-4111-8111-111111111114', 'Pulsera Surfista', 'Pulsera Surfista de Mujer · Pulsera colorida elaborada con concha de coco.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-pulsera-surfista.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222238', '11111111-1111-4111-8111-111111111114', 'Triángulo minimalista', 'Un par · Arete triangular tipo Stud. Color: Dorado. Material: Acero inoxidable.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-triangulo-minimalista.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12),
  ('22222222-2222-4222-8222-222222222239', '11111111-1111-4111-8111-111111111114', 'Arete Lunar (cachito de luna) studs', 'Un par · Tipo Stud. Color: Dorado. Material: Acero inoxidable.', 'https://voxfysjdqaixmzegvmds.supabase.co/storage/v1/object/public/negocios-media/11111111-1111-4111-8111-111111111114/servicio-arete-lunar-studs.jpg', 2500, 'CRC', 1, 0, '9291200000000', 0.13, 'item', 12)
on conflict (id) do nothing;

insert into public.schedules (id, business_id, service_id, starts_at, capacity)
select ('44444444-4444-4444-8444-' || lpad(v.n::text, 12, '0'))::uuid, v.business_id::uuid, v.service_id::uuid,
  ((anchor at time zone 'America/Costa_Rica')::date + v.days + v.hour::time) at time zone 'America/Costa_Rica', 6
from vuki_seed_clock cross join (values
  (1, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 0, '09:00'),
  (2, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 0, '14:00'),
  (3, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 1, '08:00'),
  (4, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 1, '11:00'),
  (5, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 1, '15:00'),
  (6, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222221', 2, '09:00'),
  (7, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 1, '09:00'),
  (8, '11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', 2, '09:00'),
  (9, '11111111-1111-4111-8111-111111111112', '22222222-2222-4222-8222-222222222223', 3, '06:00')
) as v(n, business_id, service_id, days, hour)
on conflict (id) do nothing;

insert into public.bookings (
  id, service_id, business_id, starts_at, client_email, client_name, quantity, management_token,
  status, transaction_ref, paid_amount_usd, cabys_code, voucher_type, client_id_type, client_tax_id,
  currency, exchange_rate_bccr, iva_rate, invoice_status, invoice_consecutive
)
select '33333333-3333-4333-8333-333333333333'::uuid, '22222222-2222-4222-8222-222222222221'::uuid,
  '11111111-1111-4111-8111-111111111111'::uuid, anchor - interval '2 days',
  'turista.demo@example.com', null, 1, null::uuid, 'pagada', 'trx_mock_demo_1', 45,
  '9291200000000', 'TE', null, null, 'USD', 515, 0.13, 'pending', null from vuki_seed_clock
union all
select '33333333-3333-4333-8333-333333333334'::uuid, '22222222-2222-4222-8222-222222222223'::uuid,
  '11111111-1111-4111-8111-111111111112'::uuid, anchor + interval '3 days',
  'viajera@example.com', 'Viajera Demo', 2, null::uuid, 'pagada', 'trx_mock_demo_2', 70,
  '8554000000000', 'FE', 'fisica', '1-1189-0452', 'USD', 515, 0.04, 'issued', '00100001010000000014'
from vuki_seed_clock
union all
select '33333333-3333-4333-8333-333333333335'::uuid, '22222222-2222-4222-8222-222222222223'::uuid,
  '11111111-1111-4111-8111-111111111112'::uuid, anchor - interval '2 days',
  'pendiente@example.com', null, 1, null::uuid, 'pendiente', null, null,
  '8554000000000', 'TE', null, null, 'USD', 515, 0.04, 'pending', null
from vuki_seed_clock
on conflict (id) do nothing;

update public.financial_transactions set id = '88888888-8888-4888-8888-888888888881'
where booking_id = '33333333-3333-4333-8333-333333333333' and id <> '88888888-8888-4888-8888-888888888881';
update public.financial_transactions set id = '88888888-8888-4888-8888-888888888882'
where booking_id = '33333333-3333-4333-8333-333333333334' and id <> '88888888-8888-4888-8888-888888888882';

insert into public.support_tickets (id, business_id, subject, status, priority, created_by, created_by_email, created_at, updated_at)
select '66666666-6666-4666-8666-666666666661'::uuid, '11111111-1111-4111-8111-111111111112'::uuid,
  'No puedo subir mi logo', 'abierto', 'normal', '00000000-0000-4000-8000-000000000002'::uuid,
  'kayak@vuki.cr', anchor - interval '1 day', anchor - interval '1 day' from vuki_seed_clock
on conflict (id) do nothing;

insert into public.ticket_messages (id, ticket_id, author_id, author_type, author_email, message, created_at)
select '66666666-6666-4666-8666-666666666662'::uuid, '66666666-6666-4666-8666-666666666661'::uuid,
  '00000000-0000-4000-8000-000000000002'::uuid, 'empresa', 'kayak@vuki.cr',
  'Al subir el logo aparece un error. ¿Pueden revisarlo?', anchor - interval '1 day' from vuki_seed_clock
on conflict (id) do nothing;

insert into public.profile_reports (id, business_id, reason, detail, reporter_email, status, created_at)
select '77777777-7777-4777-8777-777777777771'::uuid, '11111111-1111-4111-8111-111111111113'::uuid,
  'Información engañosa', 'El precio publicado no coincide con el cobrado.', 'cliente@example.com',
  'pendiente', anchor - interval '3 days' from vuki_seed_clock
on conflict (id) do nothing;

update public.platform_settings set simulated_payments_enabled = true
where id = 1;

-- Los mocks de blocks, announcements, email_broadcasts, audit_logs,
-- internal_notes, system_logs y refunds estan vacios: no se inventan filas.
commit;
