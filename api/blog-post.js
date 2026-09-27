// Server-rendered blog article.
//
// Every article used to be served by the static blog/post.html shell, which
// carries a hardcoded `<link rel="canonical" href=".../blog/post">`. Each of
// the 275 posts therefore told Google it was a duplicate of one page, and the
// title, description and body only existed after JavaScript ran. Google
// consolidated the lot into /blog/post and left the rest in "Discovered –
// currently not indexed".
//
// This handler serves the same shell with the post's real metadata and body
// already in the HTML. The client script still re-renders the article for the
// reader, so nothing changes visually.
//
// Routed from /blog/<slug> and /ar/blog/<slug> by the rewrites in vercel.json.
// Requires the SUPABASE_ANON_KEY env var that api/sitemap-blog.js already uses.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const SITE = (process.env.SITE_URL || 'https://www.hollywoodclinics.net').replace(/\/$/, '');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://dtlgclhgjvqpkqnxwawj.supabase.co';
const KEY = process.env.SUPABASE_ANON_KEY || '';

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/** Absolute URL for an image path that may be relative, already absolute, or empty. */
function imageUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return `${SITE}/assets/images/hero-bg.jpg?v=2`;
  if (/^https?:\/\//i.test(v)) return v;
  return `${SITE}/${v.replace(/^\/+/, '')}`;
}

/** Trim to a clean meta-description length without cutting mid-word. */
function clamp(text, max = 155) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  return s.slice(0, s.lastIndexOf(' ', max) > 0 ? s.lastIndexOf(' ', max) : max).trim() + '…';
}

/**
 * Some rows carry an Arabic excerpt_en (and vice versa). Serving the wrong
 * script as the description would undercut the page for the very query it
 * targets, so treat a mismatched excerpt as missing and fall back to the body.
 */
function matchesLanguage(text, isArabic) {
  const letters = String(text || '').replace(/[^\p{L}]/gu, '');
  if (letters.length < 12) return false;
  const arabic = (letters.match(/\p{Script=Arabic}/gu) || []).length / letters.length;
  return isArabic ? arabic > 0.5 : arabic < 0.3;
}

/**
 * Markdown → HTML, covering what the posts actually use: headings, lists,
 * blockquotes, bold/italic, links, images and paragraphs. The client renderer
 * replaces this on load; it exists so crawlers see the text without running JS.
 */
function renderMarkdown(md) {
  const inline = (s) => esc(s)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g,
      (m, alt, src) => `<img src="${esc(imageUrl(src))}" alt="${alt}" loading="lazy">`)
    .replace(/\[([^\]]+)\]\(([^)\s]+)[^)]*\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  const out = [];
  let list = null;                       // 'ul' | 'ol' | null

  const closeList = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const rawLine of String(md || '').split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line) { closeList(); continue; }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 6);
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^(---+|\*\*\*+|___+)$/.test(line)) { closeList(); out.push('<hr>'); continue; }

    const bullet = line.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      if (list !== 'ul') { closeList(); out.push('<ul>'); list = 'ul'; }
      out.push(`<li>${inline(bullet[1])}</li>`);
      continue;
    }

    const numbered = line.match(/^\d+[.)]\s+(.*)$/);
    if (numbered) {
      if (list !== 'ol') { closeList(); out.push('<ol>'); list = 'ol'; }
      out.push(`<li>${inline(numbered[1])}</li>`);
      continue;
    }

    const quote = line.match(/^>\s?(.*)$/);
    if (quote) { closeList(); out.push(`<blockquote><p>${inline(quote[1])}</p></blockquote>`); continue; }

    closeList();
    out.push(`<p>${inline(line)}</p>`);
  }
  closeList();
  return out.join('\n');
}

/** The shell, read from the deployment; falls back to fetching it over HTTP. */
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

