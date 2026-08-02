import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import { toast } from '../components/ui/toast.jsx';
import { ConfirmAlertDialog } from '../components/ui/alert-dialog.jsx';

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

  if (reviews === null) return <div>Loading…</div>;
  const pending = reviews.filter((r) => r.status === 'pending');
  const visibleReviews = statusFilter === 'all' ? reviews : reviews.filter((r) => r.status === statusFilter);

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Reviews</h1>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 20 }}>Moderate reviews before publishing to the storefront.</p>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {['pending', 'published', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className="btn btn-sm"
            style={{
              background: statusFilter === status ? 'var(--color-choc)' : 'var(--color-white)',
              color: statusFilter === status ? 'var(--color-white)' : 'var(--color-choc)',
            }}
          >
            {status === 'all' ? 'All' : status[0].toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 12 }}>Pending Moderation ({pending.length})</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {pending.map((r) => (
          <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product?.name} — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '6px 0' }}>{r.comment}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => moderate(r, 'published')} className="btn btn-primary btn-sm">Publish</button>
              <button onClick={() => moderate(r, 'rejected')} className="btn btn-secondary btn-sm">Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>Nothing waiting on moderation.</div>}
      </div>

      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-olive)', marginBottom: 12 }}>Review Archive</div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {visibleReviews.map((r) => (
          <div key={r.id} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(50,26,23,0.08)', display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{r.product?.name || 'Product'} — {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>{r.comment || 'No comment'}</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: r.status === 'published' ? 'var(--color-olive)' : r.status === 'rejected' ? 'var(--color-error)' : 'var(--color-text-faint)' }}>{r.status}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => moderate(r, 'published')} className="btn btn-secondary btn-sm">Publish</button>
              <button onClick={() => moderate(r, 'pending')} className="btn btn-secondary btn-sm">Hold</button>
              <button onClick={() => moderate(r, 'rejected')} className="btn btn-secondary btn-sm">Reject</button>
              <ConfirmAlertDialog
                trigger={<button type="button" className="btn btn-secondary btn-sm">Delete</button>}
                title="Delete this review?"
                description={`The review for ${r.product?.name || 'this product'} will be permanently removed.`}
                confirmLabel="Delete review"
                onConfirm={() => deleteReview(r)}
              />
            </div>
          </div>
        ))}
        {visibleReviews.length === 0 && <div style={{ padding: 20, color: 'var(--color-text-muted)' }}>No reviews in this view.</div>}
      </div>
    </div>
  );
}
