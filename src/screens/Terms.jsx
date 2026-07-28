import PolicyPage from '../components/PolicyPage.jsx';

export default function Terms() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      sections={[
        { heading: 'Ordering', body: 'All orders require at least 24 hours notice ahead of your preferred pickup or delivery date. Placing an order is an offer to buy, which we confirm once payment succeeds or once a support-assisted checkout is manually confirmed.' },
        { heading: 'Pricing', body: 'Prices are shown in Nigerian Naira (₦) and are current at the time of order. Some products may be marked "Price TBC" pending brand-confirmed pricing.' },
        { heading: 'Payment', body: 'Payment is processed via Paystack. If online payment cannot be completed, WhatsApp support can help recover a saved checkout, which remains "Pending" until manually confirmed by the business.' },
        { heading: 'Cancellations', body: 'See our Returns & Refund Policy for cancellation terms.' },
      ]}
    />
  );
}
