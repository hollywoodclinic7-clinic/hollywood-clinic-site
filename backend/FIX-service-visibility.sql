-- ============================================================
--  FIX: services added in the dashboard are invisible to visitors
--
--  Symptom: you add a service, it looks fine to you (you're signed in
--  as an admin), but a normal visitor sees nothing on the page.
--
--  Cause: the `service_pages` table has row level security switched on,
--  but no policy letting the public read it. Every other table
--  (treatments, doctors, departments, site_content) has one.
--
--  Run this ONCE in Supabase → SQL Editor → New query → Run.
--  Safe to run again.
-- ============================================================

alter table public.service_pages enable row level security;

-- anyone may read a service that is switched on
drop policy if exists service_pages_select_public on public.service_pages;
create policy service_pages_select_public
  on public.service_pages
  for select
  to anon, authenticated
  using (is_active is true);

-- only signed-in staff may create / edit / delete
drop policy if exists service_pages_admin_all on public.service_pages;
create policy service_pages_admin_all
  on public.service_pages
  for all
  to authenticated
  using (true) with check (true);

-- rows with no is_active value would stay hidden — make them explicit
update public.service_pages set is_active = true where is_active is null;


-- ── check it worked ─────────────────────────────────────────
-- 'cmd' should list SELECT for {anon,authenticated}
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'service_pages';
