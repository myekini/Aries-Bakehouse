import { useEffect, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';
import { toast } from '../components/ui/toast.jsx';
import { Button } from '../components/ui/button.jsx';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../components/ui/input-group.jsx';

// "Load more" page size — a hard .limit(300)/.limit(1000) with no way to
// see anything past it would otherwise silently hide customers/orders as
// the customer base grows past that number.
const PAGE_SIZE = 50;

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [ordersByCustomer, setOrdersByCustomer] = useState({});
  const [search, setSearch] = useState('');
  const [includeGuests, setIncludeGuests] = useState(false);
  const [savingId, setSavingId] = useState(null);

  function baseQuery() {
    let query = supabase.from('customer').select('*').order('created_at', { ascending: false });
    if (!includeGuests) query = query.eq('is_guest', false);
    const term = search.trim();
    if (term) query = query.or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`);
    return query;
  }

  // Orders are fetched only for the customer rows actually on screen
  // (.in on the loaded page's ids), not the whole order table — this stays
  // cheap no matter how large the order history grows.
  function loadOrdersFor(customerRows) {
    const ids = customerRows.map((c) => c.id);
    if (!ids.length) return Promise.resolve({});
    return supabase.from('order').select('id, customer_id, total, status').in('customer_id', ids).then(({ data, error }) => {
      const grouped = {};
      for (const order of error ? [] : data || []) {
        if (!grouped[order.customer_id]) grouped[order.customer_id] = [];
        grouped[order.customer_id].push(order);
      }
      return grouped;
    });
  }

  function load() {
    baseQuery().range(0, PAGE_SIZE - 1).then(async ({ data, error }) => {
      const rows = error ? [] : data || [];
      setCustomers(rows);
      setHasMore(!error && rows.length === PAGE_SIZE);
      setOrdersByCustomer(await loadOrdersFor(rows));
    });
  }

  function loadMore() {
    setLoadingMore(true);
    baseQuery().range(customers.length, customers.length + PAGE_SIZE - 1).then(async ({ data, error }) => {
      if (!error) {
        const nextRows = data || [];
        const moreOrders = await loadOrdersFor(nextRows);
        setCustomers((prev) => [...prev, ...nextRows]);
        setOrdersByCustomer((prev) => ({ ...prev, ...moreOrders }));
        setHasMore(nextRows.length === PAGE_SIZE);
      }
      setLoadingMore(false);
    });
  }

  useEffect(() => { load(); }, [includeGuests, search]);

  async function updateCustomer(customer, patch) {
    setSavingId(customer.id);
    const { error } = await supabase.from('customer').update(patch).eq('id', customer.id);
    if (error) toast.error('Customer was not updated', { description: error.message });
    await load();
    setSavingId(null);
  }

  const filtered = customers || [];

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Operations" title="Customers" description="Registered accounts are shown by default. Include guest records when tracing website orders." />

      <AdminToolbar>
        <label className="admin-search-field"><span>Search</span><InputGroup><InputGroupInput type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, or phone" /><InputGroupAddon><Search size={16} aria-hidden="true" /></InputGroupAddon></InputGroup></label>
        <label className="admin-switch"><input type="checkbox" checked={includeGuests} onChange={(event) => setIncludeGuests(event.target.checked)} /><span aria-hidden="true" /><strong>Include guests</strong></label>
      </AdminToolbar>

      {customers === null ? <AdminLoading label="Loading customers…" /> : (
        <section className="admin-panel admin-panel--table">
          <div className="admin-panel__header"><div><h2>Customer directory</h2><p>{filtered.length} record{filtered.length === 1 ? '' : 's'} in this view</p></div></div>
          {filtered.length ? <div className="admin-table-wrap"><table className="admin-table admin-customer-table"><thead><tr><th>Customer</th><th>Contact</th><th>Orders</th><th>Total spent</th><th>Type</th><th>Role</th></tr></thead><tbody>
            {filtered.map((customer) => {
              const customerOrders = ordersByCustomer[customer.id] || [];
              return <tr key={customer.id}>
                <td><input className="admin-table__input" defaultValue={customer.name || ''} placeholder="Add name" onBlur={(event) => event.target.value !== (customer.name || '') && updateCustomer(customer, { name: event.target.value || null })} /><small>Joined {new Date(customer.created_at).toLocaleDateString('en-NG')}</small></td>
                <td><input className="admin-table__input" type="email" defaultValue={customer.email || ''} placeholder="Add email" onBlur={(event) => event.target.value !== (customer.email || '') && updateCustomer(customer, { email: event.target.value || null })} /><input className="admin-table__input" type="tel" defaultValue={customer.phone || ''} placeholder="Add phone" onBlur={(event) => event.target.value !== (customer.phone || '') && updateCustomer(customer, { phone: event.target.value || null })} /></td>
                <td>{customerOrders.length}</td>
                <td><strong>{fmtNaira(customerOrders.reduce((sum, order) => sum + (order.total || 0), 0))}</strong></td>
                <td><AdminStatusBadge status={customer.is_guest ? 'inactive' : 'active'}>{customer.is_guest ? 'Guest' : 'Account'}</AdminStatusBadge></td>
                <td><select className="admin-table__select" value={customer.role} disabled={savingId === customer.id} onChange={(event) => updateCustomer(customer, { role: event.target.value })} aria-label={`${customer.name || 'Customer'} role`}><option value="customer">Customer</option><option value="admin">Admin</option></select></td>
              </tr>;
            })}
          </tbody></table></div> : <AdminEmpty icon={Users}>No customers match this view.</AdminEmpty>}
          {hasMore && <div className="admin-panel__footer"><Button variant="secondary" size="sm" disabled={loadingMore} onClick={loadMore}>{loadingMore ? 'Loading…' : 'Load more customers'}</Button></div>}
        </section>
      )}
    </AdminPage>
  );
}
