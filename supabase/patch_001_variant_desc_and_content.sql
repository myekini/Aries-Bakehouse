-- Patch: run once after schema.sql + seed.sql.
-- 1. Adds a description column to product_variant (used for small-chops
--    platter blurbs like "Sized for one.") — missed in the original schema.
-- 2. Seeds site_content rows for the homepage announcement, promo banner,
--    and curated bestseller/featured picks (spec §5/§14).

alter table product_variant add column if not exists description text;

update product_variant set description = v.description
from (values
  ('solo-survivor',    'Sized for one.'),
  ('small-platter',    'Sized for a small get-together.'),
  ('large-platter',    'Spring rolls, samosa, chicken, puff-puff, dips.'),
  ('chop-responsibly', 'Full event platter for a big gathering.')
) as v(variant_value, description)
where product_variant.variant_value = v.variant_value
  and product_variant.variant_type = 'platter';

insert into site_content (key, value) values
  ('announcement_bar', '{"active": true, "text": "Orders require 24 hours notice."}'),
  ('promo_banner', '{"active": true, "eyebrow": "This Month", "title": "Order a Cake Parfait bundle for your next gathering.", "href": "/menu/cake-treats", "cta": "Browse Cake Treats"}'),
  ('homepage_bestsellers', '["signature-banana-bread","small-chops-platter","brownie-box","mixed-pastry-tray"]'),
  ('homepage_featured', '[
    {"slug":"small-chops-platter","tag":"Bestseller"},
    {"slug":"signature-banana-bread","tag":"Signature"},
    {"slug":"brownie-box","tag":"Gift Box"},
    {"slug":"cake-parfait","tag":"New"}
  ]')
on conflict (key) do update set value = excluded.value;
