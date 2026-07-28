import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState(null);
  const [newName, setNewName] = useState('');

  function load() {
    supabase.from('product_category').select('*').order('sort_order').then(({ data, error }) => setCategories(error ? [] : data));
  }
  useEffect(load, []);

  async function addCategory(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    const slug = newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await supabase.from('product_category').insert({ slug, name: newName.trim() });
    setNewName('');
    load();
  }

  async function updateField(cat, field, value) {
    await supabase.from('product_category').update({ [field]: value }).eq('id', cat.id);
    load();
  }

  async function deleteCategory(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? This only works if no products reference it.`)) return;
    const { error } = await supabase.from('product_category').delete().eq('id', cat.id);
    if (error) alert(error.message);
    load();
  }

  if (categories === null) return <div>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Categories</h1>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {categories.map((c) => (
          <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, alignItems: 'center' }}>
            <input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && updateField(c, 'name', e.target.value)} />
            <input defaultValue={c.description || ''} placeholder="Description" onBlur={(e) => e.target.value !== (c.description || '') && updateField(c, 'description', e.target.value)} />
            <input defaultValue={c.image_url || ''} placeholder="Image URL" onBlur={(e) => e.target.value !== (c.image_url || '') && updateField(c, 'image_url', e.target.value)} />
            <input type="number" defaultValue={c.sort_order} aria-label={`${c.name} sort order`} onBlur={(e) => updateField(c, 'sort_order', Number(e.target.value) || 0)} />
            <button type="button" onClick={() => deleteCategory(c)} className="btn btn-secondary btn-sm">Delete</button>
          </div>
        ))}
      </div>
      <form onSubmit={addCategory} className="card" style={{ padding: 20, display: 'flex', gap: 10 }}>
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New category name" style={{ flex: 1 }} />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>
    </div>
  );
}
