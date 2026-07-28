import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtNaira } from '../lib/format.js';

export default function CartDrawer() {
  const { items, subtotal, drawerOpen, closeDrawer, updateQty, removeFromCart } = useCart();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    dialogRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') closeDrawer();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [closeDrawer, drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100 }}>
      <div
        onClick={closeDrawer}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: 'rgba(50,26,23,0.4)', opacity: 1, transition: 'opacity 0.3s' }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-label="Shopping cart"
        aria-modal="true"
        tabIndex={-1}
        style={{
          position: 'absolute', top: 0, right: 0, height: '100%', width: 'min(420px, 100vw)',
          background: 'var(--color-cream)', boxShadow: '-16px 0 40px rgba(50,26,23,0.2)',
          transform: 'translateX(0)',
          transition: 'transform 0.35s cubic-bezier(0.16,1,0.3,1)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: 24, borderBottom: '1px solid rgba(50,26,23,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Your Cart</div>
          <button onClick={closeDrawer} aria-label="Close cart" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, fontWeight: 700 }}>&times;</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Your cart is empty</div>
              <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8 }}>Add something fresh from the menu.</div>
              <Link to="/menu" onClick={closeDrawer} className="btn btn-primary" style={{ display: 'inline-block', marginTop: 20 }}>Browse Menu</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {items.map((it) => (
                <div key={it.id} style={{ display: 'flex', gap: 14, alignItems: 'center', background: 'var(--color-white)', borderRadius: 14, padding: 12 }}>
                  <img loading="lazy" src={it.image} alt={it.name} style={{ width: 64, height: 64, borderRadius: 10, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{it.name}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 2 }}>{fmtNaira(it.price)}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <button onClick={() => updateQty(it.id, it.qty - 1)} aria-label={`Decrease ${it.name} quantity`} style={stepperBtn}>&minus;</button>
                      <span style={{ fontWeight: 700, fontSize: 13 }}>{it.qty}</span>
                      <button onClick={() => updateQty(it.id, it.qty + 1)} aria-label={`Increase ${it.name} quantity`} style={stepperBtn}>+</button>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(it.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-error)', fontWeight: 700 }}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid rgba(50,26,23,0.12)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, marginBottom: 14 }}>
              <div>Subtotal</div><div>{fmtNaira(subtotal)}</div>
            </div>
            <Link to="/checkout" onClick={closeDrawer} className="btn btn-primary" style={{ display: 'flex', width: '100%' }}>Checkout</Link>
          </div>
        )}
      </div>
    </div>
  );
}

const stepperBtn = {
  width: 36, height: 36, borderRadius: 999, background: 'var(--color-cream)', border: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 700,
};
