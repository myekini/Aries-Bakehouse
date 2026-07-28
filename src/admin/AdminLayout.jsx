import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/admin', label: 'Daily Prep', end: true },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/categories', label: 'Categories' },
  { to: '/admin/delivery-options', label: 'Delivery Options' },
  { to: '/admin/discounts', label: 'Discount Codes' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/reviews', label: 'Reviews' },
  { to: '/admin/content', label: 'Site Content' },
];

export default function AdminLayout({ children }) {
  return (
    <div className="container admin-shell" style={{ padding: '32px 0 96px', display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <nav aria-label="Admin" className="admin-nav" style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 96 }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 }}>Admin</div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              textDecoration: 'none', padding: '10px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              color: isActive ? 'var(--color-white)' : 'var(--color-choc)',
              background: isActive ? 'var(--color-choc)' : 'transparent',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div style={{ flex: 1, minWidth: 0, width: '100%' }}>
        {children || <Outlet />}
      </div>
    </div>
  );
}
