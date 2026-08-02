-- Manual verification for the patch_010_price_integrity.sql fix.
-- Run this in the Supabase SQL editor (or `psql` against your project's
-- connection string) against a project that already has schema.sql (or
-- patch_010 + patch_011 + patch_012) applied. Safe to run repeatedly —
-- everything it creates is cleaned up at the end, and it never touches
-- real catalogue/order data.
--
-- What it proves: create_order() ignores a tampered unit_price/total in the
-- RPC payload and prices the order from the real product_variant row
-- instead — i.e. the price-tampering bug described in patch_010 is fixed.
--
-- set_config(...) below fakes an authenticated request the way Supabase's
-- local dev stack does — auth.uid() reads request.jwt.claim.sub, which
-- PostgREST normally sets from the caller's JWT; a raw SQL session has to
-- set it manually to exercise a SECURITY DEFINER function the same way the
-- app's supabase.rpc('create_order', ...) call would.

do $$
declare
  v_auth_user_id uuid := gen_random_uuid();
  v_customer_id uuid;
  v_category_id uuid;
  v_product_id uuid;
  v_real_price int := 8000;
  v_tampered_price int := 1; -- what an attacker would try to pay instead
  v_result jsonb;
  v_order_id uuid;
  v_stored_unit_price int;
  v_stored_total int;
begin
  -- Arrange: a throwaway customer + product/variant with a known real price.
  insert into customer (id, auth_user_id, is_guest, email)
  values (gen_random_uuid(), v_auth_user_id, false, 'price-integrity-test@example.com')
  returning id into v_customer_id;

  insert into product_category (slug, name) values ('__test_category__', 'Test') returning id into v_category_id;

  insert into product (slug, category_id, name, configurator, is_active)
  values ('__test_product__', v_category_id, 'Test Brownie Box', 'brownies', true)
  returning id into v_product_id;

  insert into product_variant (product_id, variant_type, variant_value, label, price_override, is_active)
  values (v_product_id, 'size', 'medium', 'Medium', v_real_price, true);

  -- Impersonate this customer's auth session, the way PostgREST would.
  perform set_config('request.jwt.claim.sub', v_auth_user_id::text, true);
  perform set_config('role', 'authenticated', true);

  -- Act: call create_order() with a payload that lies about the price —
  -- exactly what a tampered devtools/network request would send.
  v_result := create_order(jsonb_build_object(
    'fulfilment_type', 'pickup',
    'preferred_date', (current_date + 1)::text,
    'preferred_time', 'morning',
    'customer_name', 'Price Integrity Test',
    'customer_phone', '+2348000000000',
    'subtotal', v_tampered_price,
    'total', v_tampered_price,
    'items', jsonb_build_array(jsonb_build_object(
      'product_id', v_product_id,
      'name', 'Test Brownie Box',
      'variant_selections', jsonb_build_object('size', 'medium'),
      'quantity', 1,
      'unit_price', v_tampered_price,
      'line_total', v_tampered_price
    ))
  ));

  v_order_id := (v_result->>'id')::uuid;
  select unit_price into v_stored_unit_price from order_item where order_id = v_order_id;
  select total into v_stored_total from "order" where id = v_order_id;

  -- Assert: the order was priced from product_variant, not the payload.
  if v_stored_unit_price = v_real_price and v_stored_total = v_real_price then
    raise notice 'PASS: order priced at % (real price), tampered payload value % was ignored', v_stored_unit_price, v_tampered_price;
  else
    raise exception 'FAIL: order priced at % / total %, expected % — price tampering is NOT fixed', v_stored_unit_price, v_stored_total, v_real_price;
  end if;

  -- Cleanup.
  delete from "order" where id = v_order_id; -- cascades to order_item, payment
  delete from product where id = v_product_id; -- cascades to product_variant
  delete from product_category where id = v_category_id;
  delete from customer where id = v_customer_id;
end $$;
