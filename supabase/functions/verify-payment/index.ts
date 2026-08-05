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

// This function is called directly from the browser (supabase.functions.invoke
// in Checkout.jsx), so it needs CORS headers on every response, including the
// preflight OPTIONS request the browser sends before the real POST. Without
// this, the browser silently blocks the request as a failed fetch — the
// client's catch block then always shows "confirmation pending" even when
// Paystack itself reports the charge as successful.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: corsHeaders });

  const { reference } = await req.json();
  if (!reference) return json({ error: 'reference required' }, 400);

  const paystackRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const paystackJson = await paystackRes.json();

  if (!paystackJson.status || paystackJson.data?.status !== 'success') {
    return json({ confirmed: false });
  }

  const { data: payment } = await supabase
    .from('payment').select('id, order_id, amount, status').eq('reference', reference).maybeSingle();

  if (!payment) return json({ confirmed: false, error: 'no matching payment row' });

  if (Math.round(payment.amount * 100) !== paystackJson.data.amount) {
    return json({ confirmed: false, error: 'amount mismatch' });
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

  return json({ confirmed: true });
});
