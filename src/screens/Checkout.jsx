import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, CircleAlert, LockKeyhole, MapPin, MessageCircle, ShieldCheck, ShoppingBag } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { fmtLineTotal, fmtNaira, tomorrowISODate } from '../lib/format.js';
import { redeemDiscountCode } from '../lib/discounts.js';
import { saveOrder } from '../lib/orders.js';
import { loadPaystackScript } from '../lib/paystack.js';
import { supabase } from '../lib/supabaseClient.js';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';
import { Input } from '../components/ui/input.jsx';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '../components/ui/input-group.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const WHATSAPP_NUMBER = '2348121145785';
const TIME_OPTIONS = ['morning', 'afternoon', 'evening'];

function isValidNigerianPhone(value) {
  const compact = value.trim().replace(/[\s()-]/g, '');
  return /^(?:\+?234|0)[789]\d{9}$/.test(compact);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

export default function Checkout() {
  const cart = useCart();
  const { customer, isRealAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [savedAddresses, setSavedAddresses] = useState(null);
  const buyNowItem = location.state?.buyNowItem || null;
  const items = buyNowItem ? [buyNowItem] : cart.items;
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0), [items]);
  const hasUnpricedItems = items.some((item) => item.price === null || item.price === undefined);

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
  const [paymentState, setPaymentState] = useState('idle');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const paymentDialogRef = useRef(null);
  const fieldRefs = useRef({});
  // Client-side-only throttle against discount-code brute-forcing — see
  // applyDiscount() below for why this exists alongside the server-side
  // redeem_discount_code() check.
  const discountFailCountRef = useRef(0);
  const discountCooldownUntilRef = useRef(0);

  const discountAmount = discount?.amount || 0;
  const total = Math.max(0, subtotal - discountAmount);

  const errors = useMemo(() => {
    const next = {};
    if (name.trim().length < 2) next.name = 'Enter your full name.';
    if (!phone.trim()) next.phone = 'Enter a phone number for order updates.';
    else if (!isValidNigerianPhone(phone)) next.phone = 'Use a valid Nigerian number, for example 0801 234 5678.';
    if (email.trim() && !isValidEmail(email)) next.email = 'Enter a complete email address, for example name@example.com.';
    if (fulfilment === 'delivery' && address.trim().length < 10) next.address = 'Enter a complete delivery address in Abeokuta.';
    if (!date || date < tomorrowISODate()) next.date = 'Choose a date with at least 24 hours notice.';
    if (!TIME_OPTIONS.includes(time)) next.time = 'Choose a valid collection or delivery time.';
    return next;
  }, [name, phone, email, fulfilment, address, date, time]);

  const formIsValid = Object.keys(errors).length === 0;
  const visibleError = (field) => (attempted || touched[field]) ? errors[field] : '';
  const markTouched = (field) => setTouched((current) => ({ ...current, [field]: true }));

  useEffect(() => {
    trackEvent('checkout_started', { itemCount: items.length, subtotal });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isRealAccount || !customer) return;
    setName((current) => current || customer.name || '');
    setPhone((current) => current || customer.phone || '');
    setEmail((current) => current || customer.email || '');
  }, [isRealAccount, customer]);

  useEffect(() => {
    if (!isRealAccount || !customer?.id) { setSavedAddresses(null); return; }
    let cancelled = false;
    supabase.from('address').select('*').eq('customer_id', customer.id)
      .order('is_default', { ascending: false }).order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled && !error) setSavedAddresses(data || []);
      });
    return () => { cancelled = true; };
  }, [isRealAccount, customer?.id]);

  useEffect(() => {
    const paymentDialogOpen = paymentState === 'failed' || paymentState === 'unconfirmed';
    if (!paymentDialogOpen) return undefined;
    paymentDialogRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPaymentState('idle');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [paymentState]);

  if (items.length === 0) {
    return (
      <div className="container checkout-empty">
        <span><ShoppingBag size={22} aria-hidden="true" /></span>
        <h1>Your cart is empty</h1>
        <p>Add something from the menu before checking out.</p>
        <Link to="/menu" className="btn btn-primary">Browse menu</Link>
      </div>
    );
  }

  function buildOrder(status, fallbackChannel = null, paymentReference = null) {
    return {
      items, subtotal, subtotalLabel: fmtNaira(subtotal), hasUnpricedItems,
      discountCodeId: discount?.id || null, discountAmount, deliveryFee: 0, total,
      fulfilment, address: address.trim(), date, time, name: name.trim(), phone: phone.trim(),
      email: email.trim(), notes: notes.trim(), status, fallbackChannel, paymentReference, createdAt: Date.now(),
    };
  }

  function finishAndLeave(id) {
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
        email: email.trim() || `guest-${phone.replace(/\D/g, '')}@aries11.local`,
        amount: Math.round(total * 100),
        currency: 'NGN',
        ref: reference,
        onClose: () => {
          setSaving(false);
          setPaymentState('failed');
        },
        callback: (response) => {
          (async () => {
            try {
              const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: response.reference } });
              if (!error && data?.confirmed) {
                toast.success('Payment confirmed', { description: 'Your order has been received.' });
                finishAndLeave(orderId);
              } else {
                setPaymentState('unconfirmed');
              }
            } catch (error) {
              console.error('verify-payment call failed:', error);
              setPaymentState('unconfirmed');
            } finally {
              setSaving(false);
            }
          })();
        },
      });
      handler.openIframe();
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Payment could not start', { description: 'Your details are still here. Please try again.' });
      setSaving(false);
      setPaymentState('failed');
    }
  }

  function handleCheckout(event) {
    event.preventDefault();
    setAttempted(true);
    if (!formIsValid || hasUnpricedItems) {
      const firstError = Object.keys(errors)[0];
      if (firstError) window.requestAnimationFrame(() => fieldRefs.current[firstError]?.focus());
      return;
    }
    payWithPaystack();
  }

  async function applyDiscount() {
    if (Date.now() < discountCooldownUntilRef.current) {
      setDiscountStatus('error');
      setDiscountMsg('Too many attempts — please wait a moment before trying again.');
      return;
    }
    if (!discountCode.trim()) {
      setDiscountStatus('error');
      setDiscountMsg('Enter a discount code first.');
      return;
    }
    setDiscountStatus('working');
    setDiscountMsg('');
    try {
      const applied = await redeemDiscountCode(discountCode, subtotal);
      discountFailCountRef.current = 0;
      setDiscount(applied);
      setDiscountStatus('applied');
      setDiscountMsg(`${applied.code} applied.`);
      trackEvent('discount_code_used', { code: applied.code, amount: applied.amount });
    } catch (error) {
      discountFailCountRef.current += 1;
      if (discountFailCountRef.current >= 5) {
        discountCooldownUntilRef.current = Date.now() + 30_000;
        discountFailCountRef.current = 0;
      }
      setDiscount(null);
      setDiscountStatus('error');
      setDiscountMsg(error.message);
    }
  }

  return (
    <div className="container checkout-page">
      <header className="checkout-header">
        <div>
          <p className="checkout-eyebrow">Secure checkout</p>
          <h1>Complete your order</h1>
          <p>Confirm your details and preferred fulfilment time before payment.</p>
        </div>
        <div className="checkout-help">
          <Link to="/delivery">Delivery information</Link>
          <Link to="/faq">FAQ</Link>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer"><MessageCircle size={15} aria-hidden="true" />Support</a>
        </div>
      </header>

      <div className="checkout-layout">
        <form id="checkout-form" className="checkout-form-panel" onSubmit={handleCheckout} noValidate>
          <CheckoutSection step="01" title="Contact details" description="We use these details for order updates and your receipt.">
            <div className="checkout-field-grid">
              <Field id="name" label="Full name" required error={visibleError('name')}>
                <Input ref={(node) => { fieldRefs.current.name = node; }} id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} onBlur={() => markTouched('name')} aria-invalid={Boolean(visibleError('name'))} aria-describedby={visibleError('name') ? 'name-error' : undefined} placeholder="Your full name" />
              </Field>
              <Field id="phone" label="Phone number" required error={visibleError('phone')} hint="Nigerian mobile number">
                <Input ref={(node) => { fieldRefs.current.phone = node; }} id="phone" type="tel" inputMode="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} onBlur={() => markTouched('phone')} aria-invalid={Boolean(visibleError('phone'))} aria-describedby={visibleError('phone') ? 'phone-error' : 'phone-hint'} placeholder="0801 234 5678" />
              </Field>
              <Field id="email" label="Email address" optional error={visibleError('email')} hint="Used for your payment receipt">
                <Input ref={(node) => { fieldRefs.current.email = node; }} id="email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} onBlur={() => markTouched('email')} aria-invalid={Boolean(visibleError('email'))} aria-describedby={visibleError('email') ? 'email-error' : 'email-hint'} placeholder="name@example.com" />
              </Field>
            </div>
            {!isRealAccount && <p className="checkout-account-note">Have an account? <Link to="/account">Sign in to autofill your details.</Link></p>}
          </CheckoutSection>

          <CheckoutSection step="02" title="Fulfilment" description="Choose how you would like to receive your order.">
            <div className="checkout-segmented" role="group" aria-label="Fulfilment method">
              <ToggleButton active={fulfilment === 'pickup'} onClick={() => setFulfilment('pickup')}>Pickup</ToggleButton>
              <ToggleButton active={fulfilment === 'delivery'} onClick={() => setFulfilment('delivery')}>Delivery</ToggleButton>
            </div>
            {fulfilment === 'pickup' ? (
              <div className="checkout-info-row"><MapPin size={18} aria-hidden="true" /><div><strong>Pickup in Abeokuta</strong><span>The exact Bakehouse address is confirmed after your order is placed.</span></div></div>
            ) : (
              <div className="checkout-delivery-fields">
                {savedAddresses?.length > 0 && <div className="checkout-saved-addresses">{savedAddresses.map((saved) => <button key={saved.id} type="button" onClick={() => { setAddress(saved.address_text); markTouched('address'); }}>{saved.label || 'Saved address'}{saved.is_default ? ' · Default' : ''}</button>)}</div>}
                <Field id="address" label="Delivery address" required error={visibleError('address')} hint="Delivery fee is confirmed after your address is reviewed.">
                  <Textarea ref={(node) => { fieldRefs.current.address = node; }} id="address" autoComplete="street-address" value={address} onChange={(event) => setAddress(event.target.value)} onBlur={() => markTouched('address')} aria-invalid={Boolean(visibleError('address'))} aria-describedby={visibleError('address') ? 'address-error' : 'address-hint'} placeholder="Street, area, and a nearby landmark" />
                </Field>
              </div>
            )}
          </CheckoutSection>

          <CheckoutSection step="03" title="Schedule" description="Orders require at least 24 hours notice.">
            <div className="checkout-field-grid checkout-field-grid--two">
              <Field id="date" label="Preferred date" required error={visibleError('date')}>
                <DatePicker
                  ref={(node) => { fieldRefs.current.date = node; }}
                  id="date"
                  value={date}
                  min={tomorrowISODate()}
                  onChange={setDate}
                  onBlur={() => markTouched('date')}
                  displayFormat="EEE, d MMM yyyy"
                  aria-invalid={Boolean(visibleError('date'))}
                  aria-describedby={visibleError('date') ? 'date-error' : undefined}
                />
              </Field>
              <Field id="time" label="Preferred time" required error={visibleError('time')}>
                <select ref={(node) => { fieldRefs.current.time = node; }} id="time" value={time} onChange={(event) => setTime(event.target.value)} onBlur={() => markTouched('time')} aria-invalid={Boolean(visibleError('time'))} aria-describedby={visibleError('time') ? 'time-error' : undefined}>
                  <option value="morning">Morning · 9am-12pm</option>
                  <option value="afternoon">Afternoon · 12pm-4pm</option>
                  <option value="evening">Evening · 4pm-7pm</option>
                </select>
              </Field>
            </div>
          </CheckoutSection>

          <Collapsible className="checkout-notes">
            <CollapsibleTrigger className="checkout-notes__trigger"><span>Add order notes <small>Optional</small></span><ChevronDown size={18} aria-hidden="true" /></CollapsibleTrigger>
            <CollapsibleContent><div className="checkout-notes__content"><label htmlFor="notes">Special instructions</label><Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Allergies, gifting notes, or other requests" /></div></CollapsibleContent>
          </Collapsible>
        </form>

        <aside className="checkout-summary" aria-label="Order summary">
          <div className="checkout-summary__header"><div><p>Order summary</p><h2>{items.length} item{items.length === 1 ? '' : 's'}</h2></div>{!buyNowItem && <Link to="/cart">Edit cart</Link>}</div>
          <div className="checkout-summary__items">
            {items.map((item) => <div key={item.id} className="checkout-summary__item">
              <span className="checkout-summary__image">{item.image ? <img src={item.image} alt="" loading="lazy" /> : <ShoppingBag size={17} aria-hidden="true" />}</span>
              <div className="checkout-summary__item-copy"><strong>{item.name}</strong><span>Quantity {item.qty}</span></div>
              <div className="checkout-summary__item-price">{fmtLineTotal(item.price, item.qty)}</div>
            </div>)}
          </div>

          <div className="checkout-discount">
            <label htmlFor="checkout-discount">Discount code</label>
            <InputGroup className="checkout-discount__group">
              <InputGroupInput id="checkout-discount" value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="Enter code" />
              <InputGroupAddon align="inline-end"><InputGroupButton disabled={discountStatus === 'working'} onClick={applyDiscount}>{discountStatus === 'working' ? 'Checking' : 'Apply'}</InputGroupButton></InputGroupAddon>
            </InputGroup>
            {discountMsg && <p className={discountStatus === 'error' ? 'is-error' : ''} role={discountStatus === 'error' ? 'alert' : 'status'}>{discountMsg}</p>}
          </div>

          <div className="checkout-totals">
            <div><span>Subtotal</span><strong>{fmtNaira(subtotal)}</strong></div>
            {discount && <div><span>Discount · {discount.code}</span><strong>-{fmtNaira(discountAmount)}</strong></div>}
            <div><span>Fulfilment</span><strong>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</strong></div>
            <div className="checkout-totals__total"><span>{fulfilment === 'delivery' ? 'Current total' : 'Total'}</span><strong>{fmtNaira(total)}</strong></div>
          </div>

          {fulfilment === 'delivery' && <p className="checkout-summary__notice">Delivery fee is not included yet. The team will confirm it after reviewing your address.</p>}
          {hasUnpricedItems && <p className="checkout-summary__notice is-warning">Online payment is unavailable because an item still needs price confirmation.</p>}

          <button className="btn btn-primary btn-lg checkout-pay-button" type="submit" form="checkout-form" disabled={saving || hasUnpricedItems} aria-busy={saving && paymentState === 'opening'}>{saving && paymentState === 'opening' ? 'Opening Paystack...' : `Pay ${fmtNaira(total)}`}</button>
          {attempted && !formIsValid && <Alert variant="destructive" className="checkout-submit-error"><CircleAlert size={17} aria-hidden="true" /><AlertDescription>Check the highlighted fields before continuing.</AlertDescription></Alert>}
          <div className="checkout-trust"><span><LockKeyhole size={14} aria-hidden="true" />Secured by Paystack</span><span><ShieldCheck size={14} aria-hidden="true" />Payment verified before confirmation</span></div>
        </aside>
      </div>

      {(paymentState === 'failed' || paymentState === 'unconfirmed') && <div className="checkout-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setPaymentState('idle'); }}>
        <div ref={paymentDialogRef} className="checkout-dialog" role="dialog" aria-modal="true" aria-labelledby="payment-recovery-title" tabIndex={-1}>
          <span className="checkout-dialog__icon"><LockKeyhole size={20} aria-hidden="true" /></span>
          <p>Payment status</p>
          <h2 id="payment-recovery-title">{paymentState === 'failed' ? 'Payment was not completed' : 'Payment confirmation is pending'}</h2>
          <span>{paymentState === 'failed' ? 'The payment window was closed. Your order details are still here.' : 'If you were charged, Paystack may still confirm the transaction automatically. Avoid repeated payments until you have checked your bank notification.'}</span>
          {paymentState === 'failed' && <button className="btn btn-primary" disabled={saving} onClick={payWithPaystack}>Try payment again</button>}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="btn btn-secondary">Contact support</a>
          <button className="checkout-dialog__cancel" onClick={() => setPaymentState('idle')}>Return to checkout</button>
        </div>
      </div>}

      <div className="mobile-sticky-action checkout-mobile-pay">
        <div className="checkout-mobile-pay__row"><div className="mobile-sticky-action__meta"><div className="mobile-sticky-action__label">Order total</div><div className="mobile-sticky-action__price">{fmtNaira(total)}</div></div><span>{fulfilment === 'pickup' ? 'Pickup' : 'Delivery'}</span></div>
        <button className="btn btn-primary btn-lg" type="submit" form="checkout-form" disabled={saving || hasUnpricedItems} aria-busy={saving && paymentState === 'opening'}>{saving && paymentState === 'opening' ? 'Opening Paystack...' : 'Continue to payment'}</button>
      </div>
    </div>
  );
}

function CheckoutSection({ step, title, description, children }) {
  return <section className="checkout-section"><div className="checkout-section__heading"><span>{step}</span><div><h2>{title}</h2><p>{description}</p></div></div><div className="checkout-section__body">{children}</div></section>;
}

function Field({ id, label, required, optional, error, hint, children }) {
  return <div className={`checkout-field${error ? ' has-error' : ''}`}><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}{optional && <small>Optional</small>}</label>{children}{error ? <p id={`${id}-error`} className="field-message field-message--error">{error}</p> : hint ? <p id={`${id}-hint`} className="field-message">{hint}</p> : null}</div>;
}

function ToggleButton({ active, onClick, children }) {
  return <button type="button" className={active ? 'is-active' : ''} aria-pressed={active} onClick={onClick}>{active && <Check size={15} aria-hidden="true" />}{children}</button>;
}
