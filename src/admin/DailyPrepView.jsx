import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

function isoDate(d) { return d.toISOString().slice(0, 10); }
function addDays(d, n) { const c = new Date(d); c.setDate(c.getDate() + n); return c; }

// Highest-priority admin feature per the spec's conversion note: "orders
// grouped by preferred date, so the kitchen can see tomorrow's workload at
// a glance rather than scrolling a flat order list."
export default function DailyPrepView() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(isoDate(addDays(today, 1)));
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setOrders(null);
    supabase
      .from('order')
      .select('*, order_item(*)')
      .eq('preferred_date', selectedDate)
      .in('status', ['confirmed', 'preparing'])
      .order('preferred_time')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { console.error(error); setOrders([]); return; }
        setOrders(data);
      });
    return () => { cancelled = true; };
  }, [selectedDate]);

  async function updateStatus(order, status) {
    await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id);
    setOrders((list) => (list || []).map((o) => (o.id === order.id ? { ...o, status } : o)));
  }

  const grouped = useMemo(() => {
    if (!orders) return [];
    const map = new Map();
    for (const order of orders) {
      for (const item of order.order_item) {
        const key = `${item.product_name_snapshot}|${JSON.stringify(item.variant_selections)}`;
        const existing = map.get(key);
        if (existing) existing.quantity += item.quantity;
        else map.set(key, { name: item.product_name_snapshot, quantity: item.quantity });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const quickDates = [
    { label: 'Today', date: isoDate(today) },
    { label: 'Tomorrow', date: isoDate(addDays(today, 1)) },
    { label: '+2 days', date: isoDate(addDays(today, 2)) },
    { label: '+3 days', date: isoDate(addDays(today, 3)) },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Daily Prep View</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        Confirmed/preparing orders for the selected date, aggregated by product and variant.
      </p>

      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {quickDates.map((q) => (
          <button
            key={q.date}
            onClick={() => setSelectedDate(q.date)}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
              background: selectedDate === q.date ? 'var(--color-olive)' : 'var(--color-white)',
              color: selectedDate === q.date ? 'var(--color-white)' : 'var(--color-choc)',
            }}
          >
            {q.label}
          </button>
        ))}
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{ borderRadius: 8 }} />
      </div>

      {orders === null ? (
        <div>Loading…</div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 24, color: 'var(--color-text-muted)' }}>No confirmed orders for {selectedDate}.</div>
      ) : (
        <>
          <div className="card" style={{ padding: 24, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>
              Prep Quantities ({orders.length} order{orders.length === 1 ? '' : 's'})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grouped.map((g) => (
                <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <div>{g.name}</div>
                  <div style={{ fontWeight: 800 }}>{g.quantity}x</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>Individual Orders</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orders.map((order) => (
                <div key={order.id} style={{ borderBottom: '1px solid rgba(50,26,23,0.08)', paddingBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', fontWeight: 700, fontSize: 14 }}>
                    <Link to={`/admin/orders/${order.id}`} style={{ color: 'var(--color-choc)', textDecoration: 'none' }}>#{order.order_number} — {order.preferred_time}</Link>
                    <div>{fmtNaira(order.total)}</div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {order.customer_name} · {order.customer_phone} · {order.fulfilment_type === 'pickup' ? 'Pickup' : `Delivery — ${order.address_text || ''}`}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {order.order_item.map((it) => `${it.quantity}x ${it.product_name_snapshot}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                    <button className="btn btn-secondary btn-sm" disabled={order.status === 'preparing'} onClick={() => updateStatus(order, 'preparing')}>Preparing</button>
                    <button className="btn btn-secondary btn-sm" disabled={order.status === 'ready_or_out'} onClick={() => updateStatus(order, 'ready_or_out')}>Ready / Out</button>
                    <button className="btn btn-secondary btn-sm" disabled={order.status === 'completed'} onClick={() => updateStatus(order, 'completed')}>Completed</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
