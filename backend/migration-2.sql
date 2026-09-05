-- ════════════════════════════════════════════════════════════════════
--  MIGRATION 002 — richer doctor fields + generated doctor pages
--  Run ONCE in Supabase → SQL Editor.
-- ════════════════════════════════════════════════════════════════════
alter table public.doctors add column if not exists tagline_en     text;
alter table public.doctors add column if not exists tagline_ar     text;
alter table public.doctors add column if not exists credentials_en text;  -- one per line
alter table public.doctors add column if not exists credentials_ar text;  -- one per line
-- page_url: set = use the existing hand-built page; null = use the
-- auto-generated profile page (doctors/profile.html?slug=...).
alter table public.doctors add column if not exists page_url       text;

-- Keep your 7 original doctors pointing at their existing rich pages.
update public.doctors set page_url = 'doctors/' || slug || '.html'
 where slug in ('dr-sara-abdelhameed','dr-rana-ibrahim-sultan','dr-ehssan-rabie',
                'dr-rana-safwat','dr-marwa-magdy','dr-nesma-samir','dr-hadeel-hanee')
   and page_url is null;
