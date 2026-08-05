import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';
import { AdminEmpty, AdminLoading, AdminPage, AdminPageHeader, AdminPanel, AdminRecord, AdminRecordList, AdminStatusBadge, AdminToolbar } from './AdminPrimitives.jsx';

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  function load() {
    supabase.from('review').select('*, product(name)').order('created_at', { ascending: false })
      .then(({ data, error }) => setReviews(error ? [] : data));
  }
  useEffect(load, []);

  async function moderate(review, status) {
    await supabase.from('review').update({ status }).eq('id', review.id);
    load();
  }

  async function deleteReview(review) {
    const { error } = await supabase.from('review').delete().eq('id', review.id);
    if (error) toast.error('Review was not deleted', { description: error.message });
    load();
  }

  const pending = reviews?.filter((r) => r.status === 'pending') || [];
  const visibleReviews = reviews ? (statusFilter === 'all' ? reviews : reviews.filter((r) => r.status === statusFilter)) : [];

  return (
    <AdminPage>
      <AdminPageHeader eyebrow="Community" title="Reviews" description="Moderate verified customer feedback before it appears on the storefront." />
      <AdminToolbar className="admin-segmented-control" aria-label="Filter reviews">
        {['pending', 'published', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`btn btn-sm ${statusFilter === status ? 'btn-primary' : 'btn-secondary'}`}
          >
            {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </AdminToolbar>

      {reviews === null ? <AdminLoading label="Loading reviews…" /> : <>
      <AdminPanel title={`Pending moderation (${pending.length})`} description="Publish genuine feedback or reject content that should not appear publicly.">
        {pending.length ? <AdminRecordList>
        {pending.map((r) => (
          <AdminRecord key={r.id}>
            <div className="admin-review__heading"><strong>{r.product?.name || 'Product'}</strong><span aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
            <p className="admin-review__comment">{r.comment || 'No written comment.'}</p>
            <div className="admin-record__actions">
              <button type="button" onClick={() => moderate(r, 'published')} className="btn btn-primary btn-sm">Publish</button>
              <button type="button" onClick={() => moderate(r, 'rejected')} className="btn btn-secondary btn-sm">Reject</button>
            </div>
          </AdminRecord>
        ))}
        </AdminRecordList> : <AdminEmpty>Nothing is waiting for moderation.</AdminEmpty>}
      </AdminPanel>

      <AdminPanel title="Review archive" description={`${visibleReviews.length} reviews in this view`}>
        {visibleReviews.length ? <AdminRecordList>
        {visibleReviews.map((r) => (
          <AdminRecord key={r.id}>
            <div>
              <div className="admin-review__heading"><strong>{r.product?.name || 'Product'}</strong><span aria-label={`${r.rating} out of 5 stars`}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
              <p className="admin-review__comment">{r.comment || 'No written comment.'}</p>
              <AdminStatusBadge status={r.status}>{r.status}</AdminStatusBadge>
            </div>
            <div className="admin-record__actions">
              <button type="button" onClick={() => moderate(r, 'published')} className="btn btn-secondary btn-sm">Publish</button>
              <button type="button" onClick={() => moderate(r, 'pending')} className="btn btn-secondary btn-sm">Hold</button>
              <button type="button" onClick={() => moderate(r, 'rejected')} className="btn btn-secondary btn-sm">Reject</button>
              <ConfirmAlertDialog
                trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                title="Delete this review?"
                description={`The review for ${r.product?.name || 'this product'} will be permanently removed.`}
                confirmLabel="Delete review"
                onConfirm={() => deleteReview(r)}
              />
            </div>
          </AdminRecord>
        ))}
        </AdminRecordList> : <AdminEmpty>No reviews in this view.</AdminEmpty>}
      </AdminPanel>
      </>}
    </AdminPage>
  );
}
