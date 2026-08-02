import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';
import { toast } from '../components/ui/toast.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';

const STATUSES = ['pending', 'confirmed', 'preparing', 'ready_or_out', 'completed', 'cancelled'];
const STATUS_LABEL = {
  pending: 'Pending', confirmed: 'Confirmed', preparing: 'Preparing',
  ready_or_out: 'Ready / out', completed: 'Completed', cancelled: 'Cancelled',
};

export default function OrdersList() {
  const [orders, setOrders] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savingId, setSavingId] = useState(null);

  function load() {
    let query = supabase.from('order').select('*, order_item(id)').order('preferred_date', { ascending: true }).order('created_at', { ascending: false }).limit(300);
    if (dateFrom) query = query.gte('preferred_date', dateFrom);
    if (dateTo) query = query.lte('preferred_date', dateTo);
    query.then(({ data, error }) => setOrders(error ? [] : data));
  }

  useEffect(load, [dateFrom, dateTo]);

  const filtered = useMemo(() => (orders || [])
    .filter((order) => statusFilter === 'all' || order.status === statusFilter)
    .filter((order) => fulfilmentFilter === 'all' || order.fulfilment_type === fulfilmentFilter), [orders, statusFilter, fulfilmentFilter]);

  const counts = useMemo(() => STATUSES.reduce((result, status) => ({
    ...result,
    [status]: (orders || []).filter((order) => order.status === status).length,
  }), {}), [orders]);

  async function updateStatus(order, status) {
    setSavingId(order.id);
    const { error } = await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) toast.error('Order status was not updated', { description: error.message });
    await load();
    setSavingId(null);
  }

  function changeDateFrom(nextDate) {
    setDateFrom(nextDate);
    if (dateTo && nextDate && nextDate > dateTo) setDateTo(nextDate);
  }

  return (
    <AdminPage>
      <AdminPageHeader
        eyebrow="Operations"
        title="Orders"
        description="Filter by kitchen date, fulfilment method, and order state."
        actions={<Button asChild variant="secondary" size="sm"><Link to="/admin"><CalendarDays size={16} aria-hidden="true" />Daily prep</Link></Button>}
      />

      <AdminToolbar>
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></label>
        <label><span>Fulfilment</span><select value={fulfilmentFilter} onChange={(event) => setFulfilmentFilter(event.target.value)}><option value="all">Pickup + delivery</option><option value="pickup">Pickup only</option><option value="delivery">Delivery only</option></select></label>
        <div className="admin-date-field"><span>From</span><DatePicker aria-label="Orders from date" value={dateFrom} max={dateTo || undefined} onChange={changeDateFrom} clearable /></div>
        <div className="admin-date-field"><span>To</span><DatePicker aria-label="Orders to date" value={dateTo} min={dateFrom || undefined} onChange={setDateTo} clearable /></div>
        {(statusFilter !== 'all' || fulfilmentFilter !== 'all' || dateFrom || dateTo) && <button className="admin-clear-button" type="button" onClick={() => { setStatusFilter('all'); setFulfilmentFilter('all'); setDateFrom(''); setDateTo(''); }}>Clear filters</button>}
      </AdminToolbar>

      <div className="admin-filter-stats" aria-label="Order status totals">
        <button type="button" className={statusFilter === 'all' ? 'is-active' : ''} onClick={() => setStatusFilter('all')}><strong>{orders?.length || 0}</strong><span>All</span></button>
        {STATUSES.map((status) => <button key={status} type="button" className={statusFilter === status ? 'is-active' : ''} onClick={() => setStatusFilter(status)}><strong>{counts[status] || 0}</strong><span>{STATUS_LABEL[status]}</span></button>)}
      </div>

      {orders === null ? <AdminLoading label="Loading orders…" /> : (
        <section className="admin-panel admin-panel--table">
          <div className="admin-panel__header"><div><h2>Order queue</h2><p>{filtered.length} order{filtered.length === 1 ? '' : 's'} in this view</p></div></div>
          {filtered.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Items</th><th>Status</th><th className="is-numeric">Total</th></tr></thead><tbody>
            {filtered.map((order) => <tr key={order.id}>
              <td><Link to={`/admin/orders/${order.id}`}><strong>#{order.order_number}</strong></Link><small>{new Date(order.created_at).toLocaleDateString('en-NG')}</small></td>
              <td>{order.customer_name}<small>{order.customer_phone}</small></td>
              <td><strong className="admin-table__primary">{order.fulfilment_type === 'pickup' ? 'Pickup' : 'Delivery'}</strong><small>{order.preferred_date} · {order.preferred_time}</small></td>
              <td>{order.order_item?.length || 0}</td>
              <td><select className="admin-table__select" value={order.status} disabled={savingId === order.id} onChange={(event) => updateStatus(order, event.target.value)} aria-label={`Update order ${order.order_number} status`}>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></td>
              <td className="is-numeric"><strong>{fmtNaira(order.total)}</strong><span className="admin-table__mobile-status"><AdminStatusBadge status={order.status}>{STATUS_LABEL[order.status]}</AdminStatusBadge></span></td>
            </tr>)}
          </tbody></table></div> : <AdminEmpty icon={ClipboardList}>No orders match these filters.</AdminEmpty>}
        </section>
      )}
    </AdminPage>
  );
}
