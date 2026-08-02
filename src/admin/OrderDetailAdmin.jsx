import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira, fmtLineTotal } from '../lib/format.js';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready_or_out', 'completed', 'cancelled'];
const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready_or_out: 'Ready / Out for delivery', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OrderDetailAdmin() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(null);

  function load() {
    supabase.from('order').select('*, order_item(*), payment(*)').eq('id', orderId).maybeSingle()
      .then(({ data, error }) => setOrder(error ? null : data));
  }
  useEffect(load, [orderId]);

  async function updateStatus(status) {
    setSaving(true);
    const { error } = await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (error) toast.error('Order status was not updated', { description: error.message });
    else if (status === 'completed') trackEvent('order_completed', { orderId });
    load();
    setSaving(false);
  }

  async function verifyPayment(payment) {
    setVerifying(payment.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: payment.reference } });
      if (error) throw error;
      if (data?.confirmed) toast.success('Payment verified', { description: payment.reference });
      else toast.warning('Payment not confirmed', { description: payment.reference });
      load();
    } catch (err) {
      toast.error('Verification failed', { description: err.message });
    } finally {
      setVerifying(null);
    }
  }

  if (order === undefined) return <div>Loading…</div>;
  if (!order) return <div>Order not found.</div>;

  return (
    <div>
      <div style={{ fontSize: 13, marginBottom: 12 }}><Link to="/admin/orders" style={{ color: 'var(--color-text-faint)' }}>&larr; All Orders</Link></div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>Order #{order.order_number}</h1>
      <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 24 }}>
        {order.customer_name} · {order.customer_phone} · {order.customer_email || 'no email'}
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 12 }}>Status</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {STATUSES.map((s) => (
            <button
              key={s} disabled={saving} aria-busy={saving && order.status !== s} onClick={() => updateStatus(s)}
              style={{
                padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: order.status === s ? 'var(--color-choc)' : 'var(--color-cream)',
                color: order.status === s ? 'var(--color-white)' : 'var(--color-choc)',
              }}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 12 }}>Items</div>
        {order.order_item.map((it) => (
          <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, fontSize: 14, marginBottom: 10 }}>
            <div>
              <div>{it.quantity}x {it.product_name_snapshot}</div>
              {Object.keys(it.variant_selections || {}).length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                  {Object.entries(it.variant_selections).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')}
                </div>
              )}
            </div>
            <div style={{ fontWeight: 700 }}>{fmtLineTotal(it.unit_price, it.quantity)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid rgba(50,26,23,0.1)', paddingTop: 12, marginTop: 8 }}>
          <div>Total</div><div>{fmtNaira(order.total)}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
        <div><strong>Fulfilment:</strong> {order.fulfilment_type === 'pickup' ? 'Pickup' : `Delivery — ${order.address_text || ''}`}</div>
        <div><strong>Preferred:</strong> {order.preferred_date} ({order.preferred_time})</div>
        <div><strong>Notes:</strong> {order.special_instructions || '—'}</div>
        <div><strong>Fallback channel:</strong> {order.fallback_channel || 'none (online payment)'}</div>
      </div>

      {order.payment?.length > 0 && (
        <div className="card" style={{ padding: 24, fontSize: 13, color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 12 }}>Payment</div>
          {order.payment.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', borderTop: '1px solid rgba(50,26,23,0.08)', paddingTop: 10, marginTop: 10 }}>
              <div>
                Reference {p.reference} — <strong>{p.status}</strong> {p.verified_at ? `(verified ${new Date(p.verified_at).toLocaleString()})` : ''}
              </div>
              <button className="btn btn-secondary btn-sm" disabled={verifying === p.id} aria-busy={verifying === p.id} onClick={() => verifyPayment(p)}>
                {verifying === p.id ? 'Checking...' : 'Verify Paystack'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
