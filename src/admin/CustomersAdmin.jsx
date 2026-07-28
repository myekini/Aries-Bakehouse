import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState({});
  const [search, setSearch] = useState('');
  const [includeGuests, setIncludeGuests] = useState(false);

  function load() {
    let query = supabase.from('customer').select('*').order('created_at', { ascending: false }).limit(300);
    if (!includeGuests) query = query.eq('is_guest', false);
    Promise.all([
      query,
      supabase.from('order').select('id, customer_id, total, status').limit(1000),
    ]).then(([customerRes, orderRes]) => {
      setCustomers(customerRes.error ? [] : customerRes.data || []);
      const grouped = {};
      for (const order of orderRes.error ? [] : orderRes.data || []) {
        if (!grouped[order.customer_id]) grouped[order.customer_id] = [];
        grouped[order.customer_id].push(order);
      }
      setOrdersByCustomer(grouped);
    });
  }

  useEffect(load, [includeGuests]);

  async function updateCustomer(customer, patch) {
    await supabase.from('customer').update(patch).eq('id', customer.id);
    load();
  }

  if (customers === null) return <div>Loading…</div>;
  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || [c.name, c.email, c.phone].some((v) => (v || '').toLowerCase().includes(q));
  });

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Customers</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Registered accounts by default; include guests when matching website orders to phone/email records.</p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." aria-label="Search customers" style={{ flex: '1 1 240px', borderRadius: 999 }} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700 }}>
          <input type="checkbox" checked={includeGuests} onChange={(e) => setIncludeGuests(e.target.checked)} /> Include guests
        </label>
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.map((c) => (
          <div key={c.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, alignItems: 'center' }}>
            <div>
              <input defaultValue={c.name || ''} placeholder="Name" onBlur={(e) => updateCustomer(c, { name: e.target.value || null })} style={{ width: '100%' }} />
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                {c.is_guest ? 'Guest' : 'Account'} · joined {new Date(c.created_at).toLocaleDateString()}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              <input defaultValue={c.email || ''} placeholder="Email" onBlur={(e) => updateCustomer(c, { email: e.target.value || null })} />
              <input defaultValue={c.phone || ''} placeholder="Phone" onBlur={(e) => updateCustomer(c, { phone: e.target.value || null })} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {(ordersByCustomer[c.id] || []).length} order(s)<br />
              ₦{(ordersByCustomer[c.id] || []).reduce((sum, o) => sum + (o.total || 0), 0).toLocaleString('en-NG')}
            </div>
            <select value={c.role} onChange={(e) => updateCustomer(c, { role: e.target.value })} aria-label={`${c.name || 'Customer'} role`}>
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No customers match this view.</div>}
      </div>
    </div>
  );
}
