import { Link } from 'react-router-dom';
import BrandLogo from './BrandLogo.jsx';

const FOOTER_LINKS = [
  ['Menu', '/menu'],
  ['About', '/about'],
  ['Contact', '/contact'],
  ['Delivery', '/delivery'],
  ['FAQ', '/faq'],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer__inner">
        <div className="site-footer__brand">
          <BrandLogo tone="light" />
          <p>Made to order in Abeokuta.</p>
        </div>

        <nav className="site-footer__nav" aria-label="Footer navigation">
          {FOOTER_LINKS.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>

        <div className="site-footer__base">
          <span>&copy; {new Date().getFullYear()} Aries 11 Bakehouse</span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/returns">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
