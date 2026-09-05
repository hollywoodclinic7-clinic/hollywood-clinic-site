-- ════════════════════════════════════════════════════════════════════
--  HOLLYWOOD CLINIC — Supabase schema  (Phase 1: foundation)
--  Run this whole file ONCE in: Supabase → SQL Editor → New query → Run.
--  Safe to re-run: every object uses IF NOT EXISTS / CREATE OR REPLACE.
--
--  Security model (Supabase-direct):
--    • anon  = anyone visiting the public website (not logged in)
--    • authenticated = a logged-in user; is_admin() is TRUE only for
--      staff whose auth.uid() is listed in the admins table.
--    • Public can ONLY insert bookings / contacts / reviews, and read
--      published content. Everything sensitive is admin-only at the DB.
-- ════════════════════════════════════════════════════════════════════

-- ── Helpers ─────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- Admin allow-list. A user is an admin ONLY if their id is in here.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- Admins can see the admin list; nobody else can.
drop policy if exists admins_select on public.admins;
create policy admins_select on public.admins
  for select to authenticated using (user_id = auth.uid());

-- is_admin(): single source of truth used by every other policy.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- auto-update updated_at on any row change
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ════════════════════════════════════════════════════════════════════
--  PUBLIC-FACING DATA   (anon may INSERT; admin manages everything)
-- ════════════════════════════════════════════════════════════════════

