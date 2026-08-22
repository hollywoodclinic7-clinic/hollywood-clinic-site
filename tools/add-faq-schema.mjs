#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════
   add-faq-schema.mjs — add FAQPage JSON-LD to the English pages

   The site has FAQ accordions on ~31 pages and none of them carried
   FAQPage markup, so Google could not surface them as rich results and
   AI answer engines had no structured Q&A to lift.

   Every question and answer is read from the accordion already on the
   page. Google requires FAQPage content to be visible to visitors, so
   nothing here is invented or hidden.

   Run AFTER editing English content, and BEFORE build-ar.mjs (the Arabic
   twins regenerate their own schema from the translated text).

     node add-faq-schema.mjs
     node add-faq-schema.mjs --check
   ══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { injectFaqSchema } from './faq-schema.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://www.hollywoodclinics.net';
const CHECK_ONLY = process.argv.includes('--check');

const EXCLUDE_DIRS = ['.git', 'admin', 'ar', 'node_modules', 'assets', 'backend', 'api', 'tools'];
const EXCLUDE = new Set([
  'doctors/profile.html',
  'treatments/department.html',
  'treatments/treatment.html',
  'treatments/service.html',
  'blog/post.html',
]);

const cleanUrl = (rel) => (rel === 'index.html' ? '/' : '/' + rel.replace(/\.html$/, ''));

function collect(dir = ROOT, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name.startsWith('_')) continue;
    const abs = path.join(dir, e.name);
    const rel = path.relative(ROOT, abs).split(path.sep).join('/');
    if (e.isDirectory()) {
      if (!EXCLUDE_DIRS.includes(e.name)) collect(abs, acc);
    } else if (e.name.endsWith('.html') && !EXCLUDE.has(rel)) acc.push(rel);
  }
  return acc;
}

const pages = collect().sort();
let withFaq = 0, totalPairs = 0;

for (const rel of pages) {
  const file = path.join(ROOT, rel);
  const dom = new JSDOM(fs.readFileSync(file, 'utf8'));
  const n = injectFaqSchema(dom.window.document, SITE + cleanUrl(rel));
  if (!n) continue;
  withFaq++; totalPairs += n;
  console.log(`  ${rel.padEnd(50)} ${String(n).padStart(3)} Q&A`);
  if (!CHECK_ONLY) {
    fs.writeFileSync(file, '<!DOCTYPE html>\n' + dom.window.document.documentElement.outerHTML, 'utf8');
  }
}

console.log('\n' + '─'.repeat(60));
console.log(`Pages scanned        : ${pages.length}`);
console.log(`Pages given FAQPage  : ${withFaq}`);
console.log(`Q&A pairs marked up  : ${totalPairs}`);
console.log(CHECK_ONLY ? '\nCheck only. Nothing written.' : '\nDone.');
