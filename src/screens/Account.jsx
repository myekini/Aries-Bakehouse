import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { trackEvent } from '../lib/analytics.js';

// Guest checkout is, and must remain, the default path (spec §8/§9) - this
// page is an optional accelerator, never a gate in front of Checkout.
export default function Account() {
  const navigate = useNavigate();
  const { session, customer, isRealAccount, signOut } = useAuth();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | working | error | reset-sent
  const [errorMsg, setErrorMsg] = useState('');

  if (isRealAccount) {
    return <AccountDashboard customer={customer} signOut={signOut} />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('working');
    setErrorMsg('');

    if (mode === 'signup') {
      const isAnonymous = session?.user?.is_anonymous;
      const { error } = isAnonymous
        ? await supabase.auth.updateUser({ email, password })
        : await supabase.auth.signUp({ email, password });

      if (error) { setStatus('error'); setErrorMsg(error.message); return; }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('customer').update({
          name: name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          is_guest: false,
        }).eq('auth_user_id', user.id);
      }
      trackEvent('customer_account_created', { email: email.trim() });
      navigate('/account/orders');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setStatus('error'); setErrorMsg(error.message); return; }
    navigate('/account/orders');
  }

  async function handleForgotPassword() {
    if (!email.trim()) { setStatus('error'); setErrorMsg('Enter your email above first.'); return; }
    setStatus('working');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    if (error) { setStatus('error'); setErrorMsg(error.message); return; }
    setStatus('reset-sent');
  }

  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 440 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{mode === 'signin' ? 'Sign In' : 'Create Account'}</h1>
      <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 28 }}>
        Accounts make reordering faster, but checkout stays open to guests -{' '}
        <Link to="/checkout" style={{ color: 'var(--color-cocoa)', fontWeight: 700 }}>continue as guest</Link>.
      </p>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {mode === 'signup' && (
          <>
            <div>
              <label className="visually-hidden" htmlFor="acc-name">Full name</label>
              <input id="acc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={{ width: '100%' }} />
            </div>
            <div>
              <label className="visually-hidden" htmlFor="acc-phone">Phone number</label>
              <input id="acc-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" style={{ width: '100%' }} />
            </div>
          </>
        )}
        <div>
          <label className="visually-hidden" htmlFor="acc-email">Email</label>
          <input id="acc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={status === 'error' ? 'field-error' : undefined} style={{ width: '100%' }} />
        </div>
        <div>
          <label className="visually-hidden" htmlFor="acc-password">Password</label>
          <input id="acc-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" style={{ width: '100%' }} />
        </div>

        {status === 'error' && <div className="field-message field-message--error" role="alert">{errorMsg}</div>}
        {status === 'reset-sent' && <div className="field-message field-message--success" role="status">Check your email for a reset link.</div>}

        <button type="submit" className="btn btn-primary" aria-busy={status === 'working'} disabled={status === 'working'} style={{ width: '100%' }}>
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </button>
        {mode === 'signin' && (
          <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--color-cocoa)', fontWeight: 700, cursor: 'pointer' }}>
            Forgot password?
          </button>
        )}
      </form>

      <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14 }}>
        {mode === 'signin' ? (
          <>Don't have an account? <button onClick={() => { setMode('signup'); setStatus('idle'); }} style={linkBtn}>Sign up</button></>
        ) : (
          <>Already have an account? <button onClick={() => { setMode('signin'); setStatus('idle'); }} style={linkBtn}>Sign in</button></>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--color-text-faint)' }}>
        Phone OTP can be added later; email/password is the supported build path today.
      </div>
    </div>
  );
}

