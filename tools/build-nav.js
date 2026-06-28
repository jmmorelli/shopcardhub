#!/usr/bin/env node
/*
 * build-nav.js — single-source nav generator for ShopCardHub.
 *
 * Reads data/nav.json and rewrites the nav region of every top-level *.html page
 * between the marker comments:
 *     <!-- NAV:START -->  ...generated nav...  <!-- NAV:END -->
 *
 * Generates BOTH the desktop dropdown nav and the mobile accordion drawer from
 * the one config, plus a small injected <style> + <script> controller
 * (hamburger toggle, accordion, site search, active-page highlight).
 *
 * First run (no markers yet): finds the existing `<nav class="nav">…</nav>` +
 * `<div class="mobile-nav" …>…</div>` block, wraps it in markers, and replaces it.
 * Re-running is idempotent — it just rewrites between the markers.
 *
 * Also strips the legacy inline "Mobile nav toggle" IIFE from each page so the
 * single injected controller is the only handler (no double-binding).
 *
 * Zero dependencies. Run from the repo root:  node tools/build-nav.js
 * Flags: --check  (report only, write nothing)
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHECK_ONLY = process.argv.includes('--check');

const NAV_START = '<!-- NAV:START -->';
const NAV_END = '<!-- NAV:END -->';

// Pages that do NOT carry the site nav (internal tool dashboard).
const SKIP = new Set(['card-dungeon.html']);

const cfg = JSON.parse(readFileSync(join(ROOT, 'data', 'nav.json'), 'utf8'));

/* ---------- helpers ---------- */
const normKey = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function buildSearchIndex() {
  const seen = new Set();
  const out = [];
  const add = (label, href) => {
    if (!href || seen.has(href)) return;
    seen.add(href);
    // strip simple emoji/symbol prefixes from labels for clean display
    const t = label.replace(/\s+/g, ' ').trim();
    out.push({ t, u: href, n: normKey(t + ' ' + href.replace(/[\/-]/g, ' ')) });
  };
  add(cfg.home.label, cfg.home.href);
  for (const cat of cfg.categories) {
    add(cat.label.replace(/&amp;/g, '&'), cat.href);
    for (const g of cat.groups) for (const l of g.links) add(l.label, l.href);
  }
  for (const e of cfg.searchExtra || []) add(e.label, e.href);
  return out;
}

/* ---------- desktop nav ---------- */
function buildDesktop() {
  let items = '';
  for (const cat of cfg.categories) {
    let dd = '';
    cat.groups.forEach((g, gi) => {
      if (gi > 0) dd += `\n          <hr>`;
      dd += `\n          <div class="dd-label">${g.label}</div>`;
      for (const l of g.links) {
        const st = l.style ? ` style="${l.style}"` : '';
        dd += `\n          <a href="${l.href}"${st}>${l.label}</a>`;
      }
    });
    items += `
        <div class="nav-item">
          <a href="${cat.href}">${cat.label} <span class="chevron">▾</span></a>
          <div class="nav-dropdown">${dd}
          </div>
        </div>`;
  }
  const cta = cfg.cta;
  return `  <nav class="nav">
    <div class="nav-inner">
      <div class="logo">${cfg.brand.html}</div>
      <div class="nav-links">${items}
        <div class="nav-search" id="nav-search-desktop">
          <input type="text" class="nav-search-input" id="nav-search-input-d" placeholder="Search…" aria-label="Search the site" autocomplete="off">
          <div class="nav-search-results" id="nav-search-results-d" role="listbox"></div>
        </div>
        <a href="${cta.href}" target="${cta.target}" rel="${cta.rel}" class="nav-cta">${cta.label}</a>
      </div>
      <button class="nav-hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>`;
}

/* ---------- mobile drawer (accordion) ---------- */
function buildMobile() {
  let groups = '';
  cfg.categories.forEach((cat, ci) => {
    const panelId = `mg-${ci}`;
    const multi = cat.groups.length > 1;
    let body = '';
    for (const g of cat.groups) {
      if (multi) body += `\n        <div class="m-sublabel">${g.label}</div>`;
      for (const l of g.links) {
        const st = l.style ? ` style="${l.style}"` : '';
        body += `\n        <a href="${l.href}"${st}>${l.label}</a>`;
      }
    }
    groups += `
      <div class="m-group">
        <button class="m-group-btn" aria-expanded="false" aria-controls="${panelId}">${cat.label}<span class="m-group-chevron">▾</span></button>
        <div class="m-group-panel" id="${panelId}">${body}
        </div>
      </div>`;
  });
  const cta = cfg.cta;
  return `<!-- ═══ MOBILE DRAWER ═══ -->
<div class="mobile-nav" id="mobile-nav" aria-hidden="true">
  <div class="m-search">
    <input type="text" class="nav-search-input" id="nav-search-input-m" placeholder="Search the site…" aria-label="Search the site" autocomplete="off">
    <div class="nav-search-results" id="nav-search-results-m" role="listbox"></div>
  </div>
  <a href="${cfg.home.href}" class="m-home">${cfg.home.label}</a>${groups}
  <a href="${cta.href}" target="${cta.target}" rel="${cta.rel}" class="m-cta">${cta.mobileLabel || cta.label}</a>
</div>`;
}

