#!/usr/bin/env node
// tools/build-deals.mjs — generates deals.html, Deals: Buy It Now below the mark (Oct 23 2026).
//
// Thin client over /api/deals (the screener's feed, tools/price-engine/deals.mjs, 2x/day since Oct 23 evening — eBay budget): every verified
// fixed-price eBay listing priced under our own dated SOLD mark for that exact card and grade, sorted by discount.
// Visitors buy on eBay through EPN-tagged links (customid=deals). Nothing on the page is a number the screener
// didn't produce; the empty state is honest. Shell (tokens, nav, footer, gtag) comes from how-prices-work.html,
// exactly like tools/build-auctions.mjs. Re-run after nav.json changes.
//
//   node tools/build-deals.mjs         # writes deals.html
//   node tools/build-deals.mjs --dry

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SHELL = read("how-prices-work.html");
const pageCss = (SHELL.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const gtag = (SHELL.match(/(<!-- Google Analytics[\s\S]*?<\/script>)/) || [])[1];
const nav = (SHELL.match(/(<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->)/) || [])[1];
const footer = (SHELL.match(/(<footer>[\s\S]*?<\/footer>)/) || [])[1];
if (!pageCss || !gtag || !nav || !footer) throw new Error("shell pieces not found in how-prices-work.html");

// Method note from the screener's own rules block (Deal Hunter, Oct 29 2026; IW Oct 26 F3). Until Oct 29 the note was
// hand-written and still carried the first-draft thresholds ("3% under", "about half"). The sentence is now built from
// the `rules` object tools/price-engine/deals.mjs writes into the feed, at build time from data/feed/deals-latest.json
// and again in the browser from /api/deals, so a threshold change in the screener reaches the page on the next load.
// Plain function, no template literals or backslashes: its source is embedded verbatim in the page script below.
function methodNote(R) {
  if (!R || !R.under || !R.floor) return "";
  var NAMES = { raw: "raw cards", psa9: "PSA 9", psa10: "PSA 10", bowman: "Bowman", sealed: "sealed" };
  var KEYS = ["raw", "psa9", "psa10", "bowman", "sealed"];
  var join = function (a) { return a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + " and " + a[a.length - 1]; };
  var off = function (x) { return Math.round((1 - x) * 100) + "%"; };
  var group = function (o) { var order = [], m = {}; KEYS.forEach(function (k) { if (typeof o[k] !== "number") return; var v = off(o[k]); if (!m[v]) { m[v] = []; order.push(v); } m[v].push(NAMES[k]); }); return order.map(function (v) { return v + " under on " + join(m[v]); }); };
  var out = [];
  var u = group(R.under), f = group(R.floor);
  if (u.length) out.push("A row shows when price plus shipping is at least " + u.join(", and ") + ".");
  if (f.length) out.push("Anything more than " + f.join(", or ") + (f.length > 1 ? "," : "") + " is held back as a likely mislabel or damage.");
  if (R.vintageBefore && typeof R.vintageRawFloor === "number") out.push("Vintage raw cards (sets released before " + R.vintageBefore + ") " + (R.vintageRawNeedsNmClaim ? "need a near-mint claim in the title and " : "") + "stop at " + off(R.vintageRawFloor) + " under.");
  var a = R.maxAgeDays;
  if (a && a.raw && a.graded) out.push("Marks older than " + a.raw + " days (raw), " + a.graded + " days (graded)" + (a.bowman ? " or " + a.bowman + " days (Bowman)" : "") + " are skipped.");
  if (R.rawMinMark && R.gradedMinMark) out.push("Raw marks under $" + R.rawMinMark + " and graded marks under $" + R.gradedMinMark + " are not screened.");
  if (R.minSellerPct) out.push("Sellers under " + R.minSellerPct + "% positive feedback" + (R.minSellerScore ? " or with fewer than " + R.minSellerScore + " ratings" : "") + " are dropped.");
  return out.join(" ");
}
const FEED_RULES = (() => { try { return JSON.parse(read("data/feed/deals-latest.json")).rules || null; } catch { return null; } })();
const NOTE_RULES = methodNote(FEED_RULES);

const idx = JSON.parse(read("data/indices.json"));
const SETS = Object.entries(idx).filter(([k, v]) => v && typeof v === "object" && v.status === "live" && fs.existsSync(path.join(REPO, `data/cards/${k.toLowerCase()}.json`)))
  .map(([k, v]) => ({ tk: k, name: v.name || k, page: v.page || "/indices" }));
SETS.push({ tk: "BOWMAN", name: "Bowman watchlist", page: "/bowman-bangers" }, { tk: "SEALED", name: "Sealed product", page: "/best-hobby-boxes-2026" });

const CSS = `
.dl-wrap { max-width:1060px; margin:0 auto; padding:28px 20px 60px; }
.dl-wrap section { padding:0; border-top:0; animation:none; }
.dl-crumbs { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
.dl-crumbs a { color:var(--text-dim); } .dl-crumbs a:hover { color:var(--accent); }
.dl-eyebrow { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--green); margin-bottom:8px; }
.dl-title { font-family:var(--fd); font-size:clamp(30px,6vw,52px); font-weight:900; line-height:0.96; letter-spacing:-0.5px; text-transform:uppercase; color:var(--text-head); margin:0 0 10px; }
.dl-title em { color:var(--green); font-style:normal; }
.dl-sub { font-size:15px; color:var(--text-dim); max-width:680px; line-height:1.65; margin:0 0 18px; }
.dl-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:var(--border); border:1px solid var(--border); margin:18px 0 20px; }
.dl-cell { background:var(--bg2); padding:14px 12px; min-width:0; }
.dl-cell .l { font-family:var(--fm); font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--text-dim); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dl-cell .v { font-family:var(--fd); font-size:26px; font-weight:900; line-height:1; color:var(--text-head); }
.dl-cell .v.g { color:var(--green); }
.dl-cell .s { font-family:var(--fm); font-size:11px; color:var(--text-dim); margin-top:5px; line-height:1.45; min-height:1.45em; }
.dl-ctl { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:0 0 10px; }
.dl-chip { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--border2); background:var(--bg2); padding:9px 13px; cursor:pointer; min-height:38px; }
.dl-chip[aria-pressed="true"] { color:#000; background:var(--green); border-color:var(--green); }
.dl-chip:hover { color:var(--text-head); border-color:var(--green); } .dl-chip[aria-pressed="true"]:hover { color:#000; }
.dl-chip small { font-weight:400; opacity:0.7; margin-left:4px; }
.dl-sel { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text); background:var(--bg2); border:1px solid var(--border2); padding:9px 10px; min-height:38px; }
.dl-sel.set { margin-left:auto; max-width:46%; }
.dl-list { display:flex; flex-direction:column; gap:6px; }
.dl-row { display:grid; grid-template-columns:52px minmax(0,1fr) 130px 128px 150px; gap:12px; align-items:center; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--green); padding:10px 12px 10px 10px; color:var(--text); min-height:72px; }
.dl-row .ph { width:52px; height:72px; background:var(--bg3); overflow:hidden; } .dl-row .ph img { width:100%; height:100%; object-fit:cover; display:block; }
.dl-row .nm { min-width:0; }
.dl-row .nm a.c, .dl-row .nm span.c { display:block; font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.05; }
.dl-row .nm a.c:hover { color:var(--green); text-decoration:none; }
.dl-row .nm .t { display:block; font-size:12px; color:var(--text-dim); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.dl-row .nm .sl { display:block; font-family:var(--fm); font-size:11px; color:var(--text-dim); opacity:0.75; margin-top:3px; }
.dl-g { display:inline-block; font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:2px 6px; border:1px solid var(--border2); color:var(--text); margin-right:6px; vertical-align:middle; }
.dl-g.psa10 { color:var(--gold); border-color:rgba(245,200,0,0.5); } .dl-g.psa9 { color:var(--accent); border-color:rgba(0,204,245,0.5); } .dl-g.sealed { color:var(--orange); border-color:rgba(255,140,0,0.5); }
.dl-num { text-align:right; }
.dl-num b { font-family:var(--fd); font-size:22px; font-weight:900; color:var(--text-head); display:block; line-height:1; }
.dl-num span { font-family:var(--fm); font-size:11px; color:var(--text-dim); display:block; margin-top:4px; }
.dl-num s { color:var(--text-dim); }
.dl-vs { text-align:right; }
.dl-vs b { display:inline-block; font-family:var(--fm); font-size:13px; font-weight:700; letter-spacing:0.5px; padding:5px 8px; border:1px solid rgba(0,224,122,0.5); color:var(--green); background:var(--green-dim); }
.dl-vs span { display:block; font-family:var(--fm); font-size:11px; color:var(--text-dim); margin-top:5px; }
.dl-buy { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:var(--green); color:#000; padding:12px 10px; text-align:center; display:block; min-height:44px; line-height:20px; white-space:nowrap; }
.dl-buy:hover { background:#fff; color:#000; text-decoration:none; }
.dl-empty { background:var(--bg2); border:1px solid var(--border2); padding:26px 20px; font-size:14px; color:var(--text-dim); line-height:1.65; }
.dl-empty b { color:var(--text-head); }
.dl-note { font-family:var(--fm); font-size:11px; color:var(--text-dim); line-height:1.7; margin-top:22px; }
.dl-legend { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:2px; background:var(--border); border:1px solid var(--border); margin:34px 0 0; }
.dl-legend div { background:var(--bg2); padding:14px 14px; font-size:13px; color:var(--text-dim); line-height:1.55; }
.dl-legend div b { display:block; font-family:var(--fm); font-size:11px; letter-spacing:2px; text-transform:uppercase; color:var(--green); margin-bottom:5px; }
.dl-list:has(> .dl-skel) { min-height:100vh; }
.dl-skel { height:72px; background:linear-gradient(90deg,var(--bg2),var(--bg3),var(--bg2)); background-size:200% 100%; animation:dl-sh 1.2s infinite; border:1px solid var(--border); }
@keyframes dl-sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@media (max-width:860px) {
  .dl-wrap { padding:18px 14px 50px; }
  .dl-strip { grid-template-columns:repeat(2,1fr); }
  .dl-row { grid-template-columns:44px minmax(0,1fr) auto; grid-template-areas:"ph nm num" "ph vs vs" "buy buy buy"; row-gap:8px; }
  .dl-row .ph { grid-area:ph; width:44px; height:60px; }
  .dl-row .nm { grid-area:nm; } .dl-row .dl-num { grid-area:num; } .dl-row .dl-vs { grid-area:vs; text-align:left; } .dl-row .dl-buy { grid-area:buy; }
  .dl-sel.set { margin-left:0; max-width:none; width:100%; }
  .dl-row .nm .sl .basis { display:none; }
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="preload" href="/fonts/barlow-condensed-900.woff2" as="font" type="font/woff2" crossorigin>
  <title>Deals — eBay Buy It Now Listings Below the Mark | ShopCardHub</title>
  <meta name="description" content="Fixed-price eBay listings priced under our dated sold mark for the exact Pokémon or Bowman card and grade — raw, PSA 9, PSA 10 and sealed — verified by title, sorted by discount. Refreshed twice a day.">
  <link rel="canonical" href="https://www.shopcardhub.com/deals">
  <!-- a live listing screen is a utility, not a page to rank (same call as /auctions, B64) -->
  <meta name="robots" content="noindex,follow">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Deals — Buy It Now Below the Mark">
  <meta property="og:description" content="eBay fixed-price listings under our dated sold mark for the exact card and grade, verified and sorted by discount.">
  <meta property="og:url" content="https://www.shopcardhub.com/deals">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/indices.png?v=20261026">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/indices.png?v=20261026">
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
  <style>${pageCss}</style>
  <style>${CSS}</style>
  ${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
</head>
<body>

${nav}

<main class="dl-wrap">
  <div class="dl-crumbs"><a href="/">Home</a> <span>/</span> <a href="/indices">Indices</a> <span>/</span> <span>Deals</span></div>
  <div class="dl-eyebrow">Deals · Buy It Now · screened once a day</div>
  <h1 class="dl-title">Listed <em>below the mark</em></h1>
  <p class="dl-sub">Buy It Now listings on eBay priced under what that exact card and grade recently sold for, checked by title and sorted by discount. A deal is a price, not a call.</p>

  <div class="dl-strip" id="dl-strip">
    <div class="dl-cell"><div class="l">Live deals</div><div class="v g" id="k-count">—</div><div class="s" id="k-count-s">verified</div></div>
    <div class="dl-cell"><div class="l">Median discount</div><div class="v" id="k-med">—</div><div class="s">price + shipping vs the mark</div></div>
    <div class="dl-cell"><div class="l">Deepest</div><div class="v" id="k-best">—</div><div class="s" id="k-best-s">&nbsp;</div></div>
    <div class="dl-cell"><div class="l">Screened</div><div class="v" id="k-gen" style="font-size:20px;">—</div><div class="s" id="k-day">marks dated per row</div></div>
  </div>

  <div class="dl-ctl" role="group" aria-label="Grade">
    <button class="dl-chip" data-g="" aria-pressed="true">All</button>
    <button class="dl-chip" data-g="raw" aria-pressed="false">Raw</button>
    <button class="dl-chip" data-g="psa9" aria-pressed="false">PSA 9</button>
    <button class="dl-chip" data-g="psa10" aria-pressed="false">PSA 10</button>
    <button class="dl-chip" data-g="sealed" aria-pressed="false">Sealed</button>
    <select class="dl-sel set" id="dl-set" aria-label="Set"><option value="">Every set</option>${SETS.map((s) => `<option value="${esc(s.tk)}">${esc(s.tk)} · ${esc(s.name)}</option>`).join("")}</select>
  </div>
  <div class="dl-ctl" role="group" aria-label="Price band and sort">
    <button class="dl-chip" data-p="" aria-pressed="true">Any price</button>
    <button class="dl-chip" data-p="0-50" aria-pressed="false">Under $50</button>
    <button class="dl-chip" data-p="50-200" aria-pressed="false">$50–200</button>
    <button class="dl-chip" data-p="200-1000" aria-pressed="false">$200–1K</button>
    <button class="dl-chip" data-p="1000-" aria-pressed="false">$1K+</button>
    <select class="dl-sel" id="dl-sort" aria-label="Sort"><option value="disc">Deepest discount first</option><option value="price">Price · low to high</option><option value="-price">Price · high to low</option><option value="save">Most saved · $</option></select>
  </div>

  <div class="dl-list" id="dl-list"><div class="dl-skel"></div><div class="dl-skel"></div><div class="dl-skel"></div><div class="dl-skel"></div></div>

  <p class="dl-note" id="dl-note">Mark = our own dated sold comp for that exact card and grade: the set index's raw mark (median of clean ungraded sales, dated), the graded ladder's 30-day PSA median, or the Bowman sold mark (3+ sales in 30 days). The listing is a live eBay ask; the two are never blended. <span id="dl-rules">${esc(NOTE_RULES)}</span> Titles must name the card, the number and, for slabs, exactly that PSA grade; parallels, lots, other languages, reverse holos, promos and damage words are rejected. We can't see the photos; read the listing. ShopCardHub earns a commission on eBay purchases made through links on this page.</p>

  <div class="dl-legend">
    <div><b>vs the mark</b>Price + shipping against the dated sold mark for that card and grade. The date and the sale count sit under every row.</div>
    <div><b>Verified</b>Card name and number in the title, edition words that agree with the index (1st Edition / Shadowless / Unlimited), no grading words on a raw row, exactly one PSA grade on a slab row.</div>
    <div><b>Shipping</b>Counted when eBay states it. "+ ship" means the seller calculates it at checkout, so the all-in number can move.</div>
    <div><b>What we don't know</b>Centering, the back, whether the photo is the card. Three minutes on the listing is the rest of the screen.</div>
  </div>
</main>

${footer}

<script>
(function(){
  var state = { g:'', p:'', set:'', sort:'disc', rows:[], gen:null, day:null, limit:60 };
  var list = document.getElementById('dl-list');
  var fmt = function(n){ if (n==null || !isFinite(n)) return '\\u2014'; return '$' + (n>=1000 ? Math.round(n).toLocaleString('en-US') : n>=100 ? String(Math.round(n)) : n.toFixed(2)); };
  var pct = function(x){ if (x==null || !isFinite(x)) return '\\u2014'; return Math.round(x*100) + '%'; };
  var esc = function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  var GL = { raw:'Raw', psa9:'PSA 9', psa10:'PSA 10', sealed:'Sealed' };
  var methodNote = ${methodNote.toString()};
  function inBand(r){ if (!state.p) return true; var a = state.p.split('-'); var lo = Number(a[0]||0), hi = a[1]==='' ? Infinity : Number(a[1]); return r.total >= lo && r.total < hi; }
  function live(){ var now = Date.now(); return state.rows.filter(function(r){ return !r.ends || new Date(r.ends).getTime() > now; }); }
  function filtered(){ return live().filter(function(r){ if (state.g && r.grade !== state.g) return false; if (state.set && r.tk !== state.set) return false; return inBand(r); }); }
  function sorted(rows){ var s = state.sort; return rows.slice().sort(function(a,b){ if (s==='price') return a.total-b.total; if (s==='-price') return b.total-a.total; if (s==='save') return (b.mark-b.total)-(a.mark-a.total); return a.disc-b.disc; }); }
  function render(){
    var rows = sorted(filtered());
    if (!rows.length) { list.innerHTML = '<div class="dl-empty"><b>Nothing under the mark right now' + (state.g||state.set||state.p ? ' for this filter' : '') + '.</b> That happens \\u2014 a deal is the exception, not the shelf. The screen runs once a day, each morning. <a href="/auctions">Auctions ending under the mark \\u2192</a></div>'; return; }
    var total = rows.length; rows = rows.slice(0, state.limit);
    list.innerHTML = rows.map(function(r){
      var href = r.cardHref || r.page;
      var name = esc(r.card) + (r.num ? ' <span style="color:var(--text-dim);font-weight:600;">#' + esc(r.num) + '</span>' : '');
      return '<div class="dl-row">' +
        (href ? '<a class="ph" href="' + esc(href) + '">' : '<span class="ph">') + (r.image ? '<img src="' + esc(r.image) + '" alt="" loading="lazy">' : '') + (href ? '</a>' : '</span>') +
        '<div class="nm">' + (href ? '<a class="c" href="' + esc(href) + '">' : '<span class="c">') + name + (href ? '</a>' : '</span>') +
          '<span class="t"><span class="dl-g ' + esc(r.grade) + '">' + (GL[r.grade]||r.grade) + '</span>' + esc(r.idx) + (r.tk && r.tk !== 'BOWMAN' && r.tk !== 'SEALED' ? ' \\u00b7 ' + esc(r.tk) : '') + '</span>' +
          '<span class="sl">mark ' + fmt(r.mark) + '<span class="basis"> \\u00b7 ' + esc(r.markBasis || '') + '</span>' + (r.markAsOf ? ' \\u00b7 ' + esc(r.markAsOf) : '') + '</span></div>' +
        '<div class="dl-num"><b>' + fmt(r.total) + '</b><span>' + fmt(r.price) + (r.shipUnknown ? ' + ship' : r.ship===0 ? ' \\u00b7 free ship' : ' + ' + fmt(r.ship) + ' ship') + (r.seller && r.seller.pct ? ' \\u00b7 ' + esc(r.seller.pct) + '%' : '') + '</span></div>' +
        '<div class="dl-vs"><b>' + pct(r.disc) + ' vs mark</b><span>save ' + fmt(r.mark - r.total) + '</span></div>' +
        '<a class="dl-buy" href="' + esc(r.url) + '" target="_blank" rel="nofollow sponsored noopener" data-card="' + esc(r.cardId) + '" data-grade="' + esc(r.grade) + '">Buy on eBay \\u2192</a>' +
      '</div>'; }).join('') + (total > rows.length ? '<button type="button" class="dl-chip dl-more" style="display:block;margin:14px auto 0;">Show ' + Math.min(60, total - rows.length) + ' more \\u00b7 ' + (total - rows.length) + ' left</button>' : '');
    var more = list.querySelector('.dl-more'); if (more) more.addEventListener('click', function(){ state.limit += 60; render(); });
    list.querySelectorAll('a.dl-buy').forEach(function(a){ a.addEventListener('click', function(){ if (window.gtag) gtag('event', 'click', { link_url:'ebay', card:a.getAttribute('data-card'), grade:a.getAttribute('data-grade'), kind:'deal', page:location.pathname }); }); });
  }
  function kpis(){ var rows = live();
    document.getElementById('k-count').textContent = rows.length;
    var g = {}; rows.forEach(function(r){ g[r.grade] = (g[r.grade]||0)+1; });
    document.getElementById('k-count-s').textContent = ['raw','psa9','psa10','sealed'].filter(function(k){ return g[k]; }).map(function(k){ return g[k] + ' ' + GL[k].toLowerCase(); }).join(' \\u00b7 ') || 'verified';
    var d = rows.map(function(r){ return r.disc; }).sort(function(a,b){ return a-b; });
    document.getElementById('k-med').textContent = d.length ? pct(d[Math.floor(d.length/2)]) : '\\u2014';
    if (rows.length) { var b = rows.slice().sort(function(a,b){ return a.disc-b.disc; })[0]; document.getElementById('k-best').textContent = pct(b.disc); document.getElementById('k-best-s').textContent = b.card + ' \\u00b7 ' + (GL[b.grade]||b.grade); }
    document.getElementById('k-gen').textContent = state.gen ? new Date(state.gen).toLocaleString('en-US',{weekday:'short',hour:'numeric',minute:'2-digit'}) : '\\u2014'; }
  function load(){ fetch('/api/deals', {cache:'default'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){ state.rows = d.rows || []; state.gen = d.generated; state.day = d.day; var rn = d.rules ? methodNote(d.rules) : ''; if (rn) document.getElementById('dl-rules').textContent = rn; kpis(); render(); })
    .catch(function(){ list.innerHTML = '<div class="dl-empty"><b>The feed didn\\u2019t answer.</b> This page shows nothing rather than a stale number. Try again in a minute.</div>'; }); }
  document.querySelectorAll('.dl-chip[data-g]').forEach(function(b){ b.addEventListener('click', function(){ document.querySelectorAll('.dl-chip[data-g]').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); state.g = b.getAttribute('data-g'); state.limit = 60; render(); }); });
  document.querySelectorAll('.dl-chip[data-p]').forEach(function(b){ b.addEventListener('click', function(){ document.querySelectorAll('.dl-chip[data-p]').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); state.p = b.getAttribute('data-p'); state.limit = 60; render(); }); });
  document.getElementById('dl-set').addEventListener('change', function(e){ state.set = e.target.value; state.limit = 60; render(); });
  document.getElementById('dl-sort').addEventListener('change', function(e){ state.sort = e.target.value; render(); });
  var qs = new URLSearchParams(location.search); if (qs.get('tk')) { state.set = qs.get('tk').toUpperCase(); var sel = document.getElementById('dl-set'); if (sel.querySelector('option[value="' + state.set + '"]')) sel.value = state.set; }
  load();
  setInterval(load, 15*60000);
})();
</script>
</body>
</html>
`;

if (!DRY) fs.writeFileSync(path.join(REPO, "deals.html"), html);
console.log(`${DRY ? "would write" : "wrote"} deals.html (${SETS.length} set filters)`);
