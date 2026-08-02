export default function Delivery() {
  return (
    <div className="container content-page">
      <header className="content-page__header">
        <p className="page-kicker">Ordering support</p>
        <h1>Delivery information</h1>
        <p>What to expect when collecting from the bakehouse or arranging local delivery in Abeokuta.</p>
      </header>

      <div className="content-page__sections">
        <article>
          <h2>Areas covered</h2>
          <p>We currently offer local delivery across Abeokuta. Availability depends on the address and preferred delivery time.</p>
        </article>

        <article>
          <h2>Fees and timing</h2>
          <p>
          Delivery fees are confirmed after the team reviews your checkout address. You will know the fee before delivery is finalised.
          All pickup and delivery orders require at least 24 hours' notice.
          </p>
        </article>

        <article>
          <h2>Pickup address</h2>
          <p>Aries 11 Bakehouse, Abeokuta, Nigeria. The exact address is confirmed after your website order is placed.</p>
        </article>

        <article>
          <h2>24-hour preorder policy</h2>
          <p>Everything is made to order, not held in stock. This is why the checkout date picker only allows dates 24 hours or more from now.</p>
        </article>
      </div>
    </div>
  );
}
