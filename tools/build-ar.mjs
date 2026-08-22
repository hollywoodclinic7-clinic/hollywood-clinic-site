#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   build-ar.mjs — Hollywood Clinic static Arabic site generator

   WHY THIS EXISTS
   The site stores every Arabic string inside assets/js/i18n.js and swaps
   the text in the browser. Googlebot has no localStorage, so I18N.current()
   always returns 'en' and the crawler only ever sees the English page.
   One URL can also only ever hold one indexed language.

   WHAT THIS DOES
   Reads each English page and writes an Arabic twin under /ar/ with the
   translations already baked into the HTML, so the Arabic exists at its
   own crawlable URL with no JavaScript required.

     /treatments/body-shaping/tesla-former
     /ar/treatments/body-shaping/tesla-former

   Both sides get hreflang tags pointing at each other, self-referencing
   canonicals, and an entry in sitemap.xml.

   USAGE
     node build-ar.mjs            # generate
     node build-ar.mjs --check    # report only, write nothing

   Safe to re-run. /ar/ is deleted and rebuilt from scratch each time, so
   never hand-edit anything inside it — edit the English page and rerun.
   ══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { injectFaqSchema } from './faq-schema.mjs';

// This script lives in tools/; the site root is its parent.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.hollywoodclinics.net';
const OUT_DIR = path.join(ROOT, 'ar');
const CHECK_ONLY = process.argv.includes('--check');

/* Runtime templates: real, reachable pages that are populated from Supabase
   via a ?slug= parameter. They MUST get an Arabic twin, otherwise the language
   toggle sends visitors to a 404 — but they must NOT go in the sitemap, because
   the bare URL has no content of its own. */
const TEMPLATE_PAGES = new Set([
  'doctors/profile.html',
  'treatments/department.html',
  'treatments/treatment.html',
  'treatments/service.html',
  'blog/post.html',
]);

/* Nothing is excluded from generation. Kept as an empty set so the link
   rewriter below stays readable. */
const EXCLUDE = new Set();

const EXCLUDE_DIRS = ['.git', 'admin', 'ar', 'node_modules', 'assets', 'backend', 'api'];

const log = (...a) => console.log(...a);
const warn = [];

/* ── 1. Pull the Arabic dictionary out of i18n.js ───────────────────── */
function loadTranslations() {
  const src = fs.readFileSync(path.join(ROOT, 'assets/js/i18n.js'), 'utf8');
  const start = src.indexOf('const TRANSLATIONS');
  const end = src.indexOf('const I18N');
  if (start < 0 || end < 0) throw new Error('Could not locate TRANSLATIONS block in i18n.js');
  const literal = src.slice(start, end).trim()
    .replace(/^const\s+TRANSLATIONS\s*=\s*/, '')
    .replace(/;\s*$/, '');
  // eslint-disable-next-line no-eval
  const T = eval('(' + literal + ')');
  if (!T.ar || !T.en) throw new Error('TRANSLATIONS is missing en or ar');
  return T;
}

/* booking.html does not use data-i18n. It carries its own dictionary
   (const S = { en:{...}, ar:{...} }) and marks elements with data-qz.
   Pull that out so the booking shell is translated too. */
function loadBookingStrings() {
  const file = path.join(ROOT, 'booking.html');
  if (!fs.existsSync(file)) return null;
  const src = fs.readFileSync(file, 'utf8');
  const start = src.indexOf('const S = {');
  if (start < 0) { warn.push('booking.html: const S dictionary not found'); return null; }
  // Walk braces to find the matching close, so nested objects are safe.
  let depth = 0, i = src.indexOf('{', start);
  const open = i;
  for (; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}' && --depth === 0) break;
  }
  try {
    // eslint-disable-next-line no-eval
    const S = eval('(' + src.slice(open, i + 1) + ')');
    return S.ar || null;
  } catch (e) {
    warn.push(`booking.html: could not parse S dictionary (${e.message})`);
    return null;
  }
}

/* ── 2. Collect the pages to mirror ─────────────────────────────────── */
function collectPages(dir = ROOT, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    const abs = path.join(dir, entry.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      collectPages(abs, acc);
    } else if (entry.name.endsWith('.html') && !EXCLUDE.has(rel)) {
      acc.push(rel);
    }
  }
  return acc;
}

