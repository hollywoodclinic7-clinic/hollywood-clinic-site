# Hollywood Clinic — Arabic SEO build

Arabic now lives at its own crawlable URLs. Previously every page existed only in
English as far as Google was concerned; the Arabic was painted in by JavaScript on
the same address, so Googlebot never saw it.

```
/treatments/body-shaping/tesla-former        →  English
/ar/treatments/body-shaping/tesla-former     →  Arabic (new)
```

Proof on the page you sent:

| | Before | After |
|---|---|---|
| `<html>` | `lang="en"` | `lang="ar" dir="rtl"` |
| Arabic in raw HTML | 0 | 1,740 runs |
| Heading Googlebot sees | "What is Tesla Former?" | "إيه هو Tesla Former؟" |
| Canonical | English URL | self, `/ar/...` |
| hreflang | none | en / ar-EG / x-default |

---

## ⚠️ Two things before you deploy

**1. Put your Supabase anon key back.** `assets/js/supabase-config.js` ships with a
placeholder:

```js
var SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY_HERE";
```

Bookings, reviews and the dashboard fail silently if you skip this.

**2. Your live site may be newer than the copy I worked from.** Google is serving a
homepage meta description that does not exist in the zip you sent me. Check
`index.html` before overwriting it wholesale.

---

## What changed

### New
| Path | |
|---|---|
| `ar/**` | 47 generated Arabic pages — **never hand-edit these** |
| `tools/build-ar.mjs` | The generator |
| `tools/package.json` | Its one dependency (jsdom) |
| `.vercelignore` | Keeps `tools/`, `backend/`, `templates/` out of the deploy |
| `.gitignore` | Excludes `node_modules` |

### Modified
| File | Change |
|---|---|
| `assets/js/i18n.js` | Language is URL-driven; toggle navigates; `BASE` is root-absolute |
| `assets/js/dynamic-content.js` | `pageKey`, `subKey`, `svcKey`, `deptKey` ignore the `/ar` prefix |
| `sitemap.xml` | 47 → 94 URLs, with hreflang alternates |
| All 47 English pages | hreflang tags added |

---

## Why `i18n.js` had to change

The static Arabic pages would have been repainted back to English on load. Three fixes:

**Language now comes from the URL, not localStorage.**
```js
current() { return this.isArabicPath() ? 'ar' : 'en'; }
```
Googlebot has no localStorage, which is exactly why it only ever saw English before.

**The toggle navigates instead of repainting.** `/page` ↔ `/ar/page`. Verified
round-trip in both directions.

**`BASE` is root-absolute** (`/` or `/ar/`). Arabic pages sit a folder deeper, so the
old `../../` prefixes resolved to the wrong place.

---

## Deploy

```bash
git add -A
git commit -m "Add static Arabic pages under /ar/ with hreflang"
git push
```

Then hard-refresh (Ctrl+Shift+R) — `i18n.js` and `dynamic-content.js` both changed and
browsers cache them aggressively.

### Verify it worked

```bash
curl -s https://www.hollywoodclinics.net/ar/treatments/body-shaping/tesla-former \
  | grep -o '<html[^>]*>'
# expect: <html lang="ar" dir="rtl">
```

Then in Search Console: resubmit `sitemap.xml`, and use URL Inspection →
**Request Indexing** on two or three Arabic pages to prime the crawl.

---

## Re-running the build

Whenever you edit English content or add Arabic strings to `i18n.js`:

```bash
cd tools
npm install        # first time only
npm run build:ar   # regenerate /ar/
npm run check:ar   # report only, writes nothing
```

`/ar/` is deleted and rebuilt each run. Edit the English page, never the Arabic twin.

---

## Verified before packaging

- `node --check` clean on all 10 JS files
- CSS braces balanced across all 3 stylesheets
- 47 Arabic pages, zero HTML tag-balance errors
- `sitemap.xml` parses: 94 URLs, 282 alternates, 0 duplicates
- Zero JS console errors on every Arabic page tested
- Toggle round-trip EN → AR → EN confirmed
- `page_key` matches across both languages, so dashboard edits reach Arabic pages

### Bugs found and fixed during render testing
1. `/ar/assets/images/logo.png` 404 — injected nav was prefixing `/ar/` onto assets
2. Hero images 404 — inline `<style>` blocks held `url('../../assets/...')`
3. `page_key` mismatch — Arabic pages queried `ar/treatments/...`, so dashboard media
   overrides and gallery additions would never have applied
