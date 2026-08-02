-- One-time seed generated from the frontend's existing src/lib/catalog.js.
-- Run once after schema.sql. Safe to re-run (uses ON CONFLICT DO NOTHING on
-- the unique slug/code columns) but will NOT update rows you've since
-- edited via the admin UI — this is a bootstrap script, not a sync tool.

-- ============================================================
-- CATEGORIES
-- ============================================================

insert into product_category (slug, name, description, image_url, sort_order) values
  ('banana-bread', 'Banana Bread', 'Ripe banana loaves, seven toppings.', '/uploads/aries11-bananabread-topping-plain.png', 1),
  ('small-chops', 'Small Chops', 'Platters for every gathering.', '/uploads/aries11-smallchops-platter-large.png', 2),
  ('brownies-cookies', 'Brownies', 'Fudgy boxes in five rich flavours.', '/uploads/aries11-brownies-box-6.png', 3),
  ('pastries', 'Pastries', 'Suya pie, fish pie, sausage rolls.', '/uploads/aries11-pastries-mixedtray-complete.webp', 4),
  ('cake-treats', 'Cake Parfait', 'Layered chocolate & red velvet cups.', '/uploads/aries11-caketreats-parfait-redvelvet.png', 5),
  ('ice-cream-twist', 'Ice Cream Cake Twist', 'Frozen twist cups, two flavours.', '/uploads/aries11-caketreats-icecreamtwist-chocolate.png', 6)
on conflict (slug) do nothing;

-- ============================================================
-- PRODUCTS
-- ============================================================

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'signature-banana-bread', id, 'Banana Bread',
  'Ripe banana loaf, brown butter and your choice of topping. Baked fresh to order.',
  1250, true, 'banana-bread', 'Bestseller', 'made_to_order', 1
from product_category where slug = 'banana-bread'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'small-chops-platter', id, 'Small Chops Platter',
  'Samosa, chicken, puff-puff and more — pick the platter sized for your gathering.',
  3700, true, 'small-chops', 'Bestseller', 'made_to_order', 1
from product_category where slug = 'small-chops'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'brownie-box', id, 'Brownie Box',
  'Fudge-centre brownies, five rich flavours, boxed to share.',
  7500, true, 'brownies', null, 'made_to_order', 1
from product_category where slug = 'brownies-cookies'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'mixed-pastry-tray', id, 'Mixed Pastry Tray',
  'Suya pie, fish pie, sausage rolls — piece count TBC.',
  4000, false, 'pastries', null, 'made_to_order', 1
from product_category where slug = 'pastries'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'sausage-rolls', id, 'Sausage Rolls',
  'Sold per unit.',
  4000, false, null, null, 'made_to_order', 1
from product_category where slug = 'pastries'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'cake-parfait', id, 'Cake Parfait',
  'Layered chocolate or red velvet cake in a cup.',
  null, false, 'cake', 'New', 'made_to_order', 1
from product_category where slug = 'cake-treats'
on conflict (slug) do nothing;

insert into product (slug, category_id, name, description, base_price, price_from, configurator, badge, availability, min_qty)
select 'ice-cream-cake-twist', id, 'Ice Cream Cake Twist',
  'Frozen twist cup, chocolate or red velvet.',
  null, false, 'cake', null, 'made_to_order', 1
from product_category where slug = 'ice-cream-twist'
on conflict (slug) do nothing;

-- Primary product images (mirrors catalog.js `image` field per product)
insert into product_image (product_id, url, alt_text, is_primary)
select id, '/uploads/aries11-bananabread-topping-plain.png', name, true from product where slug = 'signature-banana-bread'
union all
select id, '/uploads/aries11-smallchops-platter-solosurvivor.png', name, true from product where slug = 'small-chops-platter'
union all
select id, '/uploads/aries11-brownies-box-4.png', name, true from product where slug = 'brownie-box'
union all
select id, '/uploads/aries11-pastries-mixedtray-complete.webp', name, true from product where slug = 'mixed-pastry-tray'
union all
select id, '/uploads/aries11-pastries-sausageroll-single.webp', name, true from product where slug = 'sausage-rolls'
union all
select id, '/uploads/aries11-caketreats-parfait-chocolate.png', name, true from product where slug = 'cake-parfait'
union all
select id, '/uploads/aries11-caketreats-icecreamtwist-chocolate.png', name, true from product where slug = 'ice-cream-cake-twist';