/* ---------- injected style ---------- */
function buildStyle() {
  return `<style>
  /* === NAV (generated by tools/build-nav.js — do not hand-edit between NAV markers) === */
  .nav-search { position:relative; margin-left:8px; }
  .nav-search-input { font-family:var(--fm); font-size:11px; letter-spacing:1px; color:var(--text); background:rgba(255,255,255,0.04); border:1px solid var(--border2); border-radius:2px; padding:7px 10px; width:118px; transition:width .2s, border-color .2s; outline:none; }
  .nav-search-input:focus { width:180px; border-color:var(--accent); }
  .nav-search-input::placeholder { color:var(--text-dim); opacity:.7; }
  .nav-search-results { position:absolute; top:calc(100% + 6px); right:0; min-width:240px; background:rgba(7,9,12,0.98); backdrop-filter:blur(20px); border:1px solid var(--border2); border-top:2px solid var(--accent); padding:6px 0; display:none; z-index:320; max-height:340px; overflow-y:auto; }
  .nav-search-results.show { display:block; }
  .nav-search-results a { display:block; padding:8px 16px; font-size:11px; font-weight:600; letter-spacing:.5px; color:var(--text-dim); font-family:var(--fb); text-transform:none; }
  .nav-search-results a:hover, .nav-search-results a.sel { color:var(--text-head); background:rgba(0,204,245,0.08); text-decoration:none; }
  .nav-search-results .ns-empty { padding:10px 16px; font-size:11px; color:var(--text-dim); font-family:var(--fm); }
  .nav-links .nav-item > a.nav-active, .mobile-nav a.nav-active { color:var(--accent); }
  /* mobile search + accordion */
  .m-search { position:relative; margin-bottom:8px; }
  .m-search .nav-search-input { width:100%; font-size:14px; padding:12px 14px; }
  .m-search .nav-search-input:focus { width:100%; }
  .m-search .nav-search-results { left:0; right:0; min-width:0; }
  .m-home { padding-top:16px; }
  .m-group { border-bottom:1px solid var(--border); }
  .m-group-btn { display:flex; align-items:center; justify-content:space-between; width:100%; background:none; border:none; cursor:pointer; font-family:var(--fd); font-size:20px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); padding:16px 0; text-align:left; transition:color .15s; }
  .m-group-btn:hover, .m-group-btn[aria-expanded="true"] { color:var(--text-head); }
  .m-group-chevron { font-size:13px; opacity:.6; transition:transform .25s ease; }
  .m-group-btn[aria-expanded="true"] .m-group-chevron { transform:rotate(180deg); }
  .m-group-panel { max-height:0; overflow:hidden; transition:max-height .28s ease; }
  .m-group-panel a { font-size:15px; padding:12px 0 12px 14px; border-bottom:1px solid var(--border); }
  .m-group-panel a:last-child { border-bottom:none; }
  .m-group-panel .m-sublabel { font-family:var(--fm); font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--accent); opacity:.55; padding:12px 0 2px 14px; }
  </style>`;
}

/* ---------- injected controller ---------- */
function buildScript(index) {
  const INDEX = JSON.stringify(index);
  return `<script>
/* === NAV controller (generated) — hamburger toggle + accordion + search + active page === */
(function(){
  var btn = document.getElementById('hamburger');
  var drawer = document.getElementById('mobile-nav');
  if (btn && drawer) {
    function closeDrawer(){ btn.classList.remove('open'); drawer.classList.remove('open'); btn.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
    btn.addEventListener('click', function(){
      var open = !drawer.classList.contains('open');
      btn.classList.toggle('open', open); drawer.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open)); drawer.setAttribute('aria-hidden', String(!open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    drawer.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', closeDrawer); });
    drawer.querySelectorAll('.m-group-btn').forEach(function(b){
      b.addEventListener('click', function(){
        var exp = b.getAttribute('aria-expanded') === 'true';
        b.setAttribute('aria-expanded', String(!exp));
        var p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.style.maxHeight = exp ? '' : p.scrollHeight + 'px';
      });
    });
  }
  var INDEX = ${INDEX};
  function nk(s){ return s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(); }
  function setup(input, results){
    if (!input || !results) return;
    var sel = -1;
    function render(items){
      sel = -1;
      if (!input.value.trim()){ results.classList.remove('show'); results.innerHTML=''; return; }
      if (!items.length){ results.innerHTML='<div class="ns-empty">No matches</div>'; results.classList.add('show'); return; }
      results.innerHTML = items.map(function(it){ return '<a href="'+it.u+'">'+it.t+'</a>'; }).join('');
      results.classList.add('show');
    }
    function find(q){ q = nk(q); if(!q) return []; return INDEX.filter(function(it){ return it.n.indexOf(q) > -1; }).slice(0,8); }
    input.addEventListener('input', function(){ render(find(input.value)); });
    input.addEventListener('keydown', function(e){
      var links = results.querySelectorAll('a');
      if (e.key === 'ArrowDown'){ e.preventDefault(); sel = Math.min(sel+1, links.length-1); }
      else if (e.key === 'ArrowUp'){ e.preventDefault(); sel = Math.max(sel-1, 0); }
      else if (e.key === 'Enter'){ var t = links[sel] || links[0]; if (t) location.href = t.getAttribute('href'); return; }
      else if (e.key === 'Escape'){ input.value=''; render([]); input.blur(); return; }
      else return;
      links.forEach(function(l,i){ l.classList.toggle('sel', i === sel); });
    });
    document.addEventListener('click', function(e){ if (!results.contains(e.target) && e.target !== input) results.classList.remove('show'); });
  }
  setup(document.getElementById('nav-search-input-d'), document.getElementById('nav-search-results-d'));
  setup(document.getElementById('nav-search-input-m'), document.getElementById('nav-search-results-m'));
  // active-page highlight
  var path = location.pathname.replace(/index\\.html$/,'').replace(/\\.html$/,'');
  if (path.length > 1 && path.charAt(path.length-1) === '/') path = path.slice(0,-1);
  document.querySelectorAll('.nav-links .nav-item > a, .mobile-nav a').forEach(function(a){
    var h = a.getAttribute('href'); if (!h || h.charAt(0) !== '/') return;
    var hn = h.replace(/\\.html$/,''); if (hn.length > 1 && hn.charAt(hn.length-1) === '/') hn = hn.slice(0,-1);
    if (hn === path){ a.classList.add('nav-active'); a.setAttribute('aria-current','page'); }
  });
})();
</script>`;
}

