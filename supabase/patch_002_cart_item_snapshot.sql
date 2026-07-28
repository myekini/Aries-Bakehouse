-- Adds denormalized display fields to cart_item, mirroring the
-- product_name_snapshot pattern already on order_item — so a reloaded cart
-- (e.g. after a page refresh) can render name/image without an extra join
-- back through product_variant reshaping logic.

alter table cart_item add column if not exists name_snapshot text;
alter table cart_item add column if not exists image_url text;
