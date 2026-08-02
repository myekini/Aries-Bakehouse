import { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient.js';
import { fmtNaira } from '../lib/format.js';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';
import { toast } from '../components/ui/toast.jsx';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../components/ui/input-group.jsx';

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState(null);
  const [ordersByCustomer, setOrdersByCustomer] = useState({});
  const [search, setSearch] = useState('');
  const [includeGuests, setIncludeGuests] = useState(false);
  const [savingId, setSavingId] = useState(null);

  function load() {
    let query = supabase.from('customer').select('*').order('created_at', { ascending: false }).limit(300);
    if (!includeGuests) query = query.eq('is_guest', false);
    return Promise.all([
      query,
      supabase.from('order').select('id, customer_id, total, status').limit(1000),
    ]).then(([customerResult, orderResult]) => {
      setCustomers(customerResult.error ? [] : customerResult.data || []);
      const grouped = {};
      for (const order of orderResult.error ? [] : orderResult.data || []) {
        if (!grouped[order.customer_id]) grouped[order.customer_id] = [];
        grouped[order.customer_id].push(order);
      }
      setOrdersByCustomer(grouped);
    });
  }

  useEffect(() => { load(); }, [includeGuests]);

  async function updateCustomer(customer, patch) {
    setSavingId(customer.id);
    const { error } = await supabase.from('customer').update(patch).eq('id', customer.id);
    if (error) toast.error('Customer was not updated', { description: error.message });
    await load();
    setSavingId(null);
  }

  const filtered = useMemo(() => (customers || []).filter((customer) => {
    const query = search.trim().toLowerCase();
    return !query || [customer.name, customer.email, customer.phone].some((value) => (value || '').toLowerCase().includes(query));
  }), [customers, search]);

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
        </section>
      )}
    </AdminPage>
  );
}
