import { useState } from 'react';
import { ArrowLeft, LockKeyhole, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { fmtLineTotal, fmtNaira } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import EmptyState from '../components/EmptyState.jsx';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';

export default function Cart() {
  const { items, subtotal, hasUnpricedItems, updateQty, removeFromCart, addToCart } = useCart();
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState(null);
  const [discountStatus, setDiscountStatus] = useState('idle');
  const [discountMsg, setDiscountMsg] = useState('');
  const total = Math.max(0, subtotal - (discount?.amount || 0));

  function handleRemove(item) {
    removeFromCart(item.id);
    const id = toast.info('Removed from cart', {
      description: item.name,
      actionProps: {
        children: 'Undo',
        onClick() {
          addToCart(item, { silent: true });
          toast.close(id);
        },
      },
    });
  }

  async function applyDiscount(event) {
    event.preventDefault();
    if (!discountCode.trim()) {
      setDiscountStatus('error');
      setDiscountMsg('Enter a discount code first.');
      return;
    }
    setDiscountStatus('working');
    setDiscountMsg('');
    try {
      const applied = await redeemDiscountCode(discountCode, subtotal);
      setDiscount(applied);
      setDiscountStatus('applied');
      setDiscountMsg(`${applied.code} applied.`);
      trackEvent('discount_code_used', { code: applied.code, amount: applied.amount });
    } catch (error) {
      setDiscount(null);
      setDiscountStatus('error');
      setDiscountMsg(error.message);
    }
  }

  if (items.length === 0) {
    return <main className="container cart-page cart-page--empty"><EmptyState icon={ShoppingBag} title="Your cart is empty" desc="Choose a treat, configure it, and it will appear here." actionLabel="Browse the menu" actionTo="/menu" /></main>;
  }

  return (
    <main className="container cart-page">
      <header className="cart-page__header">
        <div><p className="page-kicker">Your selection</p><h1>Shopping cart</h1><p>{items.length} configured item{items.length === 1 ? '' : 's'} ready for checkout.</p></div>
        <Link to="/menu" className="cart-page__continue"><ArrowLeft size={15} aria-hidden="true" />Continue shopping</Link>
      </header>

      <div className="cart-layout">
        <section className="cart-items" aria-label="Cart items">
          {items.map((item) => <article key={item.id} className="cart-item">
            <span className="cart-item__image">{item.image ? <img loading="lazy" src={item.image} alt="" /> : <ShoppingBag size={20} aria-hidden="true" />}</span>
            <div className="cart-item__details"><h2>{item.name}</h2><p>{fmtNaira(item.price)} each</p><div className="cart-item__controls"><div className="cart-quantity" aria-label={`${item.name} quantity`}><button type="button" aria-label={`Decrease ${item.name} quantity`} disabled={item.qty <= 1} onClick={() => updateQty(item.id, item.qty - 1)}><Minus size={14} aria-hidden="true" /></button><span aria-live="polite">{item.qty}</span><button type="button" aria-label={`Increase ${item.name} quantity`} onClick={() => updateQty(item.id, item.qty + 1)}><Plus size={14} aria-hidden="true" /></button></div><button type="button" className="cart-item__remove" onClick={() => handleRemove(item)}><Trash2 size={14} aria-hidden="true" />Remove</button></div></div>
            <strong className="cart-item__total">{fmtLineTotal(item.price, item.qty)}</strong>
          </article>)}
        </section>

        <aside className="cart-summary" aria-label="Cart summary">
          <div className="cart-summary__header"><p>Order summary</p><h2>{items.length} item{items.length === 1 ? '' : 's'}</h2></div>
          <form className="cart-discount" onSubmit={applyDiscount}><label htmlFor="discount">Discount code</label><div><input id="discount" value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="Enter code" /><button disabled={discountStatus === 'working'}>{discountStatus === 'working' ? 'Checking' : 'Apply'}</button></div>{discountMsg && <p className={discountStatus === 'error' ? 'is-error' : ''} role={discountStatus === 'error' ? 'alert' : 'status'}>{discountMsg}</p>}</form>
          <div className="cart-totals"><div><span>Subtotal</span><strong>{fmtNaira(subtotal)}</strong></div>{discount && <div><span>Discount · {discount.code}</span><strong>-{fmtNaira(discount.amount)}</strong></div>}<div><span>Delivery</span><strong>Calculated after address review</strong></div><div className="cart-totals__total"><span>Current total</span><strong>{fmtNaira(total)}</strong></div></div>
          {hasUnpricedItems && <p className="cart-summary__notice">Some configured items still need price confirmation. Online payment will remain unavailable until pricing is confirmed.</p>}
          <Link to="/checkout" state={discount ? { discount } : undefined} className="btn btn-primary btn-lg cart-checkout"><LockKeyhole size={15} aria-hidden="true" />Continue to checkout</Link>
          <p className="cart-summary__secure">Your selections stay editable until payment.</p>
        </aside>
      </div>
    </main>
  );
}
