import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, MessageCircle } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../lib/orders.js';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import EmptyState from '../components/EmptyState.jsx';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    getOrder(orderId).then((result) => { if (!cancelled) setOrder(result); }).catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [orderId]);

  if (order === undefined) return <div className="container order-state-loading">Loading your order…</div>;
  if (!order) return <main className="container order-confirmation"><EmptyState title="Order not found" desc="Place an order from the menu to see its confirmation." actionLabel="Browse the menu" actionTo="/menu" /></main>;

  const pending = order.status === 'pending';
  const StatusIcon = pending ? Clock3 : CheckCircle2;

  return (
    <main className="container order-confirmation">
      <header className="order-confirmation__header"><span className={pending ? 'is-pending' : ''}><StatusIcon size={25} aria-hidden="true" /></span><p>{pending ? 'Payment pending' : 'Order received'}</p><h1>{pending ? 'Your checkout has been saved' : 'Thank you for your order'}</h1><div>{pending ? 'Your order is recorded while payment confirmation completes.' : `Thank you, ${order.name || 'friend'}. The kitchen has received your order.`}</div><small>Order #{order.orderNumber}</small></header>

      <section className="order-confirmation__panel">
        <div className="order-confirmation__items">{order.items.map((item) => <div key={item.id}><span>{item.name}<small>Quantity {item.qty}</small></span><strong>{fmtLineTotal(item.price, item.qty)}</strong></div>)}</div>
        <div className="order-confirmation__total"><span>Total</span><strong>{fmtNaira(order.total)}</strong></div>
        {order.hasUnpricedItems && <p className="order-confirmation__notice">The displayed total excludes items still awaiting price confirmation.</p>}
        <dl className="order-confirmation__details"><div><dt>Fulfilment</dt><dd>{order.fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</dd></div>{order.fulfilment === 'delivery' && <div><dt>Address</dt><dd>{order.address || 'To be confirmed'}</dd></div>}<div><dt>Preferred date</dt><dd>{order.date || 'To be confirmed'}</dd></div><div><dt>Preferred time</dt><dd>{order.time || 'To be confirmed'}</dd></div></dl>
      </section>

      <div className="order-confirmation__actions"><Link to={`/account/orders/${order.id}`} className="btn btn-primary">Track order<ArrowRight size={15} aria-hidden="true" /></Link><a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-secondary"><MessageCircle size={15} aria-hidden="true" />Contact support</a><Link to="/menu">Continue shopping</Link></div>
    </main>
  );
}
