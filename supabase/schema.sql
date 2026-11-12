-- Parle & Sip French, culture, creativity and connection experiences on Supabase.
-- Run once in Supabase SQL Editor. The app must use Supabase Auth/RPC before this is live.

begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  username text,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists username text;
update public.profiles set username = coalesce(nullif(username, ''), email) where username is null or username = '';
create unique index if not exists profiles_username_unique_idx on public.profiles (lower(username)) where username is not null;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null default '',
  host_name text not null default '',
  category text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  schedule_precision text not null default 'datetime' check (schedule_precision in ('tbd', 'month', 'datetime')),
  venue_name text not null default '',
  address text not null default '',
  area text not null default '',
  language_tags text[] not null default '{}',
  main_image_url text not null default '',
  listing_label text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.events add column if not exists schedule_precision text not null default 'datetime';
alter table public.events drop constraint if exists events_schedule_precision_check;
alter table public.events add constraint events_schedule_precision_check
  check (schedule_precision in ('tbd', 'month', 'datetime'));
alter table public.events alter column starts_at drop not null;

create table if not exists public.event_images (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (event_id, image_url)
);

create table if not exists public.ticket_tiers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null,
  description text not null default '',
  price_ngn numeric(12, 2) not null check (price_ngn >= 0),
  capacity integer check (capacity is null or capacity >= 0),
  quantity_sold integer not null default 0 check (quantity_sold >= 0),
  currency_code text not null default 'NGN' check (currency_code = 'NGN'),
  sales_start_at timestamptz,
  sales_end_at timestamptz,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, name)
);

