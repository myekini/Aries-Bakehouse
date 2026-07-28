-- Fixes create_order(): gen_random_bytes() lives in the `extensions` schema
-- on Supabase, not `public`, so it wasn't visible under this function's
-- `search_path = public` (confirmed failing live: "function
-- gen_random_bytes(integer) does not exist"). gen_random_uuid() works fine
-- everywhere else in this schema, so derive the order number from that
-- instead rather than chasing the extensions search_path.

create or replace function create_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_order_number text;
  v_item jsonb;
begin
  select id into v_customer_id from customer where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'No customer row for current auth user';
  end if;

  v_order_number := 'A11-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  insert into "order" (
    order_number, customer_id, status, fulfilment_type, delivery_option_id,
    address_text, preferred_date, preferred_time, customer_name, customer_phone,
    customer_email, special_instructions, discount_code_id,
    subtotal, delivery_fee, discount_amount, total, has_unpriced_items, fallback_channel
  ) values (
    v_order_number, v_customer_id,
    coalesce(payload->>'status', 'pending'),
    payload->>'fulfilment_type',
    nullif(payload->>'delivery_option_id','')::uuid,
    payload->>'address_text',
    (payload->>'preferred_date')::date,
    payload->>'preferred_time',
    payload->>'customer_name',
    payload->>'customer_phone',
    payload->>'customer_email',
    payload->>'special_instructions',
    nullif(payload->>'discount_code_id','')::uuid,
    (payload->>'subtotal')::integer,
    coalesce((payload->>'delivery_fee')::integer, 0),
    coalesce((payload->>'discount_amount')::integer, 0),
    (payload->>'total')::integer,
    coalesce((payload->>'has_unpriced_items')::boolean, false),
    payload->>'fallback_channel'
  ) returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(payload->'items') loop
    insert into order_item (order_id, product_id, product_name_snapshot, variant_selections, quantity, unit_price, line_total, image_url)
    values (
      v_order_id,
      nullif(v_item->>'product_id','')::uuid,
      v_item->>'name',
      coalesce(v_item->'variant_selections', '{}'::jsonb),
      (v_item->>'quantity')::int,
      nullif(v_item->>'unit_price','')::integer,
      nullif(v_item->>'line_total','')::integer,
      v_item->>'image_url'
    );
  end loop;

  return jsonb_build_object('id', v_order_id, 'order_number', v_order_number);
end;
$$;
