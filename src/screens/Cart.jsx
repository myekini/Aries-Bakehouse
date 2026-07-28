import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';

export default function Cart() {
  const { items, subtotal, hasUnpricedItems, updateQty, removeFromCart, addToCart } = useCart();
  const [undoItem, setUndoItem] = useState(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountStatus, setDiscountStatus] = useState('idle');
  const [discountMsg, setDiscountMsg] = useState('');
  const undoTimer = useRef(null);
  const total = Math.max(0, subtotal - (discount?.amount || 0));

  function handleRemove(item) {
    setUndoItem(item);
    removeFromCart(item.id);
    clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndoItem(null), 5000);
  }

  function handleUndo() {
    if (undoItem) addToCart(undoItem, { silent: true });
    setUndoItem(null);
  }

  async function applyDiscount(e) {
    e.preventDefault();
    setDiscountStatus('working');
    setDiscountMsg('');
    try {
      const applied = await redeemDiscountCode(discountCode, subtotal);
      setDiscount(applied);
      setDiscountStatus('applied');
      setDiscountMsg(`${applied.code} applied.`);
      trackEvent('discount_code_used', { code: applied.code, amount: applied.amount });
    } catch (err) {
      setDiscount(null);
      setDiscountStatus('error');
      setDiscountMsg(err.message);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '56px 0 120px' }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 40 }}>Your Cart</h1>
        <EmptyState title="Your cart is empty" desc="Add something fresh from the menu." actionLabel="Browse Menu" actionTo="/menu" />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '56px 0 120px' }}>
      <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 40 }}>Your Cart</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((it) => (
            <div key={it.id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 18 }}>
              <img loading="lazy" src={it.image} alt={it.name} style={{ width: 88, height: 88, borderRadius: 14, objectFit: 'cover' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{it.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{fmtNaira(it.price)} each</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                  <button aria-label={`Decrease ${it.name} quantity`} onClick={() => updateQty(it.id, it.qty - 1)} style={stepperBtn}>&minus;</button>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{it.qty}</span>
                  <button aria-label={`Increase ${it.name} quantity`} onClick={() => updateQty(it.id, it.qty + 1)} style={stepperBtn}>+</button>
                  <button onClick={() => handleRemove(it)} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--color-error)', fontWeight: 700, cursor: 'pointer', marginLeft: 12 }}>Remove</button>
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 17, whiteSpace: 'nowrap' }}>{fmtLineTotal(it.price, it.qty)}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ flex: '0 1 360px', minWidth: 280, padding: 28, position: 'sticky', top: 96 }}>
          <form onSubmit={applyDiscount} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 }}>Discount Code</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="visually-hidden" htmlFor="discount">Discount code</label>
              <input id="discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Enter code" style={{ flex: 1, borderRadius: 999 }} />
              <button className="btn btn-primary btn-sm" disabled={discountStatus === 'working'}>Apply</button>
            </div>
            {discountMsg && (
              <div role={discountStatus === 'error' ? 'alert' : 'status'} style={{ fontSize: 12, color: discountStatus === 'error' ? 'var(--color-error)' : 'var(--color-olive)', marginTop: 8 }}>
                {discountMsg}
              </div>
            )}
          </form>
          <SummaryRow label="Subtotal" value={fmtNaira(subtotal)} strong />
          <SummaryRow label="Delivery Fee" value="TBC at checkout" />
          {discount && <SummaryRow label={`Discount (${discount.code})`} value={`-${fmtNaira(discount.amount)}`} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '1px solid rgba(50,26,23,0.12)', paddingTop: 16, marginTop: 8, marginBottom: hasUnpricedItems ? 6 : 20 }}>
            <div>Total</div><div>{fmtNaira(total)}</div>
          </div>
          {hasUnpricedItems && (
            <div style={{ fontSize: 11, color: 'var(--color-cocoa)', marginBottom: 14 }}>
              Excludes item(s) needing price confirmation — we'll confirm final pricing before delivery.
            </div>
          )}

          <Link to="/checkout" state={discount ? { discount } : undefined} className="btn btn-primary" style={{ display: 'flex', width: '100%' }}>Checkout</Link>
          <Link to="/menu" style={{ display: 'block', textAlign: 'center', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--color-cocoa)' }}>Continue Shopping</Link>
        </div>
      </div>

      {undoItem && (
        <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-choc)', color: 'var(--color-white)', padding: '14px 20px', borderRadius: 999, fontSize: 13, fontWeight: 700, display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 12px 24px rgba(0,0,0,0.25)' }}>
          <div>Removed {undoItem.name}</div>
          <button onClick={handleUndo} style={{ background: 'none', border: 'none', color: '#EBC7A0', cursor: 'pointer', fontWeight: 700 }}>Undo</button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, value, strong }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 10 }}>
      <div>{label}</div>
      <div style={strong ? { fontWeight: 700, color: 'var(--color-choc)' } : undefined}>{value}</div>
    </div>
  );
}

const stepperBtn = { width: 40, height: 40, borderRadius: 999, background: 'var(--color-cream)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700 };