create table if not exists public.ticket_orders (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique default (
    'PAS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  event_id uuid not null references public.events (id) on delete restrict,
  buyer_user_id uuid references auth.users (id) on delete set null,
  buyer_name text not null,
  buyer_email text not null,
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled', 'expired', 'refunded')),
  currency_code text not null default 'NGN' check (currency_code = 'NGN'),
  subtotal_ngn numeric(12, 2) not null default 0 check (subtotal_ngn >= 0),
  expires_at timestamptz not null default (now() + interval '15 minutes'),
  payment_reference text unique,
  paid_at timestamptz,
  amount_paid_kobo integer,
  email_status text not null default 'pending' check (email_status in ('pending', 'sending', 'sent', 'failed')),
  email_sent_at timestamptz,
  email_claimed_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ticket_orders add column if not exists paid_at timestamptz;
alter table public.ticket_orders add column if not exists amount_paid_kobo integer;
alter table public.ticket_orders add column if not exists email_status text not null default 'pending';
alter table public.ticket_orders add column if not exists email_sent_at timestamptz;
alter table public.ticket_orders add column if not exists email_claimed_at timestamptz;
alter table public.ticket_orders add column if not exists email_error text;
alter table public.ticket_orders drop constraint if exists ticket_orders_email_status_check;
alter table public.ticket_orders add constraint ticket_orders_email_status_check
  check (email_status in ('pending', 'sending', 'sent', 'failed'));

create table if not exists public.ticket_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ticket_orders (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  ticket_tier_id uuid references public.ticket_tiers (id) on delete set null,
  ticket_name text not null,
  quantity integer not null check (quantity > 0 and quantity <= 6),
  unit_price_ngn numeric(12, 2) not null check (unit_price_ngn >= 0),
  line_total_ngn numeric(12, 2) generated always as (quantity * unit_price_ngn) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.ticket_codes (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.ticket_orders (id) on delete cascade,
  order_item_id uuid not null references public.ticket_order_items (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete restrict,
  ticket_number integer not null check (ticket_number > 0),
  ticket_code text not null unique,
  ticket_name text not null,
  status text not null default 'issued' check (status in ('issued', 'checked_in', 'cancelled')),
  checked_in_at timestamptz,
  checked_in_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (order_id, ticket_number)
);

create table if not exists public.site_settings (
  setting_key text primary key default 'main' check (setting_key = 'main'),
  content jsonb not null default '{}'::jsonb,
  theme jsonb not null default '{}'::jsonb,
  logo_url text not null default '',
  favicon_url text not null default '',
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

-- Community RSVP / "Join our community" submissions (replaces Google Form)
create table if not exists public.community_rsvps (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  ticket_name text not null,
  whatsapp text not null,
  learning_french text not null,
  french_level text not null,
  motivations text[] not null default '{}',
  motivations_other text not null default '',
  hoping_to_gain text[] not null default '{}',
  hoping_to_gain_other text not null default '',
  expecting_most text not null default '',
  allergies text not null default '',
  heard_from text not null,
  heard_from_other text not null default '',
  following_social text not null,
  created_at timestamptz not null default now()
);

create index if not exists community_rsvps_created_idx
  on public.community_rsvps (created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'parle-sip-media',
  'parle-sip-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/svg+xml']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create index if not exists events_public_listing_idx
  on public.events (status, starts_at);
create index if not exists event_images_gallery_idx
  on public.event_images (event_id, sort_order);
create index if not exists ticket_tiers_event_idx
  on public.ticket_tiers (event_id, is_active, sort_order);
create index if not exists ticket_orders_buyer_idx
  on public.ticket_orders (buyer_user_id, created_at desc);
create index if not exists ticket_orders_event_idx
  on public.ticket_orders (event_id, created_at desc);
create index if not exists ticket_order_items_order_idx
  on public.ticket_order_items (order_id);
create index if not exists ticket_codes_event_status_idx
  on public.ticket_codes (event_id, status);
create index if not exists ticket_codes_order_idx
  on public.ticket_codes (order_id, ticket_number);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at before update on public.events
for each row execute function public.set_updated_at();

drop trigger if exists ticket_tiers_set_updated_at on public.ticket_tiers;
create trigger ticket_tiers_set_updated_at before update on public.ticket_tiers
for each row execute function public.set_updated_at();

drop trigger if exists ticket_orders_set_updated_at on public.ticket_orders;
create trigger ticket_orders_set_updated_at before update on public.ticket_orders
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, username)
  values (new.id, new.email, coalesce(nullif(new.raw_user_meta_data ->> 'username', ''), new.email))
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(profiles.username, excluded.username);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

insert into public.profiles (id, email, username)
select id, email, email from auth.users
on conflict (id) do update set
  email = excluded.email,
  username = coalesce(profiles.username, excluded.username);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.release_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.status = 'pending' and new.status in ('cancelled', 'expired', 'refunded') then
    update public.ticket_tiers as tiers
    set quantity_sold = greatest(0, tiers.quantity_sold - items.quantity)
    from (
      select ticket_tier_id, sum(quantity)::integer as quantity
      from public.ticket_order_items
      where order_id = old.id and ticket_tier_id is not null
      group by ticket_tier_id
    ) as items
    where items.ticket_tier_id = tiers.id;
  end if;
  return new;
end;
$$;

drop trigger if exists ticket_orders_release_inventory on public.ticket_orders;
create trigger ticket_orders_release_inventory
after update of status on public.ticket_orders
for each row execute function public.release_order_inventory();

create or replace function public.create_ticket_order(
  p_event_id uuid,
  p_buyer_name text,
  p_buyer_email text,
  p_items jsonb
)
returns table (
  order_id uuid,
  public_reference text,
  subtotal_ngn numeric(12, 2),
  currency_code text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event public.events%rowtype;
  v_tier public.ticket_tiers%rowtype;
  v_item jsonb;
  v_tier_id uuid;
  v_quantity integer;
  v_total_quantity integer := 0;
  v_order_id uuid;
  v_reference text;
  v_subtotal numeric(12, 2) := 0;
begin
  if p_buyer_name is null or length(trim(p_buyer_name)) < 2 then
    raise exception 'Enter a valid buyer name.' using errcode = '22023';
  end if;
  if p_buyer_email is null or trim(p_buyer_email) !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Enter a valid buyer email.' using errcode = '22023';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Ticket items must be provided as a JSON array.' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 10 then
    raise exception 'Choose between 1 and 10 ticket lines.' using errcode = '22023';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id and status = 'published'
  for key share;
  if not found then
    raise exception 'This event is not available.' using errcode = 'P0002';
  end if;

  v_reference := 'PAS-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.ticket_orders (
    public_reference, payment_reference, event_id, buyer_user_id, buyer_name, buyer_email, status, currency_code
  ) values (
    v_reference, v_reference, p_event_id, auth.uid(), trim(p_buyer_name), lower(trim(p_buyer_email)), 'pending', 'NGN'
  ) returning id into v_order_id;

  for v_item in
    select value
    from jsonb_array_elements(p_items) as items(value)
    order by value ->> 'tier_id'
  loop
    begin
      v_tier_id := (v_item ->> 'tier_id')::uuid;
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when others then
      raise exception 'Each ticket line needs a valid tier_id and quantity.' using errcode = '22023';
    end;

    if v_quantity < 1 or v_quantity > 6 then
      raise exception 'Ticket quantity must be between 1 and 6.' using errcode = '22023';
    end if;
    v_total_quantity := v_total_quantity + v_quantity;
    if v_total_quantity > 6 then
      raise exception 'An order cannot contain more than 6 tickets.' using errcode = '22023';
    end if;

    select * into v_tier
    from public.ticket_tiers
    where id = v_tier_id and event_id = p_event_id and is_active
    for update;
    if not found then
      raise exception 'A selected ticket type is unavailable.' using errcode = 'P0002';
    end if;
    if v_tier.sales_start_at is not null and now() < v_tier.sales_start_at then
      raise exception 'Ticket sales have not started.' using errcode = '22023';
    end if;
    if v_tier.sales_end_at is not null and now() >= v_tier.sales_end_at then
      raise exception 'Ticket sales have ended.' using errcode = '22023';
    end if;
    if v_tier.capacity is not null and v_tier.quantity_sold + v_quantity > v_tier.capacity then
      raise exception 'There are not enough tickets remaining for %.', v_tier.name using errcode = '22023';
    end if;

    update public.ticket_tiers
    set quantity_sold = quantity_sold + v_quantity
    where id = v_tier.id;

    insert into public.ticket_order_items (
      order_id, event_id, ticket_tier_id, ticket_name, quantity, unit_price_ngn
    ) values (
      v_order_id, p_event_id, v_tier.id, v_tier.name, v_quantity, v_tier.price_ngn
    );
    v_subtotal := v_subtotal + (v_tier.price_ngn * v_quantity);
  end loop;

  update public.ticket_orders
  set subtotal_ngn = v_subtotal
  where id = v_order_id;

  return query select v_order_id, v_reference, v_subtotal, 'NGN'::text;
end;
$$;

-- One transaction: lock the order, match the paid amount to the line items, and insert missing ticket codes.
-- Email delivery stays outside this function so a slow send cannot roll the tickets back.
drop function if exists public.fulfill_paid_ticket_order(text, integer, text);

create or replace function public.fulfill_paid_ticket_order(
  p_reference text,
  p_amount_kobo integer,
  p_requested_kobo integer,
  p_fees_kobo integer,
  p_currency text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_reference text := trim(p_reference);
  v_order public.ticket_orders%rowtype;
  v_event public.events%rowtype;
  v_item record;
  v_ticket_number integer := 0;
  v_slot integer;
  v_tickets jsonb;
  v_email_status text;
  v_send boolean := false;
  v_updated integer := 0;
  v_lines_ngn numeric(12, 2);
  v_due_kobo integer;
begin
  if v_reference is null or length(v_reference) < 4 or length(v_reference) > 120 then
    raise exception 'A valid payment reference is required.' using errcode = '22023';
  end if;

  begin
    select *
    into strict v_order
    from public.ticket_orders
    where payment_reference = v_reference
       or public_reference = v_reference
    for update;
  exception
    when no_data_found then
      raise exception 'Payment reference does not match an order.' using errcode = 'P0002';
    when too_many_rows then
      raise exception 'Payment reference matches more than one order.' using errcode = '21000';
  end;

  select coalesce(sum(quantity * unit_price_ngn), 0)
  into v_lines_ngn
  from public.ticket_order_items
  where order_id = v_order.id;
  v_due_kobo := round(v_lines_ngn * 100)::integer;

  -- The charged amount must cover the ticket lines exactly.
  -- A higher charge is accepted only when the extra is Paystack's reported fee.
  if v_due_kobo <= 0
     or v_due_kobo is distinct from round(v_order.subtotal_ngn * 100)::integer
     or p_currency is null
     or upper(trim(p_currency)) <> 'NGN'
     or p_requested_kobo is distinct from v_due_kobo
     or p_fees_kobo is null
     or p_fees_kobo < 0
     or p_amount_kobo is null
     or p_amount_kobo < v_due_kobo
     or (
       p_amount_kobo is distinct from v_due_kobo
       and p_amount_kobo is distinct from (v_due_kobo + p_fees_kobo)
     )
  then
    raise exception 'Payment amount or currency does not match the order.' using errcode = '22023';
  end if;
  if v_order.status = 'refunded' then
    raise exception 'Order is not in a payable state.' using errcode = '22023';
  end if;

  -- Inventory is released when a pending order expires or is cancelled.
  -- A confirmed charge still owns those seats, so put the hold back once.
  if v_order.status in ('cancelled', 'expired') then
    update public.ticket_tiers as tiers
    set quantity_sold = tiers.quantity_sold + items.quantity
    from (
      select ticket_tier_id, sum(quantity)::integer as quantity
      from public.ticket_order_items
      where order_id = v_order.id and ticket_tier_id is not null
      group by ticket_tier_id
    ) as items
    where items.ticket_tier_id = tiers.id;
  end if;

  update public.ticket_orders
  set status = 'paid',
      paid_at = coalesce(paid_at, now()),
      payment_reference = coalesce(payment_reference, v_reference),
      amount_paid_kobo = p_amount_kobo
  where id = v_order.id
    and status is distinct from 'paid';

  update public.ticket_orders
  set amount_paid_kobo = p_amount_kobo
  where id = v_order.id
    and amount_paid_kobo is null;

  update public.ticket_orders
  set payment_reference = v_reference
  where id = v_order.id
    and payment_reference is null;

  for v_item in
    select id, ticket_name, quantity
    from public.ticket_order_items
    where order_id = v_order.id
    order by created_at asc, id asc
  loop
    for v_slot in 1..v_item.quantity loop
      v_ticket_number := v_ticket_number + 1;
      insert into public.ticket_codes (
        order_id, order_item_id, event_id, ticket_number, ticket_code, ticket_name
      ) values (
        v_order.id,
        v_item.id,
        v_order.event_id,
        v_ticket_number,
        replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''),
        v_item.ticket_name
      )
      on conflict (order_id, ticket_number) do nothing;
    end loop;
  end loop;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'ticket_number', codes.ticket_number,
        'ticket_code', codes.ticket_code,
        'ticket_name', codes.ticket_name
      )
      order by codes.ticket_number
    ),
    '[]'::jsonb
  )
  into v_tickets
  from public.ticket_codes as codes
  where codes.order_id = v_order.id;

  if v_tickets is null or jsonb_array_length(v_tickets) = 0 then
    raise exception 'Unable to issue tickets for this order.' using errcode = 'P0001';
  end if;

  -- Only one caller claims delivery. A crashed claim can be taken again after 5 minutes.
  update public.ticket_orders
  set email_status = 'sending',
      email_error = null,
      email_claimed_at = now()
  where id = v_order.id
    and (
      email_status in ('pending', 'failed')
      or (
        email_status = 'sending'
        and (email_claimed_at is null or email_claimed_at < now() - interval '5 minutes')
      )
    );
  get diagnostics v_updated = row_count;
  v_send := v_updated > 0;

  select email_status into v_email_status
  from public.ticket_orders
  where id = v_order.id;

  select * into v_event from public.events where id = v_order.event_id;
  if not found then
    raise exception 'Event details are missing for this ticket order.' using errcode = 'P0002';
  end if;

  return jsonb_build_object(
    'order_id', v_order.id,
    'public_reference', v_order.public_reference,
    'buyer_name', v_order.buyer_name,
    'buyer_email', v_order.buyer_email,
    'email_status', v_email_status,
    'send_email', v_send,
    'event_title', v_event.title,
    'starts_at', v_event.starts_at,
    'venue_name', v_event.venue_name,
    'area', v_event.area,
    'ticket_count', jsonb_array_length(v_tickets),
    'tickets', v_tickets
  );
end;
$$;

create or replace function public.complete_ticket_email(
  p_order_id uuid,
  p_status text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status = 'sent' then
    update public.ticket_orders
    set email_status = 'sent',
        email_sent_at = coalesce(email_sent_at, now()),
        email_error = null
    where id = p_order_id
      and email_status in ('sending', 'failed');
  elsif p_status = 'failed' then
    update public.ticket_orders
    set email_status = 'failed',
        email_error = left(coalesce(p_error, 'Unable to deliver ticket email.'), 500)
    where id = p_order_id
      and email_status = 'sending';
  else
    raise exception 'Unsupported email status.' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.expire_pending_ticket_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  update public.ticket_orders
  set status = 'expired'
  where status = 'pending' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

drop function if exists public.admin_check_in_ticket(text);
drop function if exists public.admin_check_in_ticket(text, uuid);

create or replace function public.admin_check_in_ticket(
  p_ticket_code text,
  p_event_id uuid
)
returns table (
  ticket_code_id uuid,
  event_title text,
  buyer_name text,
  ticket_name text,
  ticket_status text,
  checked_in_at timestamptz
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ticket public.ticket_codes%rowtype;
  v_event public.events%rowtype;
  v_order public.ticket_orders%rowtype;
  v_event_day date;
  v_today date;
begin
  if not public.is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if p_event_id is null then
    raise exception 'Select the event before scanning tickets.' using errcode = '22023';
  end if;

  select * into v_event from public.events where id = p_event_id;
  if not found then
    raise exception 'The selected event was not found.' using errcode = 'P0002';
  end if;

  select * into v_ticket from public.ticket_codes where ticket_code = trim(p_ticket_code) for update;
  if not found then
    raise exception 'Ticket code was not found.' using errcode = 'P0002';
  end if;
  if v_ticket.event_id is distinct from p_event_id then
    raise exception 'This ticket does not belong to the selected event.' using errcode = '22023';
  end if;
  if v_ticket.status = 'checked_in' then
    raise exception 'Ticket was already checked in.' using errcode = '22023';
  end if;
  if v_ticket.status <> 'issued' then
    raise exception 'This ticket is not valid for entry.' using errcode = '22023';
  end if;

  select * into v_order from public.ticket_orders where id = v_ticket.order_id;
  if v_order.status <> 'paid' then
    raise exception 'Payment for this ticket has not been confirmed.' using errcode = '22023';
  end if;

  v_event_day := (v_event.starts_at at time zone 'Africa/Lagos')::date;
  v_today := (now() at time zone 'Africa/Lagos')::date;

  -- Door opens 2 hours before start.
  if now() < (v_event.starts_at - interval '2 hours') then
    raise exception 'Event hasn''t started.' using errcode = '22023';
  end if;
  -- Check-in stays open through the event day and closes the next day.
  if v_today > v_event_day then
    raise exception 'This event has already ended.' using errcode = '22023';
  end if;

  update public.ticket_codes
  set status = 'checked_in', checked_in_at = now(), checked_in_by = auth.uid()
  where id = v_ticket.id;

  return query
  select v_ticket.id, v_event.title, v_order.buyer_name, v_ticket.ticket_name, 'checked_in'::text, now();
end;
$$;

-- Site pages (home, about, contact, nav) live in site_settings.content jsonb.
-- About / Contact fields: navAbout, aboutEyebrow, aboutTitle, aboutBody, aboutImage,
-- contactPageEyebrow, contactPageTitle, contactPageDescription (+ contactEmail/WhatsApp/social).
insert into public.site_settings (setting_key, content, theme)
values (
  'main',
  '{
    "brandName":"Parle & Sip",
    "navExplore":"Explore experiences",
    "navAbout":"About us",
    "navContact":"Contact us",
    "aboutEyebrow":"OUR STORY",
    "aboutTitle":"French, culture & connection.",
    "aboutBody":"Parle & Sip brings French learners, Francophones, Francophiles and culture enthusiasts together in Abuja to practice French, explore Francophone culture and make meaningful connections.\n\nWe gather around conversation, food, art, games and shared curiosity — so learning French feels like living it.",
    "aboutImage":"",
    "contactPageEyebrow":"GET IN TOUCH",
    "contactPageTitle":"Say hello.",
    "contactPageDescription":"Questions about a seat, a collaboration, or the next gathering. Write, message, or find us on social.",
    "footerLocation":"ABUJA · NIGERIA",
    "footerCurrency":"NGN · ₦ NAIRA",
    "cityName":"Abuja",
    "areaFilterAll":"All Abuja",
    "eventAreas":"Maitama, Wuse, Garki, Asokoro, Jabi, Gwarinpa",
    "heroTitle":"A little French.",
    "heroSecondLine":"A lot to share.",
    "footerText":"Learn. Connect. Experience. Parlez et profitez !",
    "contactEmail":"Parlelinguaservices@gmail.com",
    "contactWhatsapp":"+2349162777004",
    "instagramHandle":"parlesip",
    "tiktokHandle":"parlesip",
    "ticketTemplate":{"brandName":"PARLE & SIP","slugTag":"BIGGEST FRENCH GATHERING IN ABUJA","passLabel":"EVENT PASS","qrInstruction":"SHOW THIS QR CODE AT THE DOOR","brandSize":24,"qrSize":132,"qrOffsetY":84,"notchY":250,"showLogoInQr":true,"logoInQrPercent":18}
  }'::jsonb,
  '{"background":"#f5f6f8","foreground":"#192637","primary":"#9a1f26","secondary":"#e5e9ef","muted":"#edf0f4","mutedForeground":"#526173","accent":"#be8f3f","ring":"#9a1f26","info":"#dce4ef"}'::jsonb
)
on conflict (setting_key) do update set
  content = site_settings.content || excluded.content,
  theme = site_settings.theme || excluded.theme;

update public.events
set status = 'draft', updated_at = now()
where slug in (
  'lagos-language-mixer', 'french-table', 'interpretation-practice-lab',
  'yoruba-diaspora', 'translation-jam', 'igbo-conversation'
);

insert into public.events (
  slug, title, summary, host_name, category, starts_at, venue_name, address,
  area, language_tags, main_image_url, listing_label, status
)
values
  ('french-culture-social', 'Parle & Sip: French Culture Social', 'A relaxed French conversation, culture and connection experience for all levels.', 'Parle & Sip', 'French conversation', '2026-11-14 16:00:00+01', 'The Nest', 'Maitama, Abuja', 'Maitama', array['French', 'English'], 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85', 'A PARLE & SIP EDITION', 'published'),
  ('francophone-food-table', 'À Table: Francophone Food & Conversation', 'Share Francophone flavours and easy French conversation around the table.', 'Parle & Sip', 'Food & gastronomy', '2026-11-15 14:00:00+01', 'Cafe Neo', 'Wuse, Abuja', 'Wuse', array['French', 'English'], 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85', '', 'published'),
  ('francophone-film-club', 'Cinéma & Conversation: Francophone Film Club', 'Enjoy a Francophone film followed by an open, friendly discussion.', 'Parle & Sip', 'Francophone culture', '2026-11-21 18:00:00+01', 'Alliance Française', 'Maitama, Abuja', 'Maitama', array['French', 'English'], 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85', 'FILM + DISCUSSION', 'published'),
  ('french-through-art', 'French Through Art: A Creative Atelier', 'Explore art, creativity and useful French in a welcoming hands-on workshop.', 'Parle & Sip', 'Art & creativity', '2026-11-22 11:30:00+01', 'The Borough', 'Asokoro, Abuja', 'Asokoro', array['French', 'English'], 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85', '', 'published'),
  ('francophone-art-jam', 'L’Atelier: Francophone Art & Ideas', 'A small creative gathering for Francophone culture, music and shared ideas.', 'Parle & Sip', 'Art & creativity', '2026-11-28 15:00:00+01', 'Terra Kulture', 'Jabi, Abuja', 'Jabi', array['French', 'English'], 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85', 'SMALL GROUP', 'published'),
  ('jeux-en-francais', 'Jeux en Français: Board Game Social', 'Play, laugh and practise everyday French together through friendly games.', 'Parle & Sip', 'Games & conversation', '2026-11-29 13:00:00+01', 'The Garden', 'Gwarinpa, Abuja', 'Gwarinpa', array['French', 'English'], 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85', '', 'published')
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  host_name = excluded.host_name,
  category = excluded.category,
  starts_at = excluded.starts_at,
  venue_name = excluded.venue_name,
  address = excluded.address,
  area = excluded.area,
  language_tags = excluded.language_tags,
  main_image_url = excluded.main_image_url,
  listing_label = excluded.listing_label,
  status = excluded.status;

insert into public.ticket_tiers (event_id, name, description, price_ngn, capacity, sort_order)
select events.id, seed.name, seed.description, seed.price_ngn, seed.capacity, seed.sort_order
from (values
  ('french-culture-social', 'Early bird', 'Limited first-release ticket', 5000::numeric, 20, 1),
  ('french-culture-social', 'General admission', 'Standard event entry', 7000::numeric, 80, 2),
  ('french-culture-social', 'Community supporter', 'Entry plus support for Parle & Sip', 12000::numeric, 20, 3),
  ('francophone-food-table', 'Early bird', 'Limited first-release ticket', 7000::numeric, 20, 1),
  ('francophone-food-table', 'General admission', 'Standard event entry', 9000::numeric, 50, 2),
  ('francophone-food-table', 'Community supporter', 'Entry plus support for Parle & Sip', 14000::numeric, 15, 3),
  ('francophone-film-club', 'Film + conversation', 'Screening and facilitated discussion', 8000::numeric, 25, 1),
  ('francophone-film-club', 'Culture supporter', 'Screening, discussion and community support', 14000::numeric, 10, 2),
  ('french-through-art', 'Atelier seat', 'Materials and workshop entry', 8500::numeric, 20, 1),
  ('french-through-art', 'Atelier supporter', 'Workshop seat plus host support', 14000::numeric, 10, 2),
  ('francophone-art-jam', 'Standard seat', 'Join the creative gathering', 10000::numeric, 16, 1),
  ('francophone-art-jam', 'Culture supporter', 'Seat plus support for the programme', 17000::numeric, 8, 2),
  ('jeux-en-francais', 'Game table seat', 'Join a French-friendly game table', 6000::numeric, 20, 1),
  ('jeux-en-francais', 'Game night supporter', 'Seat plus support for the host', 13000::numeric, 10, 2)
) as seed(slug, name, description, price_ngn, capacity, sort_order)
join public.events on events.slug = seed.slug
on conflict (event_id, name) do nothing;

insert into public.event_images (event_id, image_url, alt_text, sort_order)
select events.id, seed.image_url, seed.alt_text, seed.sort_order
from (values
  ('french-culture-social', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=85', 'Friends sharing a meal and conversation', 1),
  ('french-culture-social', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85', 'Community members meeting together', 2),
  ('francophone-food-table', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85', 'A shared table for Francophone food and conversation', 1),
  ('francophone-film-club', 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85', 'Guests gathering for a cultural screening', 1),
  ('french-through-art', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=85', 'Friends creating together at an art workshop', 1),
  ('francophone-art-jam', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=85', 'Music and creative collaboration', 1),
  ('jeux-en-francais', 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=1200&q=85', 'Friends enjoying games and conversation', 1)
) as seed(slug, image_url, alt_text, sort_order)
join public.events on events.slug = seed.slug
on conflict (event_id, image_url) do nothing;

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.event_images enable row level security;
alter table public.ticket_tiers enable row level security;
alter table public.ticket_orders enable row level security;
alter table public.ticket_order_items enable row level security;
alter table public.ticket_codes enable row level security;
alter table public.site_settings enable row level security;
alter table public.community_rsvps enable row level security;

drop policy if exists "profiles_read_self_or_admin" on public.profiles;
create policy "profiles_read_self_or_admin" on public.profiles
for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "published_events_readable" on public.events;
create policy "published_events_readable" on public.events
for select to anon, authenticated
using (status = 'published');

drop policy if exists "admins_manage_events" on public.events;
create policy "admins_manage_events" on public.events
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "published_event_images_readable" on public.event_images;
create policy "published_event_images_readable" on public.event_images
for select to anon, authenticated
using (exists (
  select 1 from public.events
  where events.id = event_images.event_id and events.status = 'published'
));

drop policy if exists "admins_manage_event_images" on public.event_images;
create policy "admins_manage_event_images" on public.event_images
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "active_published_tiers_readable" on public.ticket_tiers;
create policy "active_published_tiers_readable" on public.ticket_tiers
for select to anon, authenticated
using (is_active and exists (
  select 1 from public.events
  where events.id = ticket_tiers.event_id and events.status = 'published'
));

drop policy if exists "admins_manage_ticket_tiers" on public.ticket_tiers;
create policy "admins_manage_ticket_tiers" on public.ticket_tiers
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "main_site_settings_readable" on public.site_settings;
create policy "main_site_settings_readable" on public.site_settings
for select to anon, authenticated
using (setting_key = 'main');

drop policy if exists "admins_manage_site_settings" on public.site_settings;
create policy "admins_manage_site_settings" on public.site_settings
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "admins_read_community_rsvps" on public.community_rsvps;
create policy "admins_read_community_rsvps" on public.community_rsvps
for select to authenticated
using ((select public.is_admin()));

drop policy if exists "admins_manage_community_rsvps" on public.community_rsvps;
create policy "admins_manage_community_rsvps" on public.community_rsvps
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "parle_sip_media_public_read" on storage.objects;
create policy "parle_sip_media_public_read" on storage.objects
for select to anon, authenticated
using (bucket_id = 'parle-sip-media');

drop policy if exists "parle_sip_media_admin_upload" on storage.objects;
create policy "parle_sip_media_admin_upload" on storage.objects
for insert to authenticated
with check (bucket_id = 'parle-sip-media' and (select public.is_admin()));

drop policy if exists "parle_sip_media_admin_update" on storage.objects;
create policy "parle_sip_media_admin_update" on storage.objects
for update to authenticated
using (bucket_id = 'parle-sip-media' and (select public.is_admin()))
with check (bucket_id = 'parle-sip-media' and (select public.is_admin()));

drop policy if exists "parle_sip_media_admin_delete" on storage.objects;
create policy "parle_sip_media_admin_delete" on storage.objects
for delete to authenticated
using (bucket_id = 'parle-sip-media' and (select public.is_admin()));

drop policy if exists "buyers_and_admins_read_orders" on public.ticket_orders;
create policy "buyers_and_admins_read_orders" on public.ticket_orders
for select to authenticated
using (buyer_user_id = (select auth.uid()) or (select public.is_admin()));

drop policy if exists "admins_manage_orders" on public.ticket_orders;
create policy "admins_manage_orders" on public.ticket_orders
for update to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "buyers_and_admins_read_order_items" on public.ticket_order_items;
create policy "buyers_and_admins_read_order_items" on public.ticket_order_items
for select to authenticated
using (exists (
  select 1 from public.ticket_orders
  where ticket_orders.id = ticket_order_items.order_id
    and (ticket_orders.buyer_user_id = (select auth.uid()) or (select public.is_admin()))
));

drop policy if exists "admins_manage_order_items" on public.ticket_order_items;
create policy "admins_manage_order_items" on public.ticket_order_items
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "admins_read_ticket_codes" on public.ticket_codes;
create policy "admins_read_ticket_codes" on public.ticket_codes
for select to authenticated
using ((select public.is_admin()));

grant select on public.events, public.event_images, public.ticket_tiers, public.site_settings to anon, authenticated;
grant select on public.profiles, public.ticket_orders, public.ticket_order_items, public.community_rsvps to authenticated;
grant select on public.ticket_codes to authenticated;
grant insert, update, delete on public.events, public.event_images, public.ticket_tiers, public.site_settings to authenticated;
grant update on public.ticket_orders to authenticated;
grant insert, update, delete on public.ticket_order_items to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
revoke all on function public.create_ticket_order(uuid, text, text, jsonb) from public;
grant execute on function public.create_ticket_order(uuid, text, text, jsonb) to anon, authenticated, service_role;
revoke all on function public.fulfill_paid_ticket_order(text, integer, integer, integer, text) from public, anon, authenticated;
grant execute on function public.fulfill_paid_ticket_order(text, integer, integer, integer, text) to service_role;
revoke all on function public.complete_ticket_email(uuid, text, text) from public, anon, authenticated;
grant execute on function public.complete_ticket_email(uuid, text, text) to service_role;
revoke all on function public.expire_pending_ticket_orders() from public;
grant execute on function public.expire_pending_ticket_orders() to authenticated;
revoke all on function public.admin_check_in_ticket(text, uuid) from public;
grant execute on function public.admin_check_in_ticket(text, uuid) to authenticated;

commit;

-- After creating the Supabase Auth user with this email, promote its profile:
-- update public.profiles
-- set username = 'admin@parleandsip.com', role = 'admin'
-- where lower(email) = lower('admin@parleandsip.com');
-- Call this periodically (or schedule with pg_cron) to release unpaid reservations:
-- select public.expire_pending_ticket_orders();