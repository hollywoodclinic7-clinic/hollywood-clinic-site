-- ════════════════════════════════════════════════════════════════════
--  MIGRATION 001 — align reviews table with the existing review code
--  Run ONCE in Supabase → SQL Editor. Safe: the reviews table is empty.
--  This reshapes columns (name/comment/email/language) to match
--  assets/js/reviews.js and the public reviews page.
-- ════════════════════════════════════════════════════════════════════

drop table if exists public.reviews cascade;

create table public.reviews (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  treatment    text,
  rating       int  not null check (rating between 1 and 5),
  comment      text not null,
  email        text,
  language     text default 'en',
  status       text not null default 'pending'
               check (status in ('pending','approved','rejected')),
  is_featured  boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.reviews enable row level security;

-- Public may submit (forced to 'pending') and read only approved reviews.
create policy reviews_insert_public on public.reviews
  for insert to anon, authenticated with check (status = 'pending');

create policy reviews_select_approved on public.reviews
  for select to anon, authenticated using (status = 'approved');

create policy reviews_admin_all on public.reviews
  for all to authenticated using (is_admin()) with check (is_admin());

create trigger trg_reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

create index idx_reviews_status on public.reviews(status, created_at desc);
