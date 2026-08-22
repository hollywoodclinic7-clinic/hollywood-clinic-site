# Hollywood Clinic — Auto‑Blog SEO System

Publishes **3 bilingual (EN + AR) SEO articles per day** into your Supabase blog.
Each article is a **live, crawlable page** that Google can index, but it is **hidden from your main Blog list**, so visitors browsing the site don't see a wall of posts. Nothing is written to your code — only to the live database.

After the one‑time setup below, it runs **on its own**.

---

## What's included
| File | What it does |
|---|---|
| `backend/migration-blog-hidden.sql` | Adds the `hidden` + `source` columns to `blog_posts` |
| `blog.html` (updated) | Skips `hidden` articles in the Blog list (their pages still open) |
| `api/sitemap-blog.js` + `vercel.json` | Dynamic sitemap at `/blog-sitemap.xml` so Google finds the articles |
| `robots.txt` (updated) | Points Google to both sitemaps |
| `seo-autoblog/autoblog.py` | The engine: writes one article with Claude → publishes to Supabase |

---

## One‑time setup (~15 minutes)

### 1. Database
In **Supabase → SQL Editor**, run `backend/migration-blog-hidden.sql`.

### 2. Deploy the site
Push this build to Vercel (`git add -A`, commit, push). This ships the sitemap function, the Blog‑list exclusion, and robots/sitemap.

### 3. One Vercel setting (for the sitemap)
Vercel → your project → **Settings → Environment Variables** → add:
- `SUPABASE_ANON_KEY` = your Supabase anon/public key

Redeploy. Then open `https://hollywoodclinics.net/blog-sitemap.xml` — you should see XML (empty until the first article publishes).

### 4. The daily runner (this is what makes it automatic)
The engine needs to run on a machine that stays on — your **VPS** (where n8n lives) is perfect.

a. Copy the `seo-autoblog/` folder onto the server.
b. Get your **service_role** key: Supabase → Settings → API → `service_role` (keep it secret — server only).
c. Set three environment variables:
```bash
export ANTHROPIC_API_KEY="sk-ant-..."          # your Anthropic API key
export SUPABASE_URL="https://dtlgclhgjvqpkqnxwawj.supabase.co"
export SUPABASE_SERVICE_KEY="eyJ...service_role..."
```
d. Test one run:
```bash
python3 seo-autoblog/autoblog.py
# → [autoblog] Published: rich-pl-advance-explained | Rich PL Advance: ...
```
e. Schedule **3×/day** with cron (runs at 9am, 3pm, 9pm):
```
0 9,15,21 * * *  cd /path/to/site && ANTHROPIC_API_KEY=sk-ant-... SUPABASE_URL=https://dtlgclhgjvqpkqnxwawj.supabase.co SUPABASE_SERVICE_KEY=eyJ... python3 seo-autoblog/autoblog.py >> /var/log/autoblog.log 2>&1
```
**Or** in **n8n**: Schedule Trigger (3×/day) → *Execute Command* node running `python3 /path/to/seo-autoblog/autoblog.py`. Set the env vars on the n8n host.

### 5. Tell Google
Google Search Console → **Sitemaps** → submit `blog-sitemap.xml`. (One time; Google re‑checks it automatically after that.)

---

## Good to know
- **Topics:** the engine cycles through the curated list in `autoblog.py` (one per run, no duplicates). When the list is used up it stops — just add more `(slug, title)` lines to keep it running. Quality > quantity for a medical brand.
- **Cost:** each article is one Claude API call (a few US cents). 3/day ≈ a small monthly Anthropic bill on your account.
- **Model:** defaults to `claude-sonnet-5`. If your account uses a different model string, set `MODEL=...`.
- **Undo/edit:** every article is in Supabase → `blog_posts` (with `source = 'autoblog'`). You can edit, unpublish (`is_published = false`), or delete any of them from the dashboard.
- **Show one in the Blog:** if you ever want a specific auto‑article featured, set its `hidden = false`.

## Why it can't be 100% "zero setup"
The engine uses **your** Anthropic API key and **your** Supabase service key, and it must run on **your** server. Those are private credentials and paid usage on your accounts — they can't live with anyone else. Once the steps above are done, though, you never touch it again; it publishes on schedule by itself.
