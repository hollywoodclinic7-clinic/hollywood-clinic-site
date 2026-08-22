-- ════════════════════════════════════════════════════════════════════
-- HOLLYWOOD CLINIC — "Add Service" feature
-- Adds a service_pages table that holds the FULL premium-page content
-- (all bilingual sections as JSON) plus a public storage bucket for the
-- images the admin uploads. Run this in the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════

create table if not exists public.service_pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,                 -- url slug, e.g. "prp-hair"
  category      text not null,                        -- body-shaping | skin-rejuvenation | hair-restoration | votiva | laser
  name_en       text not null,
  name_ar       text,
  hero_image_url text,
  content       jsonb not null default '{}'::jsonb,   -- the whole bilingual page (see service-page.js)
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.service_pages enable row level security;

-- Anyone can read active services (the public dynamic page needs this)
drop policy if exists service_pages_select_public on public.service_pages;
create policy service_pages_select_public on public.service_pages
  for select to anon, authenticated using (is_active);

-- Only admins can create / edit / delete
drop policy if exists service_pages_admin_all on public.service_pages;
create policy service_pages_admin_all on public.service_pages
  for all to authenticated using (is_admin()) with check (is_admin());

-- keep updated_at fresh (re-uses the existing helper)
drop trigger if exists trg_service_pages_touch on public.service_pages;
create trigger trg_service_pages_touch before update on public.service_pages
  for each row execute function public.touch_updated_at();

-- ───────────────────────────── Storage ─────────────────────────────
-- Public bucket for service images (hero, before/after, gallery).
insert into storage.buckets (id, name, public)
values ('service-images', 'service-images', true)
on conflict (id) do nothing;

-- Public read
drop policy if exists "service-images public read" on storage.objects;
create policy "service-images public read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'service-images');

-- Admin upload / update / delete
drop policy if exists "service-images admin write" on storage.objects;
create policy "service-images admin write" on storage.objects
  for all to authenticated
  using (bucket_id = 'service-images' and public.is_admin())
  with check (bucket_id = 'service-images' and public.is_admin());
