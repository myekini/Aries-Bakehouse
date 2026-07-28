// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy paystack-webhook --no-verify-jwt
// (--no-verify-jwt because Paystack calls this anonymously; the HMAC
// signature check below is what actually authenticates the caller.)
//
// Required secrets (set via `supabase secrets set NAME=value`, never in a
// VITE_-prefixed env var):
//   PAYSTACK_SECRET_KEY   — from the Paystack dashboard
//   SUPABASE_URL          — auto-provided by Supabase runtime
//   SUPABASE_SERVICE_ROLE_KEY — from Project Settings > API (bypasses RLS)
//   RESEND_API_KEY        — from resend.com, for the confirmation email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function hmacSha512Hex(secret: string, payload: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-512' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendConfirmationEmail(to: string, orderNumber: string, total: number) {
  if (!RESEND_API_KEY || !to) return; // notifications are best-effort, never block order confirmation on them
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // No verified sending domain yet — Resend's shared sandbox address
        // works without domain verification, but in that mode it typically
        // only delivers to the email the Resend account itself was signed
        // up with, not arbitrary customer addresses. Swap this to
        // "Aries 11 Bakehouse <orders@yourdomain.com>" once a domain is
        // verified in Resend (Domains → Add Domain → DNS records → Verify).
        from: 'Aries 11 Bakehouse <onboarding@resend.dev>',
        to,
        subject: `Order ${orderNumber} confirmed`,
        html: `<p>Thank you — your order <strong>${orderNumber}</strong> is confirmed (₦${total.toLocaleString('en-NG')}).</p>
               <p>We'll have it ready 24 hours after confirmation, per your selected pickup/delivery window.</p>`,
      }),
    });
  } catch (err) {
    console.error('Resend email failed (non-fatal):', err);
  }
}

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get('x-paystack-signature');

  const expected = await hmacSha512Hex(PAYSTACK_SECRET_KEY, rawBody);
  if (!signature || signature !== expected) {
    return new Response('Invalid signature', { status: 401 });
  }

  const event = JSON.parse(rawBody);
  if (event.event !== 'charge.success') {
    return new Response('ignored', { status: 200 });
  }

  const reference = event.data?.reference;
  const amountKobo = event.data?.amount;

  const { data: payment } = await supabase
    .from('payment')
    .select('id, order_id, amount, status')
    .eq('reference', reference)
    .maybeSingle();

  if (!payment) {
    // Unknown reference — ack 200 anyway so Paystack doesn't retry forever.
    console.warn('paystack-webhook: no payment row for reference', reference);
    return new Response('ok', { status: 200 });
  }

  if (payment.status === 'success') {
    return new Response('already processed', { status: 200 }); // idempotent against webhook replays
  }

  if (Math.round(payment.amount * 100) !== amountKobo) {
    console.error('paystack-webhook: amount mismatch', { expected: payment.amount * 100, got: amountKobo });
    return new Response('amount mismatch', { status: 200 }); // still 200 — do not let Paystack retry-storm on a real mismatch
  }

  await supabase.from('payment').update({
    status: 'success',
    verified_at: new Date().toISOString(),
    raw_webhook_payload: event,
  }).eq('id', payment.id);

  const { data: order } = await supabase
    .from('order')
    .update({ status: 'confirmed', updated_at: new Date().toISOString() })
    .eq('id', payment.order_id)
    .eq('status', 'pending') // only advance from pending — never regress a later status on a duplicate/delayed webhook
    .select('order_number, total, customer_email')
    .maybeSingle();

  if (order) {
    await sendConfirmationEmail(order.customer_email, order.order_number, order.total);
  }

  await supabase.from('analytics_event').insert({
    event_name: 'payment_completed',
    payload: { reference, order_id: payment.order_id },
  });

  return new Response('ok', { status: 200 });
});
