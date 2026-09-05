/* ══════════════════════════════════════════════════════════════════════
   faq-schema.mjs — build FAQPage JSON-LD from the FAQ already on the page

   Shared by add-faq-schema.mjs (English pages) and build-ar.mjs (Arabic
   twins), so both languages get schema generated from their own rendered
   text. Nothing is invented: every question and answer is read out of the
   accordion that is already visible to the visitor, which is exactly what
   Google requires for FAQPage markup.

   Two accordion variants exist on this site:
     <details class="tf-item">  <summary><h3>Q</h3><svg/></summary>
                                <div class="tf-body"><p>A</p></div>
     <details class="faq-item"> <summary>Q</summary><p>A</p>
   ══════════════════════════════════════════════════════════════════════ */

/** Collapse whitespace and drop anything an SVG chevron leaves behind. */
const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

/**
 * Find the <section> that holds the real FAQ.
 * `tf-acc` is reused for non-FAQ accordions elsewhere on treatment pages,
 * so anchoring on the FAQ heading is the only reliable way in.
 */
function findFaqSections(document) {
  const sections = new Set();

  // Preferred: the translation key ends in .faq.title / .faq.eyebrow
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    if (/\.faq\.(title|eyebrow)$/.test(el.getAttribute('data-i18n'))) {
      const sec = el.closest('section');
      if (sec) sections.add(sec);
    }
  });

  // Fallback for any page without those keys
  if (!sections.size) {
    document.querySelectorAll('h2, h3').forEach((h) => {
      if (/frequently asked|الأسئلة الشائعة/i.test(clean(h.textContent))) {
        const sec = h.closest('section');
        if (sec) sections.add(sec);
      }
    });
  }
  return [...sections];
}

/** Pull {question, answer} pairs out of one FAQ section. */
function extractPairs(section) {
  const out = [];
  section.querySelectorAll('details').forEach((d) => {
    const summary = d.querySelector('summary');
    if (!summary) return;

    // Question: the heading inside summary if present, else summary itself.
    const qEl = summary.querySelector('h3, h4');
    const question = clean(qEl ? qEl.textContent : summary.textContent);

    // Answer: everything in the details except the summary.
    const parts = [];
    d.childNodes.forEach((n) => {
      if (n.nodeType === 1 && n.tagName === 'SUMMARY') return;
      const t = clean(n.textContent);
      if (t) parts.push(t);
    });
    const answer = clean(parts.join(' '));

    // Skip anything malformed rather than emitting junk schema.
    if (question.length < 3 || answer.length < 10) return;
    out.push({ question, answer });
  });
  return out;
}

/**
 * Inject (or replace) a FAQPage block on the document.
 * @returns {number} how many Q&A pairs were written; 0 means no FAQ found.
 */
export function injectFaqSchema(document, pageUrl) {
  // Remove any FAQPage we produced on a previous run so this stays idempotent.
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    if (/"FAQPage"/.test(s.textContent)) s.remove();
  });

  const pairs = [];
  for (const sec of findFaqSections(document)) pairs.push(...extractPairs(sec));

  // Drop duplicate questions, keeping the first.
  const seen = new Set();
  const unique = pairs.filter((p) => {
    const k = p.question.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  if (!unique.length) return 0;

  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: unique.map((p) => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  };
  if (pageUrl) data['@id'] = pageUrl + '#faq';

  const script = document.createElement('script');
  script.setAttribute('type', 'application/ld+json');
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
  return unique.length;
}
