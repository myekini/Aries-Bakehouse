import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardList } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
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

// Page size for the "Load more" pattern below — a hard .limit(300) with no
// way to see anything past it would otherwise silently hide older/newer
// orders as order volume grows past that number.
const PAGE_SIZE = 50;

export default function OrdersList() {
  const [params] = useSearchParams();
  const [orders, setOrders] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestedStatus = params.get('status');
  const [statusFilter, setStatusFilter] = useState([...STATUSES, 'kitchen'].includes(requestedStatus) ? requestedStatus : 'all');
  const [fulfilmentFilter, setFulfilmentFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [counts, setCounts] = useState({});
  const [statusDrafts, setStatusDrafts] = useState({});

  function baseQuery() {
    let query = supabase.from('order').select('*, order_item(id)').order('preferred_date', { ascending: true }).order('created_at', { ascending: false });
    if (statusFilter === 'kitchen') query = query.in('status', ['confirmed', 'preparing']);
    else if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (fulfilmentFilter !== 'all') query = query.eq('fulfilment_type', fulfilmentFilter);
    if (dateFrom) query = query.gte('preferred_date', dateFrom);
    if (dateTo) query = query.lte('preferred_date', dateTo);
    return query;
  }

  function load() {
    baseQuery().range(0, PAGE_SIZE - 1).then(({ data, error }) => {
      setOrders(error ? [] : data);
      setHasMore(!error && data.length === PAGE_SIZE);
    });
  }

  function loadMore() {
    setLoadingMore(true);
    baseQuery().range(orders.length, orders.length + PAGE_SIZE - 1).then(({ data, error }) => {
      if (!error) {
        setOrders((prev) => [...prev, ...data]);
        setHasMore(data.length === PAGE_SIZE);
      }
      setLoadingMore(false);
    });
  }

  // Status counts respect the date/fulfilment filters but not the status
  // filter itself, so the tally row stays a full breakdown to click into —
  // count-only queries (head: true) so this scales regardless of how many
  // orders exist, unlike deriving counts from a capped/paged fetch.
  function loadCounts() {
    let base = supabase.from('order').select('id', { count: 'exact', head: true });
    if (fulfilmentFilter !== 'all') base = base.eq('fulfilment_type', fulfilmentFilter);
    if (dateFrom) base = base.gte('preferred_date', dateFrom);
    if (dateTo) base = base.lte('preferred_date', dateTo);
    Promise.all([
      base,
      ...STATUSES.map((status) => {
        let q = supabase.from('order').select('id', { count: 'exact', head: true }).eq('status', status);
        if (fulfilmentFilter !== 'all') q = q.eq('fulfilment_type', fulfilmentFilter);
        if (dateFrom) q = q.gte('preferred_date', dateFrom);
        if (dateTo) q = q.lte('preferred_date', dateTo);
        return q;
      }),
    ]).then(([all, ...perStatus]) => {
      setCounts({
        all: all.count || 0,
        ...Object.fromEntries(STATUSES.map((status, i) => [status, perStatus[i].count || 0])),
      });
    });
  }

  useEffect(load, [dateFrom, dateTo, statusFilter, fulfilmentFilter]);
  useEffect(loadCounts, [dateFrom, dateTo, fulfilmentFilter]);

  const filtered = orders || [];

  async function updateStatus(order, status) {
    setSavingId(order.id);
    const { error } = await supabase.from('order').update({ status, updated_at: new Date().toISOString() }).eq('id', order.id);
    if (error) toast.error('Order status was not updated', { description: error.message });
    else toast.success(`Order #${order.order_number} updated`, { description: `Status changed to ${STATUS_LABEL[status]}.` });
    await load();
    await loadCounts();
    setStatusDrafts((current) => { const next = { ...current }; delete next[order.id]; return next; });
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
        <label><span>Status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="kitchen">Confirmed + preparing</option>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select></label>
        <label><span>Fulfilment</span><select value={fulfilmentFilter} onChange={(event) => setFulfilmentFilter(event.target.value)}><option value="all">Pickup + delivery</option><option value="pickup">Pickup only</option><option value="delivery">Delivery only</option></select></label>
        <div className="admin-date-field"><span>From</span><DatePicker aria-label="Orders from date" value={dateFrom} max={dateTo || undefined} onChange={changeDateFrom} clearable /></div>
        <div className="admin-date-field"><span>To</span><DatePicker aria-label="Orders to date" value={dateTo} min={dateFrom || undefined} onChange={setDateTo} clearable /></div>
        {(statusFilter !== 'all' || fulfilmentFilter !== 'all' || dateFrom || dateTo) && <button className="admin-clear-button" type="button" onClick={() => { setStatusFilter('all'); setFulfilmentFilter('all'); setDateFrom(''); setDateTo(''); }}>Clear filters</button>}
      </AdminToolbar>

      <div className="admin-task-views" aria-label="Operational order views">
        <button type="button" className={statusFilter === 'pending' ? 'is-active' : ''} onClick={() => setStatusFilter('pending')}><span>Needs confirmation</span><strong>{counts.pending || 0}</strong><small>Review details and payment</small></button>
        <button type="button" className={statusFilter === 'kitchen' ? 'is-active' : ''} onClick={() => setStatusFilter('kitchen')}><span>In the kitchen</span><strong>{(counts.confirmed || 0) + (counts.preparing || 0)}</strong><small>Confirmed and preparing</small></button>
        <button type="button" className={statusFilter === 'ready_or_out' ? 'is-active' : ''} onClick={() => setStatusFilter('ready_or_out')}><span>Ready for handoff</span><strong>{counts.ready_or_out || 0}</strong><small>Pickup or delivery next</small></button>
      </div>

      <div className="admin-filter-stats" aria-label="Order status totals">
        <button type="button" className={statusFilter === 'all' ? 'is-active' : ''} onClick={() => setStatusFilter('all')}><strong>{counts.all || 0}</strong><span>All</span></button>
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
              <td><div className="admin-status-editor"><select className="admin-table__select" value={statusDrafts[order.id] ?? order.status} disabled={savingId === order.id} onChange={(event) => setStatusDrafts((current) => ({ ...current, [order.id]: event.target.value }))} aria-label={`Choose order ${order.order_number} status`}>{STATUSES.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}</select>{statusDrafts[order.id] && statusDrafts[order.id] !== order.status && <div className="admin-status-editor__actions"><button type="button" disabled={savingId === order.id} onClick={() => updateStatus(order, statusDrafts[order.id])}>{savingId === order.id ? 'Saving…' : 'Apply'}</button><button type="button" onClick={() => setStatusDrafts((current) => { const next = { ...current }; delete next[order.id]; return next; })}>Discard</button></div>}</div></td>
              <td className="is-numeric"><strong>{fmtNaira(order.total)}</strong><span className="admin-table__mobile-status"><AdminStatusBadge status={order.status}>{STATUS_LABEL[order.status]}</AdminStatusBadge></span></td>
            </tr>)}
          </tbody></table></div> : <AdminEmpty icon={ClipboardList}>No orders match these filters.</AdminEmpty>}
          {hasMore && <div className="admin-panel__footer"><Button variant="secondary" size="sm" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading…' : 'Load more orders'}</Button></div>}
        </section>
      )}
    </AdminPage>
  );
}
