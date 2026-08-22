// Dynamic sitemap for blog articles stored in Supabase (including hidden auto-articles).
// Lets Google crawl & index every published post even though they aren't in the static sitemap.
// Served at /blog-sitemap.xml (via the rewrite in vercel.json).
// Requires Vercel env vars: SUPABASE_ANON_KEY  (SUPABASE_URL and SITE_URL optional).

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtlgclhgjvqpkqnxwawj.supabase.co';
  const KEY = process.env.SUPABASE_ANON_KEY || '';
  const SITE = (process.env.SITE_URL || 'https://www.hollywoodclinics.net').replace(/\/$/, '');

  const xmlHead = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const xmlFoot = '</urlset>';
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');

  if (!KEY) { res.status(200).send(xmlHead + xmlFoot); return; }

  try {
    const url = `${SUPABASE_URL}/rest/v1/blog_posts?select=slug,published_at,updated_at&is_published=eq.true&order=published_at.desc`;
    const r = await fetch(url, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
    const rows = await r.json();
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const urls = (Array.isArray(rows) ? rows : []).map((p) => {
      const loc = `${SITE}/blog/post?slug=${encodeURIComponent(p.slug)}`;
      const lastmod = String(p.updated_at || p.published_at || '').slice(0, 10);
      return `<url><loc>${esc(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>weekly</changefreq><priority>0.6</priority></url>`;
    }).join('');
    res.status(200).send(xmlHead + urls + xmlFoot);
  } catch (e) {
    res.status(200).send(xmlHead + xmlFoot);
  }
}
