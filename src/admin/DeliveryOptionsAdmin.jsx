import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { AdminEmpty, AdminField, AdminFormGrid, AdminLoading, AdminNotice, AdminPage, AdminPageHeader, AdminPanel, AdminRecord, AdminRecordList, AdminStatusBadge } from './AdminPrimitives.jsx';

export default function DeliveryOptionsAdmin() {
  const [options, setOptions] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'delivery', zone: '', fee: 0 });

  function load() {
    supabase.from('delivery_option').select('*').order('name').then(({ data, error }) => setOptions(error ? [] : data));
  }
  useEffect(load, []);

  async function addOption(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await supabase.from('delivery_option').insert({ ...form, fee: Number(form.fee) || 0 });
    setForm({ name: '', type: 'delivery', zone: '', fee: 0 });
    load();
  }

  async function updateFee(opt, fee) {
    await supabase.from('delivery_option').update({ fee: Number(fee) || 0 }).eq('id', opt.id);
    load();
  }

  async function updateOption(opt, patch) {
    await supabase.from('delivery_option').update(patch).eq('id', opt.id);
    load();
  }

  async function toggleActive(opt) {
    await supabase.from('delivery_option').update({ active: !opt.active }).eq('id', opt.id);
    load();
  }

  async function deleteOption(opt) {
    const { error } = await supabase.from('delivery_option').delete().eq('id', opt.id);
    if (error) toast.error('Delivery option was not deleted', { description: error.message });
    load();
  }

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Fulfilment" title="Delivery options" description="Manage pickup and local delivery choices shown during checkout." />
      <AdminNotice>Delivery fees remain subject to address review. Only publish values the team is ready to honour.</AdminNotice>
      <AdminPanel title="Available options" description={options ? `${options.length} fulfilment choices configured` : 'Loading fulfilment choices'}>
        {options === null ? <AdminLoading label="Loading delivery options…" /> : options.length ? <AdminRecordList>
        {options.map((o) => (
          <AdminRecord key={o.id}>
            <div className="admin-record__summary"><strong>{o.name}</strong><AdminStatusBadge status={o.active ? 'active' : 'inactive'}>{o.active ? 'Active' : 'Inactive'}</AdminStatusBadge></div>
            <AdminFormGrid>
            <AdminField label="Name"><input defaultValue={o.name} onBlur={(e) => e.target.value !== o.name && updateOption(o, { name: e.target.value })} /></AdminField>
            <AdminField label="Type"><select defaultValue={o.type} onChange={(e) => updateOption(o, { type: e.target.value })}>
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select></AdminField>
            <AdminField label="Zone" hint="Leave empty for pickup"><input defaultValue={o.zone || ''} placeholder="For example, GRA" onBlur={(e) => e.target.value !== (o.zone || '') && updateOption(o, { zone: e.target.value || null })} /></AdminField>
            <AdminField label="Fee (₦)"><input type="number" min="0" defaultValue={o.fee} onBlur={(e) => updateFee(o, e.target.value)} /></AdminField>
            </AdminFormGrid>
            <div className="admin-record__actions">
              <button type="button" onClick={() => toggleActive(o)} className="btn btn-secondary btn-sm">Mark {o.active ? 'inactive' : 'active'}</button>
              <ConfirmAlertDialog
                trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                title={`Delete ${o.name}?`}
                description="This delivery option will no longer be available. This action cannot be undone."
                confirmLabel="Delete option"
                onConfirm={() => deleteOption(o)}
              />
            </div>
          </AdminRecord>
        ))}
        </AdminRecordList> : <AdminEmpty>No delivery or pickup options configured.</AdminEmpty>}
      </AdminPanel>

      <form onSubmit={addOption}>
        <AdminPanel title="Add fulfilment option" description={`Customer-facing fees currently begin at ${fmtNaira(0)} until configured.`}>
        <AdminFormGrid>
        <AdminField label="Name"><input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Abeokuta delivery" /></AdminField>
        <AdminField label="Type"><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select></AdminField>
        <AdminField label="Zone" hint="Optional"><input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} placeholder="GRA" /></AdminField>
        <AdminField label="Fee (₦)"><input type="number" min="0" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} /></AdminField>
        </AdminFormGrid>
        <div className="admin-panel__footer"><button type="submit" className="btn btn-primary">Add option</button></div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
