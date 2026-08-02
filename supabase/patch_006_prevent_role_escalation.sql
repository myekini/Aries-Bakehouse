-- CRITICAL SECURITY FIX: the "customer self update" policy (schema.sql)
-- only checks row ownership (auth_user_id = auth.uid()), not which columns
-- are being changed — confirmed live that any signed-in user (including an
-- anonymous session) could run:
--   supabase.from('customer').update({ role: 'admin' }).eq('auth_user_id', myId)
-- and successfully self-promote to admin. RLS has no native per-column
-- restriction, so this is fixed with a BEFORE UPDATE trigger that silently
-- reverts any `role` change made by a non-admin back to its previous value
-- — customers can still freely update their own name/email/phone.

create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_role_guard on customer;
create trigger customer_role_guard
  before update on customer
  for each row execute function prevent_role_escalation();