4. `subKey` / `svcKey` / `deptKey` stripped `^treatments/` but not `^ar/`

---

## Known gaps

**30 untranslated keys**, all Dr Hadeel Hanee's education and FAQ entries. They stay
English on `/ar/doctors/dr-hadeel-hanee`. The build lists them by name every run — add
them to the `ar` block in `i18n.js` and rebuild.

**Breadcrumb names in JSON-LD stay English** on Arabic pages. Cosmetic; does not affect
indexing.

**Pre-existing, untouched:**
- `index.html` has an unclosed `<div>` swallowing a `</section>`; `contact.html` and
  `doctors/dr-rana-safwat.html` also have unbalanced tags
- Two malformed SVG `path d` attributes in `FOOTER_HTML` throw console errors sitewide
- `i18n.js` is 1.34 MB and render-blocking

---

## Still worth doing

1. **Stop the AI blog.** Three auto-generated posts a day on a domain registered
   21 July 2026 is the strongest spam signal you could send while Google is still
   deciding whether to trust the site.
2. **Google Business Profile.** For a Heliopolis clinic, most local discovery happens in
   Maps — and none of it shows in Search Console.
3. **Check you are in the right GSC property.** Your screenshot read
   `https://hollywoodclinics.net/` (no www) while the site 308-redirects to www. Add a
   Domain property so both are covered.

---

# AI & rich-result visibility (added)

## FAQPage schema — 245 Q&A across 30 pages

You had FAQ accordions on 31 pages and **zero** FAQPage markup. That is the format
Google turns into rich results and the one AI answer engines lift most directly.

`tools/add-faq-schema.mjs` reads the questions and answers **out of the accordion
already on the page** — nothing is invented, and nothing is hidden from visitors,
which is what Google requires for FAQPage.

Both languages get their own, generated from their own text:

```
EN  Q: Does Tesla Former hurt?
AR  Q: هل Tesla Former بيوجع؟
```

60 FAQPage blocks total (30 English + 30 Arabic), all valid JSON.

## robots.txt — AI crawlers named explicitly

14 user-agents now declared: `GPTBot`, `OAI-SearchBot`, `ChatGPT-User`, `ClaudeBot`,
`Claude-User`, `PerplexityBot`, `Perplexity-User`, `Google-Extended`, `Applebot`,
`Applebot-Extended`, `Bingbot`, `Amazonbot`, `meta-externalagent`, plus `*`.

`Google-Extended` is the one most sites miss — it governs whether Google may use your
content for AI Overviews and Gemini grounding.

## llms.txt

Plain-text entity summary at the site root: address, hours, departments, doctors, key
pages, and notes for answer engines. **Be aware this is an emerging convention, not a
standard** — some crawlers read it, most ignore it. It cost nothing to add; do not
expect much from it on its own.

## Rebuilding

```bash
cd tools
npm install     # first time only
npm run build   # FAQ schema, then Arabic pages — in that order
```

Order matters: the FAQ script runs on the English pages, then the Arabic build copies
and regenerates from the translated text.

## sameAs is still incomplete

`sameAs` currently lists only Instagram and Facebook. This is the property that tells
Google and AI systems that all your profiles are one organisation. Send me the URLs and
I will wire them in:

- Google Business Profile / Maps listing
- TikTok, YouTube, X, LinkedIn
- Vezeeta, DoctorUna, or any directory profile

## Do not add aggregateRating

There is no `aggregateRating` in your schema, and it should stay that way unless the
numbers are real and sourced. Self-applied review markup on a LocalBusiness breaches
Google's guidelines and can earn a manual action. Let ratings come from your Google
profile.

## What code cannot do

Schema and robots.txt make you *citable*. They do not make you *known*. AI systems
weight corroboration across sources you do not control:

1. **Google Business Profile, verified** — the single highest-value item, and the source
   AI local answers draw from
2. **Bing Places** — ChatGPT Search runs on Bing's index. Skip this and ChatGPT has
   almost nothing to retrieve about you
3. **Apple Business Connect**
4. **Identical NAP** across Egyptian directories — character for character; mismatches
   break entity matching
5. **Reviews** — AI summarises review text when recommending clinics
6. **Stop the AI blog** — answer engines weight source quality, and three auto-generated
   posts a day reads as a content farm to exactly the systems you want citing you
