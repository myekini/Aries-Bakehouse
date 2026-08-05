import { cloneElement, isValidElement, useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, CircleAlert, Info, MapPin, MessageCircle, PackageCheck, ShoppingBag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/account/AuthShell.jsx';
import PasswordField from '../components/account/PasswordField.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Textarea } from '../components/ui/textarea.jsx';
import { toast } from '../components/ui/toast.jsx';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { trackEvent } from '../lib/analytics.js';
import { getOrders } from '../lib/orders.js';

export default function Account() {
  const navigate = useNavigate();
  const { session, customer, isRealAccount, signOut } = useAuth();
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (isRealAccount) {
    return <AccountDashboard customer={customer} signOut={signOut} />;
  }

  const working = status === 'working';
  const signingIn = mode === 'signin';

  function switchMode(nextMode) {
    setMode(nextMode);
    setStatus('idle');
    setErrorMsg('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus('working');
    setErrorMsg('');

    if (mode === 'signup') {
      const isAnonymous = session?.user?.is_anonymous;
      const result = isAnonymous
        ? await supabase.auth.updateUser({ email: email.trim(), password })
        : await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { name: name.trim(), phone: phone.trim() } },
        });

      if (result.error) {
        setStatus('error');
        setErrorMsg(result.error.message);
        return;
      }

      const user = result.data?.user;
      if (user) {
        await supabase.from('customer').update({
          name: name.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          is_guest: false,
        }).eq('auth_user_id', user.id);
      }

      trackEvent('customer_account_created', { email: email.trim() });
      if (!isAnonymous && !result.data?.session) {
        setStatus('confirm-email');
        return;
      }
      navigate('/account/orders');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    navigate('/account/orders');
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setStatus('error');
      setErrorMsg('Enter your email address first.');
      return;
    }

    setStatus('working');
    setErrorMsg('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/account/reset-password`,
    });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }
    setStatus('reset-sent');
  }

  return (
    <AuthShell
      title={signingIn ? 'Welcome back' : 'Create your account'}
      description={signingIn
        ? 'Sign in to view orders and use your saved delivery details.'
        : 'Save delivery details and keep your order history in one place.'}
      footer={(
        <p>
          Prefer guest checkout? <Link to="/checkout">Continue to checkout</Link>
        </p>
      )}
    >
      <div className="auth-mode-tabs" role="tablist" aria-label="Account access">
        <button
          id="signin-tab"
          type="button"
          role="tab"
          aria-controls="account-access-panel"
          aria-selected={signingIn}
          className={signingIn ? 'is-active' : ''}
          onClick={() => switchMode('signin')}
        >
          Sign in
        </button>
        <button
          id="signup-tab"
          type="button"
          role="tab"
          aria-controls="account-access-panel"
          aria-selected={!signingIn}
          className={!signingIn ? 'is-active' : ''}
          onClick={() => switchMode('signup')}
        >
          Create account
        </button>
      </div>

      <form
        id="account-access-panel"
        role="tabpanel"
        aria-labelledby={signingIn ? 'signin-tab' : 'signup-tab'}
        onSubmit={handleSubmit}
        className="auth-form"
      >
        {!signingIn && (
          <div className="auth-form__row">
            <AuthField label="Full name" id="account-name">
              <Input
                id="account-name"
                name="name"
                autoComplete="name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </AuthField>
            <AuthField label="Phone number" id="account-phone">
              <Input
                id="account-phone"
                name="tel"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </AuthField>
          </div>
        )}

        <AuthField label="Email address" id="account-email">
          <Input
            id="account-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={status === 'error' ? 'field-error' : ''}
          />
        </AuthField>

        <PasswordField
          id="account-password"
          name="password"
          label="Password"
          autoComplete={signingIn ? 'current-password' : 'new-password'}
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          hint={signingIn ? undefined : 'Use at least 6 characters.'}
          action={signingIn ? (
            <button
              type="button"
              className="auth-text-action"
              onClick={handleForgotPassword}
              disabled={working}
            >
              Forgot password?
            </button>
          ) : undefined}
        />

        {status === 'error' && (
          <Alert variant="destructive"><CircleAlert size={17} aria-hidden="true" /><AlertDescription>{errorMsg}</AlertDescription></Alert>
        )}
        {status === 'reset-sent' && (
          <Alert><Info size={17} aria-hidden="true" /><AlertDescription>Check your inbox for a password reset link.</AlertDescription></Alert>
        )}
        {status === 'confirm-email' && (
          <Alert variant="success"><CheckCircle2 size={17} aria-hidden="true" /><AlertDescription>Check your inbox to confirm your email address, then sign in.</AlertDescription></Alert>
        )}

        <Button
          type="submit"
          aria-busy={working}
          disabled={working || status === 'confirm-email'}
          className="auth-form__submit"
        >
          {signingIn ? 'Sign in' : 'Create account'}
        </Button>
      </form>
    </AuthShell>
  );
}

