-- Fixes a critical price-tampering vulnerability: create_order() previously
-- inserted subtotal/total/unit_price/line_total, and the seeded payment.amount,
-- straight from the client-supplied RPC payload with no server-side check
-- against real product/product_variant prices. Since paystack-webhook and
-- verify-payment only ever compare the Paystack-paid amount against that
-- same client-set payment.amount, a tampered payload (edited in devtools)
-- could pay an arbitrary amount for an order.
--
-- This patch adds price_order_item() — a helper that prices a line item
-- from server-truth product/product_variant data, mirroring the unitPrice()
-- rules in src/screens/ProductDetail.jsx per configurator — and rewrites
-- create_order() to use it for every line, plus to recompute delivery_fee
-- (from delivery_option) and discount_amount (from discount_code) instead
-- of trusting the client's numbers for those either.

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

  v_order_number := 'A11-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  v_fulfilment := payload->>'fulfilment_type';

  if v_fulfilment = 'delivery' and nullif(payload->>'delivery_option_id','') is not null then
    select * into v_delivery_option from delivery_option
      where id = (payload->>'delivery_option_id')::uuid and active;
    if v_delivery_option is null then
      raise exception 'Invalid or inactive delivery option';
    end if;
    v_delivery_fee := v_delivery_option.fee;
  end if;

  if nullif(payload->>'discount_code_id','') is not null then
    select * into v_discount from discount_code
      where id = (payload->>'discount_code_id')::uuid and active;
    if v_discount is null then
      raise exception 'Invalid or inactive discount code';
    end if;
  end if;

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
