-- analytics_event and newsletter_signup both have `insert with check (true)`
-- RLS policies (anonymous visitors need to write them), which left them
-- open to unlimited flooding. Adds a coarse same-database backstop via
-- triggers, plus a basic email-format check on newsletter_signup. Real
-- volumetric-abuse protection (distributed floods) belongs at the edge
-- (e.g. Vercel Firewall rate limiting), not here — this only raises the
-- bar against a single runaway client.

alter table newsletter_signup
  add constraint newsletter_signup_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');

create index if not exists analytics_event_session_created_idx on analytics_event (session_id, created_at);
create index if not exists newsletter_signup_created_idx on newsletter_signup (created_at);

-- SECURITY DEFINER so the count query bypasses RLS (the inserting role —
-- anon/authenticated — has no SELECT policy on either table); without
-- that the count would always read as zero and the limit would never fire.
create or replace function enforce_analytics_event_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.session_id is not null and (
    select count(*) from analytics_event
    where session_id = new.session_id and created_at > now() - interval '1 minute'
  ) >= 60 then
    raise exception 'rate limit exceeded — too many analytics events from this session';
  end if;
  return new;
end;
$$;

drop trigger if exists analytics_event_rate_limit on analytics_event;
create trigger analytics_event_rate_limit
  before insert on analytics_event
  for each row execute function enforce_analytics_event_rate_limit();

create or replace function enforce_newsletter_signup_rate_limit() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (
    select count(*) from newsletter_signup where created_at > now() - interval '1 minute'
  ) >= 20 then
    raise exception 'rate limit exceeded — too many newsletter signups right now, try again shortly';
  end if;
  return new;
end;
$$;

drop trigger if exists newsletter_signup_rate_limit on newsletter_signup;
create trigger newsletter_signup_rate_limit
  before insert on newsletter_signup
  for each row execute function enforce_newsletter_signup_rate_limit();
