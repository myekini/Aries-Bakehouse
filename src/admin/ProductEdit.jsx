import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { fmtNaira } from '../lib/format.js';
import { AdminLoading, AdminNotice, AdminPage, AdminPageHeader, AdminPanel } from './AdminPrimitives.jsx';

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
  const [savedForm, setSavedForm] = useState(EMPTY_PRODUCT);
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
      if (!productRes.error && productRes.data) {
        const nextForm = { ...productRes.data, base_price: productRes.data.base_price ?? '' };
        setForm(nextForm);
        setSavedForm(nextForm);
      }
      setImages(imageRes.error ? [] : imageRes.data || []);
      setVariants(variantRes.error ? [] : variantRes.data || []);
      setLoading(false);
    });
  }

  // Loading is intentionally owned by this route transition effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (error) { toast.error('Product was not saved', { description: error.message }); return; }
    if (isNew) navigate(`/admin/products/${data.id}`);
    else {
      setSavedForm(form);
      toast.success(`${form.name} saved`);
      loadProduct();
    }
  }

  async function archiveProduct() {
    await supabase.from('product').update({ is_active: false, availability: 'unavailable', updated_at: new Date().toISOString() }).eq('id', productId);
    navigate('/admin/products');
  }

  async function deleteProduct() {
    const { error } = await supabase.from('product').delete().eq('id', productId);
    if (error) { toast.error('Product was not deleted', { description: error.message }); return; }
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
    await supabase.from('product_variant').delete().eq('id', variant.id);
    loadProduct();
  }

  if (loading) return <AdminLoading label="Loading product…" />;
  const isDirty = JSON.stringify(form) !== JSON.stringify(savedForm);

  return (
    <AdminPage className="admin-product-editor">
      <Link to="/admin/products" className="admin-back-link">&larr; All products</Link>
      <AdminPageHeader
        eyebrow="Catalogue"
        title={isNew ? 'Add product' : form.name || 'Edit product'}
        description={isNew ? 'Create the product first, then add its photography and customer choices.' : `${variants.length} customer choice${variants.length === 1 ? '' : 's'} · ${images.length} image${images.length === 1 ? '' : 's'}`}
        actions={!isNew && <div className="admin-page-header__actions">
            <ConfirmAlertDialog
              trigger={<button type="button" className="btn btn-secondary btn-sm">Archive</button>}
              title={`Archive ${form.name}?`}
              description="This product will be hidden from the storefront. You can restore it later."
              confirmLabel="Archive product"
              destructive={false}
              onConfirm={archiveProduct}
            />
            <ConfirmAlertDialog
              trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
              title={`Delete ${form.name}?`}
              description="This permanently removes the product and only succeeds when no orders reference it."
              confirmLabel="Delete product"
              onConfirm={deleteProduct}
            />
          </div>}
      />

      <form onSubmit={handleSubmit} className="card admin-product-details-form">
        <div className="admin-product-editor__section-heading"><strong>Storefront details</strong><span>The name, category, description, and price customers see.</span></div>
        <Field label="Storefront URL" hint="Lowercase words separated with hyphens. Avoid changing this after launch."><input required value={form.slug} onChange={(e) => set('slug', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Name"><input required value={form.name} onChange={(e) => set('name', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Category">
          <select required value={form.category_id} onChange={(e) => set('category_id', e.target.value)} style={{ width: '100%' }}>
            <option value="">Select...</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </Field>
        <Field label="Base price (NGN)" hint="Leave blank only when the team must confirm the price.">
          <input type="number" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} placeholder="Blank = TBC" style={{ width: '100%' }} />
        </Field>
        <Field label="Customer choices" hint="Choose a layout only when this product has sizes, flavours, or combinations.">
          <select value={form.configurator || ''} onChange={(e) => set('configurator', e.target.value)} style={{ width: '100%' }}>
            <option value="">No choices — standard product</option>
            <option value="banana-bread">Banana bread sizes and toppings</option>
            <option value="brownies">Brownie sizes and flavours</option>
            <option value="small-chops">Small chops platters</option>
            <option value="pastries">Pastry options</option>
            <option value="cake">Cake flavours and sizes</option>
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
        <Field label="Display order" hint="Lower numbers appear first."><input type="number" value={form.sort_order} onChange={(e) => set('sort_order', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Minimum order quantity"><input type="number" min={1} value={form.min_qty} onChange={(e) => set('min_qty', e.target.value)} style={{ width: '100%' }} /></Field>
        <div className="admin-product-editor__section-heading"><strong>Customer guidance</strong><span>Operational details that reduce questions and set expectations.</span></div>
        <Field label="Ingredients"><input value={form.ingredients_note || ''} onChange={(e) => set('ingredients_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Allergen information"><input value={form.allergen_note || ''} onChange={(e) => set('allergen_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Storage guidance"><input value={form.storage_note || ''} onChange={(e) => set('storage_note', e.target.value)} style={{ width: '100%' }} /></Field>
        <Field label="Description">
          <Textarea value={form.description || ''} onChange={(e) => set('description', e.target.value)} style={{ height: 80 }} />
        </Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.price_from} onChange={(e) => set('price_from', e.target.checked)} /> Show &ldquo;From&rdquo;
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} /> Active
          </label>
        </div>
        <div className="admin-product-save-bar">
          <div><strong>{isDirty ? 'Unsaved product changes' : 'Product details are up to date'}</strong><span>{isDirty ? 'Review and save before leaving this page.' : 'Images and variants save separately below.'}</span></div>
          {!isNew && <button type="button" className="btn btn-secondary" disabled={!isDirty || saving} onClick={() => setForm(savedForm)}>Discard</button>}
          <button type="submit" className="btn btn-primary" disabled={saving || (!isNew && !isDirty)} aria-busy={saving}>{saving ? 'Saving...' : isNew ? 'Create product' : 'Save changes'}</button>
        </div>
      </form>

      {isNew ? (
        <AdminNotice>Save the product details first. Photography and customer choices become available immediately afterwards.</AdminNotice>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
          <Panel title="Product photography" description="The primary image leads every product card. Use descriptive alternative text for accessibility.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {images.map((image) => (
                <div key={image.id} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 12, alignItems: 'center', borderBottom: '1px solid rgba(50,26,23,0.08)', paddingBottom: 12 }}>
                  <img src={image.url} alt={image.alt_text || form.name} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8 }} />
                  <div style={{ display: 'grid', gap: 8 }}>
                    <input defaultValue={image.url} aria-label="Image URL" onBlur={(e) => e.target.value !== image.url && updateImage(image, { url: e.target.value })} />
                    <input defaultValue={image.alt_text || ''} placeholder="Describe what is visible" aria-label="Alternative text" onBlur={(e) => e.target.value !== (image.alt_text || '') && updateImage(image, { alt_text: e.target.value })} />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <input type="number" defaultValue={image.sort_order} aria-label="Image sort order" onBlur={(e) => updateImage(image, { sort_order: Number(e.target.value) || 0 })} style={{ width: 90 }} />
                      <button type="button" className="btn btn-secondary btn-sm" disabled={image.is_primary} onClick={() => updateImage(image, { is_primary: true })}>{image.is_primary ? 'Primary image' : 'Make primary'}</button>
                      <ConfirmAlertDialog
                        trigger={<button type="button" className="btn btn-secondary btn-sm">Remove</button>}
                        title="Remove this image?"
                        description="The image will no longer appear with this product."
                        confirmLabel="Remove image"
                        onConfirm={() => deleteImage(image)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={addImage} className="admin-media-add-form">
                <div className="admin-media-add-form__preview">{imageForm.url ? <img src={imageForm.url} alt="New product preview" /> : <span>Image preview</span>}</div>
                <Field label="Image URL" hint="Paste the final public URL or an /uploads/ path."><input value={imageForm.url} onChange={(e) => setImageForm((f) => ({ ...f, url: e.target.value }))} placeholder="/uploads/product-photo.png" /></Field>
                <Field label="Alternative text" hint="Describe the food, angle, and key visual details."><input value={imageForm.alt_text} onChange={(e) => setImageForm((f) => ({ ...f, alt_text: e.target.value }))} placeholder="Sliced banana bread on a cream plate" /></Field>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input type="number" value={imageForm.sort_order} onChange={(e) => setImageForm((f) => ({ ...f, sort_order: e.target.value }))} aria-label="New image sort order" style={{ width: 110 }} />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={imageForm.is_primary} onChange={(e) => setImageForm((f) => ({ ...f, is_primary: e.target.checked }))} /> Primary
                  </label>
                  <button className="btn btn-primary btn-sm">Add image</button>
                </div>
              </form>
            </div>
          </Panel>

          <Panel title="Customer choices" description="Define the sizes, flavours, toppings, or platter options customers select before adding to cart.">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {variants.map((variant) => (
                <div key={variant.id} style={{ borderBottom: '1px solid rgba(50,26,23,0.08)', paddingBottom: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input defaultValue={variant.variant_type} title="Choice group" onBlur={(e) => updateVariant(variant, { variant_type: e.target.value })} aria-label="Choice group" />
                    <input defaultValue={variant.variant_value} title="Internal key" onBlur={(e) => updateVariant(variant, { variant_value: e.target.value })} aria-label="Internal key" />
                    <input defaultValue={variant.label} title="Customer label" onBlur={(e) => updateVariant(variant, { label: e.target.value })} aria-label="Customer label" />
                    <input type="number" defaultValue={variant.price_override ?? ''} placeholder="Exact price" title="Exact price" onBlur={(e) => updateVariant(variant, { price_override: e.target.value === '' ? null : Number(e.target.value) })} aria-label="Exact price" />
                    <input type="number" defaultValue={variant.price_modifier} placeholder="Price adjustment" title="Price adjustment" onBlur={(e) => updateVariant(variant, { price_modifier: Number(e.target.value) || 0 })} aria-label="Price adjustment" />
                    <input type="number" defaultValue={variant.sort_order} placeholder="Display order" onBlur={(e) => updateVariant(variant, { sort_order: Number(e.target.value) || 0 })} aria-label="Display order" />
                  </div>
                  <input defaultValue={variant.image_url || ''} placeholder="Variant image URL" onBlur={(e) => updateVariant(variant, { image_url: e.target.value || null })} style={{ width: '100%', marginTop: 8 }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {variant.price_override === null ? 'Price TBC' : fmtNaira(variant.price_override)}
                      {variant.price_modifier ? ` · ${fmtNaira(variant.price_modifier)} adjustment` : ''}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateVariant(variant, { is_active: !variant.is_active })}>{variant.is_active ? 'Active' : 'Inactive'}</button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => updateVariant(variant, { is_mixed_allowed: !variant.is_mixed_allowed })}>{variant.is_mixed_allowed ? 'Can mix' : 'Single choice'}</button>
                      <ConfirmAlertDialog
                        trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                        title={`Delete ${variant.label}?`}
                        description="This variant will no longer be available to customers. This action cannot be undone."
                        confirmLabel="Delete variant"
                        onConfirm={() => deleteVariant(variant)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={addVariant} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                <select value={variantForm.variant_type} onChange={(e) => setVariant('variant_type', e.target.value)} aria-label="Choice group"><option value="size">Size</option><option value="size_mixed">Mixed size price</option><option value="flavour">Flavour</option><option value="topping">Topping</option><option value="option">Option</option><option value="platter">Platter</option></select>
                <input value={variantForm.variant_value} onChange={(e) => setVariant('variant_value', e.target.value)} placeholder="Internal key" aria-label="Internal key" />
                <input value={variantForm.label} onChange={(e) => setVariant('label', e.target.value)} placeholder="Customer label" aria-label="Customer label" />
                <input type="number" value={variantForm.price_override} onChange={(e) => setVariant('price_override', e.target.value)} placeholder="Exact price" aria-label="Exact price" />
                <input type="number" value={variantForm.price_modifier} onChange={(e) => setVariant('price_modifier', e.target.value)} placeholder="Price adjustment" aria-label="Price adjustment" />
                <input type="number" value={variantForm.min_qty} onChange={(e) => setVariant('min_qty', e.target.value)} placeholder="Minimum quantity" aria-label="Minimum quantity" />
                <input value={variantForm.image_url} onChange={(e) => setVariant('image_url', e.target.value)} placeholder="Image URL" style={{ gridColumn: '1 / -1' }} />
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={variantForm.is_mixed_allowed} onChange={(e) => setVariant('is_mixed_allowed', e.target.checked)} /> Customers can mix
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <input type="checkbox" checked={variantForm.is_active} onChange={(e) => setVariant('is_active', e.target.checked)} /> Active
                </label>
                <button className="btn btn-primary btn-sm">Add choice</button>
              </form>
            </div>
          </Panel>
        </div>
      )}
    </AdminPage>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-olive)', marginBottom: 6 }}>{label}</div>
      {children}
      {hint && <small className="admin-field__hint">{hint}</small>}
    </label>
  );
}

function Panel({ title, description, children }) {
  return <AdminPanel title={title} description={description}>{children}</AdminPanel>;
}