async function fetchPost(slug) {
  if (!KEY) return null;
  const q = `${SUPABASE_URL}/rest/v1/blog_posts?select=*&slug=eq.${encodeURIComponent(slug)}` +
            `&is_published=eq.true&limit=1`;
  const r = await fetch(q, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
  if (!r.ok) return null;
  const rows = await r.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

/** Swap the shell's placeholder head tags for this post's real ones. */
function applyMeta(html, post, isArabic, slug) {
  const title = (isArabic ? post.title_ar : post.title_en) || post.title_en || post.title_ar || '';
  const bodyMd = (isArabic ? post.body_ar : post.body_en) || post.body_en || post.body_ar || '';
  const rawExcerpt = (isArabic ? post.excerpt_ar : post.excerpt_en) || '';
  const bodyText = bodyMd.replace(/^#{1,6}\s.*$/gm, ' ').replace(/[#*>`_[\]()]/g, ' ');
  const description = clamp(
    matchesLanguage(rawExcerpt, isArabic) ? rawExcerpt : bodyText
  );

  // The body normally opens with the title as an H1; drop it so the page has
  // exactly one, the heading rendered from title_* below.
  const bodyWithoutLeadH1 = bodyMd.replace(/^\s*#\s+.*(\r?\n)+/, '');
  const image = imageUrl(post.cover_image_url);

  const enUrl = `${SITE}/blog/${encodeURIComponent(slug)}`;
  const arUrl = `${SITE}/ar/blog/${encodeURIComponent(slug)}`;
  const canonical = isArabic ? arUrl : enUrl;
  const fullTitle = `${title} — Hollywood Clinic`;

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image: [image],
    datePublished: post.published_at || undefined,
    dateModified: post.updated_at || post.published_at || undefined,
    inLanguage: isArabic ? 'ar-EG' : 'en',
    mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    author: { '@type': 'Organization', name: 'Hollywood Clinic Egypt', url: SITE },
    publisher: {
      '@type': 'Organization',
      name: 'Hollywood Clinic Egypt',
      logo: { '@type': 'ImageObject', url: `${SITE}/assets/images/logo.png?v=2` },
    },
  };

  const head =
    `  <title>${esc(fullTitle)}</title>\n` +
    `  <meta name="description" content="${esc(description)}">\n` +
    `  <link rel="canonical" href="${esc(canonical)}">` +
    `<link rel="alternate" hreflang="x-default" href="${esc(enUrl)}">` +
    `<link rel="alternate" hreflang="ar-EG" href="${esc(arUrl)}">` +
    `<link rel="alternate" hreflang="en" href="${esc(enUrl)}">\n` +
    `  <meta property="og:type" content="article">\n` +
    `  <meta property="og:site_name" content="Hollywood Clinic Egypt">\n` +
    `  <meta property="og:title" content="${esc(title)}">\n` +
    `  <meta property="og:description" content="${esc(description)}">\n` +
    `  <meta property="og:url" content="${esc(canonical)}">\n` +
    `  <meta property="og:image" content="${esc(image)}">\n` +
    `  <meta property="og:locale" content="${isArabic ? 'ar_EG' : 'en_US'}">\n` +
    `  <meta property="og:locale:alternate" content="${isArabic ? 'en_US' : 'ar_EG'}">\n` +
    (post.published_at ? `  <meta property="article:published_time" content="${esc(post.published_at)}">\n` : '') +
    `  <meta name="twitter:card" content="summary_large_image">\n` +
    `  <meta name="twitter:title" content="${esc(title)}">\n` +
    `  <meta name="twitter:description" content="${esc(description)}">\n` +
    `  <meta name="twitter:image" content="${esc(image)}">\n` +
    `  <script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;

  // Drop the shell's placeholder title, canonical/hreflang line, and og/twitter
  // block, then insert the real ones in their place.
  let out = html
    .replace(/[ \t]*<title>[\s\S]*?<\/title>\r?\n?/, '')
    .replace(/[ \t]*<link rel="canonical"[^\n]*\r?\n?/, '')
    .replace(/[ \t]*<!-- Open Graph -->\r?\n?/, '')
    .replace(/[ \t]*<!-- Twitter -->\r?\n?/, '')
    .replace(/[ \t]*<meta (?:property="og:|name="twitter:)[^>]*>\r?\n?/g, '');

  out = out.replace('</head>', `${head}</head>`);

  // Put the article text in the HTML. The client script overwrites this node
  // once it loads, so the reader sees the fully styled version either way.
  const rendered =
    `<h1>${esc(title)}</h1>\n` +
    (post.cover_image_url ? `<img src="${esc(image)}" alt="${esc(title)}">\n` : '') +
    renderMarkdown(bodyWithoutLeadH1);

  out = out.replace(
    /(<div class="article" id="article">)[\s\S]*?(<\/div>)/,
    (m, open, close) => `${open}\n${rendered}\n${close}`
  );

  return out;
}

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host || 'www.hollywoodclinics.net'}`);
  const slug = (url.searchParams.get('slug') || '').trim();
  const isArabic = url.searchParams.get('lang') === 'ar';

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  let template = '';
  try {
    template = await loadTemplate(isArabic);
  } catch {
    res.status(302).setHeader('Location', isArabic ? '/ar/blog' : '/blog').end();
    return;
  }

  // Anything unexpected falls back to the untouched shell, which still renders
  // the post client-side — a worse page for crawlers, never a broken one.
  try {
    const post = slug ? await fetchPost(slug) : null;
    if (!post) {
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      res.status(404).send(template.replace(
        /(<div class="article" id="article">)[\s\S]*?(<\/div>)/,
        `$1<p style="text-align:center;padding:3rem 0">Post not found. <a href="/blog">Back to blog →</a></p>$2`
      ));
      return;
    }
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(applyMeta(template, post, isArabic, slug));
  } catch {
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    res.status(200).send(template);
  }
}
