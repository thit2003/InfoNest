const linkifyIt = require('linkify-it');

// Basic engine: add .au TLD recognition (second param true = keep defaults + add)
const engine = linkifyIt().tlds(['au'], true);

// Map exact URLs to nicer labels
const KNOWN_LABELS = {
  'https://registrar.au.edu/news/all/': 'Registrar News & Updates'
};

function escapeHtml(s) {
  return s
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

/**
 * Convert plain text to HTML with clickable links.
 * Only http/https are recognized (default).
 */
function linkifyText(text) {
  if (!text) return '';
  let matches;
  try {
    matches = engine.match(text);
  } catch (err) {
    console.warn('linkify-it match failed, falling back to escaped text:', err);
    return escapeHtml(text);
  }
  if (!matches) return escapeHtml(text);

  let lastIndex = 0;
  let out = '';
  for (const m of matches) {
    out += escapeHtml(text.slice(lastIndex, m.index));
    lastIndex = m.lastIndex;
    const url = m.url;
    const label = escapeHtml(KNOWN_LABELS[url] || url);
    out += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${label}</a>`;
  }
  out += escapeHtml(text.slice(lastIndex));
  return out;
}

module.exports = { linkifyText };