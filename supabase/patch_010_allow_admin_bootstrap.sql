-- Allow trusted SQL editor/service-role operations to assign the first admin.
-- Signed-in users still cannot modify their own role because auth.uid() is set
-- for normal client requests.

create or replace function prevent_role_escalation() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and not is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;

-- After applying this patch in the Supabase SQL editor, promote the intended
-- account with:
-- update public.customer set role = 'admin' where lower(email) = lower('you@example.com');
