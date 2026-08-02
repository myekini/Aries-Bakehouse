import { Link } from 'react-router-dom';
import SignatureLoafSpotlight from '../components/SignatureLoafSpotlight.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

export default function About() {
  return (
    <div className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <img
          src="/uploads/aries11-brand-collection-hero.webp"
          alt="Aries 11 banana bread, brownies, pastries, cake treats and small chops"
        />
        <div className="about-hero__scrim" aria-hidden="true" />
        <div className="container about-hero__content">
          <Badge variant="caramel">Our story</Badge>
          <h1 id="about-title">A home kitchen idea, baked for Abeokuta.</h1>
          <p>Aries 11 began with banana bread and a simple standard: make every order fresh, considered, and worth sharing.</p>
        </div>
      </section>

      <SignatureLoafSpotlight
        className="signature-loaf--about"
        badge="The beginning"
        headingId="about-beginning-title"
        title="It started with one loaf."
        description="Banana bread came first. Seven toppings now let each order feel personal, while the same made-to-order standard carries through every box, platter, and pastry tray."
        ctaLabel="Configure a loaf"
      />

      <section className="about-ordering" aria-labelledby="about-ordering-title">
        <div className="container about-ordering__inner">
          <div>
            <p className="page-kicker page-kicker--dark">Why preorder?</p>
            <h2 id="about-ordering-title">Fresh takes a little planning.</h2>
          </div>
          <p>
            We do not hold products on a shelf waiting for an order. The 24-hour notice gives the kitchen time to prepare your selections close to pickup or delivery.
          </p>
          <dl className="about-ordering__details">
            <div><dt>Kitchen</dt><dd>Made to order</dd></div>
            <div><dt>Timing</dt><dd>24-hour notice</dd></div>
            <div><dt>Service</dt><dd>Abeokuta pickup and delivery</dd></div>
          </dl>
        </div>
      </section>

      <section className="container about-closing about-closing--simple" aria-labelledby="about-closing-title">
        <div className="about-closing__copy">
          <h2 id="about-closing-title">Made for your table.</h2>
          <p>Choose a loaf, box, platter, or pastry tray and make it yours.</p>
          <Button asChild><Link to="/menu">Explore the menu</Link></Button>
        </div>
      </section>
    </div>
  );
}