/* ---------- region detection ---------- */
// Return [startIdx, endIdx) covering the matching close of a <div>/<nav> opened at openIdx.
function matchTag(html, openIdx, tag) {
  const re = new RegExp(`<${tag}\\b|</${tag}>`, 'g');
  re.lastIndex = openIdx;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === '/') { depth--; if (depth === 0) return m.index + m[0].length; }
    else depth++;
  }
  return -1;
}

function findRawRegion(html) {
  const navStart = html.indexOf('<nav class="nav">');
  if (navStart === -1) return null;
  const drawerOpen = html.indexOf('<div class="mobile-nav"', navStart);
  if (drawerOpen === -1) return null;
  const drawerEnd = matchTag(html, drawerOpen, 'div');
  if (drawerEnd === -1) return null;
  return [navStart, drawerEnd];
}

// Remove the legacy "Mobile nav toggle" IIFE (anchored on its first statement so
// it never over-matches adjacent scripts). Leaves any shared <script> intact.
const LEGACY_RE = /(?:\/\*[^*]*?Mobile nav toggle[^*]*?\*\/\s*)?\(function\(\)\s*\{\s*var btn\s*=\s*document\.getElementById\((['"])hamburger\1\)[\s\S]*?\}\)\(\);[ \t]*\n?/;
function stripLegacy(s) {
  let removed = 0;
  while (LEGACY_RE.test(s)) { s = s.replace(LEGACY_RE, ''); removed++; }
  // Clean up a <script> shell that held only the now-removed toggle IIFE.
  s = s.replace(/[ \t]*<script>\s*<\/script>\n?/g, '');
  return { s, removed };
}

/* ---------- main ---------- */
const index = buildSearchIndex();
const BLOCK = `${NAV_START}
${buildStyle()}
${buildDesktop()}

${buildMobile()}
${buildScript(index)}
${NAV_END}`;

const files = readdirSync(ROOT).filter((f) => f.endsWith('.html') && !SKIP.has(f));
let changed = 0, skipped = 0, legacyStripped = 0;
const problems = [];

for (const f of files) {
  const path = join(ROOT, f);
  const orig = readFileSync(path, 'utf8');
  let head, tail;

  const sIdx = orig.indexOf(NAV_START);
  if (sIdx !== -1) {
    const eIdx = orig.indexOf(NAV_END, sIdx);
    if (eIdx === -1) { problems.push(`${f}: NAV:START without NAV:END`); skipped++; continue; }
    head = orig.slice(0, sIdx);
    tail = orig.slice(eIdx + NAV_END.length);
  } else {
    const region = findRawRegion(orig);
    if (!region) { problems.push(`${f}: no nav region found`); skipped++; continue; }
    head = orig.slice(0, region[0]);
    tail = orig.slice(region[1]);
  }

  // Strip legacy toggle from OUTSIDE the block only (head + tail), never the new block.
  const sh = stripLegacy(head); const st = stripLegacy(tail);
  legacyStripped += sh.removed + st.removed;
  const out = sh.s + BLOCK + st.s;

  if (out !== orig) {
    if (!CHECK_ONLY) writeFileSync(path, out);
    changed++;
  } else skipped++;
}

console.log(`build-nav: ${CHECK_ONLY ? '[check] ' : ''}${changed} written, ${skipped} unchanged/skipped, legacy toggle IIFEs removed: ${legacyStripped}`);
if (problems.length) { console.log('PROBLEMS:'); for (const p of problems) console.log('  - ' + p); process.exitCode = 1; }
