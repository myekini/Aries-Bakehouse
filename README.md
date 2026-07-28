<p align="center">
  <img src="public/logo.svg" alt="Aries 11 Bakehouse" width="220" />
</p>

<h1 align="center">Aries 11 Bakehouse</h1>
<p align="center">A production e-commerce storefront and admin console for a Nigerian bakery, built on Next.js and Supabase.</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth%20%2B%20Edge%20Functions-3ECF8E?logo=supabase&logoColor=white">
  <img alt="Paystack" src="https://img.shields.io/badge/Payments-Paystack-00C3F7?logo=paystack&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/license-Proprietary-lightgrey">
</p>

---

## Overview

Aries 11 Bakehouse is the storefront for a real bakery in Abeokuta, Nigeria — customers browse a configurable product catalogue (banana bread with topping choices, small chops trays, cake treats, and more), check out as a guest or a registered customer, and pay inline via Paystack. Staff manage the entire operation — orders, products, discounts, delivery options, reviews, and site content — from an admin console built into the same app.

The app was originally scaffolded in a design tool and rebuilt from scratch into a real Next.js + Supabase product against an approved UI/UX specification, with every backend rule enforced at the database layer via Postgres Row Level Security — not just in application code.

## Features

- **Catalogue** — categories, products, and configurable variants (e.g. banana bread toppings, small chops trays) backed by Postgres, not static data.
- **Cart & guest checkout** — optimistic client-side cart synced to Supabase in the background; checkout never requires an account.
- **Accounts** — email/password auth, saved delivery addresses, order history, and reorder-in-one-click.
- **Checkout & payments** — Paystack inline payment, with a server-side webhook as the guaranteed source of truth and a synchronous verification call for fast UX feedback. Discount codes are validated and redeemed server-side.
- **Reviews** — customers can review products from completed orders; reviews are moderated (pending → published) before appearing publicly.
- **Admin console** — orders (with status lifecycle and payment verification), products/categories/variants, discount codes, delivery options, customers, reviews moderation, site content (promo banner, homepage picks), and a daily prep view for the kitchen.
- **Analytics** — first-party event tracking (product views, cart activity, checkout funnel, payments, search, signups) stored in Postgres for the team's own conversion reporting.
- **Newsletter** — email capture persisted to the database, not a UI stub.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| UI | React 18, plain CSS (design-token driven), `react-router-dom`-compatible navigation shim |
| Backend | Supabase — Postgres, Auth (incl. anonymous sessions for guest carts), Storage, Edge Functions (Deno) |
| Authorization | Postgres Row Level Security on every table; `SECURITY DEFINER` functions where RLS alone can't express the rule |
| Payments | Paystack Inline JS + webhook (HMAC-SHA512 verified) + synchronous verification function |
| Email | Resend (transactional order confirmations) |

## Project structure

```
src/
  app/            Next.js routes (App Router) — thin wrappers that render the screens below
  screens/         Customer-facing pages (Home, Menu, Cart, Checkout, Account, Order History, ...)
  admin/           Admin console pages (Orders, Products, Discounts, Reviews, Customers, ...)
  context/         React context providers (Auth, Cart)
  lib/             Supabase-backed data access (catalog, orders, discounts, reviews, addresses, analytics)
  hooks/           Data-fetching hooks over lib/
  components/      Shared UI building blocks

supabase/
  schema.sql       Canonical schema: tables, RLS policies, triggers, helper functions
  seed.sql         Catalogue seed data
  patch_*.sql      Sequential migrations applied on top of schema.sql
  functions/       Edge Functions (paystack-webhook, verify-payment)

public/            Static assets served by the app (includes curated product photography)
brand/             Design source material (logo kit, raw photography) — reference only, not served by the app
```

> `react-router-dom` is intentionally still a dependency: existing screens use its API, aliased via `next.config.mjs` to a compatibility shim (`src/lib/router-compat.jsx`) so they run on Next.js navigation underneath. This is deliberate, not leftover Vite scaffolding.

## Local setup

### Prerequisites
- Node.js 18+
- A Supabase project
- A Paystack account (test keys are fine for development)
- A Resend account for transactional email

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase project URL, anon/publishable key, and Paystack **public** key:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=...
```

Never put secret keys (Paystack secret key, Resend API key, Supabase service-role key) in `.env.local` or any file in this repo — they belong only in Supabase Edge Function secrets (Dashboard → Edge Functions → Secrets, or the Supabase CLI).

### 3. Set up the database
In the Supabase SQL editor, run in order:
1. `supabase/schema.sql`
2. `supabase/seed.sql`
3. Each `supabase/patch_*.sql` file, in numeric order

### 4. Deploy the Edge Functions
Deploy `supabase/functions/paystack-webhook` and `supabase/functions/verify-payment`. Point your Paystack webhook URL at the deployed `paystack-webhook` function, and disable "Enforce JWT Verification" on it (Paystack's webhook calls are unauthenticated and verified via HMAC signature instead).

### 5. Run the app
```bash
npm run dev      # local development
npm run build    # production build
npm run start    # serve the production build
```

## Deployment

- **App**: deploy to Vercel (or any Next.js-compatible host) with the same `NEXT_PUBLIC_*` environment variables set in the platform's dashboard.
- **Database & functions**: managed entirely in Supabase — schema/patches via the SQL editor or CLI, Edge Function secrets via the dashboard or `supabase secrets set`.

## Security notes

- All authorization is enforced server-side via Postgres RLS — the client is never trusted to self-report identity or role.
- Payment confirmation is never trusted from the client alone: the Paystack webhook (signature-verified) is the system of record, with a synchronous verification call used only to speed up the customer-facing confirmation.
