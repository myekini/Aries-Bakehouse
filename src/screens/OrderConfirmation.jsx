import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../lib/orders.js';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined); // undefined = loading, null = not found

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId).then((o) => { if (!cancelled) setOrder(o); }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (order === undefined) {
    return <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>Loading your order…</div>;
  }

  if (!order) {
    return (
      <div className="container" style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Order not found</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 10 }}>Place an order from the menu to see your confirmation here.</div>
        <Link to="/menu" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 24 }}>Browse Menu</Link>
      </div>
    );
  }

  const pending = order.status === 'pending';

  return (
    <div className="container" style={{ maxWidth: 640, margin: '0 auto', padding: '80px 20px 120px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, background: 'var(--color-olive)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFFDF8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>
      </div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, fontWeight: 400, margin: 0 }}>
        {pending ? 'Checkout Saved — Pending Confirmation' : 'Order Confirmed'}
      </h1>
      <div style={{ fontSize: 15, color: 'var(--color-text-muted)', marginTop: 12 }}>
        {pending
          ? 'Your website checkout is saved. The team will help you complete confirmation if payment needs support.'
          : `Thank you, ${order.name || 'friend'} — your order is in.`}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 8 }}>Order #{order.orderNumber}</div>

      <div className="card" style={{ padding: 28, marginTop: 32, textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {order.items.map((it) => (
            <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <div style={{ color: 'var(--color-text-muted)' }}>{it.name} &times;{it.qty}</div>
              <div style={{ fontWeight: 700 }}>{fmtLineTotal(it.price, it.qty)}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid rgba(50,26,23,0.12)', paddingTop: 14, marginBottom: order.hasUnpricedItems ? 4 : 16 }}>
          <div>Total</div><div>{fmtNaira(order.total)}</div>
        </div>
        {order.hasUnpricedItems && (
          <div style={{ fontSize: 11, color: 'var(--color-cocoa)', marginBottom: 14 }}>
            Excludes item(s) needing price confirmation — we'll confirm final pricing before delivery.
          </div>
        )}
        <div style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          <div><strong>Fulfilment:</strong> {order.fulfilment === 'pickup' ? 'Pickup' : `Delivery — ${order.address || ''}`}</div>
          <div><strong>Preferred date:</strong> {order.date || '—'}</div>
          <div><strong>Preferred time:</strong> {order.time || '—'}</div>
          <div><strong>Estimated ready:</strong> 24 hours from order confirmation</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to={`/account/orders/${order.id}`} className="btn btn-secondary">Track Order</Link>
        <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-whatsapp">Contact Support on WhatsApp</a>
        <Link to="/" className="btn btn-secondary">Back to Home</Link>
      </div>
    </div>
  );
}
