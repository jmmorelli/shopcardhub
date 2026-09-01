#!/usr/bin/env node
/*
 * apply-site-fixes.mjs — idempotent site-wide fixer for ShopCardHub pages.
 *
 *   node tools/apply-site-fixes.mjs [--check] [files...]
 *
 * Default file set: every top-level *.html in the repo except card-dungeon.html
 * (internal dashboard, no site chrome). Pass explicit paths to limit the run.
 * --check  reports what WOULD change and writes nothing.
 *
 * What it does to each page (each step is a no-op when already applied):
 *   1. <head>: adds  <meta name="view-transition" content="same-origin">
 *   2. <head>: replaces the render-blocking Google Fonts <link> (+ its preconnects)
 *      with the self-hosted /css/fonts.css sheet plus font preloads for Barlow 400
 *      (body face) and Barlow Condensed 800 (only when the page uses weight 800).
 *   3. <head>: appends <link rel="stylesheet" href="/css/site-fixes.css"> as the
 *      LAST stylesheet before </head> (contrast, reduced-motion, table scroll,
 *      min font-size on phones — see css/site-fixes.css).
 *   4. Swaps the eager  <script async src="…gtag/js?id=G-…">  loader for a lazy
 *      one: the dataLayer/gtag() stub stays inline so events queue, but the
 *      518 KB gtag.js is only injected after the first user interaction
 *      (pointerdown/keydown/scroll/touchstart) or requestIdleCallback(timeout 4s),
 *      whichever comes first.
 *   5. Wraps every <table> whose ancestors have no horizontal scroll container
 *      (overflow-x:auto|scroll via inline style or the page's own CSS) in
 *      <div class="tbl-scroll">. If the page's CSS puts a vertical margin on the
 *      table (bare `table {}` rule or a rule for one of the table's classes) the
 *      margin is moved to the wrapper so spacing/margin-collapsing is unchanged.
 *      Tables built inside <script> strings are not touched (fix those by hand).
 *
 * Zero dependencies. Safe to run repeatedly; prints a per-file change summary.
 *
 * Fonts: /fonts/*.woff2 are the latin subsets from Google Fonts css2 (Chrome UA),
 * css/fonts.css carries the @font-face rules with font-display:swap. Regenerate by
 * fetching the css2 URL with a Chrome user-agent and keeping only the blocks
 * whose subset comment reads "latin".
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const CHECK_ONLY = args.includes('--check');
const explicit = args.filter(a => !a.startsWith('--'));
const SKIP = new Set(['card-dungeon.html']);

const files = explicit.length
  ? explicit.map(f => resolve(process.cwd(), f))
  : readdirSync(ROOT).filter(f => f.endsWith('.html') && !SKIP.has(f)).sort().map(f => join(ROOT, f));

/* ------------------------------------------------------------------ */
/* constants                                                           */
/* ------------------------------------------------------------------ */
const GA_ID_DEFAULT = 'G-2Q52C5EKG7';
const VT_META = '<meta name="view-transition" content="same-origin">';
const FIXES_LINK = '<link rel="stylesheet" href="/css/site-fixes.css">';
const PRELOAD_BC800 = '<link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>';
const PRELOAD_B400 = '<link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>';
const FONTS_LINK = '<link rel="stylesheet" href="/css/fonts.css">';
// Barlow 400 is the body face on every page; Barlow Condensed 800 only where the
// page actually sets weight 800 (a preload that is never used just draws a warning).
const fontLinks = (html) => [
  ...(/font-weight\s*:\s*800\b/.test(html) ? [PRELOAD_BC800] : []),
  PRELOAD_B400,
  FONTS_LINK,
];

function gtagBlock(id, withStub) {
  const stub = withStub
    ? `    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', '${id}');
`
    : '';
  return `<!-- Google Analytics — gtag.js is deferred until first interaction or idle (tools/apply-site-fixes.mjs) -->
  <script data-gtag-deferred="${id}">
${stub}    (function(){
      var done = false;
      function load(){
        if (done) return; done = true;
        var s = document.createElement('script'); s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=${id}';
        document.head.appendChild(s);
      }
      var evs = ['pointerdown','keydown','scroll','touchstart'];
      function onEv(){ load(); evs.forEach(function(e){ window.removeEventListener(e, onEv); }); }
      evs.forEach(function(e){ window.addEventListener(e, onEv, { passive:true }); });
      // idle path is armed only once the page has finished loading, so gtag.js never
      // competes with first paint / the load event; interaction still fires it at once
      function idle(){ if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout:4000 }); else window.setTimeout(load, 4000); }
      if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
    })();
  </script>`;
}

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */
// indentation of the line that contains position `pos` (only if the text before
// pos on that line is whitespace), else null.
function lineIndent(html, pos) {
  const ls = html.lastIndexOf('\n', pos - 1) + 1;
  const before = html.slice(ls, pos);
  return /^[ \t]*$/.test(before) ? before : null;
}

