export default function Contact() {
  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>Contact</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
        <ContactCard label="WhatsApp" value="+234 812 114 5785" href="https://wa.me/2348121145785" cta="Open WhatsApp" whatsapp />
        <ContactCard label="Phone" value="+234 812 114 5785" href="tel:+2348121145785" cta="Call" />
        <ContactCard label="Instagram" value="@aries11_bakehouse" href="https://instagram.com/aries11_bakehouse" cta="Visit Instagram" />
      </div>
      <div className="card" style={{ padding: 28, marginTop: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 }}>Hours &amp; Location</div>
        <div style={{ fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
          Mon&ndash;Sat, 9am&ndash;7pm<br />
          Abeokuta, Nigeria — exact pickup address confirmed by WhatsApp on order.<br />
          Orders require 24 hours notice ahead of pickup or delivery.
        </div>
      </div>
    </div>
  );
}

function ContactCard({ label, value, href, cta, whatsapp }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{value}</div>
      <a href={href} target="_blank" rel="noreferrer" className={`btn ${whatsapp ? 'btn-whatsapp' : 'btn-secondary'} btn-sm`}>{cta}</a>
    </div>
  );
}
