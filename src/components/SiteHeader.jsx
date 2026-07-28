import { useEffect, useRef, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCategories } from '../hooks/useCatalog.js';
import { supabase } from '../lib/supabaseClient.js';

export default function SiteHeader() {
  const { count, openDrawer } = useCart();
  const { isRealAccount, customer, signOut } = useAuth();
  const { data: categories } = useCategories();
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [announcement, setAnnouncement] = useState({ active: true, text: 'Orders require 24 hours notice.' });
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const lastY = useRef(0);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      setHidden(y > lastY.current && y > 120);
      lastY.current = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
    if (menuOpen) mobileMenuRef.current?.focus();
  }, [menuOpen]);

  return (
    <>
      {showAnnouncement && announcement.active && announcement.text && (
        <div style={{ background: 'var(--color-caramel)', color: 'var(--color-white)', fontSize: 13, fontWeight: 700, padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, position: 'relative' }}>
          <div>{announcement.text}</div>
          <button
            onClick={() => setShowAnnouncement(false)}
            aria-label="Dismiss announcement"
            style={{ position: 'absolute', right: 24, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 800, fontSize: 16 }}
          >&times;</button>
        </div>
      )}

      <header
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'var(--color-cream)',
          borderBottom: '1px solid rgba(50,26,23,0.1)',
          transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
          transition: 'transform 0.25s ease',
        }}
      >
        <div className="container" style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" aria-label="Aries 11 Bakehouse home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/uploads/Aries11_Wordmark_Transparent.svg" alt="Aries 11 Bakehouse" style={{ width: 132, height: 'auto', display: 'block' }} />
          </Link>

          <nav className="desktop-nav" style={{ display: 'flex', gap: 32, fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            <NavLink to="/" end style={({ isActive }) => navLinkStyle(isActive)}>Home</NavLink>
            {/* §3: "Menu (with category mega-dropdown)" on desktop. */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setMenuDropdownOpen(true)}
              onMouseLeave={() => setMenuDropdownOpen(false)}
              onFocus={() => setMenuDropdownOpen(true)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) setMenuDropdownOpen(false);
              }}
            >
              <NavLink to="/menu" style={({ isActive }) => navLinkStyle(isActive)} aria-expanded={menuDropdownOpen} aria-haspopup="true" aria-controls="menu-categories">Menu</NavLink>
              {menuDropdownOpen && (
                <div
                  id="menu-categories"
                  role="menu"
                  style={{
                    position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 12,
                    background: 'var(--color-white)', borderRadius: 14, boxShadow: '0 20px 40px rgba(50,26,23,0.18)',
                    padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, width: 340, zIndex: 40,
                  }}
                >
                  {(categories || []).map((c) => (
                    <Link
                      key={c.id} to={`/menu/${c.id}`} role="menuitem"
                      style={{ textDecoration: 'none', color: 'var(--color-choc)', fontWeight: 600, fontSize: 13, padding: '10px 12px', borderRadius: 8, whiteSpace: 'nowrap' }}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            <NavLink to="/about" style={({ isActive }) => navLinkStyle(isActive)}>About</NavLink>
            <NavLink to="/contact" style={({ isActive }) => navLinkStyle(isActive)}>Contact</NavLink>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <Link to="/search" aria-label="Search" style={{ display: 'flex' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            </Link>
            <div
              style={{ position: 'relative' }}
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
                  style={{ display: 'flex', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                </button>
              ) : (
                <Link to="/account" aria-label="Sign in" style={{ display: 'flex' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>
                </Link>
              )}
              {isRealAccount && accountDropdownOpen && (
                <div
                  role="menu"
                  style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 18, width: 220,
                    background: 'var(--color-white)', borderRadius: 14, boxShadow: '0 20px 40px rgba(50,26,23,0.18)',
                    padding: 10, zIndex: 40,
                  }}
                >
                  <div style={{ padding: '8px 10px 10px', borderBottom: '1px solid rgba(50,26,23,0.1)', marginBottom: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-olive)' }}>Signed in</div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer?.email || customer?.phone || 'Your account'}</div>
                  </div>
                  <Link to="/account" role="menuitem" style={accountMenuItem}>Account</Link>
                  <Link to="/account/orders" role="menuitem" style={accountMenuItem}>Order History</Link>
                  <button type="button" role="menuitem" onClick={() => signOut()} style={{ ...accountMenuItem, width: '100%', textAlign: 'left' }}>Sign Out</button>
                </div>
              )}
            </div>
            <button
              onClick={openDrawer}
              aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6h15l-1.5 9h-12z" /><path d="M6 6L4 3H2" /><circle cx="9" cy="20" r="1.4" fill="#321A17" stroke="none" /><circle cx="17" cy="20" r="1.4" fill="#321A17" stroke="none" /></svg>
              {count > 0 && (
                <span style={{ position: 'absolute', top: -8, right: -9, background: 'var(--color-choc)', color: 'var(--color-white)', fontSize: 10, fontWeight: 800, borderRadius: 999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{count}</span>
              )}
            </button>
            <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" className="btn btn-whatsapp btn-sm hide-mobile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="#FFFDF8"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.3c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2zm0 18c-1.5 0-3-.4-4.3-1.1l-.3-.2-3 .8.8-2.9-.2-.3C4.4 15 4 13.5 4 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8z" /></svg>
              Support
            </a>
            <button
              className="hamburger"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'none' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#321A17" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
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
          style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'var(--color-choc)', color: 'var(--color-white)', display: 'flex', flexDirection: 'column', padding: 24 }}
        >
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setMenuOpen(false)} aria-label="Close menu" style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 28, cursor: 'pointer' }}>&times;</button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 28, fontSize: 24, fontWeight: 700, marginTop: 40 }}>
            <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/menu" onClick={() => setMenuOpen(false)}>Menu</Link>
            <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
            <Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link>
            <Link to="/account" onClick={() => setMenuOpen(false)}>Account</Link>
          </nav>
        </div>
      )}
    </>
  );
}

function navLinkStyle(isActive) {
  return {
    textDecoration: 'none',
    color: isActive ? 'var(--color-choc)' : 'var(--color-text-muted)',
    fontWeight: isActive ? 700 : 600,
    borderBottom: isActive ? '2px solid var(--color-caramel)' : '2px solid transparent',
    paddingBottom: 22,
    marginBottom: -23,
  };
}

const accountMenuItem = {
  display: 'block',
  padding: '10px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-choc)',
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 700,
  textDecoration: 'none',
};
