-- ============================================================
-- Hollywood Clinic — nightly analytics snapshot
-- Run once in Supabase → SQL Editor.
-- n8n writes one row per night; /admin/report.html reads it.
-- ============================================================

create table if not exists public.daily_stats (
  stat_date            date primary key,

  -- Google Analytics 4
  ga_users             integer default 0,
  ga_new_users         integer default 0,
  ga_sessions          integer default 0,
  ga_pageviews         integer default 0,
  ga_engagement_rate   numeric(5,2) default 0,
  ga_avg_duration      integer default 0,          -- seconds
  ga_top_pages         jsonb default '[]'::jsonb,  -- [{path,views}]
  ga_sources           jsonb default '[]'::jsonb,  -- [{source,users}]
  ga_devices           jsonb default '[]'::jsonb,  -- [{device,users}]

  -- conversion events (from GA4)
  ev_booking_submitted integer default 0,
  ev_whatsapp_click    integer default 0,
  ev_phone_click       integer default 0,

  -- Google Search Console (lags ~2 days — stat_date is the data date)
  gsc_clicks           integer default 0,
  gsc_impressions      integer default 0,
  gsc_ctr              numeric(5,2) default 0,
  gsc_position         numeric(5,2) default 0,
  gsc_top_queries      jsonb default '[]'::jsonb,  -- [{query,clicks,impressions,position}]
  gsc_top_pages        jsonb default '[]'::jsonb,

  -- indexing health
  idx_indexed          integer default 0,
  idx_not_indexed      integer default 0,

  created_at           timestamptz default now()
);

-- Only signed-in admins may read or write.
alter table public.daily_stats enable row level security;

drop policy if exists "daily_stats admin read" on public.daily_stats;
create policy "daily_stats admin read" on public.daily_stats
  for select to authenticated
  using (exists (select 1 from public.admins a where a.email = auth.jwt() ->> 'email'));

drop policy if exists "daily_stats service write" on public.daily_stats;
create policy "daily_stats service write" on public.daily_stats
  for all to service_role using (true) with check (true);

create index if not exists daily_stats_date_idx on public.daily_stats (stat_date desc);
