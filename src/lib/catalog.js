// Supabase-backed catalogue queries. Replaces the old static in-memory
// arrays — shapes returned here are kept as close as possible to the old
// static shapes so page components barely change (see src/hooks/useCatalog.js
// for the React-facing layer).

import { supabase } from './supabaseClient.js';

const AVAILABILITY_LABEL = {
  in_stock: 'In Stock',
  made_to_order: 'Made to order',
  unavailable: 'Currently unavailable',
};

// Fixed brand swatch colours for banana bread toppings — cosmetic design-
// system detail, not admin-editable business content, so it lives here
// rather than as a database column.
const TOPPING_COLORS = {
  plain: '#D8CBBE',
  oreos: '#321A17',
  'double-chocolate': '#684234',
  coconut: '#FFFDF8',
  'nuts-crunch': '#B48765',
  biscoff: '#69704A',
  raisins: '#93412E',
};

const LAUNCH_FEATURED = [
  { slug: 'small-chops-platter', tag: 'Solo Survivor Platter' },
  { slug: 'signature-banana-bread', tag: 'Medium Banana Bread' },
  { slug: 'brownie-box', tag: 'Box of 4 Brownies' },
  { slug: 'cake-parfait', tag: 'Chocolate Cake Parfait' },
];

const LAUNCH_BESTSELLERS = [
  'signature-banana-bread',
  'small-chops-platter',
  'brownie-box',
  'mixed-pastry-tray',
];

function mapProductRow(row) {
  const primaryImage = row.product_image?.find((i) => i.is_primary) || row.product_image?.[0];
  const galleryImages = (row.product_image || [])
    .map((i) => ({ url: i.url, alt: i.alt_text || row.name, isPrimary: i.is_primary }))
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.product_category?.slug,
    categoryId: row.category_id,
    startingPrice: row.base_price,
    priceFrom: row.price_from,
    desc: row.description,
    image: primaryImage?.url || null,
    galleryImages,
    badge: row.badge,
    availability: AVAILABILITY_LABEL[row.availability] || row.availability,
    outOfStock: row.availability === 'unavailable',
    configurator: row.configurator,
    minQty: row.min_qty,
    ingredientsNote: row.ingredients_note,
    allergenNote: row.allergen_note,
    storageNote: row.storage_note,
  };
}

const PRODUCT_SELECT = '*, product_image(url, alt_text, is_primary), product_category(slug)';

export async function getCategories() {
  const { data, error } = await supabase
    .from('product_category')
    .select('id, slug, name, description, image_url, sort_order')
    .order('sort_order');
  if (error) throw error;
  return data.map((c) => ({ id: c.slug, name: c.name, desc: c.description, image: c.image_url }));
}

export async function getProducts() {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data.map(mapProductRow);
}

export async function findProduct(slug) {
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProductRow(data) : null;
}

export async function relatedProducts(slug, count = 4) {
  const current = await findProduct(slug);
  if (!current) return [];
  // Filter on product.category_id directly — a `.eq()` on an embedded
  // relation (product_category.slug) does NOT filter the parent row set in
  // PostgREST, it only affects which nested rows are embedded, so an
  // earlier version of this query silently returned any active product
  // regardless of category (confirmed against the live project).
  const { data, error } = await supabase
    .from('product')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('category_id', current.categoryId)
    .neq('slug', slug)
    .limit(count);
  if (error) throw error;
  return data.map(mapProductRow);
}

export async function getHomepageBestsellers() {
  const [{ data: content }, products] = await Promise.all([
    supabase.from('site_content').select('value').eq('key', 'homepage_bestsellers').maybeSingle(),
    getProducts(),
  ]);
  const slugs = Array.isArray(content?.value) && content.value.length > 0 ? content.value : LAUNCH_BESTSELLERS;
  return slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean);
}

export async function getHomepageFeatured() {
  const [{ data: content }, products] = await Promise.all([
    supabase.from('site_content').select('value').eq('key', 'homepage_featured').maybeSingle(),
    getProducts(),
  ]);
  const entries = Array.isArray(content?.value) && content.value.length > 0 ? content.value : LAUNCH_FEATURED;
  return entries
    .map((e) => {
      const p = products.find((x) => x.slug === e.slug);
      return p ? { ...p, tag: e.tag } : null;
    })
    .filter(Boolean);
}

export async function getHomepageReviews(count = 3) {
  const { data, error } = await supabase
    .from('review')
    .select('id, rating, comment, product(name, slug)')
    .eq('status', 'published')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(count);
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    productName: r.product?.name,
    productSlug: r.product?.slug,
  }));
}

export async function getProductReviews(productSlug, count = 6) {
  const product = await findProduct(productSlug);
  if (!product) return [];
  const { data, error } = await supabase
    .from('review')
    .select('id, rating, comment, created_at')
    .eq('product_id', product.id)
    .eq('status', 'published')
    .not('comment', 'is', null)
    .order('created_at', { ascending: false })
    .limit(count);
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

// Reshapes raw product_variant rows into the same nested structure each
// configurator in ProductDetail.jsx already expects, so configurator logic
// itself doesn't need to change — only where the rules come from.
export async function getVariantRules(productSlug, configurator) {
  const product = await findProduct(productSlug);
  if (!product) return null;

  const { data: rows, error } = await supabase
    .from('product')
    .select('id, product_variant(*)')
    .eq('slug', productSlug)
    .maybeSingle();
  if (error) throw error;
  const variants = (rows?.product_variant || []).filter((v) => v.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const byType = (type) => variants.filter((v) => v.variant_type === type);

  if (configurator === 'banana-bread') {
    const mixedByValue = Object.fromEntries(byType('size_mixed').map((v) => [v.variant_value, v.price_override]));
    return {
      sizes: byType('size').map((v) => ({
        id: v.variant_value, label: v.label, price: v.price_override, minQty: v.min_qty || 1,
        mixedPrice: mixedByValue[v.variant_value] ?? null,
      })),
      toppings: byType('topping').map((v) => ({
        id: v.variant_value, label: v.label, image: v.image_url, color: TOPPING_COLORS[v.variant_value] || '#D8CBBE',
      })),
      mixedAllowedSizes: byType('size').filter((v) => v.is_mixed_allowed).map((v) => v.variant_value),
      mixedImage: product.image,
    };
  }

  if (configurator === 'brownies') {
    return {
      sizes: byType('size').map((v) => ({ id: v.variant_value, label: v.label, price: v.price_override, image: v.image_url })),
      flavours: byType('flavour').map((v) => ({ id: v.variant_value, label: v.label })),
    };
  }

  if (configurator === 'small-chops') {
    return {
      platters: byType('platter').map((v) => ({
        id: v.variant_value, label: v.label, price: v.price_override, desc: v.description, image: v.image_url,
      })),
    };
  }

  if (configurator === 'pastries') {
    return {
      options: byType('option').map((v) => ({ id: v.variant_value, label: v.label, price: v.price_override, image: v.image_url })),
      pieceCountNote: 'Piece count: TBC',
    };
  }

  if (configurator === 'cake') {
    return {
      flavours: byType('flavour').map((v) => ({ id: v.variant_value, label: v.label, image: v.image_url })),
      sizes: byType('size').map((v) => ({ id: v.variant_value, label: v.label, price: v.price_override })),
      priceNote: 'Pricing TBC — the team will confirm before payment.',
    };
  }

  return null;
}
