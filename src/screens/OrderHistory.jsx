import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MessageCircle, ReceiptText, RefreshCw, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getOrders } from '../lib/orders.js';
import { fmtNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { toast } from '../components/ui/toast.jsx';

const STATUS_LABEL = { pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing', ready_or_out: 'Ready / out', completed: 'Completed', cancelled: 'Cancelled' };

export default function OrderHistory() {
  const [orders, setOrders] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [view, setView] = useState('active');
  const { addToCart, openDrawer } = useCart();

  function loadOrders() {
    setLoadError(false);
    setOrders(null);
    getOrders().then(setOrders).catch(() => { setLoadError(true); setOrders([]); });
  }

  useEffect(() => {
    let cancelled = false;
    getOrders().then((result) => { if (!cancelled) setOrders(result); }).catch(() => { if (!cancelled) { setLoadError(true); setOrders([]); } });
    return () => { cancelled = true; };
  }, []);

  function reorder(order) {
    order.items.forEach((item) => addToCart(item, { silent: true }));
    toast.success('Order added to cart', { description: `Order #${order.orderNumber}` });
    openDrawer();
  }

  const activeOrders = useMemo(() => (orders || []).filter((order) => !['completed', 'cancelled'].includes(order.status)), [orders]);
  const pastOrders = useMemo(() => (orders || []).filter((order) => ['completed', 'cancelled'].includes(order.status)), [orders]);
  const visibleOrders = view === 'active' ? activeOrders : pastOrders;

  return (
    <main className="container orders-page">
      <header className="orders-page__header"><div><p className="page-kicker">Your account</p><h1>Your orders</h1><p>Follow orders in progress, review the details, or order a favourite again.</p></div><Link to="/account">Account settings</Link></header>
      {orders !== null && !loadError && orders.length > 0 && <div className="orders-view-switcher" role="tablist" aria-label="Order history views">
        <button type="button" role="tab" aria-selected={view === 'active'} className={view === 'active' ? 'is-active' : ''} onClick={() => setView('active')}>In progress <span>{activeOrders.length}</span></button>
        <button type="button" role="tab" aria-selected={view === 'past'} className={view === 'past' ? 'is-active' : ''} onClick={() => setView('past')}>Past orders <span>{pastOrders.length}</span></button>
      </div>}
      {orders === null ? <div className="orders-loading" aria-label="Loading orders">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton" />)}</div> : loadError ? <EmptyState icon={ReceiptText} title="Orders could not be loaded" desc="We could not reach your order history. Check your connection and try again."><button type="button" className="btn btn-primary" onClick={loadOrders}><RefreshCw size={15} aria-hidden="true" />Try again</button></EmptyState> : orders.length === 0 ? <EmptyState icon={ReceiptText} title="Your first bake is waiting" desc="When you place an order, its progress and receipt will stay together here." actionLabel="Explore the menu" actionTo="/menu" /> : visibleOrders.length === 0 ? <EmptyState icon={ReceiptText} title={view === 'active' ? 'Nothing in progress' : 'No past orders yet'} desc={view === 'active' ? 'You are all caught up. Finished orders are saved under Past orders.' : 'Completed and cancelled orders will appear here.'}>{view === 'active' && <button type="button" className="btn btn-secondary" onClick={() => setView('past')}>View past orders</button>}</EmptyState> : <section className="orders-list" aria-label={view === 'active' ? 'Orders in progress' : 'Past orders'}>{visibleOrders.map((order) => <article className="orders-list__item" key={order.id}><div className="orders-list__identity"><span>Order</span><Link to={`/account/orders/${order.id}`}>#{order.orderNumber}</Link><small>{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><div className="orders-list__meta"><span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span><strong>{fmtNaira(order.total)}</strong></div><span className={`customer-order-status customer-order-status--${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span><div className="orders-list__actions">{['completed', 'cancelled'].includes(order.status) && <button type="button" onClick={() => reorder(order)}><RotateCcw size={14} aria-hidden="true" />Order again</button>}<Link to={`/account/orders/${order.id}`}>{view === 'active' ? 'Track order' : 'View details'}<ArrowRight size={14} aria-hidden="true" /></Link></div></article>)}</section>}
      <aside className="orders-support-strip"><div><MessageCircle size={18} aria-hidden="true" /><span><strong>Need help with an order?</strong><small>Include the order number so the bakehouse can help faster.</small></span></div><a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer">Message support</a></aside>
    </main>
  );
}
