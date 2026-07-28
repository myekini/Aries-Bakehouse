import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

const EMPTY_PRODUCT = {
  slug: '', name: '', description: '', category_id: '', base_price: '', price_from: false,
  configurator: '', badge: '', availability: 'made_to_order', min_qty: 1,
  ingredients_note: 'TBC', allergen_note: 'TBC', storage_note: 'TBC',
  sort_order: 0, is_active: true,
};

const EMPTY_VARIANT = {
  variant_type: 'size', variant_value: '', label: '', price_override: '',
  price_modifier: 0, min_qty: '', image_url: '', is_mixed_allowed: false,
  sort_order: 0, is_active: true,
};

export default function ProductEdit() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const isNew = productId === 'new';
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [imageForm, setImageForm] = useState({ url: '', alt_text: '', sort_order: 0, is_primary: false });
  const [variantForm, setVariantForm] = useState(EMPTY_VARIANT);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('product_category').select('id, name').order('sort_order').then(({ data }) => setCategories(data || []));
  }, []);

  function loadProduct() {
    if (isNew) return;
    setLoading(true);
    Promise.all([
      supabase.from('product').select('*').eq('id', productId).maybeSingle(),
      supabase.from('product_image').select('*').eq('product_id', productId).order('sort_order'),
      supabase.from('product_variant').select('*').eq('product_id', productId).order('variant_type').order('sort_order'),
    ]).then(([productRes, imageRes, variantRes]) => {
      if (!productRes.error && productRes.data) setForm({ ...productRes.data, base_price: productRes.data.base_price ?? '' });
      setImages(imageRes.error ? [] : imageRes.data || []);
      setVariants(variantRes.error ? [] : variantRes.data || []);
      setLoading(false);
    });
  }

  useEffect(loadProduct, [productId, isNew]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }
  function setVariant(field, value) { setVariantForm((f) => ({ ...f, [field]: value })); }

  function productPayload() {
    return {
      ...form,
      base_price: form.base_price === '' ? null : Number(form.base_price),
      configurator: form.configurator || null,
      badge: form.badge || null,
      min_qty: Number(form.min_qty) || 1,
      sort_order: Number(form.sort_order) || 0,
      updated_at: new Date().toISOString(),
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const { data, error } = isNew
      ? await supabase.from('product').insert(productPayload()).select('id').single()
      : await supabase.from('product').update(productPayload()).eq('id', productId).select('id').single();
    setSaving(false);
    if (error) { alert(error.message); return; }
    if (isNew) navigate(`/admin/products/${data.id}`);
    else loadProduct();
  }

  async function archiveProduct() {
    if (!window.confirm('Hide this product from the storefront?')) return;
    await supabase.from('product').update({ is_active: false, availability: 'unavailable', updated_at: new Date().toISOString() }).eq('id', productId);
    navigate('/admin/products');
  }

  async function deleteProduct() {
    if (!window.confirm('Permanently delete this product? This only works when no orders reference it.')) return;
    const { error } = await supabase.from('product').delete().eq('id', productId);
    if (error) { alert(error.message); return; }
    navigate('/admin/products');
  }

  async function addImage(e) {
    e.preventDefault();
    if (!imageForm.url.trim()) return;
    const payload = { ...imageForm, product_id: productId, sort_order: Number(imageForm.sort_order) || 0 };
    if (payload.is_primary) await supabase.from('product_image').update({ is_primary: false }).eq('product_id', productId);
    await supabase.from('product_image').insert(payload);
    setImageForm({ url: '', alt_text: '', sort_order: 0, is_primary: false });
    loadProduct();
  }

  async function updateImage(image, patch) {
    if (patch.is_primary) await supabase.from('product_image').update({ is_primary: false }).eq('product_id', productId);
    await supabase.from('product_image').update(patch).eq('id', image.id);
    loadProduct();
  }

  async function deleteImage(image) {
    if (!window.confirm('Remove this image?')) return;
    await supabase.from('product_image').delete().eq('id', image.id);
    loadProduct();
  }

  async function addVariant(e) {
    e.preventDefault();
    if (!variantForm.variant_type.trim() || !variantForm.variant_value.trim() || !variantForm.label.trim()) return;
    await supabase.from('product_variant').insert({
      ...variantForm,
      product_id: productId,
      price_override: variantForm.price_override === '' ? null : Number(variantForm.price_override),
      price_modifier: Number(variantForm.price_modifier) || 0,
      min_qty: variantForm.min_qty === '' ? null : Number(variantForm.min_qty),
      image_url: variantForm.image_url || null,
      sort_order: Number(variantForm.sort_order) || 0,
    });
    setVariantForm(EMPTY_VARIANT);
    loadProduct();
  }

  async function updateVariant(variant, patch) {
    await supabase.from('product_variant').update(patch).eq('id', variant.id);
    loadProduct();
  }

  async function deleteVariant(variant) {
    if (!window.confirm(`Delete variant "${variant.label}"?`)) return;
    await supabase.from('product_variant').delete().eq('id', variant.id);
    loadProduct();
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 12 }}><Link to="/admin/products" style={{ color: 'var(--color-text-faint)' }}>&larr; Products</Link></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{isNew ? 'Add Product' : `Edit ${form.name}`}</h1>
          {!isNew && <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 6 }}>{variants.length} variant(s) · {images.length} image(s)</div>}
        </div>
        {!isNew && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={archiveProduct}>Archive</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={deleteProduct}>Delete</button>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
        <Field label="Slug"><input required value={form.slug} onChange={(e) => set('slug', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Name"><input required value={form.name} onChange={(e) => set('name', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Category">
          <select required value={form.category_id} onChange={(e) => set('category_id', e.target.value)} style={{ width: '100%' }}>
            <option value="">Select...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Base Price (NGN)">
          <input type="number" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} placeholder="Blank = TBC" style={{ width: '100%' }} />
        </Field>
        <Field label="Configurator">
          <select value={form.configurator || ''} onChange={(e) => set('configurator', e.target.value)} style={{ width: '100%' }}>
            <option value="">None</option>
            <option value="banana-bread">banana-bread</option>
            <option value="brownies">brownies</option>
            <option value="small-chops">small-chops</option>
            <option value="pastries">pastries</option>
            <option value="cake">cake</option>
          </select>
        </Field>
        <Field label="Badge">
          <select value={form.badge || ''} onChange={(e) => set('badge', e.target.value)} style={{ width: '100%' }}>
            <option value="">None</option>
            <option>Bestseller</option><option>New</option><option>Limited</option><option>Out of Stock</option>
          </select>
        </Field>
        <Field label="Availability">
          <select value={form.availability} onChange={(e) => set('availability', e.target.value)} style={{ width: '100%' }}>
            <option value="in_stock">In Stock</option>
            <option value="made_to_order">Made to order</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </Field>
        <Field label="Sort Order"><input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Minimum Quantity"><input type="number" min={1} value={form.min_qty} onChange={(e) => set('min_qty', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Ingredients Note"><input value={form.ingredients_note || ''} onChange={(e) => set('ingredients_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Allergen Note"><input value={form.allergen_note || ''} onChange={(e) => set('allergen_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Storage Note"><input value={form.storage_note || ''} onChange={(e) => set('storage_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Description">
          <textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} style={{ width: '100%', height: 80 }} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.price_from} onChange={(e) => set('price_from', e.target.checked)} /> Show "From"
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active
          </label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={saving} aria-busy={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
      </form>

      {isNew ? (
        <div className="card" style={{ padding: 24, color: 'var(--color-text-muted)' }}>Save the product first, then add images and variants.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <Panel title="Images">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {images.map((image) => (
                <div key={image.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center', borderBottom: '1px solid rgba(50,26,23,0.08)', paddingBottom: 12 }}>
                  <img src={image.url} alt={image.alt_text || form.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input defaultValue={image.url} onBlur={(e) => e.target.value !== image.url && updateImage(image, { url: e.target.value })} />
                    <input defaultValue={image.alt_text || ''} placeholder="Alt text" onBlur={(e) => e.target.value !== (image.alt_text || '') && updateImage(image, { alt_text: e.target.value })} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="number" defaultValue={image.sort_order} aria-label="Image sort order" onBlur={(e) => updateImage(image, { sort_order: Number(e.target.value) || 0 })} style={{ width: 90 }} />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateImage(image, { is_primary: true })}>{image.is_primary ? 'Primary' : 'Make Primary'}</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => deleteImage(image)}>Remove</button>
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={addImage} style={{ display: 'grid', gap: 10 }}>
                <input value={imageForm.url} onChange={(e) => setImageForm((f) => ({ ...f, url: e.target.value }))} placeholder="/uploads/product-photo.png" />
                <input value={imageForm.alt_text} onChange={(e) => setImageForm((f) => ({ ...f, alt_text: e.target.value }))} placeholder="Alt text" />
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="number" value={imageForm.sort_order} onChange={(e) => setImageForm((f) => ({ ...f, sort_order: e.target.value }))} aria-label="New image sort order" style={{ width: 110 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={imageForm.is_primary} onChange={(e) => setImageForm((f) => ({ ...f, is_primary: e.target.checked }))} /> Primary
                  </label>
                  <button className="btn btn-primary btn-sm">Add Image</button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="Variants">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {variants.map((variant) => (
                <div key={variant.id} style={{ borderBottom: '1px solid rgba(50,26,23,0.08)', paddingBottom: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input defaultValue={variant.variant_type} onBlur={(e) => updateVariant(variant, { variant_type: e.target.value })} aria-label="Variant type" />
                    <input defaultValue={variant.variant_value} onBlur={(e) => updateVariant(variant, { variant_value: e.target.value })} aria-label="Variant value" />
                    <input defaultValue={variant.label} onBlur={(e) => updateVariant(variant, { label: e.target.value })} aria-label="Variant label" />
                    <input type="number" defaultValue={variant.price_override ?? ''} placeholder="Price override" onBlur={(e) => updateVariant(variant, { price_override: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Price override" />
                    <input type="number" defaultValue={variant.price_modifier} placeholder="Price modifier" onBlur={(e) => updateVariant(variant, { price_modifier: Number(e.target.value) || 0 })} aria-label="Price modifier" />
                    <input type="number" defaultValue={variant.sort_order} placeholder="Sort" onBlur={(e) => updateVariant(variant, { sort_order: Number(e.target.value) || 0 })} aria-label="Variant sort order" />
                  </div>
                  <input defaultValue={variant.image_url || ''} placeholder="Variant image URL" onBlur={(e) => updateVariant(variant, { image_url: e.target.value || null })} style={{ width: '100%', marginTop: 8 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {variant.price_override === null ? 'Price TBC' : fmtNaira(variant.price_override)}
                      {variant.price_modifier ? ` · modifier ${fmtNaira(variant.price_modifier)}` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateVariant(variant, { is_active: !variant.is_active })}>{variant.is_active ? 'Active' : 'Inactive'}</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateVariant(variant, { is_mixed_allowed: !variant.is_mixed_allowed })}>{variant.is_mixed_allowed ? 'Mixed Allowed' : 'No Mixed'}</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => deleteVariant(variant)}>Delete</button>
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={addVariant} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <input value={variantForm.variant_type} onChange={(e) => setVariant('variant_type', e.target.value)} placeholder="type" />
                <input value={variantForm.variant_value} onChange={(e) => setVariant('variant_value', e.target.value)} placeholder="value" />
                <input value={variantForm.label} onChange={(e) => setVariant('label', e.target.value)} placeholder="Label" />
                <input type="number" value={variantForm.price_override} onChange={(e) => setVariant('price_override', e.target.value)} placeholder="Override" />
                <input type="number" value={variantForm.price_modifier} onChange={(e) => setVariant('price_modifier', e.target.value)} placeholder="Modifier" />
                <input type="number" value={variantForm.min_qty} onChange={(e) => setVariant('min_qty', e.target.value)} placeholder="Min qty" />
                <input value={variantForm.image_url} onChange={(e) => setVariant('image_url', e.target.value)} placeholder="Image URL" style={{ gridColumn: '1 / -1' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={variantForm.is_mixed_allowed} onChange={(e) => setVariant('is_mixed_allowed', e.target.checked)} /> Mixed
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={variantForm.is_active} onChange={(e) => setVariant('is_active', e.target.checked)} /> Active
                </label>
                <button className="btn btn-primary btn-sm">Add Variant</button>
              </form>
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-olive)', marginBottom: 6 }}>{label}</div>
      {children}
    </label>
  );
}

function Panel({ title, children }) {
  return (
    <section className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>{title}</div>
      {children}
    </section>
  );
}
