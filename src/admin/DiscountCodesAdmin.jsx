import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';

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

  if (codes === null) return <div>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 20 }}>Discount Codes</h1>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {codes.map((c) => (
          <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, alignItems: 'center' }}>
            <input defaultValue={c.code} onBlur={(e) => updateCode(c, { code: e.target.value.trim().toUpperCase() })} aria-label="Discount code" />
            <select defaultValue={c.type} onChange={(e) => updateCode(c, { type: e.target.value })} aria-label="Discount type">
              <option value="fixed">Fixed (₦)</option>
              <option value="percentage">Percentage (%)</option>
            </select>
            <input type="number" defaultValue={c.value} onBlur={(e) => updateCode(c, { value: Number(e.target.value) || 0 })} aria-label="Discount value" />
            <input type="number" defaultValue={c.usage_limit || ''} placeholder="No limit" onBlur={(e) => updateCode(c, { usage_limit: e.target.value ? Number(e.target.value) : null })} aria-label="Usage limit" />
            <DatePicker
              value={c.expires_at ? c.expires_at.slice(0, 10) : ''}
              onChange={(value) => updateCode(c, { expires_at: value || null })}
              aria-label={`${c.code} expiry date`}
              clearable
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleActive(c)} className="btn btn-secondary btn-sm">{c.active ? 'Active' : 'Inactive'}</button>
              <ConfirmAlertDialog
                trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                title={`Delete ${c.code}?`}
                description="The code will stop working immediately and cannot be restored."
                confirmLabel="Delete code"
                onConfirm={() => deleteCode(c)}
              />
            </div>
            <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--color-text-muted)' }}>
              {c.type === 'fixed' ? `₦${c.value} off` : `${c.value}% off`} · {c.usage_limit ? `${c.times_used}/${c.usage_limit} used` : `${c.times_used} used`}
              {c.expires_at ? ` · expires ${new Date(c.expires_at).toLocaleDateString()}` : ''}
            </div>
          </div>
        ))}
        {codes.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No discount codes yet.</div>}
      </div>

      <form onSubmit={addCode} className="card" style={{ padding: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} placeholder="CODE" style={{ width: 140 }} />
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="fixed">Fixed (₦)</option>
          <option value="percentage">Percentage (%)</option>
        </select>
        <input type="number" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} placeholder="Value" style={{ width: 100 }} />
        <input type="number" value={form.usage_limit} onChange={(e) => setForm((f) => ({ ...f, usage_limit: e.target.value }))} placeholder="Usage limit (optional)" style={{ width: 160 }} />
        <DatePicker
          value={form.expires_at}
          onChange={(value) => setForm((f) => ({ ...f, expires_at: value }))}
          aria-label="New discount expiry date"
          placeholder="Expiry date"
          clearable
          style={{ width: 180 }}
        />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>
    </div>
  );
}
