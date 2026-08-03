-- Run in the Supabase SQL editor. Lists every image filename actually
-- referenced by the live database (product_image.url, product_variant.image_url,
-- product_category.image_url), so you can diff it against `ls public/uploads`
-- and know with certainty which local files are safe to delete.
--
-- How to use: run this, copy the "filename" column values into a text file
-- (one per line), then from the repo root run:
--   comm -23 <(ls public/uploads | sort) <(sort referenced.txt)
-- That prints exactly the files in public/uploads that this query did NOT
-- find referenced anywhere in the database — those are safe to remove.

select distinct regexp_replace(url, '^.*/', '') as filename
from product_image
where url is not null
union
select distinct regexp_replace(image_url, '^.*/', '') as filename
from product_variant
where image_url is not null
union
select distinct regexp_replace(image_url, '^.*/', '') as filename
from product_category
where image_url is not null
order by 1;
