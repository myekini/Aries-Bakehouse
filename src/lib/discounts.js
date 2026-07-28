import { supabase } from './supabaseClient.js';

export function calculateDiscountAmount(discount, subtotal) {
  if (!discount || subtotal <= 0) return 0;
  if (discount.type === 'percentage') return Math.min(subtotal, Math.round((subtotal * discount.value) / 100));
  return Math.min(subtotal, discount.value);
}

export async function redeemDiscountCode(code, subtotal) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Enter a discount code first.');

  const { data, error } = await supabase.rpc('redeem_discount_code', { p_code: normalized });
  if (error) throw error;
  if (!data?.valid) {
    const reason = data?.reason;
    if (reason === 'expired') throw new Error('This discount code has expired.');
    if (reason === 'usage_limit_reached') throw new Error('This discount code has reached its usage limit.');
    throw new Error('That discount code was not found.');
  }

  const discount = {
    id: data.id,
    code: normalized,
    type: data.type,
    value: data.value,
  };
  return {
    ...discount,
    amount: calculateDiscountAmount(discount, subtotal),
  };
}
