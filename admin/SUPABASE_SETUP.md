# Supabase Setup for Reviews

This is everything you need to wire up the reviews system. Takes about 10 minutes.

## Step 1 — Create a Supabase project

1. Go to **https://supabase.com** and sign up (free tier — no card needed)
2. Click **"New Project"**
3. Pick a name like `hollywood-clinic-reviews`
4. Generate a strong database password and save it somewhere safe
5. Pick the region closest to your visitors — for Egypt traffic, **Frankfurt (eu-central-1)** is closest
6. Click **Create** — takes ~2 minutes to provision

## Step 2 — Create the `reviews` table

Once your project is ready, click **SQL Editor** in the left sidebar, then **New query**, paste this in, and click **Run**:

```sql
-- ─────────────────────────────────────────────────────────────
-- Hollywood Clinic Reviews schema
-- ─────────────────────────────────────────────────────────────

create table public.reviews (
  id         uuid          default gen_random_uuid() primary key,
  name       text          not null check (char_length(name) between 1 and 60),
  treatment  text          not null check (char_length(treatment) between 1 and 80),
  rating     int           not null check (rating between 1 and 5),
  comment    text          not null check (char_length(comment) between 10 and 1000),
  email      text,
  language   text          default 'en' check (language in ('en','ar')),
  status     text          default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz   default now(),
  updated_at timestamptz   default now()
);

-- Index to speed up listing approved reviews newest-first
create index reviews_approved_idx
  on public.reviews (created_at desc)
  where status = 'approved';

-- ─────────────────────────────────────────────────────────────
-- Row Level Security (RLS) — locks down access
-- ─────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;

-- Anyone (including anon visitors) can INSERT a new pending review
create policy "Anyone can submit a review"
  on public.reviews for insert
  to anon, authenticated
  with check (status = 'pending');

-- Anyone can SELECT only approved reviews
create policy "Anyone can read approved reviews"
  on public.reviews for select
  to anon, authenticated
  using (status = 'approved');

-- Only authenticated users can SEE pending/rejected reviews
create policy "Admins can read all reviews"
  on public.reviews for select
  to authenticated
  using (true);

-- Only authenticated users can UPDATE reviews (i.e. approve/reject)
create policy "Admins can update reviews"
  on public.reviews for update
  to authenticated
  using (true)
  with check (true);
```

Note: **the anon role can read ONLY approved reviews**, and **only authenticated admins can update**. This is enforced at the database level — anyone who tries to bypass the front-end is still blocked.

## Step 3 — Get your API credentials

1. In the left sidebar, click **Project Settings** (gear icon)
2. Click **API**
3. Copy these two values:
   - **Project URL** (e.g. `https://abcdefghij.supabase.co`)
   - **anon public key** (long string starting with `eyJ`)

The anon key is **safe to expose publicly** in your JS — it only allows what the RLS policies above permit.

## Step 4 — Paste credentials into the site

Open `assets/js/reviews.js` and find:

```javascript
const SUPABASE_CONFIG = {
  url: '',     // e.g. 'https://abcdefghij.supabase.co'
  anonKey: ''  // e.g. 'eyJhbGciOiJI...'
};
```

Paste your values in. Save the file. Reviews now work.

## Step 5 — Create your admin account

To approve reviews you need an authenticated account.

1. In Supabase dashboard, click **Authentication** in the left sidebar
2. Click **Users** → **Add user** → **Create new user**
3. Use your real clinic email and a strong password
4. Click **Create**

Now go to `/admin/reviews.html` on your site and log in with that email + password. You'll see pending reviews and can approve or reject each one.

## Step 6 — Test it

1. Open your site, click **"Leave a Review"** on the home page testimonials section
2. Fill it out and submit — it should say "Thank you!"
3. Open `/admin/reviews.html`, log in, you should see the pending review
4. Approve it — refresh the home page, your review now appears in the "Recent Reviews from Our Clients" section

## Recommended optional add-ons

### Spam protection (Cloudflare Turnstile)
Free, no user friction (mostly invisible). Add a Turnstile widget to the review form to block bots. Setup at https://www.cloudflare.com/products/turnstile/

### Daily email digest of new pending reviews
In Supabase: **Database** → **Webhooks** → Create a webhook that posts to your email (or Slack/Discord) whenever a new row is inserted into `reviews`. So you know without checking the admin page.

### Backup / export
In Supabase dashboard: **Database** → **Backups**. Automatic daily backups are included free.

## Free tier limits (as of 2026)

- **500 MB database** — that's about 1 million reviews. Plenty.
- **2 GB bandwidth/month** — the home page reads max 6 reviews per visit, very cheap
- **50,000 monthly active users** — way more than a clinic needs

You won't hit any of these limits.

## Troubleshooting

**"Reviews are temporarily unavailable" message:** The credentials in `reviews.js` aren't filled in or are wrong. Double-check Project Settings → API.

**Form submits but review never appears in admin:** RLS policies might not be set. Re-run the SQL from Step 2.

**Admin login says "Invalid credentials":** Make sure you created the user in Supabase Authentication, not somewhere else.

**Reviews appear in admin but not on home page after approval:** Clear browser cache, or check the browser console for errors.
