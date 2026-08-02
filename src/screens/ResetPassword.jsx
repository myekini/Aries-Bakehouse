import { useState } from 'react';
import { CheckCircle2, CircleAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/account/AuthShell.jsx';
import PasswordField from '../components/account/PasswordField.jsx';
import { Button } from '../components/ui/button.jsx';
import { Alert, AlertDescription } from '../components/ui/alert.jsx';
import { supabase } from '../lib/supabaseClient.js';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMsg('');

    if (password !== confirmation) {
      setStatus('error');
      setErrorMsg('The passwords do not match.');
      return;
    }

    setStatus('saving');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setStatus('error');
      setErrorMsg(error.message);
      return;
    }

    setStatus('done');
    window.setTimeout(() => navigate('/account'), 1200);
  }

  return (
    <AuthShell
      eyebrow="Account security"
      title="Set a new password"
      description="Choose a password you have not used for this account before."
      footer={<p><Link to="/account">Return to sign in</Link></p>}
    >
      {status === 'done' ? (
        <div className="auth-form">
          <Alert variant="success"><CheckCircle2 size={17} aria-hidden="true" /><AlertDescription>Your password has been updated. Redirecting to sign in.</AlertDescription></Alert>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <PasswordField
            id="new-password"
            name="new-password"
            label="New password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            hint="Use at least 6 characters."
          />
          <PasswordField
            id="confirm-password"
            name="confirm-password"
            label="Confirm new password"
            autoComplete="new-password"
            minLength={6}
            required
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
          />
          {status === 'error' && (
            <Alert variant="destructive"><CircleAlert size={17} aria-hidden="true" /><AlertDescription>{errorMsg}</AlertDescription></Alert>
          )}
          <Button
            type="submit"
            aria-busy={status === 'saving'}
            disabled={status === 'saving'}
            className="auth-form__submit"
          >
            Update password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
