const BOXED_PRODUCT_SLUGS = new Set(['brownie-box', 'cookie-pack']);
const BOXED_PRODUCT_CATEGORIES = new Set(['brownies-cookies']);

export function isBoxedProduct(product) {
  return BOXED_PRODUCT_SLUGS.has(product?.slug) || BOXED_PRODUCT_CATEGORIES.has(product?.category);
}

export function productImageFit(product) {
  return isBoxedProduct(product) ? 'contain' : 'cover';
}

export function productImagePadding(product) {
  return isBoxedProduct(product) ? 10 : 0;
}
