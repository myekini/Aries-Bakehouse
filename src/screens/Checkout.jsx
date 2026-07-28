import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtLineTotal, fmtNaira, tomorrowISODate } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import { saveOrder } from '../lib/orders.js';
import { loadPaystackScript } from '../lib/paystack.js';
import { supabase } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';

const WHATSAPP_NUMBER = '2348121145785';

export default function Checkout() {
  const cart = useCart();
  const { customer, isRealAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedAddresses, setSavedAddresses] = useState(null);

  // Buy Now passes a single item via navigation state and must NOT touch
  // the shared cart (spec §7: "skips cart, goes straight to checkout with
  // this item"). When present, checkout runs against just that item.
  const buyNowItem = location.state?.buyNowItem || null;
  const items = buyNowItem ? [buyNowItem] : cart.items;
  const subtotal = useMemo(
    () => items.reduce((s, i) => s + (i.price || 0) * i.qty, 0),
    [items],
  );
  const hasUnpricedItems = items.some((i) => i.price === null || i.price === undefined);

  const [fulfilment, setFulfilment] = useState('pickup');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState(tomorrowISODate());
  const [time, setTime] = useState('morning');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [discountCode, setDiscountCode] = useState(location.state?.discount?.code || '');
  const [discount, setDiscount] = useState(location.state?.discount || null);
  const [discountStatus, setDiscountStatus] = useState('idle');
  const [discountMsg, setDiscountMsg] = useState('');
  const discountAmount = discount?.amount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  // idle | opening | failed | unconfirmed — the modal only ever appears for
  // the failed/unconfirmed follow-up states; Paystack owns its own iframe
  // for the actual payment step.
  const [paymentState, setPaymentState] = useState('idle');
  const [saving, setSaving] = useState(false);
  const paymentDialogRef = useRef(null);

  useEffect(() => {
    trackEvent('checkout_started', { itemCount: items.length, subtotal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Saved addresses are purely an accelerator for signed-in customers — the
  // free-text field above remains the source of truth and guest checkout
  // must keep working exactly as before (spec §8/§9).
  useEffect(() => {
    if (!isRealAccount || !customer?.id) { setSavedAddresses(null); return; }
    let cancelled = false;
    supabase.from('address').select('*').eq('customer_id', customer.id)
      .order('is_default', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        setSavedAddresses(data);
      });
    return () => { cancelled = true; };
  }, [isRealAccount, customer?.id]);

  useEffect(() => {
    const paymentDialogOpen = paymentState === 'failed' || paymentState === 'unconfirmed';
    if (!paymentDialogOpen) return undefined;
    paymentDialogRef.current?.focus();

    function onKeyDown(event) {
      if (event.key === 'Escape') setPaymentState('idle');
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paymentState]);

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 20 }}>Your cart is empty</div>
        <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 10 }}>Add something from the menu before checking out.</div>
        <Link to="/menu" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 24 }}>Browse Menu</Link>
      </div>
    );
  }

  // `status` must match the DB's order.status check constraint (spec §13
  // lifecycle: pending | confirmed | preparing | ready_or_out | completed |
  // cancelled).
  function buildOrder(status, fallbackChannel = null, paymentReference = null) {
    return {
      items, subtotal, subtotalLabel: fmtNaira(subtotal), hasUnpricedItems,
      discountCodeId: discount?.id || null,
      discountAmount,
      deliveryFee: 0,
      total,
      fulfilment, address, date, time, name, phone, email, notes,
      status, fallbackChannel, paymentReference, createdAt: Date.now(),
    };
  }

  function finishAndLeave(id) {
    // Only the persisted cart needs clearing — a Buy Now checkout never
    // added its item there in the first place.
    if (!buyNowItem) cart.clearCart();
    navigate(`/order/${id}/confirmation`);
  }

  async function payWithPaystack() {
    setSaving(true);
    setPaymentState('opening');
    try {
      const reference = `A11-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const orderId = await saveOrder(buildOrder('pending', null, reference));

      await loadPaystackScript();
      trackEvent('payment_initiated', { orderId, amount: total, reference });
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: email.trim() || `guest-${phone.replace(/\D/g, '') || Date.now()}@aries11.local`,
        amount: Math.round(total * 100), // kobo
        currency: 'NGN',
        ref: reference,
        onClose: () => {
          setSaving(false);
          setPaymentState('failed');
        },
        callback: (response) => {
          // Paystack's own callback firing only means the popup finished —
          // it is NOT proof of payment (spec §8). verify-payment re-checks
          // server-side against Paystack directly before we trust it; the
          // webhook remains the backstop if this call never completes.
          (async () => {
            try {
              const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: response.reference } });
              if (!error && data?.confirmed) {
                finishAndLeave(orderId);
              } else {
                setPaymentState('unconfirmed');
              }
            } catch (err) {
              console.error('verify-payment call failed:', err);
              setPaymentState('unconfirmed');
            } finally {
              setSaving(false);
            }
          })();
        },
      });
      handler.openIframe();
    } catch (err) {
      console.error('Order creation failed:', err);
      cart.showToast('Could not start Paystack — choose a recovery option');
      setSaving(false);
      setPaymentState('failed');
    }
  }

  async function whatsappFallback() {
    setSaving(true);
    const order = buildOrder('pending', 'whatsapp');
    try {
      const id = await saveOrder(order);
      const lines = ['Hello Aries 11 Bakehouse, I would like to complete this saved website order.', `Website order reference: ${id}`, ''];
      order.items.forEach((it) => lines.push(`Product: ${it.name}\nQuantity: ${it.qty}\nUnit price: ${fmtNaira(it.price)}`, ''));
      lines.push(
        `Subtotal: ${fmtNaira(subtotal)}`,
        discount ? `Discount (${discount.code}): -${fmtNaira(discountAmount)}` : null,
        `Estimated total: ${fmtNaira(total)}${hasUnpricedItems ? ' (excludes item(s) needing price confirmation)' : ''}`,
        `Fulfilment: ${fulfilment === 'pickup' ? 'Pickup' : `Delivery - ${address}`}`,
        `Preferred date: ${date}`,
        `Preferred time: ${time}`,
        `Special instructions: ${notes || 'None'}`,
        '',
        `Customer name: ${name}`,
        `Phone number: ${phone}`,
      );
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
      finishAndLeave(id);
    } catch (err) {
      console.error('Order creation failed:', err);
      cart.showToast('Could not place order — please try again');
    } finally {
      setSaving(false);
    }
  }

  const canPay = name.trim() && phone.trim() && (fulfilment === 'pickup' || address.trim());
  const canPayOnline = canPay && !hasUnpricedItems;
  const checkoutValidationMessage = [
    !name.trim() ? 'Add your name.' : null,
    !phone.trim() ? 'Add your phone number.' : null,
    fulfilment === 'delivery' && !address.trim() ? 'Add your delivery address.' : null,
    hasUnpricedItems ? 'One item needs price confirmation before online payment.' : null,
  ].filter(Boolean).join(' ');

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

  return (
    <div className="container checkout-page" style={{ display: 'flex', flexWrap: 'wrap', gap: 56, padding: '56px 0 120px' }}>
      <div style={{ flex: '1 1 400px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0 }}>Checkout</h1>
          {/* Conversion note (§4): delivery/fee questions at checkout are a common
              silent-abandonment cause — link Delivery Info and FAQ directly here,
              not just in the footer. */}
          <div style={{ fontSize: 13, color: 'var(--color-text-faint)', marginTop: 8 }}>
            Questions before you pay? <Link to="/delivery" style={{ color: 'var(--color-cocoa)', fontWeight: 700 }}>Delivery Information</Link>
            {' · '}
            <Link to="/faq" style={{ color: 'var(--color-cocoa)', fontWeight: 700 }}>FAQ</Link>
            {' · '}
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-cocoa)', fontWeight: 700 }}>WhatsApp support</a>
          </div>
        </div>

        <Section step="1" title="Delivery Details">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <ToggleButton active={fulfilment === 'pickup'} onClick={() => setFulfilment('pickup')}>Pickup</ToggleButton>
            <ToggleButton active={fulfilment === 'delivery'} onClick={() => setFulfilment('delivery')}>Delivery</ToggleButton>
          </div>
          {fulfilment === 'pickup' ? (
            <div style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              Pickup from: Aries 11 Bakehouse, Abeokuta, Nigeria. We'll confirm the exact address by WhatsApp.
            </div>
          ) : (
            <>
              {savedAddresses && savedAddresses.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {savedAddresses.map((a) => (
                    <button
                      key={a.id} type="button" onClick={() => setAddress(a.address_text)}
                      className="btn btn-secondary btn-sm"
                    >
                      Use {a.label || 'saved address'}{a.is_default ? ' (default)' : ''}
                    </button>
                  ))}
                </div>
              )}
              <label className="visually-hidden" htmlFor="address">Delivery address</label>
              <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Delivery address in Abeokuta..." required style={{ width: '100%', height: 60, resize: 'none', marginBottom: 8, borderRadius: 12 }} />
              <div style={{ fontSize: 12, color: 'var(--color-cocoa)' }}>
                Delivery fee: TBC — confirmed by the team once your address is reviewed. See <Link to="/delivery" style={{ color: 'inherit', fontWeight: 700 }}>delivery information</Link>.
              </div>
            </>
          )}
        </Section>

        <Section step="2" title="Preferred Date & Time">
          <div style={{ fontSize: 12, color: 'var(--color-cocoa)', marginBottom: 12 }}>Orders require at least 24 hours notice — earlier dates aren't selectable.</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 160px' }}>
              <label className="visually-hidden" htmlFor="date">Preferred date</label>
              <input id="date" type="date" min={tomorrowISODate()} value={date} onChange={(e) => setDate(e.target.value)} style={{ width: '100%', borderRadius: 12 }} />
            </div>
            <div style={{ flex: '1 1 160px' }}>
              <label className="visually-hidden" htmlFor="time">Preferred time</label>
              <select id="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', borderRadius: 12 }}>
                <option value="morning">Morning (9am–12pm)</option>
                <option value="afternoon">Afternoon (12–4pm)</option>
                <option value="evening">Evening (4–7pm)</option>
              </select>
            </div>
          </div>
        </Section>

        <Section step="3" title="Customer Information">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="visually-hidden" htmlFor="name">Full name</label>
              <input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required style={{ width: '100%' }} />
            </div>
            <div>
              <label className="visually-hidden" htmlFor="phone">Phone number</label>
              <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" required style={{ width: '100%' }} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="visually-hidden" htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email for receipt (optional)" style={{ width: '100%' }} />
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 10 }}>
            Checking out as guest — <span style={{ color: 'var(--color-cocoa)', fontWeight: 700 }}>already have an account? Sign in to autofill.</span>
          </div>
        </Section>

        <Section step="4" title="Special Instructions">
          <label className="visually-hidden" htmlFor="notes">Special instructions</label>
          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes for your order..." style={{ width: '100%', height: 60, resize: 'none' }} />
        </Section>

        <Section step="5" title="Discount Code">
          <form onSubmit={applyDiscount}>
            <div style={{ display: 'flex', gap: 8 }}>
              <label className="visually-hidden" htmlFor="checkout-discount">Discount code</label>
              <input id="checkout-discount" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} placeholder="Enter code" style={{ flex: 1, borderRadius: 999 }} />
              <button className="btn btn-primary btn-sm" disabled={discountStatus === 'working'}>Apply</button>
            </div>
            {discountMsg && (
              <div role={discountStatus === 'error' ? 'alert' : 'status'} style={{ fontSize: 12, color: discountStatus === 'error' ? 'var(--color-error)' : 'var(--color-olive)', marginTop: 8 }}>
                {discountMsg}
              </div>
            )}
          </form>
        </Section>
      </div>

      <div style={{ flex: '0 1 400px', minWidth: 280 }}>
        <div className="card" style={{ padding: 28, position: 'sticky', top: 96 }}>
          <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>Confirm &amp; Pay</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <div style={{ color: 'var(--color-text-muted)' }}>{it.name} &times;{it.qty}</div>
                <div style={{ fontWeight: 700 }}>{fmtLineTotal(it.price, it.qty)}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>
            <div>Fulfilment</div><div style={{ fontWeight: 700, color: 'var(--color-choc)' }}>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</div>
          </div>
          {discount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 8 }}>
              <div>Discount</div><div style={{ fontWeight: 700, color: 'var(--color-choc)' }}>-{fmtNaira(discountAmount)}</div>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, borderTop: '1px solid rgba(50,26,23,0.12)', paddingTop: 16, marginBottom: hasUnpricedItems ? 6 : 24 }}>
            <div>Total</div><div>{fmtNaira(total)}</div>
          </div>
          {hasUnpricedItems && (
            <div style={{ fontSize: 11, color: 'var(--color-cocoa)', marginBottom: 18 }}>
              Excludes item(s) needing price confirmation — we'll confirm final pricing before delivery.
            </div>
          )}

          <button
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={!canPayOnline || saving}
            aria-busy={saving && paymentState === 'opening'}
            aria-describedby={!canPayOnline ? 'checkout-pay-help' : undefined}
            onClick={payWithPaystack}
          >
            {saving && paymentState === 'opening' ? 'Opening Paystack…' : 'Pay with Paystack'}
          </button>
          {!canPayOnline && (
            <div id="checkout-pay-help" aria-live="polite" style={{ fontSize: 11, color: 'var(--color-cocoa)', marginTop: 8, textAlign: 'center', lineHeight: 1.45 }}>
              {checkoutValidationMessage}
            </div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-faint)', marginTop: 10, textAlign: 'center' }}>
            Secure inline checkout — you never leave this page.
          </div>
        </div>
      </div>

      {(paymentState === 'failed' || paymentState === 'unconfirmed') && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(50,26,23,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div
            ref={paymentDialogRef}
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-recovery-title"
            tabIndex={-1}
            style={{ padding: 32, width: 380, maxWidth: '100%' }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 6 }}>Paystack</div>
            <div id="payment-recovery-title" style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{fmtNaira(total)}</div>

            {paymentState === 'failed' && (
              <div style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 20, lineHeight: 1.6 }}>
                Payment window closed — your card was not charged. Your cart and details are still saved.
              </div>
            )}
            {paymentState === 'unconfirmed' && (
              <div style={{ fontSize: 13, color: 'var(--color-error)', marginBottom: 20, lineHeight: 1.6 }}>
                We couldn't confirm this payment yet. If you were charged, it will be confirmed automatically shortly. You can retry or ask support to help recover the saved checkout.
              </div>
            )}
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: 10 }} disabled={saving} aria-busy={saving && paymentState === 'opening'} onClick={payWithPaystack}>Try Again</button>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: 10 }} disabled title="Requires a Paystack transaction-initialize endpoint.">
              Hosted Paystack Unavailable
            </button>
            <button className="btn btn-whatsapp" style={{ width: '100%' }} disabled={saving} onClick={whatsappFallback}>{saving ? 'Saving checkout...' : 'Complete via WhatsApp'}</button>
            <button onClick={() => setPaymentState('idle')} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', fontSize: 12, color: 'var(--color-text-faint)', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="mobile-sticky-action checkout-mobile-pay">
        <div className="checkout-mobile-pay__row">
          <div className="mobile-sticky-action__meta">
            <div className="mobile-sticky-action__label">Order total</div>
            <div className="mobile-sticky-action__price">{fmtNaira(total)}</div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right' }}>
            {fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}
          </div>
        </div>
        {!canPayOnline && (
          <div id="checkout-mobile-pay-help" aria-live="polite" className="visually-hidden">{checkoutValidationMessage}</div>
        )}
        <button
          className="btn btn-primary btn-lg"
          disabled={!canPayOnline || saving}
          aria-busy={saving && paymentState === 'opening'}
          aria-describedby={!canPayOnline ? 'checkout-mobile-pay-help' : undefined}
          onClick={payWithPaystack}
        >
          {saving && paymentState === 'opening' ? 'Opening Paystack...' : 'Pay with Paystack'}
        </button>
      </div>
    </div>
  );
}

function Section({ step, title, children }) {
  return (
    <div className="card" style={{ padding: 28 }}>
      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 16 }}>{step}. {title}</div>
      {children}
    </div>
  );
}

function ToggleButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, textAlign: 'center', padding: 12, borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none',
        background: active ? 'var(--color-choc)' : 'var(--color-cream)', color: active ? 'var(--color-white)' : 'var(--color-choc)',
      }}
    >
      {children}
    </button>
  );
}
