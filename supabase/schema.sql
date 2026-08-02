-- Aries 11 Bakehouse — core schema, RLS, and helper functions.
-- Run this once in the Supabase SQL editor (or via `supabase db push` if
-- using the CLI with this file under supabase/migrations/).
--
-- Order of operations matters: extensions → tables → functions that
-- reference tables → RLS policies → triggers.

create extension if not exists pgcrypto;

-- ============================================================
-- CATALOGUE
-- ============================================================

create table product_category (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table product (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  category_id uuid not null references product_category(id),
  name text not null,
  description text,
  base_price integer check (base_price is null or base_price >= 0), -- null = fully price-TBC (e.g. Cake Parfait)
  price_from boolean not null default false,    -- render "From ₦X"
  configurator text,                            -- null | 'banana-bread' | 'brownies' | 'small-chops' | 'pastries' | 'cake'
  badge text,                                   -- 'Bestseller' | 'New' | 'Limited' | null
  availability text not null default 'made_to_order' check (availability in ('in_stock','made_to_order','unavailable')),
  min_qty int not null default 1,
  ingredients_note text default 'TBC',
  allergen_note text default 'TBC',
  storage_note text default 'TBC',
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table product_image (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order int not null default 0,
  is_primary boolean not null default false
);

-- One row per selectable option (a "menu" of choosable values), not one row
-- per cart selection — see the app's variant_selections jsonb columns below
-- for how an actual customer choice gets recorded.
create table product_variant (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  variant_type text not null,                   -- 'size' | 'flavour' | 'topping' | 'platter' | 'option'
  variant_value text not null,                  -- 'medium', 'oreos', 'solo-survivor', ...
  label text not null,
  price_override integer check (price_override is null or price_override >= 0), -- absolute price when this variant determines price directly
  price_modifier integer not null default 0,    -- additive modifier (e.g. mixed-topping +500)
  min_qty int,
  image_url text,
  is_mixed_allowed boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  unique (product_id, variant_type, variant_value)
);

create table ingredient (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  name text not null,
  allergen_flag boolean not null default false
);

-- ============================================================
-- CUSTOMERS
-- ============================================================

-- One row per Supabase Auth user (including anonymous sessions). Doubles as
-- the role store — see is_admin() below.
create table customer (
  id uuid primary key,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  role text not null default 'customer' check (role in ('customer','admin')),
  name text,
  email text check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (phone is null or phone ~ '^[0-9+()\-\s]{7,20}$'),
  is_guest boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index customer_email_idx on customer (lower(email)) where email is not null;
create unique index customer_phone_idx on customer (phone) where phone is not null;

create table address (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customer(id) on delete cascade,
  label text,
  address_text text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CART
-- ============================================================

create table cart (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customer(id) on delete cascade,
  status text not null default 'active' check (status in ('active','converted','abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table cart_item (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references cart(id) on delete cascade,
  product_id uuid not null references product(id),
  variant_selections jsonb not null default '{}',
  quantity int not null check (quantity > 0),
  unit_price integer check (unit_price is null or unit_price >= 0), -- snapshot at add-time; null if price TBC
  created_at timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================

create table delivery_option (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  type text not null check (type in ('pickup','delivery')),
  zone text,
  fee integer not null default 0 check (fee >= 0),
  active boolean not null default true
);

create table discount_code (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null check (type in ('fixed','percentage')),
  value integer not null,
  expires_at timestamptz,
  usage_limit int,
  times_used int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table "order" (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_id uuid not null references customer(id),
  status text not null default 'pending'
    check (status in ('pending','confirmed','preparing','ready_or_out','completed','cancelled')),
  fulfilment_type text not null check (fulfilment_type in ('pickup','delivery')),
  delivery_option_id uuid references delivery_option(id),
  address_text text,
  preferred_date date not null,
  preferred_time text not null check (preferred_time in ('morning','afternoon','evening')),
  customer_name text not null,
  customer_phone text not null check (customer_phone ~ '^[0-9+()\-\s]{7,20}$'),
  customer_email text check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  special_instructions text,
  discount_code_id uuid references discount_code(id),
  subtotal integer not null check (subtotal >= 0),
  delivery_fee integer not null default 0 check (delivery_fee >= 0),
  discount_amount integer not null default 0 check (discount_amount >= 0),
  total integer not null check (total >= 0),
  has_unpriced_items boolean not null default false,
  fallback_channel text,                          -- null | 'whatsapp'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table order_item (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references "order"(id) on delete cascade,
  product_id uuid references product(id),
  product_name_snapshot text not null,
  variant_selections jsonb not null default '{}',
  quantity int not null check (quantity > 0),
  unit_price integer check (unit_price is null or unit_price >= 0),
  line_total integer check (line_total is null or line_total >= 0),
  image_url text
);

create table payment (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references "order"(id) on delete cascade,
  provider text not null default 'paystack',
  reference text unique not null,
  status text not null default 'pending' check (status in ('pending','success','failed','abandoned')),
  amount integer not null check (amount >= 0),
  currency text not null default 'NGN',
  verified_at timestamptz,
  raw_webhook_payload jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- REVIEWS
-- ============================================================

create table review (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references product(id) on delete cascade,
  order_id uuid references "order"(id),
  customer_id uuid references customer(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  status text not null default 'pending' check (status in ('pending','published','rejected')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- ANALYTICS
-- ============================================================

create table analytics_event (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  customer_id uuid references customer(id),
  session_id text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table newsletter_signup (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);
create index analytics_event_session_created_idx on analytics_event (session_id, created_at);
create index newsletter_signup_created_idx on newsletter_signup (created_at);

-- ============================================================
-- CONTENT (announcement bar / promo banner / bestseller picks — §14)
-- ============================================================

create table site_content (
  key text primary key,
  value jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from customer c
    where c.auth_user_id = auth.uid() and c.role = 'admin'
  );
$$;

create or replace function owns_customer(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from customer c where c.id = cid and c.auth_user_id = auth.uid()
  );
$$;

-- Auto-create a `customer` row the moment any auth user (including an
-- anonymous session) is created — so client code never has to remember to
-- do this itself.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into customer (id, auth_user_id, is_guest, email, phone)
  values (new.id, new.id, coalesce(new.is_anonymous, true), new.email, new.phone)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- When a previously-anonymous session gets a real email/phone via
-- supabase.auth.updateUser(), keep the customer row's is_guest/email/phone
-- in sync (auth.uid() doesn't change, so this is the SAME customer row).
create or replace function handle_user_updated() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update customer
  set email = coalesce(new.email, email),
      phone = coalesce(new.phone, phone),
      is_guest = coalesce(new.is_anonymous, is_guest)
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function handle_user_updated();

-- RLS's "customer self update" policy below only checks row ownership, not
-- which columns change — without this trigger, any signed-in user (even an
-- anonymous session) could self-promote via
-- `update customer set role='admin' where auth_user_id = auth.uid()`.
-- Reverts any `role` change made by a non-admin back to its prior value.
create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_role_guard on customer;
create trigger customer_role_guard
  before update on customer
  for each row execute function prevent_role_escalation();

-- Both analytics_event and newsletter_signup have `insert with check (true)`
-- RLS policies (anonymous visitors need to write them), which means the
-- only thing standing between them and a flood of junk rows is these
-- triggers. They're deliberately SECURITY DEFINER so their own count query
-- bypasses RLS (the inserting role — anon/authenticated — has no SELECT
-- policy on either table) — without that, the count would always read as
-- zero and the limit would never trigger. This is a coarse, same-database
-- backstop only; real volumetric-abuse protection (distributed floods)
-- belongs at the edge (e.g. Vercel Firewall rate limiting), not here.
create or replace function enforce_analytics_event_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.session_id is not null and (
    select count(*) from analytics_event
    where session_id = new.session_id and created_at > now() - interval '1 minute'
  ) >= 60 then
    raise exception 'rate limit exceeded — too many analytics events from this session';
  end if;
  return new;
end;
$$;

drop trigger if exists analytics_event_rate_limit on analytics_event;
create trigger analytics_event_rate_limit
  before insert on analytics_event
  for each row execute function enforce_analytics_event_rate_limit();

create or replace function enforce_newsletter_signup_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from newsletter_signup where created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'rate limit exceeded — too many newsletter signups right now, try again shortly';
  end if;
  return new;
end;
$$;

drop trigger if exists newsletter_signup_rate_limit on newsletter_signup;
create trigger newsletter_signup_rate_limit
  before insert on newsletter_signup
  for each row execute function enforce_newsletter_signup_rate_limit();

-- Prices a single line item from server-truth product/product_variant data,
-- mirroring the unitPrice() rules in src/screens/ProductDetail.jsx per
-- configurator. Returns null only for the 'cake' configurator, which is
-- genuinely price-TBC by design (kitchen confirms before payment) — every
-- other configurator (or no configurator at all) must resolve to a price or
-- the order is rejected, since a miss there means a product/variant
-- mismatch or a tampered payload, never a legitimate "unpriced" state.
create or replace function price_order_item(p_product product, p_selections jsonb) returns integer
language plpgsql stable set search_path = public as $$
declare
  v_price integer;
begin
  if p_product.configurator is null then
    return p_product.base_price;
  end if;

  if p_product.configurator = 'banana-bread' then
    if coalesce((p_selections->>'mixed')::boolean, false) then
      select price_override into v_price from product_variant
        where product_id = p_product.id and variant_type = 'size_mixed'
          and variant_value = p_selections->>'size' and is_active;
    end if;
    if v_price is null then
      select price_override into v_price from product_variant
        where product_id = p_product.id and variant_type = 'size'
          and variant_value = p_selections->>'size' and is_active;
    end if;
  elsif p_product.configurator = 'brownies' then
    select price_override into v_price from product_variant
      where product_id = p_product.id and variant_type = 'size'
        and variant_value = p_selections->>'size' and is_active;
  elsif p_product.configurator = 'small-chops' then
    select price_override into v_price from product_variant
      where product_id = p_product.id and variant_type = 'platter'
        and variant_value = p_selections->>'platter' and is_active;
  elsif p_product.configurator = 'pastries' then
    select price_override into v_price from product_variant
      where product_id = p_product.id and variant_type = 'option'
        and variant_value = p_selections->>'option' and is_active;
  elsif p_product.configurator = 'cake' then
    return null; -- always price-TBC, matches ProductDetail.jsx unitPrice: () => null
  else
    raise exception 'Unknown configurator % on product %', p_product.configurator, p_product.slug;
  end if;

  if v_price is null then
    raise exception 'Could not resolve a price for product % with selections %', p_product.slug, p_selections;
  end if;
  return v_price;
end;
$$;

-- Atomically creates an order + its line items (+ an initial pending
-- `payment` row when a payment_reference is supplied). Called via
-- supabase.rpc('create_order', { payload }) from the client so a partial
-- failure never leaves an order without its items (or vice versa).
--
-- SECURITY: every price (line unit_price, subtotal, delivery_fee,
-- discount_amount, total, and the seeded payment.amount) is computed here
-- from server-truth product/product_variant/delivery_option/discount_code
-- rows — the client payload's own price fields are read only for display
-- fallback on the client before this call returns, and are never trusted.
-- See patch_010_price_integrity.sql for why: the previous version inserted
-- payload->>'total' etc. directly, so a tampered RPC payload could pay any
-- amount for an order (the Paystack amount checks in paystack-webhook/
-- verify-payment only ever compared against that same client-set number).
create or replace function create_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
  v_product product;
  v_selections jsonb;
  v_qty integer;
  v_unit_price integer;
  v_line_total integer;
  v_subtotal integer := 0;
  v_has_unpriced boolean := false;
  v_priced_items jsonb[] := '{}';
  v_delivery_option delivery_option;
  v_delivery_fee integer := 0;
  v_discount discount_code;
  v_discount_amount integer := 0;
  v_total integer;
  v_fulfilment text;
begin
  select id into v_customer_id from customer where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'No customer row for current auth user';
  end if;

  -- gen_random_uuid() (not gen_random_bytes()) — the latter lives in the
  -- `extensions` schema on Supabase, outside this function's search_path.
  v_order_number := 'A11-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  v_fulfilment := payload->>'fulfilment_type';

  -- Delivery fee: trust the server's delivery_option row, never the
  -- client's delivery_fee number.
  if v_fulfilment = 'delivery' and nullif(payload->>'delivery_option_id','') is not null then
    select * into v_delivery_option from delivery_option
      where id = (payload->>'delivery_option_id')::uuid and active;
    if v_delivery_option is null then
      raise exception 'Invalid or inactive delivery option';
    end if;
    v_delivery_fee := v_delivery_option.fee;
  end if;

  -- Discount: trust the server's discount_code row (already atomically
  -- redeemed — times_used incremented — by redeem_discount_code() when the
  -- customer applied the code), never the client's discount_amount number.
  if nullif(payload->>'discount_code_id','') is not null then
    select * into v_discount from discount_code
      where id = (payload->>'discount_code_id')::uuid and active;
    if v_discount is null then
      raise exception 'Invalid or inactive discount code';
    end if;
  end if;

  -- Price every line item from product/product_variant.
  for v_item in select * from jsonb_array_elements(payload->'items') loop
    if nullif(v_item->>'product_id','') is null then
      raise exception 'order item missing product_id';
    end if;

    select * into v_product from product where id = (v_item->>'product_id')::uuid and is_active;
    if v_product is null then
      raise exception 'Unknown or inactive product %', v_item->>'product_id';
    end if;

    v_selections := coalesce(v_item->'variant_selections', '{}'::jsonb);
    v_qty := (v_item->>'quantity')::int;
    v_unit_price := price_order_item(v_product, v_selections);
    v_line_total := case when v_unit_price is null then null else v_unit_price * v_qty end;

    if v_line_total is null then
      v_has_unpriced := true;
    else
      v_subtotal := v_subtotal + v_line_total;
    end if;

    v_priced_items := v_priced_items || jsonb_build_object(
      'product_id', v_item->>'product_id',
      'name', coalesce(v_product.name, v_item->>'name'),
      'variant_selections', v_selections,
      'quantity', v_qty,
      'unit_price', v_unit_price,
      'line_total', v_line_total,
      'image_url', v_item->>'image_url'
    );
  end loop;

  if v_discount is not null then
    v_discount_amount := case
      when v_discount.type = 'percentage' then least(v_subtotal, round(v_subtotal * v_discount.value / 100.0)::integer)
      else least(v_subtotal, v_discount.value)
    end;
  end if;

  v_total := greatest(0, v_subtotal + v_delivery_fee - v_discount_amount);

  insert into "order" (
    order_number, customer_id, status, fulfilment_type, delivery_option_id,
    address_text, preferred_date, preferred_time, customer_name, customer_phone,
    customer_email, special_instructions, discount_code_id,
    subtotal, delivery_fee, discount_amount, total, has_unpriced_items, fallback_channel
  ) values (
    v_order_number, v_customer_id,
    coalesce(payload->>'status', 'pending'),
    v_fulfilment,
    nullif(payload->>'delivery_option_id','')::uuid,
    payload->>'address_text',
    (payload->>'preferred_date')::date,
    payload->>'preferred_time',
    payload->>'customer_name',
    payload->>'customer_phone',
    payload->>'customer_email',
    payload->>'special_instructions',
    v_discount.id,
    v_subtotal,
    v_delivery_fee,
    v_discount_amount,
    v_total,
    v_has_unpriced,
    payload->>'fallback_channel'
  ) returning id into v_order_id;

  for v_item in select * from unnest(v_priced_items) loop
    insert into order_item (order_id, product_id, product_name_snapshot, variant_selections, quantity, unit_price, line_total, image_url)
    values (
      v_order_id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'name',
      v_item->'variant_selections',
      (v_item->>'quantity')::int,
      nullif(v_item->>'unit_price','')::integer,
      nullif(v_item->>'line_total','')::integer,
      v_item->>'image_url'
    );
  end loop;

  if nullif(payload->>'payment_reference','') is not null then
    insert into payment (order_id, reference, amount, status)
    values (v_order_id, payload->>'payment_reference', v_total, 'pending');
  end if;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
end;
$$;

-- Redeems a discount code: validates active/expiry/usage-limit and
-- increments times_used atomically, so a client can "apply" a code without
-- ever getting direct UPDATE access to discount_code.
create or replace function redeem_discount_code(p_code text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_row discount_code;
begin
  select * into v_row from discount_code where code = p_code for update;
  if not found or not v_row.active then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;
  if v_row.expires_at is not null and v_row.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;
  if v_row.usage_limit is not null and v_row.times_used >= v_row.usage_limit then
    return jsonb_build_object('valid', false, 'reason', 'usage_limit_reached');
  end if;

  update discount_code set times_used = times_used + 1 where id = v_row.id;

  return jsonb_build_object(
    'valid', true, 'id', v_row.id, 'type', v_row.type, 'value', v_row.value
  );
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table product_category enable row level security;
alter table product enable row level security;
alter table product_image enable row level security;
alter table product_variant enable row level security;
alter table ingredient enable row level security;
alter table customer enable row level security;
alter table address enable row level security;
alter table cart enable row level security;
alter table cart_item enable row level security;
alter table delivery_option enable row level security;
alter table discount_code enable row level security;
alter table "order" enable row level security;
alter table order_item enable row level security;
alter table payment enable row level security;
alter table review enable row level security;
alter table analytics_event enable row level security;
alter table newsletter_signup enable row level security;
alter table site_content enable row level security;

-- Catalogue: public read of active rows, admin full CRUD.
create policy "catalogue public read" on product_category for select using (true);
create policy "catalogue admin write" on product_category for all using (is_admin()) with check (is_admin());

create policy "product public read" on product for select using (is_active or is_admin());
create policy "product admin write" on product for all using (is_admin()) with check (is_admin());

create policy "product_image public read" on product_image for select using (true);
create policy "product_image admin write" on product_image for all using (is_admin()) with check (is_admin());

create policy "product_variant public read" on product_variant for select using (is_active or is_admin());
create policy "product_variant admin write" on product_variant for all using (is_admin()) with check (is_admin());

create policy "ingredient public read" on ingredient for select using (true);
create policy "ingredient admin write" on ingredient for all using (is_admin()) with check (is_admin());

-- Customer / address: owner + admin only.
create policy "customer self read" on customer for select using (auth_user_id = auth.uid() or is_admin());
create policy "customer self update" on customer for update using (auth_user_id = auth.uid() or is_admin());
create policy "customer admin all" on customer for insert with check (is_admin());
create policy "customer admin delete" on customer for delete using (is_admin());

create policy "address owner all" on address for all
  using (owns_customer(customer_id) or is_admin())
  with check (owns_customer(customer_id) or is_admin());

-- Cart / cart item: owner + admin only.
create policy "cart owner all" on cart for all
  using (owns_customer(customer_id) or is_admin())
  with check (owns_customer(customer_id) or is_admin());

create policy "cart_item owner all" on cart_item for all
  using (exists (select 1 from cart c where c.id = cart_id and (owns_customer(c.customer_id) or is_admin())))
  with check (exists (select 1 from cart c where c.id = cart_id and (owns_customer(c.customer_id) or is_admin())));

-- Delivery options / discount codes: public read of active, admin write.
-- (Discount code redemption itself goes through redeem_discount_code(),
-- not a direct client UPDATE.)
create policy "delivery_option public read" on delivery_option for select using (active or is_admin());
create policy "delivery_option admin write" on delivery_option for all using (is_admin()) with check (is_admin());

create policy "discount_code public read" on discount_code for select using (active or is_admin());
create policy "discount_code admin write" on discount_code for all using (is_admin()) with check (is_admin());

-- Orders: owner can SELECT/INSERT their own, never UPDATE (status changes
-- are admin- or webhook-only — the webhook uses the service role key, which
-- bypasses RLS entirely).
create policy "order owner select" on "order" for select using (owns_customer(customer_id) or is_admin());
create policy "order owner insert" on "order" for insert with check (owns_customer(customer_id));
create policy "order admin update" on "order" for update using (is_admin());
create policy "order admin delete" on "order" for delete using (is_admin());

create policy "order_item owner select" on order_item for select
  using (exists (select 1 from "order" o where o.id = order_id and (owns_customer(o.customer_id) or is_admin())));
create policy "order_item owner insert" on order_item for insert
  with check (exists (select 1 from "order" o where o.id = order_id and owns_customer(o.customer_id)));
create policy "order_item admin write" on order_item for all using (is_admin()) with check (is_admin());

-- Payment: client can only ever SELECT its own (via order join). No client
-- INSERT/UPDATE policy at all — every write goes through the service-role
-- Edge Functions (paystack-webhook, verify-payment).
create policy "payment owner select" on payment for select
  using (exists (select 1 from "order" o where o.id = order_id and (owns_customer(o.customer_id) or is_admin())));
create policy "payment admin write" on payment for all using (is_admin()) with check (is_admin());

-- Reviews: public read of published; owner can insert on their own
-- (ideally completed) order; no client update (moderation is admin-only).
-- A customer can also see their OWN review regardless of status (pending/
-- rejected), needed to check "have I already reviewed this item" — public
-- visibility (unrelated customers) is still gated to published-only.
create policy "review public read" on review for select
  using (
    status = 'published' or is_admin()
    or customer_id in (select id from customer where auth_user_id = auth.uid())
  );
create policy "review owner insert" on review for insert
  with check (
    is_admin() or (
      customer_id in (select id from customer where auth_user_id = auth.uid())
      and exists (
        select 1 from order_item oi join "order" o on o.id = oi.order_id
        where o.id = review.order_id and oi.product_id = review.product_id and o.status = 'completed'
      )
    )
  );
create policy "review admin write" on review for update using (is_admin()) with check (is_admin());
create policy "review admin delete" on review for delete using (is_admin());

-- Analytics: insert-only for anyone (including anonymous sessions), read
-- restricted to admins.
create policy "analytics_event insert" on analytics_event for insert with check (true);
create policy "analytics_event admin read" on analytics_event for select using (is_admin());

create policy "newsletter_signup insert" on newsletter_signup for insert with check (true);
create policy "newsletter_signup admin read" on newsletter_signup for select using (is_admin());

-- Site content: public read, admin write.
create policy "site_content public read" on site_content for select using (true);
create policy "site_content admin write" on site_content for all using (is_admin()) with check (is_admin());
