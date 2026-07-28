export default function Delivery() {
  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>Delivery Information</h1>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <SectionTitle>Areas Covered</SectionTitle>
        <p style={bodyText}>We currently deliver across Abeokuta. Delivery zones and fees are being finalised — TBC pending confirmation.</p>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <SectionTitle>Fees &amp; Timing</SectionTitle>
        <p style={bodyText}>
          Delivery fees are confirmed at checkout once your address is reviewed (TBC pending brand confirmation of zones/pricing).
          All orders — pickup or delivery — require at least 24 hours' notice.
        </p>
      </div>

      <div className="card" style={{ padding: 28, marginBottom: 20 }}>
        <SectionTitle>Pickup Address</SectionTitle>
        <p style={bodyText}>Aries 11 Bakehouse, Abeokuta, Nigeria — the exact address is confirmed by WhatsApp once your order is placed.</p>
      </div>

      <div className="card" style={{ padding: 28 }}>
        <SectionTitle>24-Hour Preorder Policy</SectionTitle>
        <p style={bodyText}>Everything is made to order, not held in stock — this is why the checkout date picker only allows dates 24 hours or more from now.</p>
      </div>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-olive)', marginBottom: 12 }}>{children}</div>;
}

const bodyText = { fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.7, margin: 0 };
