import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// This is a UX guard only — it hides admin navigation from non-admins.
// The real authorization boundary is the is_admin() RLS policies in
// supabase/schema.sql; a client-side guard alone never protects data.
export default function RequireAdmin({ children }) {
  const { customer, loading } = useAuth();

  if (loading) {
    return <div className="container" style={{ padding: '96px 0', textAlign: 'center' }}>Loading…</div>;
  }
  if (!customer || customer.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}
