import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';

const SUPPORT_URL = 'https://wa.me/2348121145785';

export default function Contact() {
  return (
    <div className="contact-page">
      <section className="container contact-intro" aria-labelledby="contact-title">
        <div className="contact-intro__copy">
          <Badge variant="caramel">Support</Badge>
          <h1 id="contact-title">Help without the runaround.</h1>
          <p>For an existing order, pickup, or delivery question, message the bakehouse and include your order number.</p>
        </div>
        <div className="contact-intro__action">
          <Button asChild variant="whatsapp">
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer">Message WhatsApp support</a>
          </Button>
          <span>Replies Monday-Saturday, 9am-7pm</span>
        </div>
      </section>

      <section className="container contact-details" aria-labelledby="contact-details-title">
        <div className="contact-details__primary">
          <p className="page-kicker">Quick answers</p>
          <h2 id="contact-details-title">Start with the right place.</h2>
          <p>Ordering stays on the website. These links cover the questions that usually come before or after checkout.</p>

          <div className="contact-links">
            <Link to="/delivery">
              <span><small>Pickup and delivery</small>Timing, locations, and fees</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <Link to="/faq">
              <span><small>Frequently asked</small>Ordering and product answers</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
            <a href="tel:+2348121145785">
              <span><small>Phone</small>+234 812 114 5785</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>

        <aside className="contact-hours" aria-labelledby="contact-hours-title">
          <h2 id="contact-hours-title">Bakehouse details</h2>
          <dl>
            <div><dt>Open</dt><dd>Monday-Saturday, 9am-7pm</dd></div>
            <div><dt>Location</dt><dd>Abeokuta, Nigeria</dd></div>
            <div><dt>Pickup</dt><dd>Exact address confirmed after ordering.</dd></div>
            <div><dt>Notice</dt><dd>Please order at least 24 hours ahead.</dd></div>
          </dl>
        </aside>
      </section>
    </div>
  );
}
