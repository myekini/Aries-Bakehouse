import { useEffect, useState } from 'react';
import * as catalog from '../lib/catalog.js';

// Tiny shared async-effect helper — every hook below follows the same
// loading/error/data shape, matching the "loading grid/gallery" states the
// spec already anticipated (§4/§6) for once the catalogue became real data.
//
// `initial`, when passed, is server-fetched data (see e.g. src/app/page.jsx,
// a Server Component that awaits catalog.js directly under an ISR
// `revalidate`) — when present, the hook seeds state from it and skips the
// client-side fetch entirely, so the page renders with data on first paint
// instead of a loading skeleton, and doesn't double-fetch what the server
// already fetched. Callers that don't pass `initial` keep fetching
// client-side exactly as before.
function useAsync(fn, deps, initial) {
  const [state, setState] = useState(
    initial !== undefined ? { data: initial, loading: false, error: null } : { data: null, loading: true, error: null },
  );

  useEffect(() => {
    if (initial !== undefined) return;
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

export function useCategories(initial) {
  return useAsync(() => catalog.getCategories(), [], initial);
}

export function useProducts(initial) {
  return useAsync(() => catalog.getProducts(), [], initial);
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

export function useHomepageBestsellers(initial) {
  return useAsync(() => catalog.getHomepageBestsellers(), [], initial);
}

export function useHomepageFeatured(initial) {
  return useAsync(() => catalog.getHomepageFeatured(), [], initial);
}

export function useHomepageReviews(count = 3) {
  return useAsync(() => catalog.getHomepageReviews(count), [count]);
}

export function useProductReviews(slug, count = 6) {
  return useAsync(() => catalog.getProductReviews(slug, count), [slug, count]);
}
