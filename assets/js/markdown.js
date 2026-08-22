/* ===========================================================
   Tiny Markdown Parser
   Handles: headings, bold, italic, links, lists, blockquotes,
   images, paragraphs, hr, code (inline).
   No external dependencies. ~2KB.
   =========================================================== */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseFrontMatter(md) {
  // Normalise before matching. Bodies coming from the database arrive with
  // CRLF line endings, a UTF-8 BOM or a leading blank line often enough that
  // a strict /^---\n/ silently fails — and then the YAML block renders as
  // article text, with the underscores in keys like title_en turning into
  // italics. Tolerate all three.
  const src = String(md == null ? '' : md)
    .replace(/^\uFEFF/, '')
    .replace(/\r\n?/g, '\n');
  const m = src.match(/^\s*---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!m) return { meta: {}, body: src };
  const meta = {};
  m[1].split('\n').forEach((line) => {
    const idx = line.indexOf(':');
    if (idx > 0) {
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      meta[key] = value;
    }
  });
  return { meta, body: src.slice(m[0].length) };
}

function parseMarkdown(md) {
  const { meta, body } = parseFrontMatter(md);
  const lines = body.split('\n');
  let html = '';
  let i = 0;
  let inList = false;
  let listType = '';
  let inBlockquote = false;
  let paragraph = [];

  function flushParagraph() {
    if (paragraph.length) {
      html += '<p>' + processInline(paragraph.join(' ')) + '</p>\n';
      paragraph = [];
    }
  }
  function closeList() {
    if (inList) {
      html += `</${listType}>\n`;
      inList = false;
      listType = '';
    }
  }
  function closeBlockquote() {
    if (inBlockquote) {
      html += '</blockquote>\n';
      inBlockquote = false;
    }
  }

  function processInline(text) {
    text = escapeHtml(text);
    // images: ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
    // links: [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    // bold: **text** or __text__
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // italic: *text* or _text_
    text = text.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
    text = text.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>');
    // inline code: `code`
    text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
    return text;
  }

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (trimmed === '') {
      flushParagraph();
      closeList();
      closeBlockquote();
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(trimmed)) {
      flushParagraph();
      closeList();
      closeBlockquote();
      html += '<hr>\n';
      i++;
      continue;
    }

    // Headings
    const h = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushParagraph();
      closeList();
      closeBlockquote();
      const level = h[1].length;
      html += `<h${level}>${processInline(h[2])}</h${level}>\n`;
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      closeList();
      if (!inBlockquote) {
        html += '<blockquote>\n';
        inBlockquote = true;
      }
      const content = trimmed.replace(/^>\s?/, '');
      html += '<p>' + processInline(content) + '</p>\n';
      i++;
      continue;
    } else if (inBlockquote) {
      closeBlockquote();
    }

    // Unordered list
    const ul = trimmed.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      flushParagraph();
      if (!inList || listType !== 'ul') {
        closeList();
        html += '<ul>\n';
        inList = true;
        listType = 'ul';
      }
      html += '<li>' + processInline(ul[1]) + '</li>\n';
      i++;
      continue;
    }

    // Ordered list
    const ol = trimmed.match(/^\d+\.\s+(.*)$/);
    if (ol) {
      flushParagraph();
      if (!inList || listType !== 'ol') {
        closeList();
        html += '<ol>\n';
        inList = true;
        listType = 'ol';
      }
      html += '<li>' + processInline(ol[1]) + '</li>\n';
      i++;
      continue;
    } else if (inList) {
      closeList();
    }

    // Default: paragraph line
    paragraph.push(trimmed);
    i++;
  }

  flushParagraph();
  closeList();
  closeBlockquote();

  return { meta, html };
}

window.parseMarkdown = parseMarkdown;
