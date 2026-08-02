-- Retire Cookies and point existing catalogue rows at the approved configurator imagery.

update product
set is_active = false
where slug = 'cookie-pack';

update product_category
set name = 'Brownies',
    description = 'Fudgy boxes in five rich flavours.'
where slug = 'brownies-cookies';

update product_category
set image_url = '/uploads/aries11-pastries-mixedtray-complete.webp'
where slug = 'pastries';

update product_variant v
set image_url = values_map.image_url
from product p,
  (values
    ('biscoff',         '/uploads/aries11-brownie-biscoff-single.webp'),
    ('oreos',           '/uploads/aries11-brownie-oreos-single.webp'),
    ('coconut-crunch',  '/uploads/aries11-brownie-coconutcrunch-single.webp'),
    ('dark-chocolate',  '/uploads/aries11-brownie-darkchocolate-single.webp'),
    ('white-chocolate', '/uploads/aries11-brownie-whitechocolate-single.webp')
  ) as values_map(variant_value, image_url)
where v.product_id = p.id
  and p.slug = 'brownie-box'
  and v.variant_type = 'flavour'
  and v.variant_value = values_map.variant_value;

update product_variant v
set image_url = '/uploads/aries11-smallchops-platter-small.webp'
from product p
where v.product_id = p.id
  and p.slug = 'small-chops-platter'
  and v.variant_type = 'platter'
  and v.variant_value = 'small-platter';

update product_variant v
set image_url = values_map.image_url
from product p,
  (values
    ('suya-pie',      '/uploads/aries11-pastries-suyapie-single.webp'),
    ('fish-pie',      '/uploads/aries11-pastries-fishpie-single.webp'),
    ('sausage-rolls', '/uploads/aries11-pastries-sausageroll-single.webp'),
    ('mixed',         '/uploads/aries11-pastries-mixedtray-complete.webp')
  ) as values_map(variant_value, image_url)
where v.product_id = p.id
  and p.slug = 'mixed-pastry-tray'
  and v.variant_type = 'option'
  and v.variant_value = values_map.variant_value;

update product_image i
set url = '/uploads/aries11-pastries-mixedtray-complete.webp'
from product p
where i.product_id = p.id
  and p.slug = 'mixed-pastry-tray'
  and i.is_primary = true;

update product_image i
set url = '/uploads/aries11-pastries-sausageroll-single.webp'
from product p
where i.product_id = p.id
  and p.slug = 'sausage-rolls'
  and i.is_primary = true;
