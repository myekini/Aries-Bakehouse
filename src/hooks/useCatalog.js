import { useEffect, useState } from 'react';
import * as catalog from '../lib/catalog.js';

// Tiny shared async-effect helper — every hook below follows the same
// loading/error/data shape, matching the "loading grid/gallery" states the
// spec already anticipated (§4/§6) for once the catalogue became real data.
function useAsync(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    fn()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((error) => { if (!cancelled) setState({ data: null, loading: false, error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

export function useCategories() {
  return useAsync(() => catalog.getCategories(), []);
}

export function useProducts() {
  return useAsync(() => catalog.getProducts(), []);
}

export function useProduct(slug) {
  const { data, loading, error } = useAsync(async () => {
    const product = await catalog.findProduct(slug);
    if (!product) return null;
    const rules = product.configurator ? await catalog.getVariantRules(slug, product.configurator) : null;
    return { product, rules };
  }, [slug]);

  return { product: data?.product ?? null, rules: data?.rules ?? null, loading, error };
}

export function useRelatedProducts(slug, count = 4) {
  return useAsync(() => catalog.relatedProducts(slug, count), [slug, count]);
}

export function useHomepageBestsellers() {
  return useAsync(() => catalog.getHomepageBestsellers(), []);
}

export function useHomepageFeatured() {
  return useAsync(() => catalog.getHomepageFeatured(), []);
}

export function useHomepageReviews(count = 3) {
  return useAsync(() => catalog.getHomepageReviews(count), [count]);
}

export function useProductReviews(slug, count = 6) {
  return useAsync(() => catalog.getProductReviews(slug, count), [slug, count]);
}
