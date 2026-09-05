# Hollywood Clinic Website

A complete bilingual (English / Arabic) website for www.hollywoodclinics.net.

## Quick start

### To preview locally

Because the blog reads JSON and Markdown files, you need a local web server (you can't just double-click index.html).

The easiest way:

```bash
cd hollywood-clinic
python3 -m http.server 8000
```

Then open: http://localhost:8000

### To deploy

Upload the entire `hollywood-clinic/` folder to your web host. That's it — no build step, no Node.js, no dependencies.

Works on any static host: shared hosting, Netlify, Vercel, GitHub Pages, AWS S3, Hostinger, Bluehost, etc.

---

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `about.html` | About the clinic |
| `treatments.html` | All treatments overview |
| `treatments/*.html` | 6 individual treatment detail pages |
| `doctors.html` | Team / specialists |
| `results.html` | Before & after gallery |
| `blog.html` | Blog & video listing |
| `blog/post.html` | Universal post viewer (reads `?slug=` from URL) |
| `pricing.html` | Pricing list |
| `booking.html` | Online booking form |
| `contact.html` | Contact info + map + message form |

---

## Language toggle (EN / AR)

Every page has a `العربية` button in the navigation. Clicking it switches the entire site to Arabic, with full right-to-left (RTL) support. The choice is saved in the browser so it persists between visits.

To edit a translation, open `assets/js/i18n.js`. You'll see two big objects: `en` and `ar`. Each entry has a key like `'nav.home'` and a value. Edit the values, save, refresh.

To add new translatable text in HTML, add a `data-i18n="some.key"` attribute and add the matching keys in both `en` and `ar` in the i18n file.

---

## Adding a new blog post

### Step 1: Create the markdown file

Create a new file in `posts/`. Name it like `my-new-post.md`. Add this front matter at the top:

```markdown
---
title_en: My English Title
title_ar: عنواني بالعربية
---

## Your content starts here

Write whatever you want using regular markdown:
- Lists
- **Bold** and *italic*
- [Links](https://example.com)
- > Blockquotes

## More headings

Just like that.
```

### Step 2: Register the post in `posts/posts.json`

Open `posts/posts.json` and add an entry at the top of the `posts` array:

```json
{
  "slug": "my-new-post",
  "type": "article",
  "title": {
    "en": "My English Title",
    "ar": "عنواني بالعربية"
  },
  "excerpt": {
    "en": "Short summary in English shown on the listing page.",
    "ar": "ملخص قصير بالعربية يظهر في صفحة القائمة."
  },
  "date": "2026-05-15",
  "author": "Dr. Layla Hassan",
  "category": "Treatments",
  "readMinutes": 5,
  "cover": "",
  "file": "my-new-post.md"
}
```

Save. Refresh `blog.html`. Done.

The `slug` must match the URL-safe version of your post. The `file` field must match your markdown filename exactly.

---

## Adding a new video (vlog)

Same process, but set `type` to `"video"` and add a `videoUrl` (use the YouTube **embed** URL — get it from YouTube → Share → Embed):

```json
{
  "slug": "my-new-video",
  "type": "video",
  "title": {
    "en": "My Video Title",
    "ar": "عنوان الفيديو"
  },
  "excerpt": {
    "en": "What this video is about.",
    "ar": "ما يدور حوله هذا الفيديو."
  },
  "date": "2026-05-15",
  "author": "Hollywood Clinic",
  "category": "Behind The Scenes",
  "duration": "3:45",
  "cover": "",
  "videoUrl": "https://www.youtube.com/embed/YOUR_VIDEO_ID",
  "file": "my-new-video.md"
}
```

You still create a matching `.md` file with a description that appears below the video.

---

## Customising colours and fonts

Open `assets/css/main.css`. At the top, find the `:root` block:

```css
:root {
  --navy: #0B1D3A;
  --gold: #C9A84C;
  --cream: #FAFBFD;
  ...
  --font-heading: 'Playfair Display', Georgia, serif;
  --font-body: 'Inter', ...;
}
```

Change these and save — every page updates instantly.

---

## Adding real photos

All placeholder images are SVG icons inside coloured cards. To replace with real photos:

1. Drop your JPG / PNG / WebP files into `assets/images/`.
2. In the relevant page, find the `<div class="card-image">` (or `doctor-photo`, `ba-before`, `ba-after`, etc.) and replace the inner SVG with:
   ```html
   <img src="assets/images/your-photo.jpg" alt="description" style="width:100%;height:100%;object-fit:cover">
   ```
3. For doctor cards: replace the SVG in `<div class="doctor-photo">`.
4. For blog post covers: set the `cover` field in `posts.json` to the image path (e.g. `"assets/images/cover-lips.jpg"`).

---

## Booking & contact forms

The booking form (`booking.html`) and contact form (`contact.html`) currently show a confirmation popup when submitted. **They do not yet send emails.**

To connect them to your inbox or CRM, replace the JavaScript at the bottom of each file. Two simple options:

### Option A: Use Formspree (no coding needed)

1. Sign up at https://formspree.io (free for 50 submissions/month).
2. Get your form endpoint URL.
3. In `booking.html` and `contact.html`, change the `<form>` tag to:
   ```html
   <form id="bookingForm" action="https://formspree.io/f/YOUR_ID" method="POST">
   ```
4. Remove the custom JavaScript handler at the bottom of the file.

### Option B: Use your own backend

Replace the `alert(...)` line with a `fetch()` call to your server endpoint that sends the email.

---

## Updating contact info

Search-and-replace these placeholders in all HTML files:

| Placeholder | Replace with |
|---|---|
| `+201234567890` | Your real phone number |
| `+20 123 456 7890` | Same number, formatted |
| `hello@hollywoodclinics.net` | Your real email |
| `Zamalek, Cairo, Egypt` | Your full address (also in `i18n.js` under `footer.contact.address`) |

For the map on the contact page, replace the Google Maps iframe `src` in `contact.html` with the embed URL for your exact location (Google Maps → Share → Embed a map).

---

## Folder structure summary

```
hollywood-clinic/
├── index.html                       Home page
├── about.html                       About page
├── treatments.html                  All treatments
├── doctors.html                     Team page
├── results.html                     Before/after gallery
├── blog.html                        Blog listing
├── pricing.html                     Pricing list
├── booking.html                     Online booking form
├── contact.html                     Contact + map
├── treatments/                      Individual treatment pages
│   ├── body-shaping.html
│   ├── dermal-fillers.html
│   ├── botox.html
│   ├── skin-rejuvenation.html
│   ├── hair-restoration.html
│   └── laser.html
├── blog/
│   └── post.html                    Universal post renderer
├── posts/
│   ├── posts.json                   ★ Edit this to add posts
│   └── *.md                         One markdown file per post
└── assets/
    ├── css/main.css                 ★ All styling
    ├── js/i18n.js                   ★ All translations (EN/AR)
    ├── js/main.js                   Site behaviours
    ├── js/markdown.js               Markdown parser
    └── images/                      Drop your photos here
```

Files marked with ★ are the ones you'll edit most often.

---

## Browser support

Modern evergreen browsers (Chrome, Firefox, Safari, Edge — all current versions). Mobile-first responsive design tested down to 320px viewport width.

---

## License

This site was custom-built for Hollywood Clinic. All code is yours to modify freely.
