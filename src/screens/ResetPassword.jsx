import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';

// Landing page for the link sent by supabase.auth.resetPasswordForEmail()
// (see Account.jsx). Supabase's client detects the recovery token in the
// URL and establishes a session automatically before this page mounts, so
// all that's needed here is to collect the new password and call
// updateUser().
export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | done | error
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('saving');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setStatus('error'); setErrorMsg(error.message); return; }
    setStatus('done');
    setTimeout(() => navigate('/account'), 1500);
  }

  return (
    <div className="container" style={{ padding: '64px 0 96px', maxWidth: 440 }}>
      <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 24 }}>Set a New Password</h1>
      {status === 'done' ? (
        <div style={{ fontWeight: 700, color: 'var(--color-olive)' }}>Password updated — redirecting to sign in.</div>
      ) : (
        <form onSubmit={handleSubmit} className="card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="visually-hidden" htmlFor="new-password">New password</label>
            <input id="new-password" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" style={{ width: '100%' }} />
          </div>
          {status === 'error' && <div style={{ fontSize: 13, color: 'var(--color-error)' }} role="alert">{errorMsg}</div>}
          <button type="submit" className="btn btn-primary" disabled={status === 'saving'} style={{ width: '100%' }}>
            {status === 'saving' ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      )}
    </div>
  );
}
