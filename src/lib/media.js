const BOXED_PRODUCT_SLUGS = new Set(['brownie-box']);
const BOXED_PRODUCT_CATEGORIES = new Set(['brownies-cookies']);

export const BANANA_BREAD_SINGLE_FALLBACK = '/uploads/aries11-bananabread-topping-plain.png';
export const RETIRED_BANANA_BREAD_COLLECTION = '/uploads/aries11-bananabread-collection-fullrange.png';

const RETIRED_IMAGE_REPLACEMENTS = {
  [RETIRED_BANANA_BREAD_COLLECTION]: BANANA_BREAD_SINGLE_FALLBACK,
  '/uploads/aries11-pastries-mixedtray.png': '/uploads/aries11-pastries-mixedtray-complete.webp',
};

const CATEGORY_IMAGE_FALLBACKS = {
  'banana-bread': BANANA_BREAD_SINGLE_FALLBACK,
  'small-chops': '/uploads/aries11-smallchops-platter-large.webp',
  'brownies-cookies': '/uploads/aries11-brownies-box-9-biscoff.webp',
  pastries: '/uploads/aries11-pastries-mixedtray-complete.webp',
  'cake-treats': '/uploads/aries11-caketreats-parfait-redvelvet.png',
};

export function normalizeCatalogImage(src, category) {
  if (RETIRED_IMAGE_REPLACEMENTS[src]) return RETIRED_IMAGE_REPLACEMENTS[src];
  return src || CATEGORY_IMAGE_FALLBACKS[category] || null;
}

export function isBoxedProduct(product) {
  return BOXED_PRODUCT_SLUGS.has(product?.slug) || BOXED_PRODUCT_CATEGORIES.has(product?.category);
}

export function productImageFit(product) {
  return isBoxedProduct(product) ? 'contain' : 'cover';
}

export function productImagePadding(product) {
  return isBoxedProduct(product) ? 10 : 0;
}

export function productImageSource(product) {
  return normalizeCatalogImage(product?.image, product?.category) || '/uploads/aries11-brand-collection-hero.webp';
}
