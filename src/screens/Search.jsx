import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import { fmtNaira } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';

// §3: "Type-ahead suggesting product names after 2 characters" — results
// filter live as the customer types, no submit required. The URL `q` param
// is kept in sync (replace, not push) so a search is still shareable/
// deep-linkable without spamming browser history on every keystroke.
export default function Search() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const { data: products, loading: productsLoading } = useProducts();
  const { data: categories } = useCategories();

  useEffect(() => {
    const id = setTimeout(() => {
      setParams(input ? { q: input } : {}, { replace: true });
      if (input.trim().length >= 2) trackEvent('search_performed', { query: input.trim() });
    }, 250);
    return () => clearTimeout(id);
  }, [input, setParams]);

  const query = input.trim();
  const results = useMemo(() => {
    if (query.length < 2 || !products) return [];
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q));
  }, [query, products]);
  const suggestions = query.length >= 2 ? results.slice(0, 5) : [];

  return (
    <div className="container" style={{ padding: '56px 0 96px' }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 24 }}>Search</h1>
      <div style={{ marginBottom: 40, maxWidth: 480 }}>
        <label className="visually-hidden" htmlFor="search-q">Search products</label>
        <input
          id="search-q" type="search" value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Search for banana bread, brownies, small chops..." style={{ width: '100%', borderRadius: 999 }} autoFocus
        />
      </div>

      {suggestions.length > 0 && (
        <div style={{ margin: '-20px 0 36px', maxWidth: 560 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 }}>Suggestions</div>
          <div className="card" style={{ padding: 8, display: 'flex', flexDirection: 'column' }}>
            {suggestions.map((p) => (
              <Link
                key={p.slug}
                to={`/product/${p.slug}`}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 14px', borderRadius: 10, color: 'inherit', textDecoration: 'none' }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</span>
                <span style={{ fontSize: 13, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                  {p.startingPrice === null ? 'Price TBC' : fmtNaira(p.startingPrice)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {query.length < 2 ? (
        <PopularCategories categories={categories} />
      ) : productsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 260 }} />)}
        </div>
      ) : results.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {results.map((p) => <ProductCard key={p.slug} product={p} />)}
        </div>
      ) : (
        <>
          <EmptyState title={`No results for "${query}"`} desc="Try one of our popular categories instead:" />
          <PopularCategories categories={categories} />
        </>
      )}
    </div>
  );
}

function PopularCategories({ categories }) {
  if (!categories) return null;
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>Popular Categories</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <Link key={c.id} to={`/menu/${c.id}`} className="btn btn-secondary btn-sm">{c.name}</Link>
        ))}
      </div>
    </div>
  );
}
