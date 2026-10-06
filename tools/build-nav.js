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
    // skip allLink entries ("All Baseball →" etc.) — hub anchors, noise in search
    for (const g of cat.groups) for (const l of g.links) if (!l.allLink) add(l.label, l.href);
  }
  for (const e of cfg.searchExtra || []) add(e.label, e.href);
  return out;
}

/* ---------- shared: optional target/rel attrs (external links) ---------- */
const extAttrs = (o) => (o.target ? ` target="${o.target}"` : '') + (o.rel ? ` rel="${o.rel}"` : '');

/* ---------- desktop nav ---------- */
function linkAttrs(l) {
  const cls = l.allLink ? ' class="dd-all"' : (l.money ? ' class="dd-money"' : '');
  const st = l.style ? ` style="${l.style}"` : '';
  return cls + st + extAttrs(l);
}

function buildFooter(cat) {
  if (!cat.footer) return '';
  let links = '';
  for (const l of cat.footer.links) {
    links += `<a href="${l.href}"${linkAttrs(l)}>${l.label}</a>`;
  }
  const lbl = cat.footer.label ? `<span class="dd-foot-label">${cat.footer.label}</span>` : '';
  return `\n          <div class="dd-foot">${lbl}${links}</div>`;
}

function buildDesktop() {
  let items = '';
  for (const cat of cfg.categories) {
    let dd = '';
    if (cat.mega) {
      // mega panel: each group renders as a column
      dd += `\n          <div class="dd-cols">`;
      for (const g of cat.groups) {
        dd += `\n            <div class="dd-col">\n              <div class="dd-label">${g.label}</div>`;
        for (const l of g.links) {
          dd += `\n              <a href="${l.href}"${linkAttrs(l)}>${l.label}</a>`;
        }
        dd += `\n            </div>`;
      }
      dd += `\n          </div>`;
    } else {
      cat.groups.forEach((g, gi) => {
        if (gi > 0) dd += `\n          <hr>`;
        dd += `\n          <div class="dd-label">${g.label}</div>`;
        for (const l of g.links) {
          dd += `\n          <a href="${l.href}"${linkAttrs(l)}>${l.label}</a>`;
        }
      });
    }
    dd += buildFooter(cat);
    items += `
        <div class="nav-item">
          <a href="${cat.href}">${cat.label} <span class="chevron">▾</span></a>
          <div class="nav-dropdown${cat.mega ? ' nav-mega' : ''}">${dd}
          </div>
        </div>`;
  }
  const cta = cfg.cta;
  return `  <nav class="nav">
    <div class="nav-inner">
      <a class="logo" href="${(cfg.brand && cfg.brand.href) || "/"}" style="text-decoration:none;" aria-label="ShopCardHub — home">${cfg.brand.html}</a>
      <div class="nav-links">${items}
        <div class="nav-search" id="nav-search-desktop">
          <input type="text" class="nav-search-input" id="nav-search-input-d" placeholder="Search cards…" aria-label="Search the site" autocomplete="off">
          <div class="nav-search-results" id="nav-search-results-d" role="listbox"></div>
        </div>
${cfg.cta2 ? `        <a href="${cfg.cta2.href}"${extAttrs(cfg.cta2)} class="nav-cta nav-cta2" style="background:transparent !important; color:var(--accent) !important; border:1px solid var(--accent);">${cfg.cta2.label}</a>\n` : ""}        <a href="${cta.href}"${extAttrs(cta)} class="nav-cta">${cta.label}</a>
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
        const cls = l.allLink ? ' class="m-all"' : '';
        const st = l.style ? ` style="${l.style}"` : '';
        body += `\n        <a href="${l.href}"${cls}${st}${extAttrs(l)}>${l.label}</a>`;
      }
    }
    // category footer links (e.g. COMC inventory) go last in the mobile panel
    if (cat.footer) {
      for (const l of cat.footer.links) {
        body += `\n        <a href="${l.href}" class="m-money"${l.style ? ` style="${l.style}"` : ''}${extAttrs(l)}>${l.label}</a>`;
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
    <input type="text" class="nav-search-input" id="nav-search-input-m" placeholder="Search cards & pages…" aria-label="Search the site" autocomplete="off">
    <div class="nav-search-results" id="nav-search-results-m" role="listbox"></div>
  </div>
  <a href="${cfg.home.href}" class="m-home">${cfg.home.label}</a>${groups}
${cfg.cta2 ? `  <a href="${cfg.cta2.href}"${extAttrs(cfg.cta2)} class="m-cta m-cta-outline" style="background:transparent !important; color:var(--accent) !important; border:1px solid var(--accent); margin-bottom:8px;">${cfg.cta2.mobileLabel || cfg.cta2.label}</a>\n` : ""}  <a href="${cta.href}"${extAttrs(cta)} class="m-cta">${cta.mobileLabel || cta.label}</a>
</div>`;
}

