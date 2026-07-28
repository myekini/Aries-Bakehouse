import SiteHeader from './SiteHeader.jsx';
import Footer from './Footer.jsx';
import CartDrawer from './CartDrawer.jsx';
import Toast from './Toast.jsx';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} style={{ flex: 1 }}>{children}</main>
      <Footer />
      <CartDrawer />
      <Toast />
    </div>
  );
}
