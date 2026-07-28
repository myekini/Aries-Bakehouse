# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Local, repeat customers in Abeokuta, Nigeria, ordering baked goods (banana bread, small chops, cake treats, brownies, cookies, pastries) for home enjoyment or a small gathering — usually from a phone browser, planning at least 24 hours ahead for pickup or local delivery. Guest checkout is the default path; accounts are an accelerator for reordering, never a gate.

## Product Purpose

Aries 11 Bakehouse's website replaces an informal WhatsApp/Instagram ordering process with a real storefront: browse a configurable catalogue, build an order (including per-product topping/variant choices), pay online via Paystack or fall back to WhatsApp, and track order status — while staff run the whole operation (orders, catalogue, discounts, delivery, reviews, content) from an admin console built into the same app.

## Positioning

Nothing on the menu is a static shelf item with a photo and a size dropdown. Banana bread topping combinations, small chops tray compositions, and cake treat variants are genuinely configured per order and baked fresh — the product data model enforces this (variants, not flat SKUs), it isn't just marketing copy layered over a generic e-commerce template.

## Operating Context

- Orders require at least 24 hours' notice; there is no same-day/instant fulfillment path.
- Fulfilment is pickup from the Abeokuta bakehouse or local delivery; delivery fee and exact address are confirmed by the team after order placement, not computed automatically.
- WhatsApp (+234 812 114 5785) is a real, permanent parallel channel — for support, for the checkout fallback when a customer can't/won't pay online, and for delivery-fee confirmation. It is not a placeholder to be designed away.
- Some products (Cake Parfait, Ice Cream Twist) genuinely have unconfirmed ("TBC") pricing at the time of order; this is a real business constraint, not a data-entry gap to hide or default to ₦0.
- Staff moderate reviews (pending → published) and manage the daily prep view, discount codes, and delivery options from the built-in admin console.

## Capabilities and Constraints

- Catalogue, cart, checkout, accounts/saved addresses, order history/reorder, product reviews (post-purchase only), and a full admin console are implemented against a real Supabase backend (Postgres + Auth + Edge Functions), not mocked.
- Payment: Paystack Inline JS with a signature-verified webhook as the system of record; a synchronous verification call only speeds up the customer-facing confirmation. A hosted-Paystack fallback tier is intentionally not built yet.
- Authorization is enforced via Postgres Row Level Security on every table — the client is never trusted to self-report identity or role.
- Guest checkout must always remain available and must never be gated behind account creation.

## Brand Commitments

- Name: Aries 11 Bakehouse. Full brand kit (primary/secondary lockups, monogram, social avatar, colour palette, usage rules) lives in `brand/brand-kit/BRAND_GUIDE.md`.
- Palette per the brand guide: Chocolate `#2B140F`, Dark Chocolate `#1C0D0A`, Cream `#F5EBD6`, Warm Beige `#D8B98C`, Caramel Accent `#B9804A`.
- Only real product photography is used (curated in `public/uploads/`) — never stock or AI-generated imagery standing in for the actual bakery's products.

## Evidence on Hand

- Real product photography for the full catalogue (banana bread variants, brownies, small chops, cake treats, cookies, pastries) — `public/uploads/`.
- No customer reviews, testimonials, or ratings currently exist as seed content — the review system is live and real reviews will accumulate post-launch. Do not fabricate reviews, ratings, or customer counts anywhere on the site.
- No confirmed pricing yet for Cake Parfait / Ice Cream Twist — surfaced honestly as "TBC," never invented.

## Product Principles

1. Freshness and real per-order configurability are the whole pitch — never let the UI flatten variants back into generic fixed-SKU shopping.
2. Guest checkout stays frictionless and first-class; accounts and saved addresses are a convenience layered on top, never a requirement.
3. Where the business genuinely doesn't have an answer yet (delivery fee, TBC pricing, exact pickup address), say so honestly rather than presenting a fabricated number.
4. WhatsApp is a first-class channel, not a fallback to be hidden — design it as a real, permanent parallel path.
5. Every backend rule (who can see/edit what) is enforced in Postgres RLS, not just hidden in the UI — design and copy should never imply a security boundary the database doesn't actually have.

## Accessibility & Inclusion

No product-specific accessibility requirement has been established beyond standard web accessibility practice (semantic HTML, visible focus states, sufficient contrast against the brand palette, keyboard operability for dialogs/forms).
