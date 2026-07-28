import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

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
    if (!window.confirm(`Delete delivery option "${opt.name}"?`)) return;
    const { error } = await supabase.from('delivery_option').delete().eq('id', opt.id);
    if (error) alert(error.message);
    load();
  }

  if (options === null) return <div>Loading…</div>;

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Delivery Options</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Zones/fees are TBC pending brand confirmation (spec §13) — set real values here once decided.</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        {options.map((o) => (
          <div key={o.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, alignItems: 'center' }}>
            <input defaultValue={o.name} onBlur={(e) => e.target.value !== o.name && updateOption(o, { name: e.target.value })} aria-label="Delivery option name" />
            <select defaultValue={o.type} onChange={(e) => updateOption(o, { type: e.target.value })} aria-label="Delivery option type">
              <option value="pickup">Pickup</option>
              <option value="delivery">Delivery</option>
            </select>
            <input defaultValue={o.zone || ''} placeholder="Zone" onBlur={(e) => e.target.value !== (o.zone || '') && updateOption(o, { zone: e.target.value || null })} aria-label="Zone" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 13 }}>₦</span>
              <input type="number" defaultValue={o.fee} onBlur={(e) => updateFee(o, e.target.value)} style={{ width: 90 }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => toggleActive(o)} className="btn btn-secondary btn-sm">{o.active ? 'Active' : 'Inactive'}</button>
              <button onClick={() => deleteOption(o)} className="btn btn-secondary btn-sm">Delete</button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addOption} className="card" style={{ padding: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" style={{ flex: 1 }} />
        <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
          <option value="pickup">Pickup</option>
          <option value="delivery">Delivery</option>
        </select>
        <input value={form.zone} onChange={(e) => setForm((f) => ({ ...f, zone: e.target.value }))} placeholder="Zone (optional)" />
        <input type="number" value={form.fee} onChange={(e) => setForm((f) => ({ ...f, fee: e.target.value }))} placeholder="Fee (₦)" style={{ width: 100 }} />
        <button type="submit" className="btn btn-primary btn-sm">Add</button>
      </form>
      <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 10 }}>Current default fee shown to customers: {fmtNaira(0)} (until set above).</div>
    </div>
  );
}
