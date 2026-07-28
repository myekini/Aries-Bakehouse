import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifying, setVerifying] = useState(null);
  const [message, setMessage] = useState('');

  function load() {
    supabase.from('payment').select('*, order(order_number)').order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => setPayments(error ? [] : data));
  }

  useEffect(load, []);

  async function verify(payment) {
    setVerifying(payment.id);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: payment.reference } });
      if (error) throw error;
      setMessage(data?.confirmed ? `${payment.reference} verified successfully.` : `${payment.reference} is not confirmed by Paystack yet.`);
      await load();
    } catch (err) {
      setMessage(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(null);
    }
  }

  if (payments === null) return <div>Loading…</div>;
  const filtered = payments.filter((p) => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Payments</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>
        Cross-check references against the Paystack dashboard if a status looks stuck.
      </p>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ borderRadius: 8 }}>
          <option value="all">All payments</option>
          <option value="pending">Pending</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
          <option value="abandoned">Abandoned</option>
        </select>
        {message && <div role="status" style={{ fontSize: 12, color: message.includes('failed') ? 'var(--color-error)' : 'var(--color-olive)' }}>{message}</div>}
      </div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.map((p) => (
          <div key={p.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{p.reference}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {p.order?.order_number ? <Link to={`/admin/orders/${p.order_id}`}>Order #{p.order.order_number}</Link> : 'No order'}
                {p.verified_at ? ` · verified ${new Date(p.verified_at).toLocaleString()}` : ''}
              </div>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{fmtNaira(p.amount)}</div>
            <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: p.status === 'success' ? 'var(--color-olive)' : p.status === 'failed' ? 'var(--color-error)' : 'var(--color-text-faint)' }}>
              {p.status}
            </div>
            <button className="btn btn-secondary btn-sm" disabled={verifying === p.id || !p.reference} aria-busy={verifying === p.id} onClick={() => verify(p)}>
              {verifying === p.id ? 'Checking...' : 'Verify'}
            </button>
          </div>
        ))}
        {filtered.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No payments match this filter.</div>}
      </div>
    </div>
  );
}
