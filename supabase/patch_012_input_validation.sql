-- Defense-in-depth input validation. None of these were exploitable
-- end-to-end (create_order() as of patch_010 already recomputes every price
-- server-side, and the app's own forms already validate email/phone
-- client-side), but a malformed row reaching the database via the RPC
-- directly — or a future bug in create_order()/admin tooling — should still
-- be rejected at the schema level rather than silently stored.
--
-- All constraints below are added NOT VALID: Postgres still enforces them
-- on every INSERT/UPDATE from this point forward (the actual goal — no new
-- bad data), but does NOT scan/reject the table's existing rows at ALTER
-- time. Adding these as normal (validated) constraints failed on a live
-- project here because some pre-existing order.customer_phone rows don't
-- match the format regex — that's pre-existing data quality, not something
-- this migration should be blocked on fixing.
--
-- To find what's currently violating a constraint (do this before trying
-- to VALIDATE it — see the bottom of this file):
--   select id, customer_phone from "order" where not (customer_phone ~ '^[0-9+()\-\s]{7,20}$');
--   select id, email from customer where email is not null and not (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
-- (swap in the relevant table/column/regex for the others.)

alter table customer
  add constraint customer_email_format check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid,
  add constraint customer_phone_format check (phone is null or phone ~ '^[0-9+()\-\s]{7,20}$') not valid;

alter table "order"
  add constraint order_customer_email_format check (customer_email is null or customer_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$') not valid,
  add constraint order_customer_phone_format check (customer_phone ~ '^[0-9+()\-\s]{7,20}$') not valid,
  add constraint order_subtotal_nonneg check (subtotal >= 0) not valid,
  add constraint order_delivery_fee_nonneg check (delivery_fee >= 0) not valid,
  add constraint order_discount_amount_nonneg check (discount_amount >= 0) not valid,
  add constraint order_total_nonneg check (total >= 0) not valid;

alter table order_item
  add constraint order_item_unit_price_nonneg check (unit_price is null or unit_price >= 0) not valid,
  add constraint order_item_line_total_nonneg check (line_total is null or line_total >= 0) not valid;

alter table cart_item
  add constraint cart_item_unit_price_nonneg check (unit_price is null or unit_price >= 0) not valid;

alter table product
  add constraint product_base_price_nonneg check (base_price is null or base_price >= 0) not valid;

alter table product_variant
  add constraint product_variant_price_override_nonneg check (price_override is null or price_override >= 0) not valid;

alter table payment
  add constraint payment_amount_nonneg check (amount >= 0) not valid;

alter table delivery_option
  add constraint delivery_option_fee_nonneg check (fee >= 0) not valid;

-- Optional follow-up, once you've either fixed or accepted the legacy rows
-- a constraint above would otherwise reject: run these one at a time to
-- make Postgres actually scan existing rows and upgrade NOT VALID to fully
-- validated. Each is independent — validating one doesn't require the
-- others to be clean.
--   alter table customer validate constraint customer_email_format;
--   alter table customer validate constraint customer_phone_format;
--   alter table "order" validate constraint order_customer_email_format;
--   alter table "order" validate constraint order_customer_phone_format;
--   alter table "order" validate constraint order_subtotal_nonneg;
--   alter table "order" validate constraint order_delivery_fee_nonneg;
--   alter table "order" validate constraint order_discount_amount_nonneg;
--   alter table "order" validate constraint order_total_nonneg;
--   alter table order_item validate constraint order_item_unit_price_nonneg;
--   alter table order_item validate constraint order_item_line_total_nonneg;
--   alter table cart_item validate constraint cart_item_unit_price_nonneg;
--   alter table product validate constraint product_base_price_nonneg;
--   alter table product_variant validate constraint product_variant_price_override_nonneg;
--   alter table payment validate constraint payment_amount_nonneg;
--   alter table delivery_option validate constraint delivery_option_fee_nonneg;
