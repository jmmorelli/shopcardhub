#!/usr/bin/env node
/*
 * build-footer.js — single-source site footer for ShopCardHub (Cupertino run 3, Nov 2 2026).
 * DESIGN-SYSTEM.md "Footer"; R46 (Mo, Oct 30 2026: dark, Apple-calm, system font).
 *
 * Rewrites the inside of every top-level *.html page's <footer> between the marker comments:
 *     <footer><!-- FOOTER:START … -->  …generated…  <!-- FOOTER:END --></footer>
 * The markers sit inside <footer> so generators that copy a shell page's `<footer>…</footer>` carry the block whole.
 *
 * What a footer holds, top to bottom:
 *   1. one plain line about the site;
 *   2. a five-column directory (Indices · Pokémon · Sports · Tools · About); on phones each column is a
 *      native <details> row (a 4-line inline script closes them under 735 px; with no JS they stay open);
 *   3. any link the page's old footer had that the directory does not ("More: …"), so no footer link is lost;
 *   4. the page's own note (affiliate disclosure, sources, "not affiliated with …") carried VERBATIM;
 *   5. the legal row: wordmark (home link), © line, About, Affiliate disclosure, Privacy policy.
 *
 * First run (no markers): reads the page's existing <footer> (any of its three hand-written shapes), keeps its note
 * (the text after the © line) and its extra links, and replaces the inside. A page with no footer gets one before
 * </body> with the one sentence every footer shares ("ShopCardHub participates in the eBay Partner Network.").
 * Re-runs read the note and extras back out of the generated block (data-foot="note" / data-foot="also"), so the
 * page's own text survives every rebuild. Look lives in css/site-fixes.css §0b.
 *
 * Never changes a price, date, data-* value, EPN link or the note text. Zero dependencies.
 * Run from the repo root:  node tools/build-footer.js        Flags: --check (report only)   [paths…] (limit the run)
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename } from 'node:path';
import { FOOTER_END } from './lib/footer.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const explicit = args.filter((a) => !a.startsWith('--'));
const SKIP = new Set(['card-dungeon.html']);   // internal dashboard, no site chrome (same as build-nav)

const X = 'https://twitter.com/shopcardhub';
const ABOUT_LINE = 'One price index per set for Pokémon and Bowman cards, built from recent sales.';
const DEFAULT_NOTE = 'ShopCardHub participates in the eBay Partner Network.';

// The directory. Labels are the pages' own names (nav.json / the old footers), in sentence case.
const DIR = [
  ['Indices', [
    ['/indices', 'All set indices'],
    ['/destined-rivals-index', 'Destined Rivals'],
    ['/prismatic-evolutions-index', 'Prismatic Evolutions'],
    ['/chaos-rising-index', 'Chaos Rising'],
    ['/pitch-black-index', 'Pitch Black'],
    ['/bowman-1st-chrome-index', '1st Bowman Autos'],
    ['/how-prices-work', 'How the indices are priced'],
  ]],
  ['Pokémon', [
    ['/pokemon-tcg-2026', '2026 Pokémon TCG guide'],
    ['/pokemon-30th-anniversary-2026', '30th Celebration'],
    ['/pitch-black-set-guide', 'Pitch Black guide'],
    ['/pitch-black-vs-chaos-rising', 'Pitch Black vs Chaos Rising'],
    ['/cards', 'Card charts'],
  ]],
  ['Sports', [
    ['/bowman-bangers', 'Bowman Bangers'],
    ['/mlb-cards', 'MLB cards'],
    ['/bowman-football', 'Bowman Football'],
    ['/cooper-flagg-rookie-cards', 'Cooper Flagg rookie cards'],
    ['/nfl-rookie-cards-2026', '2026 NFL rookie guide'],
    ['/world-cup-2026-soccer-cards', 'World Cup 2026 cards'],
  ]],
  ['Tools', [
    ['/best-hobby-boxes-2026', 'Best hobby boxes 2026'],
    ['/watchlist', 'Watchlist'],
    ['/deals', 'Deals'],
    ['/auctions', 'Auction desk'],
    ['/release-calendar', 'Release calendar'],
    ['/psa-grading-guide', 'PSA grading guide'],
    ['/tag-grading-guide', 'TAG grading guide'],
  ]],
  ['About', [
    ['/about', 'About ShopCardHub'],
    ['/research', 'All guides'],
    ['/track-record', 'Track record'],
    ['/#newsletter', 'Tuesday Tape'],
    [X, '@shopcardhub on X', true],
  ]],
];
const LEGAL = [['/about', 'About'], ['/affiliate-disclosure', 'Affiliate disclosure'], ['/privacy', 'Privacy policy']];

const normHref = (h) => { const s = String(h).trim().replace(/^https?:\/\/(www\.)?shopcardhub\.com/i, '') || '/'; return s.length > 1 ? s.replace(/\/$/, '') : s; };
const COVERED = new Set(['/', ...DIR.flatMap(([, ls]) => ls.map(([h]) => normHref(h))), ...LEGAL.map(([h]) => h)]);
const plain = (s) => String(s).replace(/<[^>]+>/g, '').replace(/\p{Extended_Pictographic}\uFE0F?/gu, '').replace(/\s+/g, ' ').trim();
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}="([^"]*)"`, 'i')); return m ? m[1] : null; };

/* ---------- read what a page's footer carries ---------- */
function anchors(html) {
  const out = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = attr(m[1], 'href');
    if (href) out.push({ href, label: plain(m[2]), target: attr(m[1], 'target'), rel: attr(m[1], 'rel') });
  }
  return out;
}

