import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: 'var(--color-choc)', color: '#F3EBDD', padding: '64px 0 40px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 48 }}>
          <div>
            <img src="/uploads/Aries11_Primary_Light.svg" alt="Aries 11 Bakehouse" style={{ width: 148, maxWidth: '100%', height: 'auto' }} />
            <div style={{ fontSize: 14, color: 'rgba(243,235,221,0.7)', marginTop: 12, lineHeight: 1.6, maxWidth: 280 }}>
              Freshly made in Abeokuta. Beautifully packed for every occasion.
            </div>
          </div>
          <div>
            <div style={footerHeading}>Menu</div>
            <FooterLinks links={[
              ['Banana Bread', '/menu/banana-bread'],
              ['Small Chops', '/menu/small-chops'],
              ['Brownies & Cookies', '/menu/brownies-cookies'],
              ['Pastries', '/menu/pastries'],
              ['Cake Treats', '/menu/cake-treats'],
            ]} />
          </div>
          <div>
            <div style={footerHeading}>Company</div>
            <FooterLinks links={[
              ['About', '/about'],
              ['Contact', '/contact'],
              ['FAQ', '/faq'],
              ['Delivery Information', '/delivery'],
            ]} />
          </div>
          <div>
            <div style={footerHeading}>Legal</div>
            <FooterLinks links={[
              ['Returns & Refunds', '/returns'],
              ['Privacy Policy', '/privacy'],
              ['Terms & Conditions', '/terms'],
            ]} />
          </div>
          <div>
            <div style={footerHeading}>Contact</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'rgba(243,235,221,0.8)' }}>
              <a href="tel:+2348121145785" style={{ textDecoration: 'none', color: 'inherit' }}>+234 812 114 5785</a>
              <a href="https://instagram.com/aries11_bakehouse" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>@aries11_bakehouse</a>
              <a href="https://wa.me/2348121145785" target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'var(--color-whatsapp)', fontWeight: 700 }}>WhatsApp Support</a>
              <div>Abeokuta, Nigeria</div>
            </div>
          </div>
        </div>
        <div style={{ borderTop: '1px solid rgba(243,235,221,0.15)', marginTop: 48, paddingTop: 24, fontSize: 13, color: 'rgba(243,235,221,0.5)' }}>
          Mon&ndash;Sat, 9am&ndash;7pm &middot; Orders 24 hours ahead of pickup/delivery.
          <div style={{ marginTop: 8 }}>&copy; {new Date().getFullYear()} Aries 11 Bakehouse.</div>
        </div>
      </div>
    </footer>
  );
}

const footerHeading = { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-caramel)', marginBottom: 14 };

function FooterLinks({ links }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: 'rgba(243,235,221,0.8)' }}>
      {links.map(([label, to]) => (
        <Link key={to} to={to} style={{ textDecoration: 'none', color: 'inherit' }}>{label}</Link>
      ))}
    </div>
  );
}
