import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, ORDER_TIMELINE } from '../lib/orders.js';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { getMyReviewedProductIds, submitReview } from '../lib/reviews.js';
import { useCart } from '../context/CartContext.jsx';
import EmptyState from '../components/EmptyState.jsx';

// Maps the DB's order.status lifecycle (spec §13) onto the customer-facing
// timeline steps (spec §4: Received → Preparing → Ready/Out for delivery →
// Completed) — 'pending' and 'confirmed' both read as "Received" since
// neither has started kitchen prep yet.
const STEP_INDEX = { pending: 0, confirmed: 0, preparing: 1, ready_or_out: 2, completed: 3 };

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const { addToCart, openDrawer, showToast } = useCart();

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId).then((o) => { if (!cancelled) setOrder(o); }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    if (order?.status !== 'completed') return;
    let cancelled = false;
    getMyReviewedProductIds(orderId).then((ids) => { if (!cancelled) setReviewedProductIds(ids); }).catch(() => {});
    return () => { cancelled = true; };
  }, [order?.status, orderId]);

  if (order === undefined) {
    return <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '64px 0 96px' }}>
        <EmptyState title="Order not found" desc="It may have been placed on a different device or browser." actionLabel="View Order History" actionTo="/account/orders" />
      </div>
    );
  }

  const pending = order.status === 'pending';
  const cancelled = order.status === 'cancelled';
  const completed = order.status === 'completed';
  const currentStepIndex = STEP_INDEX[order.status] ?? 0;

  function reorder() {
    order.items.forEach((it) => addToCart(it, { silent: true }));
    showToast(`Added order #${order.orderNumber} to cart`);
    openDrawer();
  }

  return (
    <div className="container" style={{ padding: '56px 0 96px', maxWidth: 640 }}>
      <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginBottom: 8 }}>
        <Link to="/account/orders" style={{ color: 'inherit', textDecoration: 'none' }}>Order History</Link> &rarr; Order #{order.orderNumber}
      </div>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>Order #{order.orderNumber}</h1>
      <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 32 }}>
        Placed {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
        {pending && ' — pending manual confirmation'}
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 20 }}>Status</div>
        {cancelled ? (
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-error)' }}>This order was cancelled.</div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {ORDER_TIMELINE.map((step, i) => (
              <div key={step} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{
                  height: 6, borderRadius: 999, marginBottom: 8,
                  background: i <= currentStepIndex ? 'var(--color-olive)' : 'var(--color-border)',
                }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: i <= currentStepIndex ? 'var(--color-choc)' : 'var(--color-text-faint)' }}>{step}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>Items</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {order.items.map((it) => (
            <div key={it.id}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <img src={it.image} alt={it.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Qty {it.qty}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtLineTotal(it.price, it.qty)}</div>
              </div>
              {completed && it.productId && (
                reviewedProductIds.has(it.productId)
                  ? <div style={{ fontSize: 12, color: 'var(--color-olive)', marginTop: 8, marginLeft: 70 }}>Thanks — your review was submitted.</div>
                  : (
                    <ReviewForm
                      productId={it.productId}
                      orderId={order.id}
                      onSubmitted={() => setReviewedProductIds((prev) => new Set(prev).add(it.productId))}
                    />
                  )
              )}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid rgba(50,26,23,0.12)', paddingTop: 14 }}>
          <div>Total</div><div>{fmtNaira(order.total)}</div>
        </div>
        {order.hasUnpricedItems && (
          <div style={{ fontSize: 11, color: 'var(--color-cocoa)', marginTop: 8 }}>
            Excludes item(s) needing price confirmation — we'll confirm final pricing before delivery.
          </div>
        )}
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20, fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
        <div><strong>Fulfilment:</strong> {order.fulfilment === 'pickup' ? 'Pickup' : `Delivery — ${order.address || ''}`}</div>
        <div><strong>Preferred date:</strong> {order.date || '—'}</div>
        <div><strong>Preferred time:</strong> {order.time || '—'}</div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={reorder}>Reorder</button>
        <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-whatsapp">Contact Support</a>
      </div>
    </div>
  );
}

function ReviewForm({ productId, orderId, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | error
  const [errorMsg, setErrorMsg] = useState('');

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{ marginLeft: 70, marginTop: 8, background: 'none', border: 'none', fontSize: 12, fontWeight: 700, color: 'var(--color-cocoa)', cursor: 'pointer' }}>
        Leave a review
      </button>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    try {
      await submitReview({ productId, orderId, rating, comment });
      onSubmitted();
    } catch (err) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginLeft: 70, marginTop: 10, padding: 14, background: 'var(--color-cream)', borderRadius: 12 }}>
      <div role="radiogroup" aria-label="Rating" style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n} type="button" role="radio" aria-checked={rating === n} onClick={() => setRating(n)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--color-caramel)', padding: 0 }}
          >
            {n <= rating ? '★' : '☆'}
          </button>
        ))}
      </div>
      <textarea
        value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment..."
        style={{ width: '100%', height: 50, resize: 'none', marginBottom: 8 }}
      />
      {status === 'error' && <div role="alert" style={{ fontSize: 12, color: 'var(--color-error)', marginBottom: 8 }}>{errorMsg}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={status === 'saving'}>{status === 'saving' ? 'Submitting…' : 'Submit Review'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-faint)', cursor: 'pointer' }}>Cancel</button>
      </div>
    </form>
  );
}
