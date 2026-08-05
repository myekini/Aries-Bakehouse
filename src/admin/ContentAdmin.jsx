import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { fmtNaira } from '../lib/format.js';
import { AdminField, AdminFormGrid, AdminLoading, AdminNotice, AdminPage, AdminPageHeader, AdminPanel } from './AdminPrimitives.jsx';

const DEFAULT_ANNOUNCEMENT = { active: true, text: 'Orders require 24 hours notice.' };
const DEFAULT_PROMO = { active: true, eyebrow: 'This Month', title: 'Order a Cake Parfait bundle for your next gathering.', href: '/menu/cake-treats', cta: 'Browse Cake Treats' };

function primaryImage(product) {
  return [...(product?.product_image || [])].sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0]?.url;
}

function ProductSelector({ products, entries, onChange, featured = false }) {
  const [query, setQuery] = useState('');
  const selectedSlugs = entries.map((entry) => featured ? entry.slug : entry);
  const matches = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return products.filter((product) => !selectedSlugs.includes(product.slug) && `${product.name} ${product.slug}`.toLowerCase().includes(term)).slice(0, 6);
  }, [products, query, selectedSlugs]);

  function add(product) {
    onChange([...entries, featured ? { slug: product.slug, tag: '' } : product.slug]);
    setQuery('');
  }

  function move(index, direction) {
    const next = [...entries];
    const destination = index + direction;
    if (destination < 0 || destination >= next.length) return;
    [next[index], next[destination]] = [next[destination], next[index]];
    onChange(next);
  }

  return <div className="admin-product-selector">
    <div className="admin-product-selector__search">
      <Search size={17} aria-hidden="true" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products by name…" aria-label="Search products to add" />
    </div>
    {query && <div className="admin-product-selector__results" aria-live="polite">
      {matches.length ? matches.map((product) => <button type="button" key={product.id} onClick={() => add(product)}>
        {primaryImage(product) ? <img src={primaryImage(product)} alt="" /> : <span className="admin-product-selector__placeholder" />}
        <span><strong>{product.name}</strong><small>{product.is_active ? product.availability.replaceAll('_', ' ') : 'Archived'}</small></span>
        <Plus size={17} aria-hidden="true" />
      </button>) : <p>No unselected products match “{query}”.</p>}
    </div>}
    <div className="admin-selection-list">
      {entries.length ? entries.map((entry, index) => {
        const slug = featured ? entry.slug : entry;
        const product = products.find((item) => item.slug === slug);
        return <div className="admin-selection-item" key={`${slug}-${index}`}>
          <span className="admin-selection-item__position">{index + 1}</span>
          {primaryImage(product) ? <img src={primaryImage(product)} alt="" /> : <span className="admin-product-selector__placeholder" />}
          <div className="admin-selection-item__body">
            <strong>{product?.name || slug}</strong>
            <small>{product ? (product.is_active ? slug : `${slug} · archived`) : `${slug} · product missing`}</small>
            {featured && <label><span>Card label</span><input value={entry.tag || ''} onChange={(event) => onChange(entries.map((item, itemIndex) => itemIndex === index ? { ...item, tag: event.target.value } : item))} placeholder="e.g. Crowd favourite" /></label>}
          </div>
          <div className="admin-selection-item__actions">
            <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label={`Move ${product?.name || slug} up`}><ArrowUp size={16} /></button>
            <button type="button" onClick={() => move(index, 1)} disabled={index === entries.length - 1} aria-label={`Move ${product?.name || slug} down`}><ArrowDown size={16} /></button>
            <button type="button" onClick={() => onChange(entries.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${product?.name || slug}`}><Trash2 size={16} /></button>
          </div>
        </div>;
      }) : <div className="admin-selection-empty">No products selected. Search above to add the first one.</div>}
    </div>
  </div>;
}

function StorefrontPreview({ announcement, promo, featured, products }) {
  const visible = featured.map((entry) => ({ entry, product: products.find((item) => item.slug === entry.slug) })).filter(({ product }) => product);
  return <div className="admin-storefront-preview">
    <div className="admin-storefront-preview__chrome"><span /><span /><span /><strong>Homepage preview</strong></div>
    {announcement.active && <div className="admin-storefront-preview__announcement">{announcement.text || 'Announcement text'}</div>}
    <div className="admin-storefront-preview__hero"><small>{promo.eyebrow || 'Promotion'}</small><h3>{promo.title || 'Your promotion headline'}</h3>{promo.active && <span>{promo.cta || 'Call to action'}</span>}</div>
    <div className="admin-storefront-preview__section"><small>Fresh picks</small><div>{visible.length ? visible.slice(0, 4).map(({ entry, product }) => <article key={product.id}>
      {primaryImage(product) ? <img src={primaryImage(product)} alt="" /> : <span className="admin-storefront-preview__image" />}
      <p>{entry.tag || 'Featured'}</p><strong>{product.name}</strong><small>{product.base_price == null ? 'Price TBC' : `${product.price_from ? 'From ' : ''}${fmtNaira(product.base_price)}`}</small>
    </article>) : <p className="admin-storefront-preview__empty">Select featured products to populate this preview.</p>}</div></div>
  </div>;
}

export default function ContentAdmin() {
  const [announcement, setAnnouncement] = useState(DEFAULT_ANNOUNCEMENT);
  const [promo, setPromo] = useState(DEFAULT_PROMO);
  const [bestsellers, setBestsellers] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from('site_content').select('*').in('key', ['announcement_bar', 'promo_banner', 'homepage_bestsellers', 'homepage_featured']),
      supabase.from('product').select('id, slug, name, base_price, price_from, availability, is_active, product_image(url, is_primary, sort_order)').order('name'),
    ]).then(([contentResult, productResult]) => {
      const row = (key) => contentResult.data?.find((item) => item.key === key)?.value;
      setAnnouncement({ ...DEFAULT_ANNOUNCEMENT, ...(row('announcement_bar') || {}) });
      setPromo({ ...DEFAULT_PROMO, ...(row('promo_banner') || {}) });
      setBestsellers(Array.isArray(row('homepage_bestsellers')) ? row('homepage_bestsellers') : []);
      setFeatured(Array.isArray(row('homepage_featured')) ? row('homepage_featured') : []);
      setProducts(productResult.data || []);
      if (contentResult.error || productResult.error) toast.error('Some content could not be loaded');
      setLoading(false);
    });
  }, []);

  async function saveValue(key, value) {
    setSaving(key);
    const { error } = await supabase.from('site_content').upsert({ key, value, updated_at: new Date().toISOString() });
    setSaving('');
    if (error) toast.error('Content was not saved', { description: error.message });
    else toast.success('Storefront content saved');
  }

  const unavailableSelections = [...bestsellers, ...featured.map((item) => item.slug)].filter((slug, index, values) => values.indexOf(slug) === index && !products.find((product) => product.slug === slug && product.is_active));

  return <AdminPage className="admin-content-editor">
    <AdminPageHeader eyebrow="Storefront" title="Homepage content" description="Shape what customers see without editing code or structured data." actions={<Link to="/" target="_blank" className="btn btn-secondary btn-sm">Open storefront <ExternalLink size={15} /></Link>} />
    {loading ? <AdminLoading label="Loading site content…" /> : <div className="admin-content-layout">
      <div className="admin-content-layout__editor">
        {unavailableSelections.length > 0 && <AdminNotice tone="warning">{unavailableSelections.length} selected product{unavailableSelections.length === 1 ? ' is' : 's are'} archived or missing. Remove or replace {unavailableSelections.length === 1 ? 'it' : 'them'} before publishing.</AdminNotice>}
        <AdminPanel title="Announcement bar" description="Keep this short and operational. It appears above the main navigation.">
          <label className="admin-switch"><input type="checkbox" checked={announcement.active} onChange={(event) => setAnnouncement((value) => ({ ...value, active: event.target.checked }))} /><span aria-hidden="true" /><strong>Show announcement</strong></label>
          <AdminField label="Announcement text" className="admin-field--full"><input value={announcement.text} onChange={(event) => setAnnouncement((value) => ({ ...value, text: event.target.value }))} placeholder="Orders require 24 hours notice." /></AdminField>
          <div className="admin-panel__footer"><button type="button" className="btn btn-primary" disabled={saving === 'announcement_bar'} onClick={() => saveValue('announcement_bar', announcement)}>Save announcement</button></div>
        </AdminPanel>
        <AdminPanel title="Homepage promotion" description="The seasonal message and action shown near the top of the homepage.">
          <label className="admin-switch"><input type="checkbox" checked={promo.active} onChange={(event) => setPromo((value) => ({ ...value, active: event.target.checked }))} /><span aria-hidden="true" /><strong>Show promotion</strong></label>
          <AdminFormGrid>
            <AdminField label="Short label"><input value={promo.eyebrow} onChange={(event) => setPromo((value) => ({ ...value, eyebrow: event.target.value }))} placeholder="This month" /></AdminField>
            <AdminField label="Destination" hint="Use a storefront path beginning with /"><input value={promo.href} onChange={(event) => setPromo((value) => ({ ...value, href: event.target.value }))} placeholder="/menu/cake-treats" /></AdminField>
            <AdminField label="Button label"><input value={promo.cta} onChange={(event) => setPromo((value) => ({ ...value, cta: event.target.value }))} placeholder="Browse cake treats" /></AdminField>
            <AdminField label="Headline" className="admin-field--full"><Textarea value={promo.title} onChange={(event) => setPromo((value) => ({ ...value, title: event.target.value }))} /></AdminField>
          </AdminFormGrid>
          <div className="admin-panel__footer"><button type="button" className="btn btn-primary" disabled={saving === 'promo_banner'} onClick={() => saveValue('promo_banner', promo)}>Save promotion</button></div>
        </AdminPanel>
        <AdminPanel title="Homepage bestsellers" description="Choose the fallback bestseller order shown before enough sales data is available.">
          <ProductSelector products={products} entries={bestsellers} onChange={setBestsellers} />
          <div className="admin-panel__footer"><span>{bestsellers.length} selected</span><button type="button" className="btn btn-primary" disabled={saving === 'homepage_bestsellers' || unavailableSelections.some((slug) => bestsellers.includes(slug))} onClick={() => saveValue('homepage_bestsellers', bestsellers)}>Publish bestsellers</button></div>
        </AdminPanel>
        <AdminPanel title="Featured products" description="Choose and order the product cards in Fresh picks, then add a short customer-facing label.">
          <ProductSelector products={products} entries={featured} onChange={setFeatured} featured />
          <div className="admin-panel__footer"><span>{featured.length} selected</span><button type="button" className="btn btn-primary" disabled={saving === 'homepage_featured' || unavailableSelections.some((slug) => featured.some((item) => item.slug === slug))} onClick={() => saveValue('homepage_featured', featured)}>Publish featured products</button></div>
        </AdminPanel>
      </div>
      <aside className="admin-content-layout__preview"><StorefrontPreview announcement={announcement} promo={promo} featured={featured} products={products} /><p>Preview updates as you edit. Use “Open storefront” to verify the published page.</p></aside>
    </div>}
  </AdminPage>;
}
