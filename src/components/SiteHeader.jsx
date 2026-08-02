import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCategories } from '../hooks/useCatalog.js';
import { supabase } from '../lib/supabaseClient.js';
import ThemeToggle from './ThemeToggle.jsx';
import BrandLogo from './BrandLogo.jsx';

export default function SiteHeader() {
  const { count, openDrawer } = useCart();
  const { isRealAccount, customer, signOut } = useAuth();
  const { data: categories } = useCategories();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcement, setAnnouncement] = useState({ active: true, text: 'Orders require 24 hours notice.' });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const mobileMenuRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const mobileMenuCloseRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    supabase.from('site_content').select('value').eq('key', 'announcement_bar').maybeSingle()
      .then(({ data }) => {
        if (!cancelled && data?.value) setAnnouncement((current) => ({ ...current, ...data.value }));
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      setMenuDropdownOpen(false);
      setAccountDropdownOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    mobileMenuCloseRef.current?.focus();

    function trapFocus(event) {
      if (event.key !== 'Tab') return;
      const focusable = mobileMenuRef.current?.querySelectorAll('a[href], button:not([disabled])');
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

    document.addEventListener('keydown', trapFocus);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', trapFocus);
      mobileMenuButtonRef.current?.focus();
    };
  }, [menuOpen]);

  return (
    <>
      {showAnnouncement && announcement.active && announcement.text && (
        <div className="announcement-bar">
          <div>{announcement.text}</div>
          <button
            type="button"
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
            className="announcement-bar__dismiss"
          >&times;</button>
        </div>
      )}

      <header className="site-header">
        <div className="container site-header__inner">
          <Link to="/" aria-label="Aries 11 Bakehouse home" className="site-header__brand-link">
            <BrandLogo className="site-header__logo" />
          </Link>

          <nav className="desktop-nav" aria-label="Main navigation">
            <NavLink to="/" end className={navLinkClass}>Home</NavLink>
            <div
              className="desktop-nav__menu"
              onMouseEnter={() => setMenuDropdownOpen(true)}
              onMouseLeave={() => setMenuDropdownOpen(false)}
              onFocus={() => setMenuDropdownOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setMenuDropdownOpen(false);
              }}
            >
              <NavLink to="/menu" className={navLinkClass} aria-expanded={menuDropdownOpen} aria-haspopup="true" aria-controls="menu-categories">Menu</NavLink>
              {menuDropdownOpen && (
                <div
                  id="menu-categories"
                  role="menu"
                  className="desktop-nav__dropdown"
                >
                  {(categories || []).map((c) => (
                    <Link
                      key={c.id} to={`/menu/${c.id}`} role="menuitem"
                      className="desktop-nav__dropdown-link"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink to="/about" className={navLinkClass}>About</NavLink>
            <NavLink to="/contact" className={navLinkClass}>Contact</NavLink>
          </nav>

          <div className="site-header__actions">
            <Link to="/search" aria-label="Search" className="site-header__icon-link hide-mobile">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </Link>
            <ThemeToggle />
            <div
              className="hide-mobile site-header__account"
              onMouseEnter={() => isRealAccount && setAccountDropdownOpen(true)}
              onMouseLeave={() => setAccountDropdownOpen(false)}
              onFocus={() => isRealAccount && setAccountDropdownOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setAccountDropdownOpen(false);
              }}
            >
              {isRealAccount ? (
                <button
                  aria-label="Account menu"
                  aria-expanded={accountDropdownOpen}
                  aria-haspopup="true"
                  onClick={() => setAccountDropdownOpen((open) => !open)}
                  className="site-header__icon-link"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                </button>
              ) : (
                <Link to="/account" aria-label="Sign in" className="site-header__icon-link">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                </Link>
              )}
              {isRealAccount && accountDropdownOpen && (
                <div
                  role="menu"
                  className="site-header__account-menu"
                >
                  <div className="site-header__account-summary">
                    <div>Signed in</div>
                    <strong>{customer?.email || customer?.phone || 'Your account'}</strong>
                  </div>
                  <Link to="/account" role="menuitem" className="site-header__account-item">Account</Link>
                  <Link to="/account/orders" role="menuitem" className="site-header__account-item">Order history</Link>
                  {customer?.role === 'admin' && (
                    <Link to="/admin" role="menuitem" className="site-header__account-item site-header__account-item--admin">Admin dashboard</Link>
                  )}
                  <button type="button" role="menuitem" onClick={() => signOut()} className="site-header__account-item">Sign out</button>
                </div>
              )}
            </div>
            <button
              onClick={openDrawer}
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              className="site-header__icon-link"
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L4 3H2" /><circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" /><circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" /></svg>
              {count > 0 && (
                <span className="site-header__cart-count">{count}</span>
              )}
            </button>
            <button
              ref={mobileMenuButtonRef}
              className="hamburger"
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Main menu"
          tabIndex={-1}
          className="mobile-menu"
        >
          <div className="mobile-menu__header">
            <BrandLogo tone="light" className="mobile-menu__logo" />
            <button ref={mobileMenuCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="mobile-menu__close">&times;</button>
          </div>
          <nav className="mobile-menu__nav" aria-label="Mobile navigation">
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/menu" onClick={() => setMenuOpen(false)}>Menu</Link>
            <Link to="/search" onClick={() => setMenuOpen(false)}>Search</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
            {customer?.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)}>Admin dashboard</Link>}
          </nav>
          <p className="mobile-menu__note">Made to order in Abeokuta. Please allow at least 24 hours.</p>
        </div>
      )}
    </>
  );
}

function navLinkClass({ isActive }) {
  return `desktop-nav__link${isActive ? ' is-active' : ''}`;
}
