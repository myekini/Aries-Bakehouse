import { useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../components/ui/collapsible.jsx';

const faqs = [
  { q: 'How much notice do you need for an order?', a: 'Every order needs at least 24 hours notice — this lets us bake to order rather than holding stock. The checkout date picker won\'t let you select an earlier date.' },
  { q: 'How do I pay?', a: 'Online via Paystack at checkout. WhatsApp is available for support questions, not as a separate order channel.' },
  { q: 'Do you deliver, and where?', a: 'We deliver across Abeokuta and offer pickup from our kitchen. See the Delivery Information page for zones, fees, and timing.' },
  { q: 'Can I cancel or change an order?', a: 'Contact support as early as possible — since items are made to order, changes get harder to accommodate the closer we get to your preferred date.' },
  { q: 'Do you list allergens and ingredients?', a: 'Product pages show the information currently available. If you have an allergy or dietary concern, contact support before ordering so the kitchen can confirm whether the product is suitable.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="container content-page">
      <header className="content-page__header">
        <p className="page-kicker">Quick answers</p>
        <h1>Frequently asked questions</h1>
        <p>Ordering, payment, delivery, and product information in one place.</p>
      </header>
      <div className="faq-list">
        {faqs.map((item, i) => {
          const open = openIndex === i;
          return (
            <Collapsible key={item.q} open={open} onOpenChange={(nextOpen) => setOpenIndex(nextOpen ? i : null)} className={`faq-item${open ? ' is-open' : ''}`}>
              <CollapsibleTrigger>
                <span>{item.q}</span>
                <span className="faq-item__icon" aria-hidden="true">+</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="faq-item__answer">{item.a}</div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
