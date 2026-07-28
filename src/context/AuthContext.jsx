import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';

const AuthContext = createContext(null);

// Wraps supabase.auth.onAuthStateChange and the matching `customer` row
// (created automatically by the handle_new_user() trigger — see
// supabase/schema.sql). `customer` is null only while the very first
// session check is in flight; after that it's always set once the app has
// signed in anonymously at least once (see CartContext's lazy sign-in).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = not checked yet, null = signed out
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // still checking
    if (!session) { setCustomer(null); setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    supabase
      .from('customer')
      .select('id, name, email, phone, role, is_guest')
      .eq('auth_user_id', session.user.id)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) { setCustomer(data); setLoading(false); } });
    return () => { cancelled = true; };
  }, [session]);

  const value = {
    session,
    customer,
    isSignedIn: !!session,
    isRealAccount: !!customer && !customer.is_guest,
    isAdmin: customer?.role === 'admin',
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

// Ensures a Supabase session exists (anonymous if nothing else), returning
// the session. Called lazily by CartContext on first cart mutation rather
// than eagerly on every page load, per the plan (avoids creating a throwaway
// auth.users row for visitors who never interact with the cart).
export async function ensureSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session;
  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return signInData.session;
}
