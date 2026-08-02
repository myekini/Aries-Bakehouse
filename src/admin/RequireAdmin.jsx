import { ArrowLeft, LogIn, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAdmin({ children }) {
  const { customer, isSignedIn, loading } = useAuth();

  if (loading) {
    return <div className="admin-access"><div className="admin-loading">Checking admin access…</div></div>;
  }

  if (!customer || customer.role !== 'admin') {
    return (
      <div className="admin-access">
        <div className="admin-access__panel">
          <span className="admin-access__icon"><ShieldAlert size={22} aria-hidden="true" /></span>
          <p>Admin access</p>
          <h1>{isSignedIn ? 'This account is not an admin' : 'Sign in to continue'}</h1>
          <span>
            {isSignedIn
              ? `Signed in as ${customer?.email || 'an account'} with the ${customer?.role || 'unassigned'} role.`
              : 'Use the account that has been assigned the admin role in Supabase.'}
          </span>
          <div className="admin-access__actions">
            <Link to="/account" className="btn btn-primary"><LogIn size={16} aria-hidden="true" />{isSignedIn ? 'Open account' : 'Sign in'}</Link>
            <Link to="/" className="btn btn-secondary"><ArrowLeft size={16} aria-hidden="true" />Return to store</Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
