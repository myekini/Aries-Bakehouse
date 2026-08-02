import { useEffect, useState } from 'react';
import { ArrowRight, ReceiptText, RotateCcw } from 'lucide-react';
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
  const { addToCart, openDrawer } = useCart();

  useEffect(() => {
    getOrders().then(setOrders).catch((error) => { console.error(error); setLoadError(true); setOrders([]); });
  }, []);

  function reorder(order) {
    order.items.forEach((item) => addToCart(item, { silent: true }));
    toast.success('Order added to cart', { description: `Order #${order.orderNumber}` });
    openDrawer();
  }

  return (
    <main className="container orders-page">
      <header className="orders-page__header"><div><p className="page-kicker">Your account</p><h1>Order history</h1><p>Track current orders or quickly reorder previous selections.</p></div><Link to="/account">Account settings</Link></header>
      {orders === null ? <div className="orders-loading" aria-label="Loading orders">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton" />)}</div> : loadError ? <EmptyState icon={ReceiptText} title="Orders could not be loaded" desc="Check your connection and refresh the page." /> : orders.length === 0 ? <EmptyState icon={ReceiptText} title="No orders yet" desc="Your order history will appear here after your first checkout." actionLabel="Browse the menu" actionTo="/menu" /> : <section className="orders-list" aria-label="Previous orders">{orders.map((order) => <article className="orders-list__item" key={order.id}><div className="orders-list__identity"><span>Order</span><Link to={`/account/orders/${order.id}`}>#{order.orderNumber}</Link><small>{new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</small></div><div className="orders-list__meta"><span>{order.items.length} item{order.items.length === 1 ? '' : 's'}</span><strong>{fmtNaira(order.total)}</strong></div><span className={`customer-order-status customer-order-status--${order.status}`}>{STATUS_LABEL[order.status] || order.status}</span><div className="orders-list__actions"><button type="button" onClick={() => reorder(order)}><RotateCcw size={14} aria-hidden="true" />Reorder</button><Link to={`/account/orders/${order.id}`}>Details<ArrowRight size={14} aria-hidden="true" /></Link></div></article>)}</section>}
    </main>
  );
}
