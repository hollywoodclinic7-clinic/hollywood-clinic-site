// Dynamic sitemap for blog articles stored in Supabase (including hidden auto-articles).
// Lets Google crawl & index every published post even though they aren't in the static sitemap.
// Served at /blog-sitemap.xml (via the rewrite in vercel.json).
// Requires Vercel env vars: SUPABASE_ANON_KEY  (SUPABASE_URL and SITE_URL optional).
//
// Both language versions are listed. Every post carries a full Arabic title and
// body and renders at /ar/blog/<slug>, but only the English URL was ever
// submitted — so of the URLs offered to Google 87% were English, and the 275
// Arabic articles were never put forward as indexable pages at all. That is the
// likeliest reason impressions skew to English queries for a Cairo clinic.

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtlgclhgjvqpkqnxwawj.supabase.co';
  const KEY = process.env.SUPABASE_ANON_KEY || '';
  const SITE = (process.env.SITE_URL || 'https://www.hollywoodclinics.net').replace(/\/$/, '');

  const xmlHead = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' +
    'xmlns:xhtml="http://www.w3.org/1999/xhtml">';
  const xmlFoot = '</urlset>';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (!KEY) { res.status(200).send(xmlHead + xmlFoot); return; }

  try {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts` +
      `?select=slug,title_ar,published_at,updated_at&is_published=eq.true&order=published_at.desc`;
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const rows = await r.json();
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const hasArabic = (s) => /[؀-ۿ]/.test(String(s || ''));

    const urls = (Array.isArray(rows) ? rows : []).map((p) => {
      // Clean paths, matching the canonical each article declares. The old
      // ?slug= form 301s here, so it must not be advertised as well.
      const slug = encodeURIComponent(p.slug);
      const en = `${SITE}/blog/${slug}`;
      const ar = `${SITE}/ar/blog/${slug}`;
      const lastmod = String(p.updated_at || p.published_at || '').slice(0, 10);

      // A post with no Arabic title has no Arabic page worth offering; listing
      // one would submit a page that falls back to English content.
      const translated = hasArabic(p.title_ar);

      const alternates =
        `<xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>` +
        (translated ? `<xhtml:link rel="alternate" hreflang="ar-EG" href="${esc(ar)}"/>` : '') +
        `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/>`;

      const entry = (loc) =>
        `<url><loc>${esc(loc)}</loc>${alternates}` +
        `${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}` +
        `<changefreq>weekly</changefreq><priority>0.6</priority></url>`;

      return translated ? entry(en) + entry(ar) : entry(en);
    }).join('');

    res.status(200).send(xmlHead + urls + xmlFoot);
  } catch (e) {
    console.error('BLOG SITEMAP ERROR:', (e && e.stack) || e);
    res.status(200).send(xmlHead + xmlFoot);
  }
}
