import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { AdminEmpty, AdminField, AdminFormGrid, AdminLoading, AdminPage, AdminPageHeader, AdminPanel, AdminRecord, AdminRecordList } from './AdminPrimitives.jsx';

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
    const { error } = await supabase.from('product_category').delete().eq('id', cat.id);
    if (error) toast.error('Category was not deleted', { description: error.message });
    load();
  }

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Catalogue" title="Categories" description="Organise the menu and control the order in which product groups appear to customers." />
      <AdminPanel title="Menu categories" description={`${categories?.length || 0} categories in the storefront`}>
        {categories === null ? <AdminLoading label="Loading categories…" /> : categories.length ? <AdminRecordList>
        {categories.map((c) => (
          <AdminRecord key={c.id}>
            <AdminFormGrid className="admin-form-grid--category">
              <AdminField label="Name"><input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && updateField(c, 'name', e.target.value)} /></AdminField>
              <AdminField label="Description"><input defaultValue={c.description || ''} placeholder="Short menu description" onBlur={(e) => e.target.value !== (c.description || '') && updateField(c, 'description', e.target.value)} /></AdminField>
              <AdminField label="Image URL"><input type="url" defaultValue={c.image_url || ''} placeholder="https://…" onBlur={(e) => e.target.value !== (c.image_url || '') && updateField(c, 'image_url', e.target.value)} /></AdminField>
              <AdminField label="Sort order"><input type="number" defaultValue={c.sort_order} onBlur={(e) => updateField(c, 'sort_order', Number(e.target.value) || 0)} /></AdminField>
            </AdminFormGrid>
            <div className="admin-record__actions">
            <ConfirmAlertDialog
              trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
              title={`Delete ${c.name}?`}
              description="This category can only be deleted when no products reference it. This action cannot be undone."
              confirmLabel="Delete category"
              onConfirm={() => deleteCategory(c)}
            />
            </div>
          </AdminRecord>
        ))}
        </AdminRecordList> : <AdminEmpty>No categories yet. Add the first menu category below.</AdminEmpty>}
      </AdminPanel>
      <form onSubmit={addCategory}>
        <AdminPanel title="Add category" description="A URL-safe slug is created automatically from the name.">
          <div className="admin-create-row">
            <AdminField label="Category name"><input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="For example, Celebration cakes" /></AdminField>
            <button type="submit" className="btn btn-primary">Add category</button>
          </div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
