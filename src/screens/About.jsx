import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 800 }}>
      <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 14 }}>Our Story</div>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, margin: 0 }}>
        Freshly made in Abeokuta, since day one.
      </h1>
      <p style={{ fontSize: 17, color: 'var(--color-text-muted)', lineHeight: 1.7, marginTop: 24 }}>
        Aries 11 Bakehouse started in a home kitchen in Abeokuta with one recipe — banana bread — and a simple standard:
        real ingredients, made to order, never rushed. That standard hasn't changed as the menu has grown to include
        pastries, brownies, cake treats, and small-chops platters for every kind of gathering.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 40 }}>How we bake</h2>
      <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        Everything is made to order rather than held in a display case — that's why we ask for 24 hours' notice on
        every order. It means what reaches you was baked with your order in mind, not sitting on a shelf.
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 40 }}>Where we serve</h2>
      <p style={{ fontSize: 16, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
        We currently serve Abeokuta and its surrounding areas via pickup and delivery. See our{' '}
        <Link to="/delivery" style={{ fontWeight: 700, color: 'var(--color-cocoa)' }}>delivery information</Link> page for zones and timing.
      </p>
      <Link to="/menu" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 32 }}>Explore the Menu</Link>
    </div>
  );
}
