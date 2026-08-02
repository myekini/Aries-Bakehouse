import { useEffect, useState } from 'react';
import { ArrowLeft, Check, CircleAlert, MessageCircle, ReceiptText, RotateCcw, Star } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getOrder, ORDER_TIMELINE } from '../lib/orders.js';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { getMyReviewedProductIds, submitReview } from '../lib/reviews.js';
import { useCart } from '../context/CartContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { toast } from '../components/ui/toast.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { Textarea } from '../components/ui/textarea.jsx';

const STEP_INDEX = { pending: 0, confirmed: 0, preparing: 1, ready_or_out: 2, completed: 3 };
const STATUS_LABEL = { pending: 'Pending confirmation', confirmed: 'Received', preparing: 'Preparing', ready_or_out: 'Ready / out', completed: 'Completed', cancelled: 'Cancelled' };

export default function OrderDetail() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());
  const { addToCart, openDrawer } = useCart();

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId).then((result) => { if (!cancelled) setOrder(result); }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    if (order?.status !== 'completed') return undefined;
    let cancelled = false;
    getMyReviewedProductIds(orderId).then((ids) => { if (!cancelled) setReviewedProductIds(ids); }).catch(() => {});
    return () => { cancelled = true; };
  }, [order?.status, orderId]);

  if (order === undefined) return <div className="container order-state-loading">Loading order…</div>;
  if (!order) return <main className="container order-detail-page"><EmptyState icon={ReceiptText} title="Order not found" desc="It may belong to another account or no longer be available." actionLabel="View order history" actionTo="/account/orders" /></main>;

  const cancelled = order.status === 'cancelled';
  const completed = order.status === 'completed';
  const currentStepIndex = STEP_INDEX[order.status] ?? 0;

  function reorder() {
    order.items.forEach((item) => addToCart(item, { silent: true }));
    toast.success('Order added to cart', { description: `Order #${order.orderNumber}` });
    openDrawer();
  }

  return (
    <main className="container order-detail-page">
      <Link className="order-detail-page__back" to="/account/orders"><ArrowLeft size={15} aria-hidden="true" />Order history</Link>
      <header className="order-detail-page__header"><div><p className="page-kicker">Order details</p><h1>#{order.orderNumber}</h1><span>Placed {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</span></div><span className={`customer-order-status customer-order-status--${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span></header>

      <section className="order-panel order-progress" aria-labelledby="order-progress-title"><div className="order-panel__header"><h2 id="order-progress-title">Order status</h2><p>{cancelled ? 'This order has been cancelled.' : STATUS_LABEL[order.status]}</p></div>{!cancelled && <ol>{ORDER_TIMELINE.map((step, index) => <li key={step} className={index <= currentStepIndex ? 'is-complete' : ''}><span>{index < currentStepIndex ? <Check size={13} aria-hidden="true" /> : index + 1}</span><strong>{step}</strong></li>)}</ol>}</section>

      <section className="order-panel"><div className="order-panel__header"><h2>Items</h2><p>{order.items.length} item{order.items.length === 1 ? '' : 's'}</p></div><div className="order-detail-items">{order.items.map((item) => <article key={item.id}><span className="order-detail-items__image">{item.image ? <img src={item.image} alt="" loading="lazy" /> : <ReceiptText size={17} aria-hidden="true" />}</span><div><h3>{item.name}</h3><p>Quantity {item.qty}</p>{completed && item.productId && (reviewedProductIds.has(item.productId) ? <span className="order-review-thanks">Review submitted</span> : <ReviewForm productId={item.productId} orderId={order.id} onSubmitted={() => setReviewedProductIds((previous) => new Set(previous).add(item.productId))} />)}</div><strong>{fmtLineTotal(item.price, item.qty)}</strong></article>)}</div><div className="order-detail-total"><span>Total</span><strong>{fmtNaira(order.total)}</strong></div>{order.hasUnpricedItems && <p className="order-panel__notice">The displayed total excludes items awaiting price confirmation.</p>}</section>

      <section className="order-panel"><div className="order-panel__header"><h2>Fulfilment</h2></div><dl className="order-detail-meta"><div><dt>Method</dt><dd>{order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</dd></div>{order.fulfilment === 'delivery' && <div><dt>Address</dt><dd>{order.address || 'To be confirmed'}</dd></div>}<div><dt>Preferred date</dt><dd>{order.date || 'To be confirmed'}</dd></div><div><dt>Preferred time</dt><dd>{order.time || 'To be confirmed'}</dd></div></dl></section>

      <div className="order-detail-actions"><button className="btn btn-primary" type="button" onClick={reorder}><RotateCcw size={15} aria-hidden="true" />Reorder</button><a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-secondary"><MessageCircle size={15} aria-hidden="true" />Contact support</a></div>
    </main>
  );
}

function ReviewForm({ productId, orderId, onSubmitted }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('saving');
    try {
      await submitReview({ productId, orderId, rating, comment });
      onSubmitted();
    } catch (error) {
      setStatus('error');
      setErrorMsg(error.message);
    }
  }

  if (!open) return <button className="order-review-trigger" type="button" onClick={() => setOpen(true)}>Leave a review</button>;

  return <form className="order-review-form" onSubmit={handleSubmit}><div role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((number) => <button key={number} type="button" role="radio" aria-label={`${number} star${number === 1 ? '' : 's'}`} aria-checked={rating === number} onClick={() => setRating(number)}><Star size={18} fill={number <= rating ? 'currentColor' : 'none'} aria-hidden="true" /></button>)}</div><label className="visually-hidden" htmlFor={`review-${productId}`}>Review comment</label><Textarea id={`review-${productId}`} value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Optional comment" />{status === 'error' && <Alert variant="destructive"><CircleAlert size={16} aria-hidden="true" /><AlertDescription>{errorMsg}</AlertDescription></Alert>}<footer><button type="submit" className="btn btn-primary btn-sm" disabled={status === 'saving'}>{status === 'saving' ? 'Submitting...' : 'Submit review'}</button><button type="button" onClick={() => setOpen(false)}>Cancel</button></footer></form>;
}