/* ── 3. Path helpers ────────────────────────────────────────────────── */

/** 'treatments/body-shaping/tesla-former.html' -> '/treatments/body-shaping/tesla-former'
 *  'index.html' -> '/'    (cleanUrls is on in vercel.json) */
const cleanUrl = (rel) =>
  rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, '');

const enUrl = (rel) => SITE + cleanUrl(rel);
/* No trailing slash on the Arabic home URL: vercel.json sets trailingSlash:false,
   so /ar/ 308-redirects to /ar. A canonical or hreflang pointing at /ar/ would be
   pointing at a redirect. */
const arUrl = (rel) => SITE + '/ar' + (cleanUrl(rel) === '/' ? '' : cleanUrl(rel));

/** Resolve a relative href/src against the page's folder into a root-absolute
 *  path. The Arabic twin sits one directory deeper, so every relative link
 *  would otherwise resolve to the wrong place. */
function toRootAbsolute(value, pageRel) {
  const dir = path.posix.dirname('/' + pageRel);
  return path.posix.normalize(path.posix.join(dir, value));
}

const SKIP_PREFIX = /^(https?:|\/\/|#|mailto:|tel:|javascript:|data:|whatsapp:)/i;

/* ── 4. Convert one page ────────────────────────────────────────────── */
function buildArabicPage(rel, AR, EN) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const dom = new JSDOM(html);
  const { document } = dom.window;
  const stats = { translated: 0, missing: [] };

  /* 4a. Document language + direction, so it is correct with JS disabled */
  document.documentElement.setAttribute('lang', 'ar');
  document.documentElement.setAttribute('dir', 'rtl');
  if (document.body) document.body.setAttribute('dir', 'rtl');

  /* 4b. Bake in the translations */
  const put = (el, key, apply) => {
    const val = AR[key];
    if (val == null) {
      if (EN[key] != null) stats.missing.push(key);
      return;
    }
    apply(val);
    stats.translated++;
  };
  document.querySelectorAll('[data-i18n]').forEach((el) =>
    put(el, el.getAttribute('data-i18n'), (v) => { el.textContent = v; }));
  document.querySelectorAll('[data-i18n-html]').forEach((el) =>
    put(el, el.getAttribute('data-i18n-html'), (v) => { el.innerHTML = v; }));
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) =>
    put(el, el.getAttribute('data-i18n-placeholder'), (v) => el.setAttribute('placeholder', v)));

  /* 4b-ii. booking.html's own data-qz strings */
  if (QZ) {
    document.querySelectorAll('[data-qz]').forEach((el) => {
      const v = QZ[el.getAttribute('data-qz')];
      if (v != null) { el.innerHTML = v; stats.translated++; }
    });
  }

  /* 4b-iii. Legal pages hold both languages inline and reveal one with a
     class. Set it here so the correct language is visible without JS. */
  document.querySelectorAll('[data-legal-lang]').forEach((el) => {
    if (el.getAttribute('data-legal-lang') === 'ar') el.classList.add('legal-on');
    else el.remove();   // drop the English copy entirely from the Arabic twin
  });

  /* 4c. Title / meta description / OG / Twitter from their data-seo-ar twins */
  document.querySelectorAll('[data-seo-ar]').forEach((el) => {
    const v = el.getAttribute('data-seo-ar');
    if (!v) return;
    if (el.tagName === 'TITLE') el.textContent = v;
    else el.setAttribute('content', v);
  });
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute('content', 'ar_EG');
  const ogAlt = document.querySelector('meta[property="og:locale:alternate"]');
  if (ogAlt) ogAlt.setAttribute('content', 'en_US');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', arUrl(rel));

  /* 4d. Rewrite every relative link and asset reference.
         Pages point at their Arabic twin; assets point at the shared originals. */
  for (const [sel, attr] of [['[href]', 'href'], ['[src]', 'src']]) {
    document.querySelectorAll(sel).forEach((el) => {
      const v = el.getAttribute(attr);
      if (!v || SKIP_PREFIX.test(v)) return;
      if (v.startsWith('/')) return; // already root-absolute

      const [, pathPart, tail] = v.match(/^([^?#]*)([?#].*)?$/);
      if (!pathPart) return; // pure "?x" or "#y"
      const abs = toRootAbsolute(pathPart, rel);
      /* Internal links are extensionless now that cleanUrls is on, so a page is
         anything without a file extension (assets keep theirs: .css, .jpg, .js). */
      const isPage = /\.html$/.test(abs) || !/\.[a-z0-9]+$/i.test(abs);
      const arAbs = ('/ar' + abs).replace(/\/$/, '');  // '/ar/' would 308 to '/ar'
      el.setAttribute(attr, (isPage && !EXCLUDE.has(abs.slice(1)) ? arAbs : abs) + (tail || ''));
    });
  }

  /* 4d-ii. Inline CSS carries its own relative references, e.g.
     url('../../assets/images/hero.jpg') in a <style> block or a style="".
     Those break at the deeper /ar/ path, so resolve them to root-absolute. */
  const fixCss = (css) => css.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
    (whole, quote, url) => {
      if (SKIP_PREFIX.test(url) || url.startsWith('/')) return whole;
      return `url(${quote}${toRootAbsolute(url, rel)}${quote})`;
    });
  document.querySelectorAll('style').forEach((el) => { el.textContent = fixCss(el.textContent); });
  document.querySelectorAll('[style]').forEach((el) => {
    const v = el.getAttribute('style');
    if (v && v.includes('url(')) el.setAttribute('style', fixCss(v));
  });

  /* 4e. Canonical + hreflang */
  let canon = document.querySelector('link[rel="canonical"]');
  if (!canon) {
    canon = document.createElement('link');
    canon.setAttribute('rel', 'canonical');
    document.head.appendChild(canon);
  }
  canon.setAttribute('href', arUrl(rel));
  addHreflang(document, rel);

  /* 4f. Point JSON-LD at the Arabic URL and mark its language */
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try {
      const data = JSON.parse(s.textContent);
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== 'object') return;
        for (const k of Object.keys(node)) {
          if ((k === 'url' || k === '@id' || k === 'item') && typeof node[k] === 'string'
              && node[k].startsWith(SITE) && !node[k].startsWith(SITE + '/ar')) {
            node[k] = node[k].replace(SITE, SITE + '/ar').replace(/\/ar\/$/, '/ar');
          } else walk(node[k]);
        }
        if (node['@type'] && 'inLanguage' in node) node.inLanguage = 'ar';
      };
      walk(data);
      s.textContent = JSON.stringify(data);
    } catch {
      warn.push(`${rel}: JSON-LD did not parse, left unchanged`);
    }
  });

  /* 4g. Rebuild FAQPage from the now-Arabic accordion. The English block was
         copied along with the page, so it must be regenerated rather than
         URL-swapped, otherwise the Arabic page would carry English Q&A. */
  stats.faq = injectFaqSchema(document, arUrl(rel));

  return { html: '<!DOCTYPE html>\n' + document.documentElement.outerHTML, stats };
}

