import { useEffect, useMemo, useState } from 'react';
import { ImageOff, PackageOpen, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button.jsx';
import { toast } from '../components/ui/toast.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../components/ui/input-group.jsx';

const AVAILABILITY_LABELS = { in_stock: 'In stock', made_to_order: 'Made to order', unavailable: 'Unavailable' };

export default function ProductsList() {
  const [products, setProducts] = useState(null);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [savingId, setSavingId] = useState(null);

  function load() {
    supabase.from('product').select('*, product_category(id, name), product_variant(id), product_image(id, url, alt_text, is_primary, sort_order)').order('sort_order')
      .then(({ data, error }) => setProducts(error ? [] : data));
  }

  useEffect(() => {
    load();
    supabase.from('product_category').select('id, name').order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  async function updateProduct(product, patch) {
    setSavingId(product.id);
    const { error } = await supabase.from('product').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', product.id);
    if (error) toast.error('Product was not updated', { description: error.message });
    await load();
    setSavingId(null);
  }

  const filtered = useMemo(() => (products || [])
    .filter((product) => categoryFilter === 'all' || product.category_id === categoryFilter)
    .filter((product) => availabilityFilter === 'all' || product.availability === availabilityFilter)
    .filter((product) => {
      const query = search.trim().toLowerCase();
      return !query || product.name.toLowerCase().includes(query) || product.slug.toLowerCase().includes(query);
    }), [products, search, categoryFilter, availabilityFilter]);

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Manage product visibility, availability, pricing, variants, and imagery."
        actions={<Button asChild size="sm"><Link to="/admin/products/new"><Plus size={16} aria-hidden="true" />Add product</Link></Button>}
      />

      <AdminToolbar>
        <label className="admin-search-field"><span>Search</span><InputGroup><InputGroupInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or slug" /><InputGroupAddon><Search size={16} aria-hidden="true" /></InputGroupAddon></InputGroup></label>
        <label><span>Category</span><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span>Availability</span><select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)}><option value="all">All availability</option><option value="in_stock">In stock</option><option value="made_to_order">Made to order</option><option value="unavailable">Unavailable</option></select></label>
        {(search || categoryFilter !== 'all' || availabilityFilter !== 'all') && <button className="admin-clear-button" type="button" onClick={() => { setSearch(''); setCategoryFilter('all'); setAvailabilityFilter('all'); }}>Clear filters</button>}
      </AdminToolbar>

      {products === null ? <AdminLoading label="Loading products…" /> : (
        <section className="admin-panel admin-panel--table">
          <div className="admin-panel__header"><div><h2>Product catalogue</h2><p>{filtered.length} product{filtered.length === 1 ? '' : 's'} in this view</p></div></div>
          {filtered.length ? <div className="admin-table-wrap"><table className="admin-table admin-product-table"><thead><tr><th>Product</th><th>Category</th><th>Setup</th><th>Availability</th><th>Visibility</th><th aria-label="Actions" /></tr></thead><tbody>
            {filtered.map((product) => {
              const image = [...(product.product_image || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
              return <tr key={product.id}>
                <td><div className="admin-product-cell"><span className="admin-product-thumb">{image?.url ? <img src={image.url} alt="" loading="lazy" /> : <ImageOff size={17} aria-hidden="true" />}</span><span><Link to={`/admin/products/${product.id}`}><strong>{product.name}</strong></Link><small>{product.base_price === null ? 'Price TBC' : fmtNaira(product.base_price)}</small></span></div></td>
                <td>{product.product_category?.name || 'Uncategorised'}</td>
                <td>{product.product_variant?.length || 0} variants<small>{product.product_image?.length || 0} images</small></td>
                <td><select className="admin-table__select" value={product.availability} disabled={savingId === product.id} onChange={(event) => updateProduct(product, { availability: event.target.value })} aria-label={`Update ${product.name} availability`}>{Object.entries(AVAILABILITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td>
                <td><AdminStatusBadge status={product.is_active ? 'active' : 'inactive'}>{product.is_active ? 'Active' : 'Archived'}</AdminStatusBadge></td>
                <td className="is-numeric"><button type="button" className="admin-row-action" disabled={savingId === product.id} onClick={() => updateProduct(product, { is_active: !product.is_active })}>{product.is_active ? 'Archive' : 'Restore'}</button></td>
              </tr>;
            })}
          </tbody></table></div> : <AdminEmpty icon={PackageOpen}>No products match these filters.</AdminEmpty>}
        </section>
      )}
    </AdminPage>
  );
}