-- ── Bookings ────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  full_name       text not null,
  phone           text not null,
  email           text,
  treatment       text,
  preferred_date  date,
  preferred_time  text,
  message         text,
  status          text not null default 'new'
                  check (status in ('new','confirmed','done','cancelled')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.bookings enable row level security;

drop policy if exists bookings_insert_public on public.bookings;
create policy bookings_insert_public on public.bookings
  for insert to anon, authenticated with check (true);

drop policy if exists bookings_admin_all on public.bookings;
create policy bookings_admin_all on public.bookings
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_bookings_touch on public.bookings;
create trigger trg_bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();

-- ── Contact messages ────────────────────────────────────────────────
create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  full_name   text not null,
  phone       text,
  email       text,
  subject     text,
  message     text not null,
  status      text not null default 'new'
              check (status in ('new','read','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.contact_messages enable row level security;

drop policy if exists contacts_insert_public on public.contact_messages;
create policy contacts_insert_public on public.contact_messages
  for insert to anon, authenticated with check (true);

drop policy if exists contacts_admin_all on public.contact_messages;
create policy contacts_admin_all on public.contact_messages
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_contacts_touch on public.contact_messages;
create trigger trg_contacts_touch before update on public.contact_messages
  for each row execute function public.touch_updated_at();

-- ── Reviews / testimonials ──────────────────────────────────────────
-- Public may submit (forced to 'pending') and may read only 'approved'.
create table if not exists public.reviews (
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

drop policy if exists reviews_insert_public on public.reviews;
create policy reviews_insert_public on public.reviews
  for insert to anon, authenticated with check (status = 'pending');

drop policy if exists reviews_select_approved on public.reviews;
create policy reviews_select_approved on public.reviews
  for select to anon, authenticated using (status = 'approved');

drop policy if exists reviews_admin_all on public.reviews;
create policy reviews_admin_all on public.reviews
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_reviews_touch on public.reviews;
create trigger trg_reviews_touch before update on public.reviews
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  CMS CONTENT   (public READS published rows; admin manages)
-- ════════════════════════════════════════════════════════════════════

-- ── Doctors ─────────────────────────────────────────────────────────
create table if not exists public.doctors (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  name_en       text not null,
  name_ar       text,
  specialty_en  text,
  specialty_ar  text,
  bio_en        text,
  bio_ar        text,
  image_url     text,
  department    text,                       -- body | skin | surgical ...
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.doctors enable row level security;

drop policy if exists doctors_select_public on public.doctors;
create policy doctors_select_public on public.doctors
  for select to anon, authenticated using (is_active);

drop policy if exists doctors_admin_all on public.doctors;
create policy doctors_admin_all on public.doctors
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_doctors_touch on public.doctors;
create trigger trg_doctors_touch before update on public.doctors
  for each row execute function public.touch_updated_at();

-- ── Blog posts ──────────────────────────────────────────────────────
create table if not exists public.blog_posts (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  title_en      text not null,
  title_ar      text,
  excerpt_en    text,
  excerpt_ar    text,
  body_en       text,                       -- markdown
  body_ar       text,                       -- markdown
  cover_image_url text,
  is_published  boolean not null default false,
  published_at  timestamptz,
  sort_order    int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.blog_posts enable row level security;

drop policy if exists blog_select_public on public.blog_posts;
create policy blog_select_public on public.blog_posts
  for select to anon, authenticated using (is_published);

drop policy if exists blog_admin_all on public.blog_posts;
create policy blog_admin_all on public.blog_posts
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_blog_touch on public.blog_posts;
create trigger trg_blog_touch before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- ── Treatments (umbrella + sub-treatment cards/pages) ───────────────
create table if not exists public.treatments (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  category      text not null,              -- body-shaping | skin-rejuvenation | hair-restoration | laser | votiva
  parent_slug   text,                       -- null = umbrella page; set = sub-treatment
  name_en       text not null,
  name_ar       text,
  tagline_en    text,
  tagline_ar    text,
  description_en text,
  description_ar text,
  image_url     text,
  page_url      text,                       -- existing detail page; null = generated treatment.html
  sort_order    int  not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.treatments enable row level security;

drop policy if exists treatments_select_public on public.treatments;
create policy treatments_select_public on public.treatments
  for select to anon, authenticated using (is_active);

drop policy if exists treatments_admin_all on public.treatments;
create policy treatments_admin_all on public.treatments
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_treatments_touch on public.treatments;
create trigger trg_treatments_touch before update on public.treatments
  for each row execute function public.touch_updated_at();

-- ── Site content (EN/AR copy overrides keyed like i18n.js) ──────────
-- Frontend merges these on top of the hardcoded TRANSLATIONS so the
-- dashboard can edit "site copy" without touching i18n.js.
create table if not exists public.site_content (
  key         text primary key,            -- e.g. 'cta.title.lead'
  value_en    text,
  value_ar    text,
  updated_at  timestamptz not null default now()
);
alter table public.site_content enable row level security;

drop policy if exists site_content_select_public on public.site_content;
create policy site_content_select_public on public.site_content
  for select to anon, authenticated using (true);

drop policy if exists site_content_admin_all on public.site_content;
create policy site_content_admin_all on public.site_content
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_site_content_touch on public.site_content;
create trigger trg_site_content_touch before update on public.site_content
  for each row execute function public.touch_updated_at();

-- ════════════════════════════════════════════════════════════════════
--  SENSITIVE — PATIENTS & MEDICAL RECORDS   (admin-only, NO public access)
--  No anon policy exists on these tables, so the public website role
--  cannot read or write them under any circumstances.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.patients (
  id            uuid primary key default gen_random_uuid(),
  full_name     text not null,
  phone         text,
  email         text,
  date_of_birth date,
  gender        text,
  address       text,
  notes         text,
  created_by    uuid references auth.users(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
alter table public.patients enable row level security;

drop policy if exists patients_admin_all on public.patients;
create policy patients_admin_all on public.patients
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_patients_touch on public.patients;
create trigger trg_patients_touch before update on public.patients
  for each row execute function public.touch_updated_at();

create table if not exists public.patient_records (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.patients(id) on delete cascade,
  visit_date     date not null default current_date,
  treatment      text,
  doctor         text,
  clinical_notes text,
  attachments    jsonb not null default '[]'::jsonb,  -- [{name,url}]
  created_by     uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.patient_records enable row level security;

drop policy if exists records_admin_all on public.patient_records;
create policy records_admin_all on public.patient_records
  for all to authenticated using (is_admin()) with check (is_admin());

drop trigger if exists trg_records_touch on public.patient_records;
create trigger trg_records_touch before update on public.patient_records
  for each row execute function public.touch_updated_at();

-- ── Indexes ─────────────────────────────────────────────────────────
create index if not exists idx_bookings_status     on public.bookings(status, created_at desc);
create index if not exists idx_contacts_status      on public.contact_messages(status, created_at desc);
create index if not exists idx_reviews_status       on public.reviews(status, created_at desc);
create index if not exists idx_doctors_sort         on public.doctors(sort_order);
create index if not exists idx_blog_pub             on public.blog_posts(is_published, published_at desc);
create index if not exists idx_treatments_cat       on public.treatments(category, parent_slug, sort_order);
create index if not exists idx_records_patient      on public.patient_records(patient_id, visit_date desc);

-- ════════════════════════════════════════════════════════════════════
--  DONE. Next: create your admin user (see SETUP.md step 3), then:
--    insert into public.admins (user_id, email)
--    values ('PASTE-USER-UUID-HERE', 'admin@hollywoodclinic.com');
-- ════════════════════════════════════════════════════════════════════
