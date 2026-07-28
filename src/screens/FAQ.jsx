import { useState } from 'react';

const faqs = [
  { q: 'How much notice do you need for an order?', a: 'Every order needs at least 24 hours notice — this lets us bake to order rather than holding stock. The checkout date picker won\'t let you select an earlier date.' },
  { q: 'How do I pay?', a: 'Online via Paystack at checkout (card or bank transfer, once payment is fully wired up), or via our WhatsApp fallback if online payment isn\'t available.' },
  { q: 'Do you deliver, and where?', a: 'We deliver across Abeokuta and offer pickup from our kitchen. See the Delivery Information page for zones, fees, and timing.' },
  { q: 'Can I cancel or change an order?', a: 'Contact us on WhatsApp as early as possible — since items are made to order, changes get harder to accommodate the closer we get to your preferred date.' },
  { q: 'Do you list allergens and ingredients?', a: 'We\'re adding ingredient and allergen information product by product — pages currently marked "TBC" will be updated as the brand confirms details.' },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 720 }}>
      <h1 style={{ fontSize: 'clamp(32px, 4vw, 44px)', fontWeight: 800, marginBottom: 32 }}>Frequently Asked Questions</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {faqs.map((item, i) => {
          const open = openIndex === i;
          return (
            <div key={item.q} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 16, fontWeight: 700 }}
              >
                {item.q}
                <span style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s', fontSize: 20, fontWeight: 400 }}>+</span>
              </button>
              {open && (
                <div style={{ padding: '0 24px 20px', fontSize: 15, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{item.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
