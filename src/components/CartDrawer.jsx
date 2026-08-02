import { useEffect, useRef } from 'react';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';

export default function CartDrawer() {
  const { items, subtotal, hasUnpricedItems, drawerOpen, closeDrawer, updateQty, removeFromCart } = useCart();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = dialogRef.current?.querySelectorAll('a[href], button:not([disabled])');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [closeDrawer, drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <div className="cart-drawer-root">
      <button className="cart-drawer__backdrop" type="button" onClick={closeDrawer} aria-label="Close cart" />
      <aside ref={dialogRef} role="dialog" aria-label="Shopping cart" aria-modal="true" tabIndex={-1} className="cart-drawer">
        <header className="cart-drawer__header"><div><p>Your selection</p><h2>Cart <span>{items.length}</span></h2></div><button ref={closeButtonRef} type="button" onClick={closeDrawer} aria-label="Close cart"><X size={20} aria-hidden="true" /></button></header>

        <div className="cart-drawer__body">
          {items.length === 0 ? <div className="cart-drawer__empty"><span><ShoppingBag size={21} aria-hidden="true" /></span><h3>Your cart is empty</h3><p>Add something fresh from the menu.</p><Link to="/menu" onClick={closeDrawer} className="btn btn-primary">Browse menu</Link></div> : <div className="cart-drawer__items">
            {items.map((item) => <article key={item.id} className="cart-drawer__item">
              <span className="cart-drawer__image">{item.image ? <img loading="lazy" src={item.image} alt="" /> : <ShoppingBag size={17} aria-hidden="true" />}</span>
              <div className="cart-drawer__copy"><h3>{item.name}</h3><strong>{fmtLineTotal(item.price, item.qty)}</strong><div><button type="button" disabled={item.qty <= 1} onClick={() => updateQty(item.id, item.qty - 1)} aria-label={`Decrease ${item.name} quantity`}><Minus size={13} aria-hidden="true" /></button><span>{item.qty}</span><button type="button" onClick={() => updateQty(item.id, item.qty + 1)} aria-label={`Increase ${item.name} quantity`}><Plus size={13} aria-hidden="true" /></button></div></div>
              <button type="button" className="cart-drawer__remove" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name}`}><Trash2 size={15} aria-hidden="true" /></button>
            </article>)}
          </div>}
        </div>

        {items.length > 0 && <footer className="cart-drawer__footer"><div><span>Subtotal</span><strong>{fmtNaira(subtotal)}</strong></div>{hasUnpricedItems && <p>Some prices still need confirmation.</p>}<Link to="/checkout" onClick={closeDrawer} className="btn btn-primary">Checkout</Link><Link to="/cart" onClick={closeDrawer}>View and edit cart</Link></footer>}
      </aside>
    </div>
  );
}
