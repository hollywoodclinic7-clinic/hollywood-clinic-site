#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   verify.mjs — run before pushing

   Catches the classes of breakage that are invisible in the source but
   obvious in a browser, without needing a browser. Written after a real
   regression: adding `defer` to i18n-core.js but not main.js reordered
   script execution, i18n rebuilt document.body.innerHTML after main.js had
   already registered its scroll-reveal observer, and every page rendered
   blank below the header.

     cd tools && node verify.mjs

   Exits non-zero if anything fails, so it can gate a deploy.
   ══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = ['.git', 'admin', 'node_modules', 'tools', 'backend', 'templates', 'seo-autoblog'];

let failures = 0, warnings = 0;
const fail = (msg) => { failures++; console.log(`  FAIL  ${msg}`); };
const warn = (msg) => { warnings++; console.log(`  WARN  ${msg}`); };
const pass = (msg) => console.log(`  ok    ${msg}`);

function pages(dir = ROOT, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.includes(e.name)) pages(abs, acc); }
    else if (e.name.endsWith('.html')) acc.push(abs);
  }
  return acc;
}

const all = pages();
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');
console.log(`\nChecking ${all.length} pages\n`);

/* ── 1. Script order and defer consistency ──────────────────────────────
   i18n injects the navbar and footer by rewriting body.innerHTML. main.js
   then attaches observers and handlers to the resulting DOM. If i18n runs
   AFTER main.js, everything main.js registered is thrown away. Mixing defer
   between the two silently flips that order. */
console.log('1. script execution order (i18n before main, neither deferred)');
let orderBad = 0;
for (const f of all) {
  const s = fs.readFileSync(f, 'utf8');
  const i18n = s.match(/<script src="[^"]*i18n(?:-core)?\.js"([^>]*)>/);
  const main = s.match(/<script src="[^"]*main\.js"([^>]*)>/);
  if (!i18n || !main) { warn(`${rel(f)}: missing i18n or main.js`); continue; }
  const iDefer = /defer/.test(i18n[1]), mDefer = /defer/.test(main[1]);
  if (iDefer) {
    // i18n rebuilds document.body.innerHTML to inject nav/footer. Deferring it
    // makes that happen AFTER inline scripts and main.js have captured element
    // references, which then point at detached nodes: blank pages, blog posts
    // stuck on "Loading post...". It must run in document order.
    fail(`${rel(f)}: i18n is deferred — it rebuilds body.innerHTML, so deferring it detaches elements other scripts already grabbed`);
    orderBad++;
  } else if (mDefer) {
    fail(`${rel(f)}: main.js deferred while i18n is not — execution order flips`);
    orderBad++;
  } else if (s.indexOf(i18n[0]) > s.indexOf(main[0])) {
    fail(`${rel(f)}: main.js appears before i18n`);
    orderBad++;
  }
}
if (!orderBad) pass(`all ${all.length} pages load i18n then main, in order, undeferred`);

/* ── 2. Referenced local files actually exist ───────────────────────── */
console.log('\n2. local references resolve');
const missing = new Set();
for (const f of all) {
  const s = fs.readFileSync(f, 'utf8');
  for (const m of s.matchAll(/(?:src|href)="([^"]+)"/g)) {
    const v = m[1];
    if (/^(https?:|\/\/|#|mailto:|tel:|data:|javascript:)/i.test(v)) continue;
    if (v.includes('${') || v.includes("'+") || v.includes('+ ')) continue; // JS template/concat, not a real path
    const clean = v.split(/[?#]/)[0];
    if (!clean || !/\.(js|css|jpg|jpeg|png|webp|svg|ico|json|txt|xml|mp4|html)$/i.test(clean)) continue;
    const target = clean.startsWith('/')
      ? path.join(ROOT, clean.slice(1))
      : path.resolve(path.dirname(f), clean);
    if (!fs.existsSync(target)) missing.add(`${rel(f)} -> ${v}`);
  }
}
missing.size ? [...missing].slice(0, 12).forEach(fail) : pass('every referenced asset and page exists');
if (missing.size > 12) fail(`… and ${missing.size - 12} more`);

/* ── 3. JSON-LD parses ──────────────────────────────────────────────── */
console.log('\n3. structured data parses');
let ld = 0, ldBad = 0;
for (const f of all) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    ld++;
    try { JSON.parse(m[1]); } catch { ldBad++; fail(`${rel(f)}: invalid JSON-LD`); }
  }
}
if (!ldBad) pass(`${ld} JSON-LD blocks, all valid`);

/* ── 4. Every English page has an Arabic twin ───────────────────────── */
console.log('\n4. english / arabic parity');
const en = all.filter((f) => !rel(f).startsWith('ar/'));
const orphans = en.filter((f) => !fs.existsSync(path.join(ROOT, 'ar', rel(f))));
orphans.length
  ? orphans.forEach((f) => fail(`${rel(f)} has no Arabic twin — run npm run build:ar`))
  : pass(`${en.length} pages, each with an /ar twin`);

/* ── 5. Arabic pages are actually Arabic ────────────────────────────── */
console.log('\n5. arabic pages carry arabic');
let thin = 0;
for (const f of all.filter((f) => rel(f).startsWith('ar/'))) {
  const s = fs.readFileSync(f, 'utf8');
  if (!/<html[^>]*lang="ar"/.test(s)) { fail(`${rel(f)}: not lang="ar"`); thin++; continue; }
  const runs = (s.match(/[\u0600-\u06FF]+/g) || []).length;
  if (runs < 40 && !/(profile|post|service|department|treatment)\.html$/.test(rel(f))) {
    warn(`${rel(f)}: only ${runs} Arabic runs — may not have been generated`); thin++;
  }
}
if (!thin) pass('all Arabic pages are lang="ar" with real Arabic content');

/* ── 6. Sitemap ─────────────────────────────────────────────────────── */
console.log('\n6. sitemap');
const sm = path.join(ROOT, 'sitemap.xml');
if (!fs.existsSync(sm)) fail('sitemap.xml missing');
else {
  const s = fs.readFileSync(sm, 'utf8');
  const locs = [...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const dupes = locs.length - new Set(locs).size;
  dupes ? fail(`${dupes} duplicate URLs in sitemap`) : pass(`${locs.length} URLs, no duplicates`);
}

/* ── 7. Supabase key — the one that breaks bookings silently ────────── */
console.log('\n7. supabase key');
const cfg = path.join(ROOT, 'assets/js/supabase-config.js');
if (fs.existsSync(cfg)) {
  const s = fs.readFileSync(cfg, 'utf8');
  if (/PASTE_YOUR_SUPABASE_ANON_KEY_HERE/.test(s)) {
    fail('anon key is still the placeholder — bookings, reviews and the dashboard will fail silently');
  } else if (/SUPABASE_ANON_KEY\s*=\s*"eyJ/.test(s)) pass('anon key present');
  else warn('anon key looks unusual — check it');
}

console.log(`\n${'─'.repeat(58)}`);
console.log(failures ? `${failures} FAILURE(S), ${warnings} warning(s) — do not push` : `All checks passed${warnings ? `, ${warnings} warning(s)` : ''}`);
console.log('Browser check still needed: scroll one page top to bottom and confirm content fades in.\n');
process.exit(failures ? 1 : 0);
