// Supabase Edge Function (Deno). Deploy with:
//   supabase functions deploy verify-payment
// Called synchronously from Checkout.jsx right after Paystack's inline
// `onSuccess` fires, so the customer sees "Confirmed" fast instead of
// waiting on webhook delivery. The paystack-webhook function remains the
// guaranteed backstop if this call never completes (tab closed, etc).
//
// Required secrets: PAYSTACK_SECRET_KEY, SUPABASE_URL (auto), SUPABASE_SERVICE_ROLE_KEY.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')!;

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

  const { reference } = await req.json();
  if (!reference) return new Response(JSON.stringify({ error: 'reference required' }), { status: 400 });

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const paystackJson = await paystackRes.json();

  if (!paystackJson.status || paystackJson.data?.status !== 'success') {
    return new Response(JSON.stringify({ confirmed: false }), { status: 200 });
  }

  const { data: payment } = await supabase
    .from('payment').select('id, order_id, amount, status').eq('reference', reference).maybeSingle();

  if (!payment) return new Response(JSON.stringify({ confirmed: false, error: 'no matching payment row' }), { status: 200 });

  if (Math.round(payment.amount * 100) !== paystackJson.data.amount) {
    return new Response(JSON.stringify({ confirmed: false, error: 'amount mismatch' }), { status: 200 });
  }

  if (payment.status !== 'success') {
    await supabase.from('payment').update({
      status: 'success', verified_at: new Date().toISOString(), raw_webhook_payload: paystackJson,
    }).eq('id', payment.id);

    await supabase.from('order')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', payment.order_id)
      .eq('status', 'pending');
  }

  return new Response(JSON.stringify({ confirmed: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});