function AccountDashboard({ customer, signOut }) {
  const [profile, setProfile] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
  });
  const [addresses, setAddresses] = useState(null);
  const [addressForm, setAddressForm] = useState({
    id: null,
    label: '',
    address: '',
    isDefault: false,
  });
  const [profileStatus, setProfileStatus] = useState('idle');
  const [profileError, setProfileError] = useState('');
  const [addressStatus, setAddressStatus] = useState('idle');
  const [addressError, setAddressError] = useState('');
  const [recentOrders, setRecentOrders] = useState(null);

  useEffect(() => {
    // Profile fields mirror authenticated customer data when the session refreshes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile({
      name: customer?.name || '',
      email: customer?.email || '',
      phone: customer?.phone || '',
    });
  }, [customer?.email, customer?.name, customer?.phone]);

  useEffect(() => {
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.id]);

  useEffect(() => {
    getOrders().then((orders) => setRecentOrders(orders)).catch(() => setRecentOrders([]));
  }, []);

  async function loadAddresses() {
    if (!customer?.id) {
      setAddresses([]);
      return;
    }
    const { data, error } = await supabase
      .from('address')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });
    setAddresses(error ? [] : data);
  }

  async function saveProfile(event) {
    event.preventDefault();
    setProfileStatus('saving');
    setProfileError('');
    const { error } = await supabase.from('customer').update({
      name: profile.name.trim() || null,
      phone: profile.phone.trim() || null,
    }).eq('id', customer.id);
    if (error) {
      setProfileStatus('error');
      setProfileError(error.message);
      return;
    }
    setProfileStatus('saved');
    toast.success('Profile saved');
  }

  async function saveAddress(event) {
    event.preventDefault();
    setAddressStatus('saving');
    setAddressError('');
    const shouldDefault = addressForm.isDefault || !addresses?.length;

    if (shouldDefault) {
      const { error } = await supabase
        .from('address')
        .update({ is_default: false })
        .eq('customer_id', customer.id);
      if (error) {
        setAddressStatus('error');
        setAddressError(error.message);
        return;
      }
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
      setAddressError(result.error.message);
      return;
    }

    resetAddressForm();
    setAddressStatus('idle');
    toast.success('Address saved');
    loadAddresses();
  }

  async function removeAddress(address) {
    const { error } = await supabase.from('address').delete().eq('id', address.id);
    if (error) {
      toast.error('Address was not removed', { description: error.message });
      return;
    }
    toast.info('Address removed');
    loadAddresses();
  }

  async function makeDefault(address) {
    const { error: clearError } = await supabase
      .from('address')
      .update({ is_default: false })
      .eq('customer_id', customer.id);
    if (clearError) {
      toast.error('Default address was not changed', { description: clearError.message });
      return;
    }
    const { error } = await supabase
      .from('address')
      .update({ is_default: true })
      .eq('id', address.id);
    if (error) {
      toast.error('Default address was not changed', { description: error.message });
      return;
    }
    toast.success('Default address updated');
    loadAddresses();
  }

  function editAddress(address) {
    setAddressForm({
      id: address.id,
      label: address.label || '',
      address: address.address_text,
      isDefault: address.is_default,
    });
  }

  function resetAddressForm() {
    setAddressForm({ id: null, label: '', address: '', isDefault: false });
    setAddressStatus('idle');
    setAddressError('');
  }

  return (
    <section className="account-page">
      <div className="container">
        <header className="account-page__header">
          <div>
            <p className="account-page__eyebrow">Customer account</p>
            <h1>Your account</h1>
            <p>{customer?.email}</p>
          </div>
          <div className="account-page__actions">
            {customer?.role === 'admin' && (
              <Button asChild size="sm">
                <Link to="/admin">Admin dashboard</Link>
              </Button>
            )}
            <Button asChild variant="secondary" size="sm">
              <Link to="/account/orders">Order history</Link>
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </header>

        <section className="account-overview" aria-label="Account overview">
          <div className="account-overview__intro">
            <span><ShoppingBag size={20} aria-hidden="true" /></span>
            <div><strong>{customer?.name ? `Welcome back, ${customer.name.split(' ')[0]}` : 'Welcome back'}</strong><p>Your orders, saved delivery details, and support are all here.</p></div>
          </div>
          <div className="account-overview__links">
            <Link to="/account/orders"><PackageCheck size={18} aria-hidden="true" /><span><strong>{recentOrders === null ? 'Loading orders…' : `${recentOrders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length} in progress`}</strong><small>Track and reorder</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
            <a href="#saved-addresses"><MapPin size={18} aria-hidden="true" /><span><strong>{addresses === null ? 'Loading addresses…' : `${addresses.length} saved address${addresses.length === 1 ? '' : 'es'}`}</strong><small>Manage delivery details</small></span><ArrowRight size={16} aria-hidden="true" /></a>
            <Link to="/contact"><MessageCircle size={18} aria-hidden="true" /><span><strong>Need help?</strong><small>Contact the bakehouse</small></span><ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </section>

        <div className="account-grid">
          <Card className="account-panel">
            <div className="account-panel__header">
              <h2>Profile</h2>
              <p>Your contact details for receipts and delivery updates.</p>
            </div>
            <form onSubmit={saveProfile} className="account-form">
              <AuthField label="Full name" id="profile-name">
                <Input
                  id="profile-name"
                  name="name"
                  autoComplete="name"
                  value={profile.name}
                  onChange={(event) => setProfile((current) => ({
                    ...current,
                    name: event.target.value,
                  }))}
                />
              </AuthField>
              <AuthField
                label="Account email"
                id="profile-email"
                hint="This is the email used to sign in."
              >
                <Input
                  id="profile-email"
                  type="email"
                  value={profile.email}
                  readOnly
                  aria-readonly="true"
                />
              </AuthField>
              <AuthField label="Phone number" id="profile-phone">
                <Input
                  id="profile-phone"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  value={profile.phone}
                  onChange={(event) => setProfile((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))}
                />
              </AuthField>
              {profileStatus === 'error' && (
                <Alert variant="destructive"><CircleAlert size={17} aria-hidden="true" /><AlertTitle>Profile not saved</AlertTitle><AlertDescription>{profileError || 'Check your connection and try again.'}</AlertDescription></Alert>
              )}
              <Button
                type="submit"
                aria-busy={profileStatus === 'saving'}
                disabled={profileStatus === 'saving'}
              >
                Save changes
              </Button>
            </form>
          </Card>

          <Card className="account-panel" id="saved-addresses">
            <div className="account-panel__header">
              <h2>Saved addresses</h2>
              <p>Add a delivery address or update an existing one.</p>
            </div>
            <form onSubmit={saveAddress} className="account-form account-address-form">
              <AuthField label="Label" id="address-label">
                <Input
                  id="address-label"
                  value={addressForm.label}
                  placeholder="Home, office, campus"
                  onChange={(event) => setAddressForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))}
                />
              </AuthField>
              <AuthField label="Delivery address" id="address-text">
                <Textarea
                  id="address-text"
                  required
                  value={addressForm.address}
                  placeholder="Street, area and a nearby landmark"
                  onChange={(event) => setAddressForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))}
                />
              </AuthField>
              <label className="account-checkbox">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(event) => setAddressForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))}
                />
                <span>Use as default address</span>
              </label>
              {addressStatus === 'error' && (
                <Alert variant="destructive"><CircleAlert size={17} aria-hidden="true" /><AlertTitle>Address not saved</AlertTitle><AlertDescription>{addressError || 'Check the address and try again.'}</AlertDescription></Alert>
              )}
              <div className="account-form__actions">
                <Button
                  type="submit"
                  size="sm"
                  aria-busy={addressStatus === 'saving'}
                  disabled={addressStatus === 'saving'}
                >
                  {addressForm.id ? 'Update address' : 'Add address'}
                </Button>
                {addressForm.id && (
                  <Button type="button" variant="ghost" size="sm" onClick={resetAddressForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            <div className="address-list" aria-live="polite">
              {addresses === null ? (
                <div className="skeleton address-list__loading" />
              ) : addresses.length === 0 ? (
                <p className="address-list__empty">No saved addresses yet.</p>
              ) : addresses.map((address) => (
                <article key={address.id} className="address-row">
                  <div className="address-row__body">
                    <div className="address-row__title">
                      <h3>{address.label || 'Saved address'}</h3>
                      {address.is_default && <span>Default</span>}
                    </div>
                    <p>{address.address_text}</p>
                  </div>
                  <div className="address-row__actions">
                    <button type="button" onClick={() => editAddress(address)}>Edit</button>
                    {!address.is_default && (
                      <button type="button" onClick={() => makeDefault(address)}>Make default</button>
                    )}
                    <ConfirmAlertDialog
                      trigger={<button type="button" className="is-destructive">Remove</button>}
                      title="Remove this address?"
                      description={`“${address.label || 'Saved address'}” will be removed from your account.`}
                      confirmLabel="Remove address"
                      onConfirm={() => removeAddress(address)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}

function AuthField({ label, id, hint, children }) {
  const hintId = hint ? `${id}-hint` : undefined;
  const field = hint && isValidElement(children)
    ? cloneElement(children, { 'aria-describedby': hintId })
    : children;

  return (
    <div className="auth-field">
      <Label htmlFor={id}>{label}</Label>
      {field}
      {hint && <p id={hintId} className="auth-field__hint">{hint}</p>}
    </div>
  );
}
