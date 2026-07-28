import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready_or_out', 'completed', 'cancelled'];
const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready_or_out: 'Ready / Out for delivery', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OrdersList() {
  const [orders, setOrders] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savingId, setSavingId] = useState(null);

  function load() {
    let query = supabase.from('order').select('*, order_item(id)').order('preferred_date', { ascending: true }).order('created_at', { ascending: false }).limit(300);
    if (dateFrom) query = query.gte('preferred_date', dateFrom);
    if (dateTo) query = query.lte('preferred_date', dateTo);
    query.then(({ data, error }) => setOrders(error ? [] : data));
  }

  useEffect(load, [dateFrom, dateTo]);

  const filtered = useMemo(() => {
    if (!orders) return [];
    return orders
      .filter((o) => statusFilter === 'all' || o.status === statusFilter)
      .filter((o) => fulfilmentFilter === 'all' || o.fulfilment_type === fulfilmentFilter);
  }, [orders, statusFilter, fulfilmentFilter]);

  const counts = useMemo(() => {
    const list = orders || [];
    return STATUSES.reduce((acc, status) => ({ ...acc, [status]: list.filter((o) => o.status === status).length }), {});
  }, [orders]);

  async function updateStatus(order, status) {
    setSavingId(order.id);
    const { error } = await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) alert(error.message);
    await load();
    setSavingId(null);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '8px 0 0' }}>Filter by kitchen date, fulfilment, and lifecycle state.</p>
        </div>
        <Link to="/admin" className="btn btn-secondary btn-sm">Daily Prep View</Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: 8 }}>
          <option value="all">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
        </select>
        <select value={fulfilmentFilter} onChange={(e) => setFulfilmentFilter(e.target.value)} style={{ borderRadius: 8 }}>
          <option value="all">Pickup + Delivery</option>
          <option value="pickup">Pickup only</option>
          <option value="delivery">Delivery only</option>
        </select>
        <input aria-label="Preferred date from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ borderRadius: 8 }} />
        <input aria-label="Preferred date to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ borderRadius: 8 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        {STATUSES.map((s) => (
          <button key={s} type="button" onClick={() => setStatusFilter(s)} className="card" style={{ padding: 14, border: 'none', cursor: 'pointer', textAlign: 'left', background: statusFilter === s ? 'var(--color-choc)' : 'var(--color-white)', color: statusFilter === s ? 'var(--color-white)' : 'var(--color-choc)' }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{counts[s] || 0}</div>
            <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>{STATUS_LABEL[s]}</div>
          </button>
        ))}
      </div>

      {orders === null ? <div>Loading…</div> : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((o) => (
            <div
              key={o.id}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)' }}
            >
              <div>
                <Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-choc)', textDecoration: 'none' }}>#{o.order_number}</Link>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {o.preferred_date} · {o.preferred_time} · {o.fulfilment_type} · {o.customer_name}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtNaira(o.total)}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{o.order_item.length} item(s)</div>
              </div>
              <select value={o.status} disabled={savingId === o.id} onChange={(e) => updateStatus(o, e.target.value)} aria-label={`Update order ${o.order_number} status`} style={{ borderRadius: 8 }}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No orders match these filters.</div>}
        </div>
      )}
    </div>
  );
}