function inlineStyles(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(m => m[1]).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '');
}

// yields {selectors:[...], decl:string} for every rule (media blocks are transparent)
function* cssRules(css) {
  const re = /([^{}]+)\{|\}/g; let m;
  while ((m = re.exec(css))) {
    if (m[0] === '}') continue;
    const sel = m[1].trim();
    if (sel.startsWith('@')) continue; // @media / @supports / @keyframes wrapper — recurse naturally
    const start = re.lastIndex; const end = css.indexOf('}', start);
    if (end < 0) return;
    const decl = css.slice(start, end); re.lastIndex = end + 1;
    yield { selectors: sel.split(',').map(s => s.trim()).filter(Boolean), decl };
  }
}

function lastCompound(sel) {
  // strip pseudo-elements/classes so ".foo:hover" -> ".foo"; take last compound
  const parts = sel.split(/\s*[>+~]\s*|\s+/).filter(Boolean);
  return parts[parts.length - 1].replace(/::?[a-zA-Z-]+(\([^)]*\))?/g, '');
}

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','source','track','wbr','param','keygen']);

function attrClasses(attrs) {
  const m = attrs.match(/\sclass\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return m ? (m[2] ?? m[3] ?? m[4]).split(/\s+/).filter(Boolean) : [];
}
function attrId(attrs) {
  const m = attrs.match(/\sid\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
  return m ? (m[2] ?? m[3] ?? m[4]) : null;
}
function attrStyle(attrs) {
  const m = attrs.match(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
  return m ? (m[2] ?? m[3]) : '';
}

/* ------------------------------------------------------------------ */
/* 1–3: head injections                                                */
/* ------------------------------------------------------------------ */
function fixHead(html, log) {
  const headEnd = html.search(/<\/head\s*>/i);
  if (headEnd < 0) { log.push('no </head> — head fixes skipped'); return html; }

  // 1. view-transition meta
  if (!/<meta\s+name=["']view-transition["']/i.test(html)) {
    const vp = html.match(/<meta\s+name=["']viewport["'][^>]*>/i);
    if (vp) {
      const at = vp.index + vp[0].length;
      const ind = lineIndent(html, vp.index);
      html = html.slice(0, at) + (ind !== null ? '\n' + ind : '') + VT_META + html.slice(at);
    } else {
      html = insertBeforeHeadEnd(html, VT_META);
    }
    log.push('+view-transition meta');
  }

  // 2. self-hosted fonts
  if (!html.includes('href="/css/fonts.css"')) {
    const gf = html.match(/<link[^>]*href=["']https:\/\/fonts\.googleapis\.com\/css2?[^"']*["'][^>]*>/i);
    if (gf) {
      const ind = lineIndent(html, gf.index);
      const sep = ind !== null ? '\n' + ind : '';
      const links = fontLinks(html);
      html = html.slice(0, gf.index) + links.join(sep) + html.slice(gf.index + gf[0].length);
      log.push(`fonts: Google Fonts link -> /css/fonts.css (+${links.length - 1} preload${links.length > 2 ? 's' : ''})`);
    } else {
      // no Google Fonts link: put the sheet before the first <style> in head, else before </head>
      const st = html.search(/<style[\s>]/i);
      const at = st >= 0 && st < html.search(/<\/head\s*>/i) ? st : null;
      const links = fontLinks(html);
      if (at !== null) {
        const ind = lineIndent(html, at);
        html = html.slice(0, at) + links.join(ind !== null ? '\n' + ind : '') + (ind !== null ? '\n' + ind : '') + html.slice(at);
      } else {
        html = insertBeforeHeadEnd(html, links.join('\n  '));
      }
      log.push(`fonts: added /css/fonts.css (+${links.length - 1} preload${links.length > 2 ? 's' : ''})`);
    }
  }
  // an unused Barlow Condensed 800 preload (page never sets weight 800) only draws a console warning
  if (!/font-weight\s*:\s*800\b/.test(html) && html.includes(PRELOAD_BC800)) {
    html = html.replace(new RegExp('[ \\t]*' + PRELOAD_BC800.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '[ \\t]*\\r?\\n?'), '');
    log.push('fonts: dropped unused Barlow Condensed 800 preload');
  }
  // drop Google Fonts preconnects (only meaningful with the remote stylesheet)
  const pcRe = /[ \t]*<link[^>]*rel=["']preconnect["'][^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com["'][^>]*>[ \t]*\r?\n?/gi;
  const pcRe2 = /[ \t]*<link[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com["'][^>]*rel=["']preconnect["'][^>]*>[ \t]*\r?\n?/gi;
  let n = 0;
  html = html.replace(pcRe, () => (n++, '')).replace(pcRe2, () => (n++, ''));
  if (n) log.push(`fonts: removed ${n} preconnect${n > 1 ? 's' : ''}`);

  // 3. site-fixes.css last in head
  if (!html.includes('href="/css/site-fixes.css"')) {
    html = insertBeforeHeadEnd(html, FIXES_LINK);
    log.push('+site-fixes.css');
  }
  return html;
}

function insertBeforeHeadEnd(html, tag) {
  const m = html.match(/<\/head\s*>/i);
  const ind = lineIndent(html, m.index);
  if (ind !== null) {
    // </head> is on its own line: put the tag on its own line, indented like the previous line
    const prevEnd = html.lastIndexOf('\n', m.index - ind.length - 1);
    const prevStart = html.lastIndexOf('\n', prevEnd - 1) + 1;
    const prevInd = (html.slice(prevStart, prevEnd).match(/^[ \t]*/) || [''])[0];
    return html.slice(0, m.index - ind.length) + prevInd + tag + '\n' + html.slice(m.index - ind.length);
  }
  return html.slice(0, m.index) + tag + html.slice(m.index);
}

/* ------------------------------------------------------------------ */
/* 4: deferred gtag loader                                             */
/* ------------------------------------------------------------------ */
function fixGtag(html, log) {
  const re = /(<!--\s*Google Analytics\s*-->\s*)?<script\s+async\s+src=["']https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=(G-[A-Z0-9]+)["']\s*><\/script>(\s*<script>\s*window\.dataLayer\s*=[\s\S]*?<\/script>)?/i;
  const m = html.match(re);
  if (!m) {
    // already deferred: refresh the block if this script's loader template changed
    const ex = html.match(/<!-- Google Analytics — gtag\.js is deferred[^\n]*-->\s*<script data-gtag-deferred="(G-[A-Z0-9]+)">[\s\S]*?<\/script>/);
    if (ex) {
      const fresh = gtagBlock(ex[1], /dataLayer/.test(ex[0]));
      if (ex[0] !== fresh) { html = html.replace(ex[0], fresh); log.push('gtag: refreshed deferred loader'); }
    } else {
      log.push('gtag: no eager loader found (nothing to do)');
    }
    return html;
  }
  const id = m[2] || GA_ID_DEFAULT;
  const rest = html.slice(0, m.index) + html.slice(m.index + m[0].length);
  const stubElsewhere = /gtag\(\s*['"]config['"]/.test(rest);
  const block = gtagBlock(id, !stubElsewhere);
  html = html.slice(0, m.index) + block + html.slice(m.index + m[0].length);
  log.push(`gtag: deferred loader (${id})${m[3] ? ', stub kept inline' : stubElsewhere ? ', stub already elsewhere' : ', stub added'}`);
  return html;
}

/* ------------------------------------------------------------------ */
/* 5: table wrappers                                                   */
/* ------------------------------------------------------------------ */
function overflowSelectors(css) {
  const classes = new Set(), ids = new Set();
  for (const r of cssRules(css)) {
    if (!/overflow(?:-x)?\s*:\s*(?:auto|scroll)/i.test(r.decl)) continue;
    for (const s of r.selectors) {
      const lc = lastCompound(s);
      for (const c of lc.matchAll(/\.([a-zA-Z0-9_-]+)/g)) classes.add(c[1]);
      for (const i of lc.matchAll(/#([a-zA-Z0-9_-]+)/g)) ids.add(i[1]);
    }
  }
  classes.add('tbl-scroll');
  return { classes, ids };
}

// vertical margin the page's CSS gives a <table> with these classes (last rule wins)
function tableMargin(css, tblClasses) {
  let top = null, bottom = null;
  // bare `table` rules first, then class rules (class specificity beats element)
  const rules = [...cssRules(css)];
  const bare = rules.filter(r => r.selectors.includes('table'));
  const byClass = rules.filter(r => r.selectors.some(s => {
    const m = s.match(/^(?:table)?\.([a-zA-Z0-9_-]+)$/);
    return m && tblClasses.includes(m[1]);
  }));
  for (const r of [...bare, ...byClass]) {
    for (const d of r.decl.split(';')) {
      const [k, v] = d.split(':').map(x => x && x.trim());
      if (!k || !v) continue;
      if (k === 'margin') {
        const p = v.split(/\s+/);          // 1: all | 2: v h | 3: t h b | 4: t r b l
        top = p[0]; bottom = p.length >= 3 ? p[2] : p[0];
      } else if (k === 'margin-top') top = v;
      else if (k === 'margin-bottom') bottom = v;
    }
  }
  const z = v => v === null || /^0(px|em|rem|%)?$/.test(v);
  return { top, bottom, any: !(z(top) && z(bottom)) };
}

function fixTables(html, log) {
  if (!/<table[\s>]/i.test(html)) return html;
  const css = inlineStyles(html);
  const ov = overflowSelectors(css);
  const tokRe = /<!--[\s\S]*?-->|<script[\s>][\s\S]*?<\/script\s*>|<style[\s>][\s\S]*?<\/style\s*>|<\/([a-zA-Z][a-zA-Z0-9-]*)\s*>|<([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^'">])*)>/g;
  const stack = [];
  const edits = []; // {start, end, replacement}
  let m, wrapped = 0, skipped = 0;
  while ((m = tokRe.exec(html))) {
    if (m[0].startsWith('<!--') || /^<(script|style)/i.test(m[0])) continue;
    if (m[1]) { // closing tag
      const name = m[1].toLowerCase();
      const i = stack.map(s => s.name).lastIndexOf(name);
      if (i >= 0) stack.length = i;
      continue;
    }
    const name = m[2].toLowerCase(); const attrs = m[3] || '';
    if (name === 'table') {
      // find matching </table> (tables are not nested on this site, but count anyway)
      let depth = 1, p = tokRe.lastIndex, end = -1;
      const inner = /<table[\s>]|<\/table\s*>/gi; inner.lastIndex = p;
      let im;
      while ((im = inner.exec(html))) {
        if (im[0][1] === '/') { if (--depth === 0) { end = im.index + im[0].length; break; } }
        else depth++;
      }
      if (end < 0) { skipped++; continue; }
      const covered = stack.some(s => {
        if (/overflow(?:-x)?\s*:\s*(?:auto|scroll)/i.test(s.style)) return true;
        if (s.classes.some(c => ov.classes.has(c))) return true;
        return s.id && ov.ids.has(s.id);
      });
      if (!covered) {
        const tblClasses = attrClasses(attrs);
        const mg = tableMargin(css, tblClasses);
        const open = mg.any
          ? `<div class="tbl-scroll tbl-scroll--mg" style="margin:${mg.top || '0'} 0 ${mg.bottom || '0'}">`
          : '<div class="tbl-scroll">';
        const ind = lineIndent(html, m.index);
        const after = html.slice(end).match(/^[ \t]*\r?\n/);
        if (ind !== null && after) {
          edits.push({ start: m.index, end, replacement: open + '\n' + ind + html.slice(m.index, end) + '\n' + ind + '</div>' });
        } else {
          edits.push({ start: m.index, end, replacement: open + html.slice(m.index, end) + '</div>' });
        }
        wrapped++;
      }
      tokRe.lastIndex = end;
      continue;
    }
    if (VOID.has(name) || attrs.trim().endsWith('/')) continue;
    stack.push({ name, classes: attrClasses(attrs), id: attrId(attrs), style: attrStyle(attrs) });
  }
  for (const e of edits.reverse()) html = html.slice(0, e.start) + e.replacement + html.slice(e.end);
  if (wrapped) log.push(`tables: wrapped ${wrapped} in .tbl-scroll`);
  if (skipped) log.push(`tables: ${skipped} unterminated <table> skipped`);
  return html;
}

/* ------------------------------------------------------------------ */
/* main                                                                */
/* ------------------------------------------------------------------ */
let changed = 0, unchanged = 0, missing = 0;
for (const file of files) {
  if (!existsSync(file)) { console.log(`?? ${basename(file)}: not found`); missing++; continue; }
  const orig = readFileSync(file, 'utf8');
  const log = [];
  let html = orig;
  html = fixHead(html, log);
  html = fixGtag(html, log);
  html = fixTables(html, log);
  if (html !== orig) {
    changed++;
    if (!CHECK_ONLY) writeFileSync(file, html);
    console.log(`${CHECK_ONLY ? 'would change' : 'changed'}  ${basename(file)}: ${log.join('; ')}`);
  } else {
    unchanged++;
    console.log(`ok         ${basename(file)}`);
  }
}
console.log(`\n${CHECK_ONLY ? '[check] ' : ''}${changed} changed, ${unchanged} already up to date${missing ? `, ${missing} missing` : ''}`);
