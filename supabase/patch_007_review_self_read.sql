-- The original "review public read" policy only allowed status='published'
-- or admin — meaning a customer could never see their OWN pending/rejected
-- review, which breaks the "already reviewed this item" check on Order
-- Detail (it would always come back empty for a still-pending review,
-- showing the review form again after every submission).

drop policy if exists "review public read" on review;
create policy "review public read" on review for select
  using (
    status = 'published'
    or is_admin()
    or customer_id in (select id from customer where auth_user_id = auth.uid())
  );
