import PolicyPage from '../components/PolicyPage.jsx';

export default function Privacy() {
  return (
    <PolicyPage
      title="Privacy Policy"
      sections={[
        { heading: 'What we collect', body: 'Name, phone number, email (optional), and delivery address, collected at checkout to fulfil your order — plus order history if you create an account.' },
        { heading: 'How we use it', body: 'Solely to process and deliver your order, contact you about it by email or phone, and — if you opt in — send reorder reminders. We do not sell customer data.' },
        { heading: 'Payment data', body: 'Card and payment details are handled directly by Paystack; we never store your card information ourselves.' },
        { heading: 'Contact', body: 'Questions about this policy can be sent via WhatsApp or the Contact page.' },
      ]}
    />
  );
}
