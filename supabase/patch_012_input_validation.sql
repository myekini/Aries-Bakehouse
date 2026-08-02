-- Defense-in-depth input validation. None of these were exploitable
-- end-to-end (create_order() as of patch_010 already recomputes every price
-- server-side, and the app's own forms already validate email/phone
-- client-side), but a malformed row reaching the database via the RPC
-- directly — or a future bug in create_order()/admin tooling — should still
-- be rejected at the schema level rather than silently stored.

alter table customer
  add constraint customer_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint customer_phone_format check (phone is null or phone ~ '^[0-9+()\-\s]{7,20}$');

alter table "order"
  add constraint order_customer_email_format check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add constraint order_customer_phone_format check (customer_phone ~ '^[0-9+()\-\s]{7,20}$'),
  add constraint order_subtotal_nonneg check (subtotal >= 0),
  add constraint order_delivery_fee_nonneg check (delivery_fee >= 0),
  add constraint order_discount_amount_nonneg check (discount_amount >= 0),
  add constraint order_total_nonneg check (total >= 0);

alter table order_item
  add constraint order_item_unit_price_nonneg check (unit_price is null or unit_price >= 0),
  add constraint order_item_line_total_nonneg check (line_total is null or line_total >= 0);

alter table cart_item
  add constraint cart_item_unit_price_nonneg check (unit_price is null or unit_price >= 0);

alter table product
  add constraint product_base_price_nonneg check (base_price is null or base_price >= 0);

alter table product_variant
  add constraint product_variant_price_override_nonneg check (price_override is null or price_override >= 0);

alter table payment
  add constraint payment_amount_nonneg check (amount >= 0);

alter table delivery_option
  add constraint delivery_option_fee_nonneg check (fee >= 0);
