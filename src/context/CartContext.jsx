import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { ensureSession } from './AuthContext.jsx';
import { trackEvent } from '../lib/analytics.js';

const CartContext = createContext(null);

function rowToItem(row) {
  return {
    id: row.id, // once loaded from the DB, the row's own id is a perfectly good stable key
    _dbId: row.id,
    productId: row.product_id,
    variantSelections: row.variant_selections || {},
    name: row.name_snapshot,
    image: row.image_url,
    price: row.unit_price,
    qty: row.quantity,
  };
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const cartIdRef = useRef(null);
  const customerIdRef = useRef(null);

  async function resolveCustomerId(session) {
    if (customerIdRef.current) return customerIdRef.current;
    const { data, error } = await supabase.from('customer').select('id').eq('auth_user_id', session.user.id).maybeSingle();
    if (error) throw error;
    customerIdRef.current = data.id;
    return data.id;
  }

  // Lazy: only ensures a session (anonymous if needed) when the cart is
  // actually mutated, not on every page load — see AuthContext.ensureSession.
  async function ensureCart() {
    if (cartIdRef.current) return cartIdRef.current;
    const session = await ensureSession();
    const customerId = await resolveCustomerId(session);
    let { data: cart, error } = await supabase.from('cart').select('id').eq('customer_id', customerId).eq('status', 'active').maybeSingle();
    if (error) throw error;
    if (!cart) {
      const inserted = await supabase.from('cart').insert({ customer_id: customerId }).select('id').single();
      if (inserted.error) throw inserted.error;
      cart = inserted.data;
    }
    cartIdRef.current = cart.id;
    return cart.id;
  }

  // On mount, only load an existing cart if a session already exists (e.g.
  // returning visitor after a refresh) — do NOT trigger anonymous sign-in
  // just from viewing a page, that only happens on first real mutation.
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) return;
      try {
        await resolveCustomerId(data.session);
        const cartId = await ensureCart();
        const { data: rows, error } = await supabase.from('cart_item').select('*').eq('cart_id', cartId);
        if (!error && rows) setItems(rows.map(rowToItem));
      } catch (err) {
        console.error('Cart load failed:', err);
      }
    })();
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2200);
  }, []);

  const addToCart = useCallback((item, opts = {}) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + (item.qty || 1) } : i));
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
    if (!opts.silent) showToast(`Added ${item.name} to cart`);
    if (opts.openDrawer) setDrawerOpen(true);
    trackEvent('product_added_to_cart', { productId: item.productId, name: item.name, price: item.price, qty: item.qty || 1 });

    (async () => {
      try {
        const cartId = await ensureCart();
        const { data: existingRows, error: selErr } = await supabase
          .from('cart_item').select('id, quantity').eq('cart_id', cartId).eq('product_id', item.productId);
        if (selErr) throw selErr;
        const match = (existingRows || []).find((r) => r.id === item._dbId)
          || (existingRows || []).find((r) => JSON.stringify(r.variant_selections) === JSON.stringify(item.variantSelections || {}));

        if (match) {
          const { error } = await supabase.from('cart_item').update({ quantity: match.quantity + (item.qty || 1) }).eq('id', match.id);
          if (error) throw error;
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, _dbId: match.id } : i)));
        } else {
          const { data: inserted, error } = await supabase.from('cart_item').insert({
            cart_id: cartId, product_id: item.productId, variant_selections: item.variantSelections || {},
            quantity: item.qty || 1, unit_price: item.price, name_snapshot: item.name, image_url: item.image,
          }).select('id').single();
          if (error) throw error;
          setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, _dbId: inserted.id } : i)));
        }
      } catch (err) {
        console.error('addToCart sync failed:', err);
        showToast('Could not save to cart - check your connection', 'error');
      }
    })();
  }, [showToast]);

  const removeFromCart = useCallback((id) => {
    let removedDbId = null;
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      removedDbId = target?._dbId;
      return prev.filter((i) => i.id !== id);
    });
    trackEvent('cart_updated', { action: 'remove', itemId: id });
    if (removedDbId) {
      supabase.from('cart_item').delete().eq('id', removedDbId).then(({ error }) => {
        if (error) { console.error('removeFromCart sync failed:', error); showToast('Could not sync removal', 'error'); }
      });
    }
  }, [showToast]);

  const updateQty = useCallback((id, qty) => {
    let dbId = null;
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      dbId = target?._dbId;
      return prev.map((i) => (i.id === id ? { ...i, qty } : i)).filter((i) => i.qty > 0);
    });
    trackEvent('cart_updated', { action: 'quantity', itemId: id, qty });
    if (!dbId) return;
    if (qty > 0) {
      supabase.from('cart_item').update({ quantity: qty }).eq('id', dbId).then(({ error }) => {
        if (error) console.error('updateQty sync failed:', error);
      });
    } else {
      supabase.from('cart_item').delete().eq('id', dbId).then(({ error }) => {
        if (error) console.error('updateQty(0) sync failed:', error);
      });
    }
  }, []);

  const clearCart = useCallback(() => {
    const dbIds = items.map((i) => i._dbId).filter(Boolean);
    setItems([]);
    if (dbIds.length > 0) {
      supabase.from('cart_item').delete().in('id', dbIds).then(({ error }) => {
        if (error) console.error('clearCart sync failed:', error);
      });
    }
  }, [items]);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + (i.price || 0) * i.qty, 0), [items]);
  // Cake Parfait / Ice Cream Twist have no confirmed price yet (spec §7) — a
  // cart containing one of these must not present `subtotal` as if it were
  // complete. Pages that show a total should also show this flag's note.
  const hasUnpricedItems = useMemo(() => items.some((i) => i.price === null || i.price === undefined), [items]);

  const value = {
    items, count, subtotal, hasUnpricedItems,
    addToCart, removeFromCart, updateQty, clearCart,
    toast, showToast,
    drawerOpen, openDrawer: () => setDrawerOpen(true), closeDrawer: () => setDrawerOpen(false),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