-- ============================================================
-- VARIANTS — Banana Bread: sizes + toppings
-- ============================================================

insert into product_variant (product_id, variant_type, variant_value, label, price_override, min_qty, is_mixed_allowed, sort_order)
select p.id, 'size', v.value, v.label, v.price, v.min_qty, v.mixed_allowed, v.sort_order
from product p, (values
  ('mini',   'Mini',   1250, 4, false, 1),
  ('medium', 'Medium', 5000, 1, true,  2),
  ('large',  'Large',  7500, 1, true,  3)
) as v(value, label, price, min_qty, mixed_allowed, sort_order)
where p.slug = 'signature-banana-bread'
on conflict (product_id, variant_type, variant_value) do nothing;

-- Mixed-size price overrides (Medium ₦5,500 / Large ₦8,000) stored as
-- separate 'size_mixed' rows so create_order/cart logic can look up the
-- mixed price by (product, size) without overloading price_modifier
-- semantics used elsewhere (brownies' flat +0 mixed delta, etc).
insert into product_variant (product_id, variant_type, variant_value, label, price_override, sort_order)
select p.id, 'size_mixed', v.value, v.label, v.price, v.sort_order
from product p, (values
  ('medium', 'Medium (mixed)', 5500, 1),
  ('large',  'Large (mixed)',  8000, 2)
) as v(value, label, price, sort_order)
where p.slug = 'signature-banana-bread'
on conflict (product_id, variant_type, variant_value) do nothing;

insert into product_variant (product_id, variant_type, variant_value, label, image_url, sort_order)
select p.id, 'topping', v.value, v.label, v.image, v.sort_order
from product p, (values
  ('plain',            'Plain',             '/uploads/aries11-bananabread-topping-plain.png', 1),
  ('oreos',            'Oreos',             '/uploads/aries11-bananabread-topping-oreo.png', 2),
  ('double-chocolate', 'Double Chocolate',  '/uploads/aries11-bananabread-topping-doublechocolate.png', 3),
  ('coconut',          'Coconut Flakes',    '/uploads/aries11-bananabread-topping-coconutflakes.png', 4),
  ('nuts-crunch',      'Nuts Crunch',       '/uploads/aries11-bananabread-topping-nutscrunch.png', 5),
  ('biscoff',          'Biscoff',           '/uploads/aries11-bananabread-topping-biscoff.png', 6),
  ('raisins',          'Raisins',           '/uploads/aries11-bananabread-topping-raisins.png', 7)
) as v(value, label, image, sort_order)
where p.slug = 'signature-banana-bread'
on conflict (product_id, variant_type, variant_value) do nothing;

-- ============================================================
-- VARIANTS — Brownies: box sizes + flavours
-- ============================================================

insert into product_variant (product_id, variant_type, variant_value, label, price_override, image_url, sort_order)
select p.id, 'size', v.value, v.label, v.price, v.image, v.sort_order
from product p, (values
  ('4',  'Box of 4',  7500,  '/uploads/aries11-brownies-box-4.png', 1),
  ('6',  'Box of 6',  11500, '/uploads/aries11-brownies-box-6.png', 2),
  ('9',  'Box of 9',  17000, '/uploads/aries11-brownies-box-9.png', 3),
  ('16', 'Box of 16', 30000, '/uploads/aries11-brownies-box-16.png', 4)
) as v(value, label, price, image, sort_order)
where p.slug = 'brownie-box'
on conflict (product_id, variant_type, variant_value) do nothing;

insert into product_variant (product_id, variant_type, variant_value, label, image_url, sort_order)
select p.id, 'flavour', v.value, v.label, v.image, v.sort_order
from product p, (values
  ('biscoff',         'Biscoff',         '/uploads/aries11-brownie-biscoff-single.webp', 1),
  ('oreos',           'Oreos',           '/uploads/aries11-brownie-oreos-single.webp', 2),
  ('coconut-crunch',  'Coconut Crunch',  '/uploads/aries11-brownie-coconutcrunch-single.webp', 3),
  ('dark-chocolate',  'Dark Chocolate',  '/uploads/aries11-brownie-darkchocolate-single.webp', 4),
  ('white-chocolate', 'White Chocolate', '/uploads/aries11-brownie-whitechocolate-single.webp', 5)
) as v(value, label, image, sort_order)
where p.slug = 'brownie-box'
on conflict (product_id, variant_type, variant_value) do nothing;

-- ============================================================
-- VARIANTS — Small Chops: named platters
-- ============================================================

insert into product_variant (product_id, variant_type, variant_value, label, price_override, image_url, sort_order)
select p.id, 'platter', v.value, v.label, v.price, v.image, v.sort_order
from product p, (values
  ('solo-survivor',    'Solo Survivor',        3700,  '/uploads/aries11-smallchops-platter-solosurvivor.png', 1),
  ('small-platter',    'Small Platter',        7500,  '/uploads/aries11-smallchops-platter-small.webp', 2),
  ('large-platter',    'Large Event Platter',  15000, '/uploads/aries11-smallchops-platter-large.png', 3),
  ('chop-responsibly', 'Chop Responsibly',     32000, '/uploads/aries11-smallchops-platter-large-alt.png', 4)
) as v(value, label, price, image, sort_order)
where p.slug = 'small-chops-platter'
on conflict (product_id, variant_type, variant_value) do nothing;

-- ============================================================
-- VARIANTS — Pastries: single-selection options
-- ============================================================

insert into product_variant (product_id, variant_type, variant_value, label, price_override, image_url, sort_order)
select p.id, 'option', v.value, v.label, v.price, v.image, v.sort_order
from product p, (values
  ('suya-pie',      'Suya Pie',         4000, '/uploads/aries11-pastries-suyapie-single.webp', 1),
  ('fish-pie',      'Fish Pie',         4000, '/uploads/aries11-pastries-fishpie-single.webp', 2),
  ('sausage-rolls', 'Sausage Rolls',    4000, '/uploads/aries11-pastries-sausageroll-single.webp', 3),
  ('mixed',         'Mixed Selection',  4000, '/uploads/aries11-pastries-mixedtray-complete.webp', 4)
) as v(value, label, price, image, sort_order)
where p.slug = 'mixed-pastry-tray'
on conflict (product_id, variant_type, variant_value) do nothing;

-- ============================================================
-- VARIANTS — Cake Parfait / Ice Cream Cake Twist: flavour + size
-- Same flavour ids, different photography per product (parfait vs twist).
-- ============================================================

insert into product_variant (product_id, variant_type, variant_value, label, image_url, sort_order)
select p.id, 'flavour', v.value, v.label, v.image, v.sort_order
from product p, (values
  ('chocolate',   'Chocolate',   '/uploads/aries11-caketreats-parfait-chocolate.png', 1),
  ('red-velvet',  'Red Velvet',  '/uploads/aries11-caketreats-parfait-redvelvet.png', 2)
) as v(value, label, image, sort_order)
where p.slug = 'cake-parfait'
on conflict (product_id, variant_type, variant_value) do nothing;

insert into product_variant (product_id, variant_type, variant_value, label, image_url, sort_order)
select p.id, 'flavour', v.value, v.label, v.image, v.sort_order
from product p, (values
  ('chocolate',   'Chocolate',   '/uploads/aries11-caketreats-icecreamtwist-chocolate.png', 1),
  ('red-velvet',  'Red Velvet',  '/uploads/aries11-caketreats-icecreamtwist-redvelvet.png', 2)
) as v(value, label, image, sort_order)
where p.slug = 'ice-cream-cake-twist'
on conflict (product_id, variant_type, variant_value) do nothing;

-- Cake sizes: price null on both — the ₦5,200 size is marked TBC per spec §7.
insert into product_variant (product_id, variant_type, variant_value, label, price_override, sort_order)
select p.id, 'size', v.value, v.label, null, v.sort_order
from product p, (values ('small', 'Small Cup', 1), ('medium', 'Medium Cup', 2)) as v(value, label, sort_order)
where p.slug in ('cake-parfait', 'ice-cream-cake-twist')
on conflict (product_id, variant_type, variant_value) do nothing;

-- ============================================================
-- DELIVERY OPTIONS (fee/zone TBC pending brand input per spec §13)
-- ============================================================

insert into delivery_option (name, type, zone, fee, active) values
  ('Pickup — Abeokuta', 'pickup', null, 0, true),
  ('Delivery — Abeokuta', 'delivery', 'Abeokuta', 0, true) -- fee TBC, set once brand confirms
on conflict (name) do nothing;
