import SiteHeader from './SiteHeader.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import FloatingSupport from './FloatingSupport.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';
import { useLocation } from 'react-router-dom';

const MOBILE_NAV_EXCLUDED_PATHS = ['/cart', '/checkout', '/product/', '/order/', '/account/reset-password'];

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  const showMobileNav = !MOBILE_NAV_EXCLUDED_PATHS.some((path) => (
    path.endsWith('/') ? pathname.startsWith(path) : pathname === path
  ));

  if (isAdmin) {
    return (
      <div className="admin-app-frame">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    );
  }

  return (
    <div className={`site-shell${showMobileNav ? ' has-mobile-nav' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="site-main">{children}</main>
      <Footer />
      <FloatingSupport />
      <CartDrawer />
      {showMobileNav && <MobileBottomNav />}
    </div>
  );
}