/* ---------- injected style ---------- */
function buildStyle() {
  return `<style>
  /* === NAV (generated by tools/build-nav.js — do not hand-edit between NAV markers) === */
  .nav-search { position:relative; margin-left:8px; }
  .nav-search-input { font-family:var(--fm); font-size:11px; letter-spacing:1px; color:var(--text); background:rgba(255,255,255,0.04); border:1px solid var(--border2); border-radius:2px; padding:7px 10px; width:150px; transition:width .2s, border-color .2s; outline:none; }
  .nav-search-input:focus { width:240px; border-color:var(--accent); }
  /* Night Crew Oct 1 (B22/B25): desktop nav labels never wrap, so the bar keeps one height while Barlow swaps in (a
     2-line → 1-line nav moved every page by 20 px at 1024), and the search box grows less on narrow desktops so the
     two buttons never squeeze */
  @media (min-width:1024px) { .nav-links .nav-item > a, .nav-links .nav-cta { white-space:nowrap; } .nav-links .nav-cta { flex-shrink:0; } }
  @media (max-width:1180px) { .nav-search-input:focus { width:190px; } }
  .nav-search-input::placeholder { color:var(--text-dim); opacity:.7; }
  .nav-search-results { position:absolute; top:calc(100% + 6px); right:0; min-width:240px; background:rgba(7,9,12,0.98); backdrop-filter:blur(20px); border:1px solid var(--border2); border-top:2px solid var(--accent); padding:6px 0; display:none; z-index:320; max-height:340px; overflow-y:auto; }
  .nav-search-results.show { display:block; }
  .nav-search-results a { display:block; padding:8px 16px; font-size:11px; font-weight:600; letter-spacing:.5px; color:var(--text-dim); font-family:var(--fb); text-transform:none; }
  .nav-search-results a:hover, .nav-search-results a.sel { color:var(--text-head); background:rgba(0,204,245,0.08); text-decoration:none; }
  .nav-search-results .ns-h { padding:8px 16px 4px; font-family:var(--fm); font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--accent); border-top:1px solid var(--border2); margin-top:4px; }
  .nav-search-results a small { display:block; font-family:var(--fm); font-size:11px; font-weight:400; color:var(--text-dim); letter-spacing:0; margin-top:2px; }
  .nav-search-results .ns-empty { padding:10px 16px; font-size:11px; color:var(--text-dim); font-family:var(--fm); }
  /* Night Crew Oct 6 (B45b): miss links were 81×14 on phones, header 9 px, card sub-line 10 px */
  .nav-search-results .ns-empty a { display:inline-flex; align-items:center; min-height:40px; padding:0; border:0; color:var(--accent); text-decoration:underline; }
  .nav-links .nav-item > a.nav-active, .mobile-nav a.nav-active { color:var(--accent); }
  /* dropdown + search panels: solid ground (page --bg2, fallback) so hero text never bleeds through */
  .nav-dropdown, .nav-search-results { background:var(--bg2, #0c1017); -webkit-backdrop-filter:blur(12px); backdrop-filter:blur(12px); }
  /* mega panel (Sports): groups render as columns */
  .nav-dropdown.nav-mega { left:-140px; min-width:0; width:max-content; max-width:min(880px, calc(100vw - 48px)); padding:14px 10px 12px; }
  .nav-mega .dd-cols { display:flex; flex-wrap:wrap; }
  .nav-mega .dd-col { min-width:190px; padding:0 8px; }
  .nav-mega .dd-col .dd-label { padding:4px 12px 6px; border-bottom:1px solid var(--border); margin-bottom:4px; }
  .nav-mega .dd-col a { padding:8px 12px; }
  /* "All X →" hub links */
  .nav-dropdown a.dd-all { color:var(--accent); font-weight:700; }
  .nav-dropdown a.dd-all:hover { color:var(--text-head); }
  /* panel footer (money path) */
  .dd-foot { display:flex; align-items:center; gap:16px; margin:10px 12px 2px; padding:10px 6px 4px; border-top:1px solid var(--border); }
  .dd-foot-label { font-family:var(--fm); font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--text-dim); opacity:.7; white-space:nowrap; }
  .nav-dropdown a.dd-money, .dd-foot a.dd-money { color:#00e07a; font-weight:700; padding:4px 6px; }
  .nav-dropdown a.dd-money:hover { color:#4dffab; background:rgba(0,224,122,0.06); }
  /* mobile equivalents */
  .mobile-nav a.m-all { color:var(--accent); font-weight:700; }
  .mobile-nav a.m-money { color:#00e07a; font-weight:700; }
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
  /* keyboard: a focused menu opens like a hovered one; Escape closes it (Night Crew, Sep 29) */
  .nav-item:focus-within .nav-dropdown { opacity:1; visibility:visible; transform:translateY(0); }
  .nav-item:focus-within > a .chevron { transform:rotate(180deg); }
  .nav-item.dd-shut .nav-dropdown { opacity:0; visibility:hidden; }
  .nav-item.dd-shut > a .chevron { transform:none; }
  </style>`;
}

