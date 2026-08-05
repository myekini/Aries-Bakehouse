import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Banknote,
  ChartNoAxesCombined,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  PackageOpen,
  ShoppingBag,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert.jsx';
import { DatePicker } from '../components/ui/date-picker.jsx';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { ChartContainer, ChartTooltipContent } from '../components/ui/chart.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready_or_out'];
const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready_or_out: 'Ready / out',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_COLORS = ['var(--color-caramel)', 'var(--color-olive)', 'var(--color-cocoa)', 'var(--color-choc)', 'var(--color-text-faint)', 'var(--color-error)'];

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function formatFullDate(value) {
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(`${value}T12:00:00`));
}

function StatusBadge({ status }) {
  return <span className={`admin-status admin-status--${status}`}>{STATUS_LABELS[status] || status}</span>;
}

function MetricCard({ label, value, note, icon: Icon }) {
  return (
    <Card className="admin-metric-card">
      <div className="admin-metric-card__top">
        <span>{label}</span>
        <span className="admin-metric-card__icon"><Icon size={18} aria-hidden="true" /></span>
      </div>
      <strong>{value}</strong>
      <p>{note}</p>
    </Card>
  );
}

export default function DailyPrepView() {
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(dateKey(addDays(today, 1)));
  const [prepOrders, setPrepOrders] = useState(null);
  const [dashboard, setDashboard] = useState({ orders: [], payments: [], productCount: 0, customerCount: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const since = addDays(today, -29);
    since.setHours(0, 0, 0, 0);

    async function loadDashboard() {
      setDashboardLoading(true);
      const [ordersResult, paymentsResult, productsResult, customersResult] = await Promise.all([
        supabase
          .from('order')
          .select('id, order_number, status, fulfilment_type, preferred_date, preferred_time, total, customer_name, created_at')
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('payment')
          .select('id, amount, status, created_at')
          .gte('created_at', since.toISOString())
          .limit(500),
        supabase.from('product').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('customer').select('id', { count: 'exact', head: true }).eq('is_guest', false),
      ]);

      if (cancelled) return;
      const firstError = [ordersResult, paymentsResult, productsResult, customersResult].find((result) => result.error)?.error;
      if (firstError) setError('Some dashboard data could not be loaded. Refresh to try again.');
      setDashboard({
        orders: ordersResult.data || [],
        payments: paymentsResult.data || [],
        productCount: productsResult.count || 0,
        customerCount: customersResult.count || 0,
      });
      setDashboardLoading(false);
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [today]);

  useEffect(() => {
    let cancelled = false;
    // Reset the visible list while a newly selected prep date loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrepOrders(null);
    supabase
      .from('order')
      .select('*, order_item(*)')
      .eq('preferred_date', selectedDate)
      .in('status', ['confirmed', 'preparing'])
      .order('preferred_time')
      .then(({ data, error: prepError }) => {
        if (cancelled) return;
        if (prepError) {
          console.error(prepError);
          setError('The prep list could not be loaded. Refresh to try again.');
          setPrepOrders([]);
          return;
        }
        setPrepOrders(data || []);
      });
    return () => { cancelled = true; };
  }, [selectedDate]);

  async function updateStatus(order, status) {
    const { error: updateError } = await supabase
      .from('order')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    if (updateError) {
      setError('That order status could not be updated. Try again.');
      return;
    }
    setPrepOrders((list) => (list || []).map((item) => (item.id === order.id ? { ...item, status } : item)));
    setDashboard((current) => ({
      ...current,
      orders: current.orders.map((item) => (item.id === order.id ? { ...item, status } : item)),
    }));
  }

  const prepSummary = useMemo(() => {
    if (!prepOrders) return [];
    const map = new Map();
    for (const order of prepOrders) {
      for (const item of order.order_item || []) {
        const key = `${item.product_name_snapshot}|${JSON.stringify(item.variant_selections)}`;
        const existing = map.get(key);
        if (existing) existing.quantity += item.quantity;
        else map.set(key, { key, name: item.product_name_snapshot, quantity: item.quantity });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  }, [prepOrders]);

  const quickDates = useMemo(() => [
    { label: 'Today', date: dateKey(today) },
    { label: 'Tomorrow', date: dateKey(addDays(today, 1)) },
    { label: '+2 days', date: dateKey(addDays(today, 2)) },
    { label: '+3 days', date: dateKey(addDays(today, 3)) },
  ], [today]);

  const chartData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => dateKey(addDays(today, index - 6)));
    return days.map((day) => ({
      day,
      label: formatShortDate(day),
      orders: dashboard.orders.filter((order) => dateKey(new Date(order.created_at)) === day).length,
      revenue: dashboard.payments
        .filter((payment) => dateKey(new Date(payment.created_at)) === day)
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    }));
  }, [dashboard.orders, dashboard.payments, today]);

  const statusData = useMemo(() => Object.entries(STATUS_LABELS)
    .map(([status, name]) => ({ name, status, value: dashboard.orders.filter((order) => order.status === status).length }))
    .filter((item) => item.value > 0), [dashboard.orders]);

  const openOrders = useMemo(() => dashboard.orders
    .filter((order) => ACTIVE_STATUSES.includes(order.status))
    .sort((a, b) => new Date(a.preferred_date) - new Date(b.preferred_date))
    .slice(0, 6), [dashboard.orders]);

  const revenue = dashboard.payments.filter((payment) => payment.status === 'success').reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const openOrderCount = dashboard.orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length;
  const totalPrepItems = prepSummary.reduce((sum, item) => sum + item.quantity, 0);
  const taskCounts = {
    pending: dashboard.orders.filter((order) => order.status === 'pending').length,
    kitchen: dashboard.orders.filter((order) => ['confirmed', 'preparing'].includes(order.status)).length,
    ready: dashboard.orders.filter((order) => order.status === 'ready_or_out').length,
    payment: dashboard.payments.filter((payment) => ['failed', 'pending'].includes(payment.status)).length,
  };

  return (
    <div className="admin-dashboard">
      <div className="admin-page-header">
        <div>
          <p className="admin-page-header__eyebrow">Operations overview</p>
          <h1>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}</h1>
          <p>Start with the orders that need a decision, then move into today’s kitchen run.</p>
        </div>
        <Button asChild variant="secondary" className="admin-page-header__action">
          <Link to="/admin/orders">View all orders <ArrowRight size={16} aria-hidden="true" /></Link>
        </Button>
      </div>

      {error && <Alert variant="destructive"><CircleAlert size={18} aria-hidden="true" /><AlertTitle>Dashboard data is incomplete</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}

      <section className="admin-action-board" aria-labelledby="action-board-title">
        <div className="admin-action-board__header"><div><h2 id="action-board-title">What needs attention</h2><p>Live operational queues, ordered by the next staff action.</p></div><span>{openOrderCount} open orders</span></div>
        <div className="admin-action-board__grid">
          <Link to="/admin/orders?status=pending"><span>Confirm next</span><strong>{dashboardLoading ? '—' : taskCounts.pending}</strong><small>Review order details and payment</small><ArrowRight size={17} aria-hidden="true" /></Link>
          <Link to="/admin/orders?status=kitchen"><span>In the kitchen</span><strong>{dashboardLoading ? '—' : taskCounts.kitchen}</strong><small>Confirmed or being prepared</small><ArrowRight size={17} aria-hidden="true" /></Link>
          <Link to="/admin/orders?status=ready_or_out"><span>Ready for handoff</span><strong>{dashboardLoading ? '—' : taskCounts.ready}</strong><small>Pickup or delivery is next</small><ArrowRight size={17} aria-hidden="true" /></Link>
          <Link to="/admin/payments"><span>Payment check</span><strong>{dashboardLoading ? '—' : taskCounts.payment}</strong><small>Pending or failed transactions</small><ArrowRight size={17} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="admin-metrics" aria-label="Store metrics" aria-busy={dashboardLoading}>
        <MetricCard label="Revenue" value={dashboardLoading ? '—' : fmtNaira(revenue)} note="Successful payments, last 30 days" icon={Banknote} />
        <MetricCard label="Open orders" value={dashboardLoading ? '—' : openOrderCount} note="Orders needing attention" icon={ShoppingBag} />
        <MetricCard label="Active products" value={dashboardLoading ? '—' : dashboard.productCount} note="Currently visible in the store" icon={PackageOpen} />
        <MetricCard label="Customers" value={dashboardLoading ? '—' : dashboard.customerCount} note="Registered accounts" icon={Users} />
      </section>

      <section className="admin-dashboard-grid" aria-label="Performance overview">
        <Card className="admin-panel admin-panel--wide">
          <div className="admin-panel__header">
            <div>
              <h2>Orders and revenue</h2>
              <p>Daily activity over the last seven days</p>
            </div>
            <span className="admin-panel__icon"><ChartNoAxesCombined size={18} aria-hidden="true" /></span>
          </div>
          <ChartContainer>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-faint)', fontSize: 11 }} />
                <YAxis yAxisId="orders" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-faint)', fontSize: 11 }} />
                <YAxis yAxisId="revenue" hide orientation="right" />
                <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--color-cream) 60%, transparent)' }} content={<ChartTooltipContent valueFormatter={(value, entry) => entry.dataKey === 'revenue' ? fmtNaira(value) : value} />} />
                <Bar yAxisId="orders" dataKey="orders" name="Orders" fill="var(--color-olive)" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar yAxisId="revenue" dataKey="revenue" name="Revenue" fill="var(--color-caramel)" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="admin-chart-legend" aria-hidden="true">
            <span><i style={{ background: 'var(--color-olive)' }} />Orders</span>
            <span><i style={{ background: 'var(--color-caramel)' }} />Revenue</span>
          </div>
        </Card>

        <Card className="admin-panel">
          <div className="admin-panel__header">
            <div>
              <h2>Order status</h2>
              <p>Last 30 days</p>
            </div>
          </div>
          {statusData.length ? (
            <div className="admin-status-chart">
              <ChartContainer className="admin-status-chart__plot">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
                      {statusData.map((entry, index) => <Cell key={entry.status} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
              <div className="admin-status-chart__legend">
                {statusData.map((entry, index) => (
                  <div key={entry.status}>
                    <span><i style={{ background: STATUS_COLORS[index % STATUS_COLORS.length] }} />{entry.name}</span>
                    <strong>{entry.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="admin-empty">No order activity yet.</div>}
        </Card>
      </section>

      <section className="admin-panel admin-panel--table admin-recent-orders">
        <div className="admin-panel__header">
          <div>
            <h2>Orders needing attention</h2>
            <p>Open orders sorted by fulfilment date</p>
          </div>
          <Link to="/admin/orders" className="admin-text-link">All orders <ArrowRight size={15} aria-hidden="true" /></Link>
        </div>
        {openOrders.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Status</th><th className="is-numeric">Total</th></tr></thead>
              <tbody>
                {openOrders.map((order) => (
                  <tr key={order.id}>
                    <td><Link to={`/admin/orders/${order.id}`}><strong>#{order.order_number}</strong></Link></td>
                    <td>{order.customer_name}</td>
                    <td>{formatShortDate(order.preferred_date)} · {order.preferred_time}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td className="is-numeric"><strong>{fmtNaira(order.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="admin-empty"><CheckCircle2 size={22} aria-hidden="true" />No open orders need attention.</div>}
      </section>

      <section className="admin-prep-section">
        <div className="admin-page-header admin-page-header--section">
          <div>
            <p className="admin-page-header__eyebrow">Kitchen workflow</p>
            <h2>Daily prep</h2>
            <p>Confirmed and preparing orders grouped into a production list.</p>
          </div>
          <div className="admin-date-picker">
            <DatePicker aria-label="Prep date" value={selectedDate} onChange={setSelectedDate} displayFormat="EEE, d MMM yyyy" />
          </div>
        </div>

        <div className="admin-date-tabs" aria-label="Choose prep date">
          {quickDates.map((option) => (
            <button key={option.date} type="button" className={selectedDate === option.date ? 'is-active' : ''} onClick={() => setSelectedDate(option.date)}>
              {option.label}<span>{formatShortDate(option.date)}</span>
            </button>
          ))}
        </div>

        {prepOrders === null ? (
          <div className="admin-loading">Loading prep list…</div>
        ) : prepOrders.length === 0 ? (
          <div className="admin-empty admin-empty--large"><ClipboardList size={24} aria-hidden="true" />No confirmed prep for {formatFullDate(selectedDate)}.</div>
        ) : (
          <div className="admin-prep-grid">
            <Card className="admin-panel admin-prep-summary">
              <div className="admin-panel__header">
                <div><h3>Production list</h3><p>{totalPrepItems} item{totalPrepItems === 1 ? '' : 's'} across {prepOrders.length} order{prepOrders.length === 1 ? '' : 's'}</p></div>
              </div>
              <div className="admin-prep-summary__list">
                {prepSummary.map((item) => (
                  <div key={item.key}><span>{item.name}</span><strong>{item.quantity}</strong></div>
                ))}
              </div>
            </Card>

            <Card className="admin-panel admin-panel--table">
              <div className="admin-panel__header"><div><h3>Prep orders</h3><p>{formatFullDate(selectedDate)}</p></div></div>
              <div className="admin-prep-orders">
                {prepOrders.map((order) => (
                  <article className="admin-prep-order" key={order.id}>
                    <div className="admin-prep-order__main">
                      <div>
                        <Link to={`/admin/orders/${order.id}`}>#{order.order_number}</Link>
                        <span>{order.customer_name} · {order.fulfilment_type === 'pickup' ? 'Pickup' : 'Delivery'} · {order.preferred_time}</span>
                      </div>
                      <strong>{fmtNaira(order.total)}</strong>
                    </div>
                    <p>{(order.order_item || []).map((item) => `${item.quantity}× ${item.product_name_snapshot}`).join(', ')}</p>
                    <div className="admin-prep-order__actions">
                      <StatusBadge status={order.status} />
                      <button type="button" disabled={order.status === 'preparing'} onClick={() => updateStatus(order, 'preparing')}>Preparing</button>
                      <button type="button" onClick={() => updateStatus(order, 'ready_or_out')}>Ready / out</button>
                      <ConfirmAlertDialog trigger={<button type="button">Complete</button>} title={`Complete order #${order.order_number}?`} description="Confirm that pickup or delivery has finished. The order will leave the active kitchen queue." confirmLabel="Complete order" destructive={false} onConfirm={() => updateStatus(order, 'completed')} />
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