/* Insert the three hreflang tags, replacing any that already exist. */
function addHreflang(document, rel) {
  document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((n) => n.remove());
  const pairs = [
    ['en', enUrl(rel)],
    ['ar-EG', arUrl(rel)],
    ['x-default', enUrl(rel)],
  ];
  const canon = document.querySelector('link[rel="canonical"]');
  for (const [lang, href] of pairs) {
    const link = document.createElement('link');
    link.setAttribute('rel', 'alternate');
    link.setAttribute('hreflang', lang);
    link.setAttribute('href', href);
    canon && canon.parentNode
      ? canon.parentNode.insertBefore(link, canon.nextSibling)
      : document.head.appendChild(link);
  }
}

/* ── 5. Add hreflang to the English originals (they need it too) ────── */
function annotateEnglishPage(rel) {
  const file = path.join(ROOT, rel);
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  const { document } = dom.window;
  addHreflang(document, rel);
  /* NEVER remove content here. The English page is this build's input, so
     deleting the Arabic block would destroy it permanently on the next run.
     Only toggle visibility; the /ar twin is generated and safe to prune. */
  document.querySelectorAll('[data-legal-lang]').forEach((el) => {
    el.classList.toggle('legal-on', el.getAttribute('data-legal-lang') === 'en');
  });
  if (!CHECK_ONLY) {
    fs.writeFileSync(file, '<!DOCTYPE html>\n' + document.documentElement.outerHTML, 'utf8');
  }
}

