import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCategories, useProducts } from '../hooks/useCatalog.js';
import { fmtNaira } from '../lib/format.js';
import ProductCard from '../components/ProductCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Menu() {
  const { category: categoryFromRoute } = useParams();
  const [category, setCategory] = useState(categoryFromRoute || 'all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(35000);
  const [recentSlugs, setRecentSlugs] = useState([]);

  const { data: categories, loading: categoriesLoading } = useCategories();
  const { data: products, loading: productsLoading } = useProducts();

  // /menu and /menu/:category render the same component instance without
  // remounting — a `useState` initializer alone only reads the param once,
  // so a deep link clicked while already on /menu (e.g. from the footer)
  // left the tab stuck on whatever category was selected before.
  useEffect(() => {
    setCategory(categoryFromRoute || 'all');
  }, [categoryFromRoute]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem('aries11_recently_viewed');
      setRecentSlugs(raw ? JSON.parse(raw) : []);
    } catch (err) {
      console.error('Recently viewed load failed:', err);
      setRecentSlugs([]);
    }
  }, []);

  const filtered = useMemo(() => {
    let list = products || [];
    if (category !== 'all') list = list.filter((p) => p.category === category);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.includes(q));
    }
    list = list.filter((p) => p.startingPrice === null || p.startingPrice <= maxPrice);
    if (sort === 'price-asc') list = [...list].sort((a, b) => (a.startingPrice ?? Infinity) - (b.startingPrice ?? Infinity));
    if (sort === 'price-desc') list = [...list].sort((a, b) => (b.startingPrice ?? -Infinity) - (a.startingPrice ?? -Infinity));
    if (sort === 'newest') list = [...list].slice().reverse();
    return list;
  }, [category, search, sort, maxPrice]);

  const recentlyViewed = useMemo(() => {
    if (!products || recentSlugs.length === 0) return [];
    return recentSlugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean);
  }, [products, recentSlugs]);

  return (
    <div className="container" style={{ padding: '48px 0 96px' }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>Full Menu</h1>

      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: 'var(--color-cream)',
        borderBottom: '1px solid rgba(50,26,23,0.08)', padding: '12px 0 16px', marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <div role="tablist" aria-label="Category" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 2 }}>
          {[{ id: 'all', name: 'All' }, ...(categoriesLoading ? [] : categories)].map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={category === c.id}
              onClick={() => setCategory(c.id)}
              style={{
                padding: '10px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: category === c.id ? 'var(--color-olive)' : 'var(--color-white)',
                color: category === c.id ? 'var(--color-white)' : 'var(--color-choc)',
              }}
            >
              {c.name}
            </button>
          ))}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="visually-hidden" htmlFor="menu-search">Search products</label>
            <input id="menu-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." style={{ borderRadius: 999, width: 200 }} />
            <label className="visually-hidden" htmlFor="menu-sort">Sort by</label>
            <select id="menu-sort" value={sort} onChange={(e) => setSort(e.target.value)} style={{ borderRadius: 999 }}>
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
        <label htmlFor="max-price" style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-olive)', whiteSpace: 'nowrap' }}>
          Up to {fmtNaira(maxPrice)}
        </label>
        <input id="max-price" type="range" min="1000" max="35000" step="500" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} style={{ width: 220 }} />
      </div>

      {productsLoading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
        </div>
      ) : filtered.length > 0 ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {filtered.map((p) => <ProductCard key={p.slug} product={p} />)}
          </div>
          {recentlyViewed.length > 0 && (
            <div style={{ marginTop: 80 }}>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 24 }}>Recently Viewed</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
                {recentlyViewed.map((p) => <ProductCard key={p.slug} product={p} />)}
              </div>
            </div>
          )}
        </>
      ) : (
        <EmptyState
          title={search ? `No matches for "${search}"` : 'No products in this range'}
          desc="Try a different category or clear your filters."
          actionLabel="Browse Full Menu"
          actionTo="/menu"
        />
      )}
    </div>
  );
}
