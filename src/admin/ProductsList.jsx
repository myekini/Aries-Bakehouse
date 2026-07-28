import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

export default function ProductsList() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  function load() {
    supabase.from('product').select('*, product_category(id, name), product_variant(id), product_image(id)').order('sort_order')
      .then(({ data, error }) => setProducts(error ? [] : data));
  }
  useEffect(() => {
    load();
    supabase.from('product_category').select('id, name').order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  async function updateProduct(product, patch) {
    await supabase.from('product').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', product.id);
    load();
  }

  if (products === null) return <div>Loading…</div>;

  const filtered = products
    .filter((p) => categoryFilter === 'all' || p.category_id === categoryFilter)
    .filter((p) => availabilityFilter === 'all' || p.availability === availabilityFilter)
    .filter((p) => {
      const q = search.trim().toLowerCase();
      return !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
    });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>Products</h1>
        <Link to="/admin/products/new" className="btn btn-primary btn-sm">Add Product</Link>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." aria-label="Search products" style={{ flex: '1 1 220px', borderRadius: 999 }} />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ borderRadius: 8 }}>
          <option value="all">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={availabilityFilter} onChange={(e) => setAvailabilityFilter(e.target.value)} style={{ borderRadius: 8 }}>
          <option value="all">All availability</option>
          <option value="in_stock">In Stock</option>
          <option value="made_to_order">Made to order</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)' }}>
            <div>
              <Link to={`/admin/products/${p.id}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-choc)', textDecoration: 'none' }}>{p.name}</Link>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {p.product_category?.name} · {p.base_price === null ? 'Price TBC' : fmtNaira(p.base_price)}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {p.product_variant?.length || 0} variant(s)<br />{p.product_image?.length || 0} image(s)
            </div>
            <select value={p.availability} onChange={(e) => updateProduct(p, { availability: e.target.value })} aria-label={`Update ${p.name} availability`} style={{ borderRadius: 8 }}>
              <option value="in_stock">In Stock</option>
              <option value="made_to_order">Made to order</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <button onClick={() => updateProduct(p, { is_active: !p.is_active })} className="btn btn-secondary btn-sm">
              {p.is_active ? 'Archive' : 'Restore'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No products match these filters.</div>}
      </div>
    </div>
  );
}
