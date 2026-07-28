import { supabase } from './supabaseClient.js';

// RLS ("review owner insert" in supabase/schema.sql) already enforces that
// the submitting customer owns a *completed* order containing this exact
// product — this function just shapes the insert, the database is the real
// gate. New reviews always land as status 'pending' (column default),
// picked up by the existing ReviewsAdmin moderation queue.
export async function submitReview({ productId, orderId, rating, comment }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be signed in to leave a review.');

  const { data: customer, error: customerError } = await supabase
    .from('customer').select('id').eq('auth_user_id', user.id).maybeSingle();
  if (customerError) throw customerError;
  if (!customer) throw new Error('Could not find your account.');

  const { error } = await supabase.from('review').insert({
    product_id: productId,
    order_id: orderId,
    customer_id: customer.id,
    rating,
    comment: comment?.trim() || null,
  });
  if (error) throw error;
}

// Lets the Order Detail page hide the "leave a review" form for items
// already reviewed (any status — pending/published/rejected all count as
// "already submitted", to avoid duplicate-review clutter).
export async function getMyReviewedProductIds(orderId) {
  const { data, error } = await supabase.from('review').select('product_id').eq('order_id', orderId);
  if (error) throw error;
  return new Set(data.map((r) => r.product_id));
}
