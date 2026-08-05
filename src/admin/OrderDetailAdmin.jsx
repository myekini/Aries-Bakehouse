import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira, fmtLineTotal } from '../lib/format.js';
import { trackEvent } from '../lib/analytics.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminPanel, AdminStatusBadge } from './AdminPrimitives.jsx';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready_or_out', 'completed', 'cancelled'];
const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready_or_out: 'Ready / Out for delivery', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OrderDetailAdmin() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(undefined);
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);

  function load() {
    supabase.from('order').select('*, order_item(*), payment(*)').eq('id', orderId).maybeSingle()
      .then(({ data, error }) => setOrder(error ? null : data));
  }
  useEffect(load, [orderId]);

  async function updateStatus(status) {
    setSaving(true);
    const { error } = await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    if (error) toast.error('Order status was not updated', { description: error.message });
    else {
      toast.success(`Order #${order.order_number} updated`, { description: `Status changed to ${STATUS_LABEL[status]}.` });
      if (status === 'completed') trackEvent('order_completed', { orderId });
    }
    load();
    setPendingStatus(null);
    setSaving(false);
  }

  async function verifyPayment(payment) {
    setVerifying(payment.id);
    try {
      const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference: payment.reference } });
      if (error) throw error;
      if (data?.confirmed) toast.success('Payment verified', { description: payment.reference });
      else toast.warning('Payment not confirmed', { description: payment.reference });
      load();
    } catch (err) {
      toast.error('Verification failed', { description: err.message });
    } finally {
      setVerifying(null);
    }
  }

  if (order === undefined) return <AdminLoading label="Loading order…" />;
  if (!order) return <AdminEmpty>Order not found.</AdminEmpty>;

  return (
    <AdminPage>
      <Link to="/admin/orders" className="admin-back-link">&larr; All orders</Link>
      <AdminPageHeader eyebrow="Order details" title={`Order #${order.order_number}`} description={`${order.customer_name} · ${order.customer_phone} · ${order.customer_email || 'no email'}`} actions={<AdminStatusBadge status={order.status}>{STATUS_LABEL[order.status]}</AdminStatusBadge>} />

      <AdminPanel title="Order status" description="Choose the current kitchen or fulfilment state.">
        <div className="admin-status-actions">
          {STATUSES.map((s) => (
            <button
              type="button" key={s} disabled={saving} aria-pressed={(pendingStatus || order.status) === s} onClick={() => setPendingStatus(s === order.status ? null : s)}
              className={`btn btn-sm ${(pendingStatus || order.status) === s ? 'btn-primary' : 'btn-secondary'}`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        {pendingStatus && <div className="admin-save-bar" role="status"><div><strong>Unsaved status change</strong><span>{STATUS_LABEL[order.status]} → {STATUS_LABEL[pendingStatus]}</span></div><button type="button" className="btn btn-secondary btn-sm" onClick={() => setPendingStatus(null)}>Discard</button>{['completed', 'cancelled'].includes(pendingStatus) ? <ConfirmAlertDialog trigger={<button type="button" className="btn btn-primary btn-sm">Review and apply</button>} title={`Mark order as ${STATUS_LABEL[pendingStatus]}?`} description={pendingStatus === 'cancelled' ? 'This removes the order from the active kitchen workflow. Confirm only after the customer and team have been informed.' : 'This closes the order as fulfilled. Confirm that pickup or delivery is complete.'} confirmLabel={`Mark ${STATUS_LABEL[pendingStatus].toLowerCase()}`} destructive={pendingStatus === 'cancelled'} onConfirm={() => updateStatus(pendingStatus)} /> : <button type="button" className="btn btn-primary btn-sm" disabled={saving} onClick={() => updateStatus(pendingStatus)}>{saving ? 'Saving…' : 'Apply status'}</button>}</div>}
      </AdminPanel>

      <AdminPanel title="Items" description={`${order.order_item.length} configured line items`}>
        <div className="admin-order-items">
        {order.order_item.map((it) => (
          <div key={it.id} className="admin-order-item">
            <div>
              <strong>{it.quantity}× {it.product_name_snapshot}</strong>
              {Object.keys(it.variant_selections || {}).length > 0 && (
                <p>
                  {Object.entries(it.variant_selections).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' · ')}
                </p>
              )}
            </div>
            <strong>{fmtLineTotal(it.unit_price, it.quantity)}</strong>
          </div>
        ))}
        </div>
        <div className="admin-order-total">
          <span>Total</span><strong>{fmtNaira(order.total)}</strong>
        </div>
      </AdminPanel>

      <AdminPanel title="Fulfilment" description="Customer timing, destination, and preparation notes.">
        <dl className="admin-detail-list">
          <div><dt>Method</dt><dd>{order.fulfilment_type === 'pickup' ? 'Pickup' : `Delivery — ${order.address_text || 'address pending'}`}</dd></div>
          <div><dt>Preferred time</dt><dd>{order.preferred_date} ({order.preferred_time})</dd></div>
          <div><dt>Notes</dt><dd>{order.special_instructions || 'None supplied'}</dd></div>
          <div><dt>Fallback channel</dt><dd>{order.fallback_channel || 'Online payment'}</dd></div>
        </dl>
      </AdminPanel>

      {order.payment?.length > 0 && (
        <AdminPanel title="Payment" description="Paystack transactions associated with this order.">
          {order.payment.map((p) => (
            <div key={p.id} className="admin-payment-row">
              <div>
                <strong>{p.reference}</strong><span>{p.status} {p.verified_at ? `· verified ${new Date(p.verified_at).toLocaleString()}` : ''}</span>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" disabled={verifying === p.id} aria-busy={verifying === p.id} onClick={() => verifyPayment(p)}>
                {verifying === p.id ? 'Checking...' : 'Verify Paystack'}
              </button>
            </div>
          ))}
        </AdminPanel>
      )}
    </AdminPage>
  );
}
