import PolicyPage from '../components/PolicyPage.jsx';

export default function Terms() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      sections={[
        { heading: 'Ordering', body: 'All orders require at least 24 hours notice ahead of your preferred pickup or delivery date. Placing an order is an offer to buy, which we confirm once payment succeeds or once a support-assisted checkout is manually confirmed.' },
        { heading: 'Pricing', body: 'Prices are shown in Nigerian Naira (₦) and are current at the time of order. Products marked "Price TBC" cannot be paid for online until the kitchen confirms the price.' },
        { heading: 'Payment', body: 'Payment is processed via Paystack. WhatsApp is available for support if checkout needs help, but order completion happens through the website flow.' },
        { heading: 'Cancellations', body: 'See our Returns & Refund Policy for cancellation terms.' },
      ]}
    />
  );
}
