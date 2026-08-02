import { useEffect, useMemo, useState } from 'react';
import { CircleDollarSign, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';
import { toast } from '../components/ui/toast.jsx';

const PAYMENT_STATUSES = ['pending', 'success', 'failed', 'abandoned'];

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifying, setVerifying] = useState(null);

  function load() {
    return supabase.from('payment').select('*, order(order_number)').order('created_at', { ascending: false }).limit(200)
      .then(({ data, error }) => setPayments(error ? [] : data));
  }

  useEffect(() => { load(); }, []);

  async function verify(payment) {
    setVerifying(payment.id);
    try {
      await toast.promise((async () => {
        const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: payment.reference } });
        if (error) throw error;
        await load();
        return data;
      })(), {
        loading: { title: 'Checking payment', description: payment.reference },
        success: (data) => data?.confirmed
          ? { title: 'Payment verified', description: payment.reference }
          : { title: 'Payment not confirmed', description: payment.reference, type: 'warning' },
        error: (error) => ({ title: 'Verification failed', description: error.message }),
      });
    } catch {
      // toast.promise renders the actionable failure state.
    } finally {
      setVerifying(null);
    }
  }

  const filtered = useMemo(() => (payments || []).filter((payment) => statusFilter === 'all' || payment.status === statusFilter), [payments, statusFilter]);
  const successfulTotal = (payments || []).filter((payment) => payment.status === 'success').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Operations" title="Payments" description="Review Paystack references and manually recheck transactions that are still pending." />

      <div className="admin-inline-metrics">
        <div><span>Successful volume</span><strong>{fmtNaira(successfulTotal)}</strong></div>
        <div><span>Transactions</span><strong>{payments?.length || 0}</strong></div>
        <div><span>Pending review</span><strong>{(payments || []).filter((payment) => payment.status === 'pending').length}</strong></div>
      </div>

      <AdminToolbar>
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All payments</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select></label>
      </AdminToolbar>

      {payments === null ? <AdminLoading label="Loading payments…" /> : (
        <section className="admin-panel admin-panel--table">
          <div className="admin-panel__header"><div><h2>Transactions</h2><p>{filtered.length} payment{filtered.length === 1 ? '' : 's'} in this view</p></div></div>
          {filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Reference</th><th>Order</th><th>Date</th><th>Status</th><th className="is-numeric">Amount</th><th aria-label="Actions" /></tr></thead><tbody>
            {filtered.map((payment) => <tr key={payment.id}>
              <td><strong className="admin-table__primary admin-table__reference">{payment.reference}</strong><small>{payment.provider}</small></td>
              <td>{payment.order?.order_number ? <Link to={`/admin/orders/${payment.order_id}`}>#{payment.order.order_number}</Link> : <span className="admin-table__muted">No order</span>}</td>
              <td>{new Date(payment.created_at).toLocaleDateString('en-NG')}<small>{payment.verified_at ? `Verified ${new Date(payment.verified_at).toLocaleDateString('en-NG')}` : 'Not verified'}</small></td>
              <td><AdminStatusBadge status={payment.status}>{payment.status}</AdminStatusBadge></td>
              <td className="is-numeric"><strong>{fmtNaira(payment.amount)}</strong></td>
              <td className="is-numeric"><button className="admin-row-action" type="button" disabled={verifying === payment.id || !payment.reference} onClick={() => verify(payment)}><RefreshCw className={verifying === payment.id ? 'admin-spinner' : ''} size={14} aria-hidden="true" />{verifying === payment.id ? 'Checking' : 'Verify'}</button></td>
            </tr>)}
          </tbody></table></div> : <AdminEmpty icon={CircleDollarSign}>No payments match this filter.</AdminEmpty>}
        </section>
      )}
    </AdminPage>
  );
}
