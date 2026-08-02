import SiteHeader from './SiteHeader.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import FloatingSupport from './FloatingSupport.jsx';
import { useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <div className="admin-app-frame">
        <a href="#main-content" className="skip-link">Skip to content</a>
        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>{children}</main>
      <Footer />
      <FloatingSupport />
      <CartDrawer />
    </div>
  );
}
