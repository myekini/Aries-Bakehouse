// Supabase-backed order history. Orders are created via the create_order()
// Postgres function (SECURITY DEFINER, see supabase/schema.sql) so the
// order + its line items commit atomically — never a partial write.

import { supabase } from './supabaseClient.js';

function mapOrderItemRow(row) {
  return {
    id: row.id,
    productId: row.product_id,
    variantSelections: row.variant_selections || {},
    name: row.product_name_snapshot,
    price: row.unit_price,
    qty: row.quantity,
    image: row.image_url,
  };
}

function mapOrderRow(row) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    fulfilment: row.fulfilment_type,
    address: row.address_text,
    date: row.preferred_date,
    time: row.preferred_time,
    name: row.customer_name,
    phone: row.customer_phone,
    email: row.customer_email,
    notes: row.special_instructions,
    subtotal: row.subtotal,
    total: row.total,
    hasUnpricedItems: row.has_unpriced_items,
    fallbackChannel: row.fallback_channel,
    createdAt: new Date(row.created_at).getTime(),
    items: (row.order_item || []).map(mapOrderItemRow),
  };
}

const ORDER_SELECT = '*, order_item(*)';

export async function getOrders() {
  const { data, error } = await supabase.from('order').select(ORDER_SELECT).order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(mapOrderRow);
}

export async function getOrder(id) {
  const { data, error } = await supabase.from('order').select(ORDER_SELECT).eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapOrderRow(data) : null;
}

// `orderData.items` must each carry { productId, variantSelections, name,
// price, qty, image } — the same shape CartContext items already use.
// `orderData.paymentReference`, when present, seeds an initial `payment`
// row (status 'pending') atomically alongside the order — the client has
// no direct INSERT policy on payment (§3), so this is the one
// client-triggerable path allowed to create it (via the SECURITY DEFINER
// create_order function).
export async function saveOrder(orderData) {
  const payload = {
    status: orderData.status,
    fulfilment_type: orderData.fulfilment,
    address_text: orderData.address || null,
    preferred_date: orderData.date,
    preferred_time: orderData.time,
    customer_name: orderData.name,
    customer_phone: orderData.phone,
    customer_email: orderData.email || null,
    special_instructions: orderData.notes || null,
    subtotal: orderData.subtotal,
    delivery_fee: orderData.deliveryFee || 0,
    discount_code_id: orderData.discountCodeId || null,
    discount_amount: orderData.discountAmount || 0,
    total: orderData.total ?? orderData.subtotal,
    has_unpriced_items: orderData.hasUnpricedItems,
    fallback_channel: orderData.fallbackChannel || null,
    payment_reference: orderData.paymentReference || null,
    items: orderData.items.map((it) => ({
      product_id: it.productId,
      name: it.name,
      variant_selections: it.variantSelections || {},
      quantity: it.qty,
      unit_price: it.price,
      line_total: it.price === null ? null : it.price * it.qty,
      image_url: it.image,
    })),
  };

  const { data, error } = await supabase.rpc('create_order', { payload });
  if (error) throw error;
  return data.id; // route param — order_number is available via getOrder() for display
}

// Status timeline shown on Order Detail/Tracking (spec §4). Every order
// placed here has only reached "Received" — Preparing/Ready/Completed are
// kitchen-side updates that need the admin tooling in §14.
export const ORDER_TIMELINE = ['Received', 'Preparing', 'Ready/Out for delivery', 'Completed'];
