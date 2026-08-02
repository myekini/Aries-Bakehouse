import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BadgePercent,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareMore,
  PackageOpen,
  PanelsTopLeft,
  Store,
  Truck,
  Users,
  X,
} from 'lucide-react';
import ThemeToggle from '../components/ThemeToggle.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_GROUPS = [
  {
    label: 'Operations',
    items: [
      { to: '/admin', label: 'Overview', end: true, icon: LayoutDashboard },
      { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
      { to: '/admin/payments', label: 'Payments', icon: CircleDollarSign },
      { to: '/admin/customers', label: 'Customers', icon: Users },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      { to: '/admin/products', label: 'Products', icon: PackageOpen },
      { to: '/admin/categories', label: 'Categories', icon: FolderTree },
      { to: '/admin/delivery-options', label: 'Delivery', icon: Truck },
      { to: '/admin/discounts', label: 'Discounts', icon: BadgePercent },
    ],
  },
  {
    label: 'Storefront',
    items: [
      { to: '/admin/reviews', label: 'Reviews', icon: MessageSquareMore },
      { to: '/admin/content', label: 'Site content', icon: PanelsTopLeft },
    ],
  },
];

export default function AdminLayout({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { customer, signOut } = useAuth();
  const allItems = NAV_GROUPS.flatMap((group) => group.items);
  const currentItem = [...allItems]
    .sort((a, b) => b.to.length - a.to.length)
    .find((item) => (item.end ? pathname === item.to : pathname.startsWith(item.to)));

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    document.body.classList.add('admin-nav-is-open');
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.classList.remove('admin-nav-is-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/account');
  };

  return (
    <div className="admin-shell">
      <button
        className={`admin-nav-backdrop${navOpen ? ' is-open' : ''}`}
        type="button"
        aria-label="Close navigation"
        tabIndex={navOpen ? 0 : -1}
        onClick={() => setNavOpen(false)}
      />

      <aside className={`admin-sidebar${navOpen ? ' is-open' : ''}`} aria-label="Admin navigation">
        <div className="admin-sidebar__brand">
          <div className="admin-sidebar__mark" aria-hidden="true">A11</div>
          <div>
            <strong>Aries 11</strong>
            <span>Operations</span>
          </div>
          <button className="admin-icon-button admin-sidebar__close" type="button" onClick={() => setNavOpen(false)} aria-label="Close navigation">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-nav">
          {NAV_GROUPS.map((group) => (
            <div className="admin-nav__group" key={group.label}>
              <p className="admin-nav__label">{group.label}</p>
              {group.items.map(({ icon: Icon, ...item }) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}
                >
                  <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
                  <span>{item.label}</span>
                  <ChevronRight className="admin-nav__chevron" size={15} aria-hidden="true" />
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-user">
            <span className="admin-user__avatar" aria-hidden="true">{(customer?.name || customer?.email || 'A').charAt(0).toUpperCase()}</span>
            <span className="admin-user__copy">
              <strong>{customer?.name || 'Administrator'}</strong>
              <span>{customer?.email || 'Admin account'}</span>
            </span>
          </div>
          <button className="admin-nav__link admin-sign-out" type="button" onClick={handleSignOut}>
            <LogOut size={18} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div className="admin-topbar__context">
            <button className="admin-icon-button admin-menu-button" type="button" onClick={() => setNavOpen(true)} aria-label="Open navigation" aria-expanded={navOpen}>
              <Menu size={20} aria-hidden="true" />
            </button>
            <div>
              <span className="admin-topbar__eyebrow">Admin</span>
              <strong>{currentItem?.label || 'Workspace'}</strong>
            </div>
          </div>
          <div className="admin-topbar__actions">
            <NavLink to="/" className="admin-store-link">
              <Store size={17} aria-hidden="true" />
              <span>View store</span>
            </NavLink>
            <ThemeToggle />
          </div>
        </header>

        <div className="admin-content">
          {children || <Outlet />}
        </div>
      </div>
    </div>
  );
}
