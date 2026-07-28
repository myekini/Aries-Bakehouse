import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getOrders } from '../lib/orders.js';
import { fmtNaira } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import EmptyState from '../components/EmptyState.jsx';

const STATUS_LABEL = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_or_out: 'Ready / Out for delivery',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function OrderHistory() {
  const [orders, setOrders] = useState(null);
  const { addToCart, openDrawer, showToast } = useCart();

  useEffect(() => {
    getOrders().then(setOrders).catch((err) => { console.error(err); setOrders([]); });
  }, []);

  function reorder(order) {
    order.items.forEach((it) => addToCart(it, { silent: true }));
    showToast(`Added order #${order.orderNumber} to cart`);
    openDrawer();
  }

  if (orders === null) {
    return <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>Loading orders…</div>;
  }

  return (
    <div className="container" style={{ padding: '56px 0 96px' }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>Order History</h1>

      {orders.length === 0 ? (
        <EmptyState title="No orders yet" desc="Your past orders will show up here once you place one." actionLabel="Browse Menu" actionTo="/menu" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <div key={order.id} className="card" style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>Order #{order.orderNumber}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
                  {new Date(order.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  {' · '}{order.items.length} item{order.items.length === 1 ? '' : 's'}
                  {' · '}{fmtNaira(order.total)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-olive)', marginTop: 6 }}>{STATUS_LABEL[order.status] || order.status}</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to={`/account/orders/${order.id}`} className="btn btn-secondary btn-sm">View Detail</Link>
                <button onClick={() => reorder(order)} className="btn btn-primary btn-sm">Reorder</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
