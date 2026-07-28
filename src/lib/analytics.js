import { supabase } from './supabaseClient.js';

const SESSION_KEY = 'aries11_analytics_session';

// Deliberately separate from the Supabase auth session id — this just
// needs to group events from the same browser/tab across a visit, and
// should keep working even for the many visitors who never trigger the
// lazy anonymous sign-in in CartContext (pure browsers, never add to cart).
function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = window.localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// Fire-and-forget by design (spec §15 calls this "basic" analytics) — never
// awaited by callers, never allowed to throw into the UI.
export function trackEvent(eventName, payload = {}) {
  try {
    supabase.auth.getSession().then(({ data }) => {
      supabase.from('analytics_event').insert({
        event_name: eventName,
        customer_id: null, // resolved server-side would need a join; session_id is enough to fund the §15 funnel
        session_id: getSessionId(),
        payload: { ...payload, authUserId: data.session?.user?.id ?? null },
      }).then(({ error }) => {
        if (error) console.warn('trackEvent failed (non-fatal):', eventName, error.message);
      });
    });
  } catch (err) {
    console.warn('trackEvent threw (non-fatal):', err);
  }
}
