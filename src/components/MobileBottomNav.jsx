import { House, LayoutGrid, Search, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const ITEMS = [
  { to: '/', label: 'Home', icon: House, matches: (path) => path === '/' },
  { to: '/menu', label: 'Menu', icon: LayoutGrid, matches: (path) => path.startsWith('/menu') },
  { to: '/search', label: 'Search', icon: Search, matches: (path) => path === '/search' },
  { to: '/account', label: 'Account', icon: UserRound, matches: (path) => path.startsWith('/account') },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="mobile-bottom-nav" aria-label="Primary mobile navigation">
      <div className="mobile-bottom-nav__inner">
        {ITEMS.map(({ to, label, icon: Icon, matches }) => {
          const active = matches(pathname);
          return (
            <Link
              key={to}
              to={to}
              className={`mobile-bottom-nav__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