// Old hand-written footer → { note, extras }. The note is everything in .footer-copy after the "©" line.
function readOld(inner) {
  let note = '', rest = inner;
  const cm = inner.match(/<(div|p)\s+class="footer-copy"[^>]*>([\s\S]*?)<\/\1>/i);
  if (cm) {
    const segs = cm[2].split(/<br\s*\/?>/i);
    const ci = segs.findIndex((s) => s.includes('©'));
    const noteSegs = ci >= 0 ? segs.slice(ci + 1) : segs.slice(-1);
    note = noteSegs.join('<br>').replace(/\s+/g, ' ').trim();
    const head = ci >= 0 ? segs.slice(0, ci + 1).join(' ') : segs.slice(0, -1).join(' ');
    rest = inner.replace(cm[0], head);   // links in the note stay in the note
  }
  return { note, extras: extrasFrom(anchors(rest)) };
}

// Generated block → { note, extras } (re-run).
function readGenerated(block) {
  const nm = block.match(/<div class="ds-foot-note" data-foot="note">([\s\S]*?)<\/div>/);
  const am = block.match(/<div class="ds-foot-also" data-foot="also">([\s\S]*?)<\/div>/);
  return { note: nm ? nm[1].trim() : '', extras: am ? extrasFrom(anchors(am[1])) : [] };
}

function extrasFrom(list) {
  const seen = new Set(), out = [];
  for (const a of list) {
    const k = normHref(a.href);
    if (COVERED.has(k) || seen.has(k)) continue;
    seen.add(k); out.push(a);
  }
  return out;
}

/* ---------- render ---------- */
const esc = (s) => String(s).replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ext = (a) => (a.target ? ` target="${a.target}"` : '') + (a.rel ? ` rel="${a.rel}"` : '');

function render({ note, extras }) {
  // No per-page "current" mark: card pages, the card template, auctions, deals and grade premiums copy their footer
  // from how-prices-work.html, so a per-page attribute would travel to ~640 other pages.
  const cols = DIR.map(([label, links]) =>
    `<details class="ds-foot-col" open><summary>${label}</summary><div class="ds-foot-list">` +
    links.map(([h, l, x]) => `<a href="${h}"${x ? ' target="_blank" rel="noopener"' : ''}>${l}</a>`).join('') +
    `</div></details>`).join('\n    ');
  const also = extras.length
    ? `\n  <div class="ds-foot-also" data-foot="also">More: ${extras.map((a) => `<a href="${a.href}"${ext(a)}>${esc(a.label)}</a>`).join(' · ')}</div>`
    : '';
  const legal = LEGAL.map(([h, l]) => `<a href="${h}">${l}</a>`).join('');
  return `<!-- FOOTER:START — site footer, generated by tools/build-footer.js (DESIGN-SYSTEM.md "Footer"). Do not hand-edit: the note below is this page's own text, carried on every rebuild. -->
<div class="ds-foot">
  <div class="ds-foot-about">${ABOUT_LINE}</div>
  <div class="ds-foot-dir" role="navigation" aria-label="Site directory">
    ${cols}
  </div>${also}
  <div class="ds-foot-note" data-foot="note">${note || DEFAULT_NOTE}</div>
  <div class="ds-foot-legal"><a href="/" class="ds-foot-mark">ShopCardHub</a><span>© 2026 ShopCardHub · shopcardhub.com</span>${legal}</div>
</div>
<script>(function(){var m=window.matchMedia&&matchMedia('(max-width:734px)');if(!m)return;function s(){var d=document.querySelectorAll('.ds-foot-col');for(var i=0;i<d.length;i++)d[i].open=!m.matches;}s();if(m.addEventListener)m.addEventListener('change',s);})();</script>
${FOOTER_END}`;
}

/* ---------- per page ---------- */
const GEN_RE = /<footer>\s*(<!-- FOOTER:START[\s\S]*?<!-- FOOTER:END -->)\s*<\/footer>/;

function processPage(page, html) {
  const g = html.match(GEN_RE);
  if (g) {
    const block = render(readGenerated(g[1]));
    return { html: html.replace(g[0], () => `<footer>${block}</footer>`), how: 'rewrite' };
  }
  const all = [...html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)];
  if (all.length) {
    const m = all[all.length - 1];
    const block = render(readOld(m[1]));
    const at = m.index;
    return { html: html.slice(0, at) + `<footer>${block}</footer>` + html.slice(at + m[0].length), how: 'wrap' };
  }
  const bi = html.lastIndexOf('</body>');
  if (bi < 0) return { html, how: 'skip (no </body>)' };
  const block = render({ note: '', extras: [] });
  return { html: html.slice(0, bi) + `<footer>${block}</footer>\n` + html.slice(bi), how: 'add' };
}

const files = explicit.length
  ? explicit.map((f) => basename(f))
  : readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.has(f)).sort();

const tally = {};
let written = 0;
for (const f of files) {
  const p = join(ROOT, f);
  const orig = readFileSync(p, 'utf8');
  const { html, how } = processPage(f, orig);
  tally[how] = (tally[how] || 0) + 1;
  if (html !== orig) { written++; if (!CHECK_ONLY) writeFileSync(p, html); }
}
console.log(`build-footer: ${written} ${CHECK_ONLY ? 'would change' : 'written'} · ${Object.entries(tally).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