function AccountDashboard({ customer, signOut }) {
  const { showToast } = useCart();
  const [profile, setProfile] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });
  const [addresses, setAddresses] = useState(null);
  const [addressForm, setAddressForm] = useState({ id: null, label: '', address: '', isDefault: false });
  const [profileStatus, setProfileStatus] = useState('idle');
  const [addressStatus, setAddressStatus] = useState('idle');

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  async function loadAddresses() {
    if (!customer?.id) return;
    const { data, error } = await supabase
      .from('address')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses(error ? [] : data);
  }

  async function saveProfile(e) {
    e.preventDefault();
    setProfileStatus('saving');
    const { error } = await supabase.from('customer').update({
      name: profile.name.trim() || null,
      email: profile.email.trim() || null,
      phone: profile.phone.trim() || null,
    }).eq('id', customer.id);
    if (error) {
      setProfileStatus('error');
      showToast(error.message, 'error');
      return;
    }
    setProfileStatus('saved');
    showToast('Profile saved');
  }

  async function saveAddress(e) {
    e.preventDefault();
    setAddressStatus('saving');
    const shouldDefault = addressForm.isDefault || !addresses || addresses.length === 0;
    if (shouldDefault) {
      await supabase.from('address').update({ is_default: false }).eq('customer_id', customer.id);
    }
    const payload = {
      customer_id: customer.id,
      label: addressForm.label.trim() || null,
      address_text: addressForm.address.trim(),
      is_default: shouldDefault,
    };
    const result = addressForm.id
      ? await supabase.from('address').update(payload).eq('id', addressForm.id)
      : await supabase.from('address').insert(payload);
    if (result.error) {
      setAddressStatus('error');
      showToast(result.error.message, 'error');
      return;
    }
    setAddressForm({ id: null, label: '', address: '', isDefault: false });
    setAddressStatus('idle');
    showToast('Address saved');
    loadAddresses();
  }

  async function removeAddress(address) {
    const { error } = await supabase.from('address').delete().eq('id', address.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Address removed', 'info');
    loadAddresses();
  }

  async function makeDefault(address) {
    await supabase.from('address').update({ is_default: false }).eq('customer_id', customer.id);
    const { error } = await supabase.from('address').update({ is_default: true }).eq('id', address.id);
    if (error) { showToast(error.message, 'error'); return; }
    showToast('Default address updated');
    loadAddresses();
  }

  return (
    <div className="container" style={{ padding: '56px 0 96px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, margin: 0 }}>Your Account</h1>
          <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 8 }}>Manage profile details, saved addresses, and repeat orders.</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/account/orders" className="btn btn-primary btn-sm">Order History</Link>
          <button onClick={() => signOut()} className="btn btn-secondary btn-sm">Logout</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, alignItems: 'start' }}>
        <form onSubmit={saveProfile} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionTitle>Profile</SectionTitle>
          <Field label="Full name" id="profile-name">
            <input id="profile-name" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} placeholder="Full name" style={{ width: '100%' }} />
          </Field>
          <Field label="Email" id="profile-email">
            <input id="profile-email" type="email" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} placeholder="Email" style={{ width: '100%' }} />
          </Field>
          <Field label="Phone" id="profile-phone">
            <input id="profile-phone" type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone number" style={{ width: '100%' }} />
          </Field>
          {profileStatus === 'error' && <div className="field-message field-message--error">Could not save profile.</div>}
          <button className="btn btn-primary" aria-busy={profileStatus === 'saving'} disabled={profileStatus === 'saving'}>Save Profile</button>
        </form>

        <div className="card" style={{ padding: 28 }}>
          <SectionTitle>Saved Addresses</SectionTitle>
          <form onSubmit={saveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            <Field label="Address label" id="address-label">
              <input id="address-label" value={addressForm.label} onChange={(e) => setAddressForm((a) => ({ ...a, label: e.target.value }))} placeholder="Home, office, campus..." style={{ width: '100%' }} />
            </Field>
            <Field label="Address" id="address-text">
              <textarea id="address-text" required value={addressForm.address} onChange={(e) => setAddressForm((a) => ({ ...a, address: e.target.value }))} placeholder="Delivery address in Abeokuta..." style={{ width: '100%', minHeight: 72, resize: 'vertical' }} />
            </Field>
            <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 700 }}>
              <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((a) => ({ ...a, isDefault: e.target.checked }))} />
              Make default address
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-sm" aria-busy={addressStatus === 'saving'} disabled={addressStatus === 'saving'}>{addressForm.id ? 'Update Address' : 'Add Address'}</button>
              {addressForm.id && (
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddressForm({ id: null, label: '', address: '', isDefault: false })}>Cancel Edit</button>
              )}
            </div>
          </form>

          {addresses === null ? (
            <div className="skeleton" style={{ height: 96 }} />
          ) : addresses.length === 0 ? (
            <div style={{ padding: '24px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>No saved addresses yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {addresses.map((address) => (
                <div key={address.id} style={{ border: '1px solid rgba(50,26,23,0.1)', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14 }}>{address.label || 'Saved address'} {address.is_default && <span style={{ color: 'var(--color-olive)' }}>- Default</span>}</div>
                      <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4, lineHeight: 1.5 }}>{address.address_text}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setAddressForm({ id: address.id, label: address.label || '', address: address.address_text, isDefault: address.is_default })}>Edit</button>
                    {!address.is_default && <button type="button" className="btn btn-secondary btn-sm" onClick={() => makeDefault(address)}>Make Default</button>}
                    <button type="button" onClick={() => removeAddress(address)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--color-olive)', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 4 }}>{children}</div>
  );
}

const linkBtn = { background: 'none', border: 'none', color: 'var(--color-cocoa)', fontWeight: 700, cursor: 'pointer', font: 'inherit' };
