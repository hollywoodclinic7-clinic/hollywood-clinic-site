// Article index for /blog/all and /ar/blog/all.
//
// The N8N-generated posts are deliberately kept out of the curated Blog list
// (blog.html skips rows with hidden=true). That left all 275 reachable from
// nowhere on the site, which is what put them in "Discovered - currently not
// indexed": the sitemap asked Google to rank pages the site itself would not
// link to.
//
// This page restores a crawl path without changing the Blog page. Readers still
// arrive on an article from search; almost none will browse this index, and it
// exists mainly so the articles are part of the site's link graph.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SITE = (process.env.SITE_URL || 'https://www.hollywoodclinics.net').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtlgclhgjvqpkqnxwawj.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || '';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

async function loadTemplate(isArabic) {
  const rel = isArabic ? 'ar/blog/post.html' : 'blog/post.html';
  try {
    return await readFile(path.join(process.cwd(), rel), 'utf8');
  } catch {
    const r = await fetch(`${SITE}/${rel}`);
    if (!r.ok) throw new Error(`template ${rel}: HTTP ${r.status}`);
    return r.text();
  }
}

async function fetchAll() {
  if (!KEY) return [];
  const q = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,title_en,title_ar,published_at` +
            `&is_published=eq.true&order=published_at.desc&limit=1000`;
  const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) return [];
  const rows = await r.json();
  return Array.isArray(rows) ? rows : [];
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'www.hollywoodclinics.net'}`);
  const isArabic = url.searchParams.get('lang') === 'ar';
  const base = isArabic ? '/ar/blog' : '/blog';
  const canonical = `${SITE}${base}/all`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let template;
  try {
    template = await loadTemplate(isArabic);
  } catch {
    res.status(302).setHeader('Location', base).end();
    return;
  }

  try {
    const posts = await fetchAll();
    const title = isArabic ? 'كل المقالات' : 'All Articles';
    const intro = isArabic
      ? 'كل مقالات هوليوود كلينك عن التجميل والجلدية ونحت الجسم.'
      : 'Every Hollywood Clinic article on aesthetics, dermatology and body contouring.';

    // Group by month so the page is navigable rather than one flat 275-item list.
    const groups = new Map();
    for (const p of posts) {
      const key = String(p.published_at || '').slice(0, 7) || '—';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(p);
    }

    let body = `<h1>${esc(title)}</h1>\n<p>${esc(intro)}</p>\n`;
    for (const [month, rows] of groups) {
      body += `<h2>${esc(month)}</h2>\n<ul>\n`;
      for (const p of rows) {
        const t = (isArabic ? p.title_ar : p.title_en) || p.title_en || p.title_ar || p.slug;
        body += `<li><a href="${base}/${encodeURIComponent(p.slug)}">${esc(t)}</a></li>\n`;
      }
      body += `</ul>\n`;
    }

    const head =
      `  <title>${esc(title)} — Hollywood Clinic</title>\n` +
      `  <meta name="description" content="${esc(intro)}">\n` +
      `  <link rel="canonical" href="${esc(canonical)}">` +
      `<link rel="alternate" hreflang="x-default" href="${SITE}/blog/all">` +
      `<link rel="alternate" hreflang="ar-EG" href="${SITE}/ar/blog/all">` +
      `<link rel="alternate" hreflang="en" href="${SITE}/blog/all">\n` +
      `  <meta property="og:type" content="website">\n` +
      `  <meta property="og:title" content="${esc(title)}">\n` +
      `  <meta property="og:description" content="${esc(intro)}">\n` +
      `  <meta property="og:url" content="${esc(canonical)}">\n` +
      `  <meta property="og:image" content="${SITE}/assets/images/hero-bg.jpg?v=2">\n`;

    let out = template
      .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/, '')
      .replace(/[ \t]*<link rel="canonical"[^\n]*\r?\n?/, '')
      .replace(/[ \t]*<!-- Open Graph -->\r?\n?/, '')
      .replace(/[ \t]*<!-- Twitter -->\r?\n?/, '')
      .replace(/[ \t]*<meta (?:property="og:|name="twitter:)[^>]*>\r?\n?/g, '')
      .replace('</head>', `${head}</head>`)
      .replace(/(<div class="article" id="article">)[\s\S]*?(<\/div>)/,
        (m, open, close) => `${open}\n${body}\n${close}`);

    // The article shell's script looks for a slug and would replace the list
    // with a "no post specified" message; this page supplies its own content.
    out = out.replace(/<script src="\.\.\/assets\/js\/markdown\.js[^>]*><\/script>/, '');
    out = out.replace(/<script>\s*\(async function\(\)[\s\S]*?<\/script>/, '');

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(out);
  } catch (e) {
    console.error('ARCHIVE ERROR:', e && e.stack || e);
    res.status(302).setHeader('Location', base).end();
  }
}