/* ── 6. Sitemap with alternates for both languages ──────────────────── */
function writeSitemap(pages) {
  const today = new Date().toISOString().slice(0, 10);
  const priority = (rel) =>
    rel === 'index.html' ? '1.0'
      : /^(privacy|terms|cookies|data-deletion)\.html$/.test(rel) ? '0.3'
      : rel.includes('/') ? '0.8' : '0.7';

  const entry = (loc, rel) =>
    `  <url>\n    <loc>${loc}</loc>\n` +
    `    <xhtml:link rel="alternate" hreflang="en" href="${enUrl(rel)}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="ar-EG" href="${arUrl(rel)}"/>\n` +
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl(rel)}"/>\n` +
    `    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n` +
    `    <priority>${priority(rel)}</priority>\n  </url>`;

  const listed = pages.filter((r) => !TEMPLATE_PAGES.has(r));
  const body = [
    ...listed.map((r) => entry(enUrl(r), r)),
    ...listed.map((r) => entry(arUrl(r), r)),
  ].join('\n');

  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
    body + '\n</urlset>\n';

  if (!CHECK_ONLY) fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
  return listed.length * 2;
}

/* ── 7. Run ─────────────────────────────────────────────────────────── */
const T = loadTranslations();
const QZ = loadBookingStrings();
const pages = collectPages().sort();
log(`Arabic dictionary : ${Object.keys(T.ar).length} keys`);
log(`Pages to mirror   : ${pages.length}`);
if (CHECK_ONLY) log('(--check: nothing will be written)\n');

/* /ar is NEVER deleted. Earlier versions wiped and recreated it, which would
   destroy any Arabic page added by hand. This build only overwrites the files
   it generates; everything else in /ar is left exactly as it is and reported
   at the end so nothing disappears silently. */
const generated = new Set(pages.map((r) => path.join(OUT_DIR, r)));
function existingArFiles(dir = OUT_DIR, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) existingArFiles(abs, acc);
    else acc.push(abs);
  }
  return acc;
}
const preserved = existingArFiles().filter((f) => !generated.has(f));

let totalTranslated = 0;
const missingKeys = new Set();

for (const rel of pages) {
  const { html, stats } = buildArabicPage(rel, T.ar, T.en);
  totalTranslated += stats.translated;
  stats.missing.forEach((k) => missingKeys.add(k));

  if (!CHECK_ONLY) {
    const dest = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, html, 'utf8');
  }
  annotateEnglishPage(rel);
  log(`  ar/${rel.padEnd(48)} ${String(stats.translated).padStart(4)} strings` +
      (stats.faq ? `  ${String(stats.faq).padStart(2)} FAQ` : '') +
      (stats.missing.length ? `  (${stats.missing.length} untranslated)` : ''));
}

const urls = writeSitemap(pages);

log(`\n${'─'.repeat(62)}`);
log(`Arabic pages written : ${pages.length}`);
if (preserved.length) {
  log(`Left untouched in /ar : ${preserved.length} file(s) not produced by this build`);
  preserved.slice(0, 10).forEach((f) => log(`  · ${path.relative(ROOT, f)}`));
  if (preserved.length > 10) log(`  … and ${preserved.length - 10} more`);
}
log(`Strings baked in     : ${totalTranslated}`);
log(`Sitemap URLs         : ${urls}  (${urls / 2} en + ${urls / 2} ar; ${TEMPLATE_PAGES.size} templates generated but not listed)`);
if (missingKeys.size) {
  log(`\nKeys with no Arabic translation (${missingKeys.size}) — these stay English:`);
  [...missingKeys].slice(0, 40).forEach((k) => log(`  · ${k}`));
  if (missingKeys.size > 40) log(`  … and ${missingKeys.size - 40} more`);
}
warn.forEach((w) => log(`WARN  ${w}`));
log(CHECK_ONLY ? '\nCheck complete. Nothing written.' : '\nDone.');
