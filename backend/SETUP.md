# Hollywood Clinic — Backend Setup (Phase 1)

This sets up the database. The dashboard UI comes next, but it needs these
steps done first.

---

## 1. Create the Supabase project
- Go to https://supabase.com → **New project**.
- For real **patient/medical records**, choose a **paid plan** (not Free) and
  a region close to Egypt (e.g. EU/Frankfurt). Free is fine only for testing.
- Set a strong database password and save it.

## 2. Run the schema
- Open **SQL Editor → New query**.
- Paste the entire contents of `schema.sql` and click **Run**.
- You should see "Success. No rows returned." That's correct — it builds the
  tables and security rules.

## 3. Create your admin login
- Go to **Authentication → Users → Add user**.
- Enter your email + a strong password. (Repeat for each staff member later.)
- **Turn on MFA:** Authentication → Providers/Policies → enable MFA, then add
  it on your own account. Do this before storing any real patient data.

## 4. Mark that user as an admin
- Go to **Authentication → Users**, click your user, copy the **User UID**.
- Back in **SQL Editor**, run (replace the UUID and email):
  ```sql
  insert into public.admins (user_id, email)
  values ('PASTE-USER-UUID-HERE', 'you@hollywoodclinic.com');
  ```
- Only users listed in this `admins` table can read bookings, patients, or
  manage content. Everyone else (the public site) can only submit forms.

## 5. Connect the website
- Go to **Settings → API**. Copy:
  - **Project URL**
  - **anon public** key  ← this one is safe in the website
- Open `supabase-config.js` and paste both into the two placeholders at top.
- ⚠️ **Never** copy the **service_role** key into the website or send it to
  anyone. It bypasses all security.

## 6. Test
- Put `supabase-config.js` somewhere the site can load it (e.g.
  `assets/js/supabase-config.js`) and add `<script src=".../supabase-config.js">`.
- Open the site, then in the browser console run:
  ```js
  HC.db.from('bookings').insert({ full_name:'Test', phone:'0100', treatment:'Botox' })
    .then(console.log)
  ```
- It should succeed. Then try `HC.db.from('bookings').select('*')` **while
  logged out** — it should return an empty list (public can't read bookings).
  That confirms the security rules work.

---

## What's protected, at a glance

| Table | Public can… | Admin can… |
|---|---|---|
| bookings | insert only | read / update status / delete |
| contact_messages | insert only | read / archive / delete |
| reviews | submit (pending) + read approved | approve / feature / delete |
| doctors, blog_posts, treatments | read published | full edit |
| site_content | read | edit EN/AR copy |
| **patients, patient_records** | **nothing** | full edit |

Patient tables have **no public access whatsoever** — only logged-in admins,
enforced at the database, not in the page.

---

## Security reminders for patient data
- Paid plan + MFA on every staff login.
- Don't store more than the clinic actually needs.
- Get patient consent before storing health data (Egypt Law 151/2020 treats
  it as sensitive). I'm not a lawyer — confirm specifics with one.
- Supabase offers a HIPAA add-on if you ever need formal compliance.

Once steps 1–5 are done, tell me and I'll build the **admin login + dashboard**
(bookings, contacts, reviews first), then the CMS and patient modules.

---

# Phase 2 — Admin Dashboard (do these 3 things)

You've already created the project, run the schema, made your admin user, and
marked yourself admin. To turn the dashboard on:

### A. Run the reviews migration
- **SQL Editor → New query** → paste all of `backend/migration.sql` → **Run**.
- This reshapes the (empty) reviews table so the review form + dashboard agree.

### B. Paste your anon key (one place, one time)
- **Settings → API Keys** → copy the **anon / publishable** key.
- Open `assets/js/supabase-config.js` and replace `PASTE-YOUR-ANON-PUBLIC-KEY-HERE`
  with it. The Project URL is already filled in.
- This one file powers the booking form, contact form, reviews, AND the dashboard.

### C. Open the dashboard
- Go to `admin/login.html` (e.g. `.../hollywood-clinic-site/admin/login.html`).
- Sign in with the staff email + password from step 3.
- You'll land on the dashboard: Bookings, Messages, Reviews — live.

### Test the full loop
1. Open `booking.html`, submit a test booking.
2. Open `admin/login.html`, sign in.
3. The booking appears under **Bookings → New**. ✅

The dashboard is `noindex` and only opens for users in the `admins` table —
Google won't list it and non-admins can't read the data even if they find the URL.
