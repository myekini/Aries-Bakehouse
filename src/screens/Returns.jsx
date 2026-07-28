import PolicyPage from '../components/PolicyPage.jsx';

export default function Returns() {
  return (
    <PolicyPage
      title="Returns & Refund Policy"
      sections={[
        { heading: 'Made-to-order items', body: 'Because every item is baked to order rather than held in stock, we\'re unable to accept returns once an order has been prepared. If something arrives damaged or incorrect, contact us on WhatsApp within 24 hours of delivery/pickup.' },
        { heading: 'Cancellations', body: 'Orders can be cancelled or changed via WhatsApp — the earlier you reach out relative to your preferred date, the easier it is to accommodate, since preparation begins ahead of the 24-hour window.' },
        { heading: 'Refunds', body: 'Refunds for verified issues (damaged, incorrect, or undelivered orders) are processed back to the original payment method. Full refund policy detail is pending brand confirmation — this page will be updated.' },
      ]}
    />
  );
}
