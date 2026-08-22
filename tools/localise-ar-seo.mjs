#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   localise-ar-seo.mjs — retarget Arabic titles/descriptions to Heliopolis

   The Arabic titles read "... في مصر" — in Egypt. On a young domain that
   competes nationally against every clinic in the country. "في مصر الجديدة"
   is the neighbourhood the clinic actually serves, has a fraction of the
   competition, and matches how people search for a local clinic.

   Edits the data-seo-ar attributes on the ENGLISH pages (the build inputs),
   so the change flows into /ar on the next build. English titles are left
   completely alone.

   Titles are kept under 60 characters and descriptions under 155 — the
   points where Google truncates. When adding the neighbourhood would push a
   title over, the trailing brand is dropped: the domain already says it.

     node localise-ar-seo.mjs --check   # table of proposed changes, writes nothing
     node localise-ar-seo.mjs           # apply
   ══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK_ONLY = process.argv.includes('--check');

const TITLE_MAX = 60;
const DESC_MAX = 155;

const NATIONAL = 'في مصر';
const LOCAL = 'في مصر الجديدة';
const BRAND_SUFFIXES = [' | هوليوود كلينك', ' — هوليوود كلينك', ' | هوليوود كلينك مصر'];

const EXCLUDE_DIRS = ['.git', 'admin', 'ar', 'node_modules', 'assets', 'backend', 'api', 'tools'];

function collect(dir = ROOT, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (!EXCLUDE_DIRS.includes(e.name)) collect(abs, acc); }
    else if (e.name.endsWith('.html')) acc.push(path.relative(ROOT, abs).split(path.sep).join('/'));
  }
  return acc;
}

/** Already local, or no national phrase to upgrade? Leave it alone. */
const needsWork = (s) => s && s.includes(NATIONAL) && !s.includes('مصر الجديدة');

/** Insert the neighbourhood, then shorten until it fits. */
function localise(text, max) {
  let out = text.replace(NATIONAL, LOCAL);
  if (out.length <= max) return out;
  for (const suffix of BRAND_SUFFIXES) {
    if (out.endsWith(suffix)) {
      const trimmed = out.slice(0, -suffix.length);
      if (trimmed.length <= max) return trimmed;
      out = trimmed;
      break;
    }
  }
  return out;
}

const rows = [];
let changed = 0;

for (const rel of collect().sort()) {
  const file = path.join(ROOT, rel);
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  const { document } = dom.window;
  let touched = false;

  // <title data-seo-ar="...">
  const titleEl = document.querySelector('title');
  if (titleEl) {
    const ar = titleEl.getAttribute('data-seo-ar');
    if (needsWork(ar)) {
      const next = localise(ar, TITLE_MAX);
      if (next !== ar) {
        titleEl.setAttribute('data-seo-ar', next);
        rows.push([rel, 'title', ar, next]);
        touched = true;
      }
    }
  }

  // every meta carrying an Arabic twin (description, og:*, twitter:*)
  document.querySelectorAll('meta[data-seo-ar]').forEach((m) => {
    const ar = m.getAttribute('data-seo-ar');
    if (!needsWork(ar)) return;
    const isTitleish = /title/i.test(m.getAttribute('property') || m.getAttribute('name') || '');
    const next = localise(ar, isTitleish ? TITLE_MAX : DESC_MAX);
    if (next === ar) return;
    m.setAttribute('data-seo-ar', next);
    rows.push([rel, m.getAttribute('property') || m.getAttribute('name'), ar, next]);
    touched = true;
  });

  if (touched) {
    changed++;
    if (!CHECK_ONLY) {
      fs.writeFileSync(file, '<!DOCTYPE html>\n' + document.documentElement.outerHTML, 'utf8');
    }
  }
}

const seen = new Set();
for (const [rel, field, before, after] of rows) {
  if (field !== 'title') continue;
  if (seen.has(rel)) continue;
  seen.add(rel);
  console.log(`  ${rel}`);
  console.log(`     before [${String(before.length).padStart(2)}] ${before}`);
  console.log(`     after  [${String(after.length).padStart(2)}] ${after}`);
}

console.log('\n' + '─'.repeat(62));
console.log(`Pages changed  : ${changed}`);
console.log(`Tags rewritten : ${rows.length}`);
const over = rows.filter(([, f, , a]) => f === 'title' && a.length > TITLE_MAX);
console.log(`Titles still over ${TITLE_MAX} chars: ${over.length}`);
over.forEach(([rel, , , a]) => console.log(`  · ${rel} [${a.length}] ${a}`));
console.log(CHECK_ONLY ? '\nCheck only. Nothing written.' : '\nDone. Run "npm run build:ar" to regenerate /ar.');