/* ---------- injected controller ---------- */
function buildScript(index) {
  const INDEX = JSON.stringify(index);
  return `<script>
/* === NAV controller (generated) — hamburger toggle + accordion + search + active page === */
(function(){
  /* keep wide menu panels on screen (Sep 29: the Indices / Tools & Guides panels ran past the right edge at 1024-1280px).
     Sep 30 (Night Crew): a closed panel is only invisible, not removed, so fitting on hover alone left the closed panels
     sticking out 101px at 1024 and the page scrolled sideways on 24 index pages. Every panel is fitted on load and resize too. */
  var fits = [];
  document.querySelectorAll('.nav-dropdown').forEach(function(dd){
    var host = dd.parentElement; if (!host) return;
    var fit = function(){ dd.style.marginLeft = ''; var r = dd.getBoundingClientRect(), vw = document.documentElement.clientWidth;
      if (!r.width) return;
      var shift = 0; if (r.right > vw - 16) shift = (vw - 16) - r.right; if (r.left + shift < 16) shift = 16 - r.left;
      if (shift) dd.style.marginLeft = shift + 'px'; };
    fits.push(fit); fit();
    host.addEventListener('mouseenter', fit); host.addEventListener('focusin', fit);
  });
  var fitT; window.addEventListener('resize', function(){ clearTimeout(fitT); fitT = setTimeout(function(){ fits.forEach(function(f){ f(); }); }, 150); });
  /* guide tables on phones (Night Crew, Sep 30): each cell carries its column name, so css/site-fixes.css §11 can stack a
     .roi-table that is wider than its box into one card per row (rank · name, then label/value pairs, then the links).
     Tables that fit stay tables. Same cells, same links, same order; nothing is hidden. */
  function roiStack(){
    if (!window.matchMedia || !window.matchMedia('(max-width:600px)').matches) return;
    document.querySelectorAll('table.roi-table').forEach(function(t){
      var w = t.parentElement; if (!w || t.classList.contains('rt-stack') || t.scrollWidth <= w.clientWidth + 1) return;
      var hs = Array.prototype.map.call(t.querySelectorAll('thead th'), function(th){ return th.textContent.replace(/\\s+/g,' ').trim(); });
      var lead = -1;
      hs.forEach(function(h, i){ if (lead < 0 && h && h !== '#') lead = i; });
      var mark = function(tr){
        if (tr.getAttribute('data-rt')) return; tr.setAttribute('data-rt', '1');
        Array.prototype.forEach.call(tr.children, function(td, i){
          var h = hs[i] || '', txt = td.textContent.replace(/\\s+/g,' ').trim();
          if (td.colSpan > 1 || i === lead) { td.classList.add('rt-lead'); return; }
          if (i < lead && txt.length <= 3) { td.classList.add('rt-rank'); return; }
          if (h) td.setAttribute('data-label', h);
          if (td.querySelector('a[href]') && txt.length < 60 && !td.querySelector('.verdict-tag')) td.classList.add('rt-act');
          else if (txt.length > 34) td.classList.add('rt-long');
        });
      };
      t.querySelectorAll('tbody tr').forEach(mark);
      /* rows that a page script fills in later (the track record's scorecard) are marked as they arrive */
      if (window.MutationObserver) t.querySelectorAll('tbody').forEach(function(tb){
        new MutationObserver(function(){ tb.querySelectorAll('tr').forEach(mark); }).observe(tb, { childList: true });
      });
      t.classList.add('rt-stack');
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', roiStack); else roiStack();
  /* Escape closes an open menu and returns focus to its top link; the menu re-arms when the pointer or focus leaves */
  document.querySelectorAll('.nav-links .nav-item').forEach(function(it){
    var top = it.querySelector(':scope > a'); if (!it.querySelector('.nav-dropdown')) return;
    it.addEventListener('keydown', function(e){ if (e.key === 'Escape'){ it.classList.add('dd-shut'); if (top) top.focus(); } });
    it.addEventListener('mouseenter', function(){ it.classList.remove('dd-shut'); });
    it.addEventListener('focusout', function(e){ if (!it.contains(e.relatedTarget)) it.classList.remove('dd-shut'); });
  });
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
    document.addEventListener('keydown', function(e){ if (e.key === 'Escape' && drawer.classList.contains('open')){ closeDrawer(); btn.focus(); } });
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
      if (!items.length){ var mq = input.value.trim().slice(0,80); results.innerHTML='<div class="ns-empty">Not in an index yet — <a href="'+missUrl(mq)+'" target="_blank" rel="sponsored nofollow noopener" data-miss="1">see it on eBay ›</a> · <a href="/indices">what we track</a></div>'; results.classList.add('show'); var ml = results.querySelector('a[data-miss]'); if (ml) ml.addEventListener('click', function(){ ga('search_miss_click', { query: mq }); }); if (CARDS) missEvent(mq); return; }
      results.innerHTML = items.map(function(it){ return it.h ? '<div class="ns-h">'+it.h+'</div>' : '<a href="'+it.u+'">'+it.t+(it.s ? ' <small>'+it.s+'</small>' : '')+'</a>'; }).join('');
      results.classList.add('show');
    }
    // card search (Sep 30 2026, Mo: search a card, land on its page with raw / PSA 9 / PSA 10 / TAG): /data/card-search.json
    // is loaded on first focus (~90 KB raw, ~20 KB gzip), never on page load. Every token must match; dearest card first.
    var CARDS = null, cardsP = null;
    // empty state → affiliate click (Oct 4 2026, Coverage Scout report, build E): a query that finds no page and no card opens
    // an EPN-tagged eBay search for the typed text (Pokémon TCG or Sports Trading Cards category, see missUrl; customid search-miss), and GA4 gets a
    // search_miss event once per query, 1.2 s after typing stops and only once the card list has loaded (no false misses).
    var EPN = 'mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001';
    // Night Crew Oct 6 (B45, desk ruling Oct 5): "pokemon " + the Pokémon TCG category (183454) only when the query names
    // Pokémon (or a Pokémon name like Charizard) or the page is a Pokémon page (path, or title/description names Pokémon and no sports product); otherwise the
    // plain query in Sports Trading Cards (212). "mahomes" no longer lands on a Pokémon search. Other params unchanged.
    var PK_RE = /pok[eé]mon|pikachu|charizard|gengar|mewtwo|lugia|umbreon|eevee|darkrai|greninja|prismatic evolutions|ascended heroes|\\btcg\\b/i, SP_RE = /bowman|topps|panini|baseball|football|basketball|soccer|rookie/i;
    function pkPage(){ var m = document.querySelector('meta[name="description"]'), t = document.title + ' ' + (m ? m.content : ''); return /pokemon/i.test(location.pathname) || (PK_RE.test(t) && !SP_RE.test(t)); }
    function missUrl(q){ var named = /pok[eé]mon/i.test(q), pk = named || PK_RE.test(q) || pkPage(), t = pk && !named ? 'pokemon ' + q : q; return 'https://www.ebay.com/sch/i.html?_nkw=' + encodeURIComponent(t.replace(/\\s+/g,' ').trim()).replace(/%20/g,'+').replace(/'/g,'%27').replace(/[!()*]/g, function(c){ return '%' + c.charCodeAt(0).toString(16).toUpperCase(); }) + '&_sacat=' + (pk ? '183454' : '212') + '&LH_BIN=1&' + EPN + '&customid=search-miss'; }
    function ga(ev, p){ try { if (typeof gtag === 'function') gtag('event', ev, Object.assign({ page: location.pathname }, p)); } catch (e) {} }
    var missT = null, missSent = {};
    function missEvent(q){ clearTimeout(missT); missT = setTimeout(function(){ var k = nk(q); if (!k || missSent[k] || nk(input.value) !== k) return; missSent[k] = 1; ga('search_miss', { query: q }); }, 1200); }
    function loadCards(){ if (cardsP) return cardsP; cardsP = fetch('/data/card-search.json').then(function(r){ return r.json(); }).then(function(d){ CARDS = (d.cards||[]).map(function(c){ return { id:c[0], t:c[1], s:c[2], p:c[3], n:nk(c[1]+' '+c[2]) }; }); }).catch(function(){ CARDS = []; }); return cardsP; }
    function money(n){ return n == null ? '' : '$'+Number(n).toLocaleString('en-US', n >= 100 ? {maximumFractionDigits:0} : {minimumFractionDigits:2, maximumFractionDigits:2}); }
    function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
    function findCards(q){ q = nk(q); if (!CARDS || q.length < 2) return []; var tk = q.split(' ');
      return CARDS.filter(function(c){ for (var i=0;i<tk.length;i++) if (c.n.indexOf(tk[i]) < 0) return false; return true; })
        .sort(function(a,b){ var sa = nk(a.t).indexOf(tk[0]) === 0 ? 0 : 1, sb = nk(b.t).indexOf(tk[0]) === 0 ? 0 : 1; return sa - sb || (b.p||0) - (a.p||0); }).slice(0,8)
        .map(function(c){ return { u:'/card?id='+c.id, t:esc(c.t), s:esc(c.s)+(c.p == null ? '' : ' · raw '+money(c.p)) }; }); }
    function find(q){ q = nk(q); if(!q) return []; return INDEX.filter(function(it){ return it.n.indexOf(q) > -1; }).slice(0,8); }
    function all(q){ var pg = find(q), cd = findCards(q); if (!cd.length) return pg; return pg.slice(0,4).concat([{h:'Cards · raw to PSA 10'}], cd); }
    input.addEventListener('focus', loadCards);
    input.addEventListener('input', function(){ var v = input.value; render(all(v)); if (!CARDS) loadCards().then(function(){ if (input.value === v) render(all(v)); }); });
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
  // watchlist count on the CTA (return-user program, Sep 25 2026): reads the Watchlist mirror, never writes it
  try {
    var st = JSON.parse(localStorage.getItem('sch_vault_v1') || 'null'), n = st && st.cards ? st.cards.length : 0;
    if (n > 0) document.querySelectorAll('a.nav-cta[href="/watchlist"], a.m-cta[href="/watchlist"]').forEach(function(a){ if (!a.querySelector('.nav-wl-n')) a.insertAdjacentHTML('beforeend', ' <span class="nav-wl-n" style="display:inline-block;min-width:18px;padding:0 5px;margin-left:6px;border-radius:9px;background:rgba(0,0,0,0.28);font-size:11px;line-height:18px;text-align:center;font-weight:800;">' + n + '</span>'); });
  } catch (e5) {}
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
