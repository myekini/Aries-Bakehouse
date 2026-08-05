import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';
import { AdminEmpty, AdminField, AdminFormGrid, AdminLoading, AdminPage, AdminPageHeader, AdminPanel, AdminRecord, AdminRecordList, AdminStatusBadge } from './AdminPrimitives.jsx';

export default function DiscountCodesAdmin() {
  const [codes, setCodes] = useState(null);
  const [form, setForm] = useState({ code: '', type: 'fixed', value: '', usage_limit: '', expires_at: '' });

  function load() {
    supabase.from('discount_code').select('*').order('created_at', { ascending: false }).then(({ data, error }) => setCodes(error ? [] : data));
  }
  useEffect(load, []);

  async function addCode(e) {
    e.preventDefault();
    if (!form.code.trim() || !form.value) return;
    await supabase.from('discount_code').insert({
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value: Number(form.value),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at || null,
    });
    setForm({ code: '', type: 'fixed', value: '', usage_limit: '', expires_at: '' });
    load();
  }

  async function toggleActive(code) {
    await supabase.from('discount_code').update({ active: !code.active }).eq('id', code.id);
    load();
  }

  async function updateCode(code, patch) {
    await supabase.from('discount_code').update(patch).eq('id', code.id);
    load();
  }

  async function deleteCode(code) {
    const { error } = await supabase.from('discount_code').delete().eq('id', code.id);
    if (error) toast.error('Discount code was not deleted', { description: error.message });
    load();
  }

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Growth" title="Discount codes" description="Create controlled offers and monitor how often each code is used." />
      <AdminPanel title="Existing offers" description={codes ? `${codes.length} discount codes configured` : 'Loading discount codes'}>
        {codes === null ? <AdminLoading label="Loading discount codes…" /> : codes.length ? <AdminRecordList>
        {codes.map((c) => (
          <AdminRecord key={c.id}>
            <div className="admin-record__summary"><strong>{c.code}</strong><AdminStatusBadge status={c.active ? 'active' : 'inactive'}>{c.active ? 'Active' : 'Inactive'}</AdminStatusBadge></div>
            <AdminFormGrid>
            <AdminField label="Code"><input defaultValue={c.code} onBlur={(e) => updateCode(c, { code: e.target.value.trim().toUpperCase() })} /></AdminField>
            <AdminField label="Type"><select defaultValue={c.type} onChange={(e) => updateCode(c, { type: e.target.value })}>
              <option value="fixed">Fixed (₦)</option>
              <option value="percentage">Percentage (%)</option>
            </select></AdminField>
            <AdminField label="Value"><input type="number" min="0" defaultValue={c.value} onBlur={(e) => updateCode(c, { value: Number(e.target.value) || 0 })} /></AdminField>
            <AdminField label="Usage limit" hint="Leave blank for no limit"><input type="number" min="1" defaultValue={c.usage_limit || ''} placeholder="No limit" onBlur={(e) => updateCode(c, { usage_limit: e.target.value ? Number(e.target.value) : null })} /></AdminField>
            <AdminField label="Expiry date"><DatePicker
              value={c.expires_at ? c.expires_at.slice(0, 10) : ''}
              onChange={(value) => updateCode(c, { expires_at: value || null })}
              clearable
            /></AdminField>
            </AdminFormGrid>
            <p className="admin-record__meta">{c.type === 'fixed' ? `₦${c.value} off` : `${c.value}% off`} · {c.usage_limit ? `${c.times_used}/${c.usage_limit} used` : `${c.times_used} used`}{c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}</p>
            <div className="admin-record__actions">
              <button type="button" onClick={() => toggleActive(c)} className="btn btn-secondary btn-sm">Mark {c.active ? 'inactive' : 'active'}</button>
              <ConfirmAlertDialog
                trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                title={`Delete ${c.code}?`}
                description="The code will stop working immediately and cannot be restored."
                confirmLabel="Delete code"
                onConfirm={() => deleteCode(c)}
              />
            </div>
          </AdminRecord>
        ))}
        </AdminRecordList> : <AdminEmpty>No discount codes yet.</AdminEmpty>}
      </AdminPanel>

      <form onSubmit={addCode}>
        <AdminPanel title="Create discount code" description="Codes are normalized to uppercase when saved.">
        <AdminFormGrid>
        <AdminField label="Code"><input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="WELCOME10" /></AdminField>
        <AdminField label="Type"><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="fixed">Fixed (₦)</option>
          <option value="percentage">Percentage (%)</option>
        </select></AdminField>
        <AdminField label="Value"><input type="number" min="0" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="10" /></AdminField>
        <AdminField label="Usage limit" hint="Optional"><input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} placeholder="No limit" /></AdminField>
        <AdminField label="Expiry date" hint="Optional"><DatePicker
          value={form.expires_at}
          onChange={(value) => setForm((f) => ({ ...f, expires_at: value }))}
          placeholder="Expiry date"
          clearable
        /></AdminField>
        </AdminFormGrid>
        <div className="admin-panel__footer"><button type="submit" className="btn btn-primary">Create code</button></div>
        </AdminPanel>
      </form>
    </AdminPage>
  );
}
