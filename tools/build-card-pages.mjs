#!/usr/bin/env node
// build-card-pages.mjs — per-card chart pages (Sep 4 2026, Mo's retention directive:
// "index → card page → Vault"). One page per engine-tracked card in data/watchlist.json:
//
//   /card-<id>            e.g. /card-ethan-holliday, /card-umbreon-ex-sir-pe
//   /cards                hub listing every card page
//
// What a card page is: the thing a chaser bookmarks. The nightly price line (engine
// mark), the ask floor + verified sample size, the engine's chart signal (gated),
// auction hammers as they accumulate, the verified live listings at shown prices
// (the link type that actually converts — Sep 4 EPN read), a feed-linked ★ Track
// button, and the Signal Alerts capture. Phone-first: one column, the listing is
// the tap target.
//
// Everything priced is rendered CLIENT-SIDE from the price-data branch feeds
// (prices-latest.json / prices-history.json / market-latest.json) and from
// /api/comps?card=<id> (the engine's verifyListings filter, server-side), so the
// HTML never goes stale between builds. The build bakes the last mark + date into
// the static markup for crawlers and for audit-prices (numeric price + dated stamp).
//
// Usage:  node tools/build-card-pages.mjs            (writes card-*.html + cards.html)
//         node tools/build-card-pages.mjs --dry      (report only)
// Then:   node tools/build-nav.js  (only if nav.json changed) · audit gates · push.
// Re-run on the Monday run so the baked stamps stay fresh (audit-prices STALE_DAYS=21).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const FEED_BASE = "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data";
const EPN = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";

const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const exists = (f) => fs.existsSync(path.join(REPO, f));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const attr = esc;

// ---------- shell pieces borrowed from a known-good page ----------
const SHELL = read("how-prices-work.html");
const pageCss = (SHELL.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const gtag = (SHELL.match(/(<!-- Google Analytics[\s\S]*?<\/script>)/) || [])[1];
const nav = (SHELL.match(/(<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->)/) || [])[1];
const footer = (SHELL.match(/(<footer>[\s\S]*?<\/footer>)/) || [])[1];
if (!pageCss || !gtag || !nav || !footer) throw new Error("shell pieces not found in how-prices-work.html");

// ---------- data ----------
const wl = JSON.parse(read("data/watchlist.json"));
const cards = (wl.cards || []).filter((c) => c && c.source === "ebay" && c.id && c.query);
let latest = null;
try { latest = JSON.parse(await (await fetch(`${FEED_BASE}/prices-latest.json?t=${Date.now()}`)).text()); } catch { latest = null; }
const latestBy = new Map(((latest && latest.cards) || []).map((c) => [c.key, c]));

// ---------- per-card derived facts ----------
const TCG_SETS = {
  "pitch-black-set-guide": ["Pitch Black", "pitch-black-index", "PB26"],
  "chaos-rising": ["Chaos Rising", "chaos-rising-index", "CR26"],
  "ascended-heroes": ["Ascended Heroes", "ascended-heroes-index", "AH26"],
  "prismatic-evolutions-guide": ["Prismatic Evolutions", "prismatic-evolutions-index", "PRIS25"],
  "destined-rivals": ["Destined Rivals", "destined-rivals-index", "DR25"],
};
function facts(c) {
  // Positive query tokens only: "-sapphire" in a Chrome query must not read as Sapphire.
  const q = c.query.split(/\s+/).filter((t) => t && !t.startsWith("-")).join(" ").toLowerCase();
  const year = (q.match(/\b(20\d{2})\b/) || [])[1] || "";
  const type = c.cardType || "chrome-auto";
  const isTcg = type === "tcg-single";
  const code = (c.query.match(/\b([A-Z]{2,4}-[A-Z]{1,3}\d{0,3}|[A-Z]{2,4}-\d{1,3})\b/) || [])[1] || null;
  let set = "Pokémon TCG", cat = "pokemon", setHref = null, indexHref = null, ticker = null, lane = "Pokémon single";
  if (!isTcg) {
    cat = "baseball";
    set = `${year} Bowman${/sapphire/.test(q) ? " Sapphire" : /chrome/.test(q) ? " Chrome" : ""}`.trim();
    setHref = "/bowman-bangers";
    lane = type === "chrome-auto" ? "1st Bowman Chrome Auto · raw" : type === "sapphire-base" ? "1st Bowman Sapphire · raw base" : "1st Bowman Chrome · raw base";
  } else {
    const m = TCG_SETS[c.slug];
    if (m) { set = m[0]; indexHref = "/" + m[1]; ticker = m[2]; }
    if (/mewtwo/.test(q) && !m) { set = "Destined Rivals"; indexHref = "/destined-rivals-index"; ticker = "DR25"; }
    lane = "SIR single · raw";
    setHref = c.slug && exists(c.slug + ".html") ? "/" + c.slug : null;
  }
  const guideHref = c.slug && exists(c.slug + ".html") ? "/" + c.slug : null;
  const positive = c.query.split(/\s+/).filter((t) => t && !t.startsWith("-")).join(" ");
  const ebaySearch = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(positive)}&LH_BIN=1&${EPN}&customid=card-${c.id}`;
  const l = latestBy.get("ebay:" + c.id) || null;
  const img = l && l.image && l.image.url ? l.image : null;
  const imgHref = img && img.item ? img.item.replace(/customid=[^&]*/, "customid=card-" + c.id) : ebaySearch;
  return { year, type, isTcg, code, set, cat, setHref, indexHref, ticker, lane, guideHref, ebaySearch, latest: l, img, imgHref, positive };
}

const fmt$ = (n) => n == null ? "—" : "$" + (n >= 1000 ? Math.round(n).toLocaleString("en-US") : n >= 100 ? String(Math.round(n)) : n.toFixed(2));

// ---------- page CSS (card pages only; shell CSS already has tokens/nav/footer) ----------
const CARD_CSS = `
.cp-wrap { max-width:760px; margin:0 auto; padding:28px 20px 60px; }
.cp-wrap section, .cp-wrap .cp-sec { padding:0; border-top:0; animation:none; }
.cp-wrap .cp-sec { margin:34px 0 0; padding-top:26px; border-top:1px solid var(--border); }
.cp-crumbs { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
.cp-crumbs a { color:var(--text-dim); } .cp-crumbs a:hover { color:var(--accent); }
.cp-head { display:grid; grid-template-columns:120px 1fr; gap:18px; align-items:start; margin-bottom:22px; }
.cp-photo { position:relative; display:block; background:var(--bg2); border:1px solid var(--border2); aspect-ratio:5/7; overflow:hidden; }
.cp-photo img { width:100%; height:100%; object-fit:contain; display:block; }
.cp-photo .cp-noimg { display:flex; align-items:center; justify-content:center; height:100%; font-family:var(--fm); font-size:10px; color:var(--text-dim); letter-spacing:1px; }
.cp-eyebrow { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--accent); margin-bottom:8px; }
.cp-title { font-family:var(--fd); font-size:clamp(28px,6vw,44px); font-weight:900; line-height:0.98; letter-spacing:-0.5px; text-transform:uppercase; color:var(--text-head); margin:0 0 8px; }
.cp-lane { font-family:var(--fm); font-size:12px; color:var(--text-dim); letter-spacing:0.5px; }
.cp-lane b { color:var(--text); font-weight:600; }
.cp-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:var(--border); border:1px solid var(--border); margin:18px 0 14px; }
.cp-cell { background:var(--bg2); padding:14px 12px; min-width:0; }
.cp-cell .l { font-family:var(--fm); font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--text-dim); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cp-cell .v { font-family:var(--fd); font-size:26px; font-weight:900; line-height:1; color:var(--text-head); letter-spacing:-0.5px; }
.cp-cell .s { font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:5px; }
.cp-cell .v.up { color:var(--green); } .cp-cell .v.dn { color:var(--red); }
.cp-sig { display:inline-flex; align-items:center; gap:6px; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:6px 10px; border:1px solid var(--border2); background:var(--bg2); color:var(--text); }
.cp-sig.buy { border-color:rgba(0,224,122,0.5); color:var(--green); } .cp-sig.sell { border-color:rgba(255,46,85,0.5); color:var(--red); } .cp-sig.hold { border-color:rgba(245,200,0,0.4); color:var(--gold); }
.cp-actions { display:flex; gap:10px; flex-wrap:wrap; align-items:center; margin:8px 0 26px; }
.cp-actions .sch-track-card { font-family:var(--fm); font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:var(--accent); color:#000; border:none; padding:13px 18px; cursor:pointer; min-height:44px; }
.cp-actions .cp-jump { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--border2); padding:12px 16px; min-height:44px; display:inline-flex; align-items:center; }
.cp-actions .cp-jump:hover { color:var(--accent); border-color:var(--accent); text-decoration:none; }
.cp-sec { margin:30px 0; }
.cp-sec h2 { font-family:var(--fd); font-size:22px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-head); margin:0 0 4px; }
.cp-sec .sub { font-size:13px; color:var(--text-dim); margin:0 0 14px; line-height:1.55; }
.cp-chart { background:var(--bg2); border:1px solid var(--border2); padding:12px 8px 6px; }
.cp-chart svg { width:100%; height:auto; display:block; }
.cp-chart .axis { font-family:var(--fm); font-size:10px; fill:var(--text-dim); }
.cp-chart .grid { stroke:rgba(255,255,255,0.06); }
.cp-chart .line { fill:none; stroke:var(--accent); stroke-width:2; stroke-linejoin:round; stroke-linecap:round; }
.cp-chart .sma { fill:none; stroke:var(--gold); stroke-width:1.2; stroke-dasharray:4 4; opacity:0.85; }
.cp-chart .area { fill:rgba(0,204,245,0.08); }
.cp-chart .dot { fill:var(--accent); }
.cp-chart .last { font-family:var(--fm); font-size:11px; font-weight:700; fill:var(--text-head); }
.cp-legend { display:flex; gap:16px; flex-wrap:wrap; font-family:var(--fm); font-size:10px; color:var(--text-dim); padding:8px 4px 2px; letter-spacing:0.5px; }
.cp-legend i { display:inline-block; width:14px; height:2px; vertical-align:middle; margin-right:5px; background:var(--accent); }
.cp-legend i.g { background:var(--gold); }
.cp-note { font-family:var(--fm); font-size:11px; color:var(--text-dim); line-height:1.6; }
.cp-list { display:flex; flex-direction:column; gap:8px; }
.cp-item { display:grid; grid-template-columns:64px 1fr auto; gap:12px; align-items:center; background:var(--bg2); border:1px solid var(--border2); padding:10px 12px 10px 10px; color:var(--text); min-height:64px; transition:border-color 0.15s; }
.cp-item:hover { border-color:var(--accent); color:var(--text); text-decoration:none; }
.cp-item .ph { position:relative; width:64px; height:64px; background:var(--bg3); overflow:hidden; }
.cp-item .ph img { width:100%; height:100%; object-fit:cover; display:block; }
.cp-item .t { font-size:13px; line-height:1.35; color:var(--text); overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.cp-item .m { font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:4px; }
.cp-item .p { text-align:right; white-space:nowrap; }
.cp-item .p b { font-family:var(--fd); font-size:22px; font-weight:900; color:var(--green); display:block; line-height:1; }
.cp-item .p span { font-family:var(--fm); font-size:10px; color:var(--text-dim); }
.cp-item .p .ebay { display:block; font-family:var(--fm); font-size:9px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--accent); margin-top:5px; }
.cp-item.auction .p b { color:var(--gold); }
.cp-foot { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center; margin-top:12px; }
.cp-foot a.more { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--accent); border:1px solid rgba(0,204,245,0.4); padding:11px 14px; min-height:44px; display:inline-flex; align-items:center; }
.cp-foot a.more:hover { background:var(--accent); color:#000; text-decoration:none; }
.cp-hammers { display:grid; grid-template-columns:repeat(3,1fr); gap:2px; background:var(--border); border:1px solid var(--border); }
.cp-related { display:grid; grid-template-columns:repeat(2,1fr); gap:10px; }
.cp-related a { display:block; background:var(--bg2); border:1px solid var(--border2); padding:14px; color:var(--text); }
.cp-related a:hover { border-color:var(--accent); text-decoration:none; }
.cp-related .rt { font-family:var(--fm); font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--accent); margin-bottom:6px; }
.cp-related .rn { font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.1; }
.cp-empty { background:var(--bg2); border:1px dashed var(--border2); padding:18px; font-family:var(--fm); font-size:12px; color:var(--text-dim); line-height:1.6; }
@media (max-width:640px) {
  .cp-wrap { padding:18px 14px 50px; }
  .cp-head { grid-template-columns:96px 1fr; gap:14px; }
  .cp-strip { grid-template-columns:1fr 1fr; }
  .cp-cell .v { font-size:24px; }
  .cp-related { grid-template-columns:1fr; }
  .cp-hammers { grid-template-columns:1fr 1fr 1fr; }
  .cp-item { grid-template-columns:56px 1fr auto; gap:10px; }
  .cp-item .ph { width:56px; height:56px; }
  .cp-item .p b { font-size:20px; }
}
`;

// ---------- client script (one per page; CARD is baked) ----------
const CLIENT_JS = `
(function(){
  'use strict';
  var C = window.SCH_CARD; if (!C) return;
  var KEY = 'ebay:' + C.id;
  var FEED = '${FEED_BASE}';
  var $ = function(id){ return document.getElementById(id); };
  var esc = function(s){ return String(s==null?'':s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); };
  var fmt = function(n){ if (n==null || !isFinite(n)) return '\\u2014'; return '$' + (n>=1000 ? Math.round(n).toLocaleString('en-US') : n>=100 ? String(Math.round(n)) : n.toFixed(2)); };
  var dstr = function(d){ if(!d) return ''; var p = d.split('-'); return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+p[1]-1] + ' ' + (+p[2]); };
  function getJSON(u){ return fetch(u, {cache:'no-store'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }); }

  /* 1. latest mark + strip + signal */
  getJSON(FEED + '/prices-latest.json?t=' + Date.now()).then(function(d){
    var c = (d.cards||[]).filter(function(x){ return x.key===KEY; })[0]; if(!c) return;
    var day = d.day || '';
    if (c.last != null) { $('cp-mark').textContent = fmt(c.last); $('cp-mark-d').textContent = 'engine mark \\u00b7 ' + dstr(day); }
    var roc = c.roc30; var el = $('cp-roc');
    if (roc != null && isFinite(roc)) { el.textContent = (roc>0?'+':'') + roc.toFixed(1) + '%'; el.className = 'v ' + (roc>0.5?'up':roc<-0.5?'dn':''); }
    $('cp-n').textContent = c.points != null ? String(c.points) : '\\u2014';
    if (c.askQ1 != null && c.askQ3 != null) $('cp-n-s').textContent = 'asks ' + fmt(c.askQ1) + '\\u2013' + fmt(c.askQ3) + ' (Q1\\u2013Q3)';
    $('cp-sup').textContent = c.supply != null ? String(c.supply) : '\\u2014';
    if (c.supplyChange30 != null) $('cp-sup-s').textContent = (c.supplyChange30>0?'+':'') + c.supplyChange30.toFixed(0) + '% vs 30d';
    var sig = $('cp-sig'); var s = String(c.signal||'HOLD').toUpperCase(); var gated = !!c.gated || (c.signalRaw && c.signalRaw !== c.signal);
    sig.className = 'cp-sig ' + s.toLowerCase();
    sig.innerHTML = '<span>engine \\u00b7 ' + esc(s) + '</span>' + (gated ? '<span style="opacity:.7">\\u00b7 gated, thin sample</span>' : '');
    var why = (c.reasons||[])[0]; if (why) $('cp-why').textContent = why + (c.confidence!=null ? ' \\u00b7 confidence ' + Math.round(c.confidence*100) + '%' : '');
    if (c.image && c.image.url) { var im = $('cp-img'); if (im && im.tagName==='IMG') im.src = c.image.url;
      var ph = $('cp-photo'); if (ph && c.image.item) ph.href = c.image.item.replace(/customid=[^&]*/, 'customid=card-' + C.id); }
  }).catch(function(){});

  /* 2. history chart */
  getJSON(FEED + '/prices-history.json?t=' + Date.now()).then(function(h){
    var e = h[KEY]; var box = $('cp-chart'); if(!e || !box) return;
    var pts = (e.series||[]).filter(function(p){ return p && p.p != null && isFinite(p.p); });
    $('cp-chart-n').textContent = pts.length + ' nightly point' + (pts.length===1?'':'s') + (pts.length ? ' \\u00b7 ' + dstr(pts[0].d) + ' \\u2192 ' + dstr(pts[pts.length-1].d) : '');
    if (pts.length < 2) { box.innerHTML = '<div class="cp-empty">' + pts.length + ' point so far \\u2014 the line fills in one point per night as the engine re-marks this card.</div>'; return; }
    var W=640,H=260,L=44,R=14,T=16,B=28;
    var ys = pts.map(function(p){return p.p;}); var lo=Math.min.apply(null,ys), hi=Math.max.apply(null,ys);
    if (hi===lo){ hi=lo*1.05; lo=lo*0.95; } var pad=(hi-lo)*0.12; lo-=pad; hi+=pad; if(lo<0) lo=0;
    var x=function(i){ return L + (W-L-R)*i/(pts.length-1); }, y=function(v){ return T + (H-T-B)*(1-(v-lo)/(hi-lo)); };
    var sma=[]; for (var i=0;i<pts.length;i++){ var a=Math.max(0,i-29); var seg=ys.slice(a,i+1); sma.push(seg.reduce(function(s,v){return s+v;},0)/seg.length); }
    var line = pts.map(function(p,i){ return (i?'L':'M') + x(i).toFixed(1) + ' ' + y(p.p).toFixed(1); }).join(' ');
    var area = line + ' L' + x(pts.length-1).toFixed(1) + ' ' + (H-B) + ' L' + L + ' ' + (H-B) + ' Z';
    var sl = sma.map(function(v,i){ return (i?'L':'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); }).join(' ');
    var g=''; for (var k=0;k<=4;k++){ var v=lo+(hi-lo)*k/4; var yy=y(v); g += '<line class="grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+yy.toFixed(1)+'" y2="'+yy.toFixed(1)+'"/>' + '<text class="axis" x="'+(L-6)+'" y="'+(yy+3).toFixed(1)+'" text-anchor="end">'+fmt(v)+'</text>'; }
    var xl = '<text class="axis" x="'+L+'" y="'+(H-8)+'">'+esc(dstr(pts[0].d))+'</text><text class="axis" x="'+(W-R)+'" y="'+(H-8)+'" text-anchor="end">'+esc(dstr(pts[pts.length-1].d))+'</text>';
    var lastP = pts[pts.length-1]; var lx = x(pts.length-1), ly = y(lastP.p);
    var lab = '<circle class="dot" cx="'+lx.toFixed(1)+'" cy="'+ly.toFixed(1)+'" r="3.5"/><text class="last" x="'+(lx-8).toFixed(1)+'" y="'+(ly-10).toFixed(1)+'" text-anchor="end">'+fmt(lastP.p)+'</text>';
    box.innerHTML = '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Nightly engine mark, '+pts.length+' points">' + g + '<path class="area" d="'+area+'"/><path class="sma" d="'+sl+'"/><path class="line" d="'+line+'"/>' + lab + xl + '</svg>' +
      '<div class="cp-legend"><span><i></i>engine mark (trimmed low-ask, price + shipping)</span><span><i class="g"></i>30-night average</span></div>';
  }).catch(function(){});

  /* 3. hammers / auction closes (market-latest.json exists once the engine has recorded closes) */
  getJSON(FEED + '/market-latest.json?t=' + Date.now()).then(function(m){
    var b = m && (m[KEY] || (m.byKey && m.byKey[KEY]) || (m.cards && m.cards[KEY])); if(!b) return;
    var box = $('cp-hammers'); if(!box) return;
    var n = (b.hammers||[]).length;
    if (!n && !b.watching) return;
    box.innerHTML = '<div class="cp-hammers">' +
      '<div class="cp-cell"><div class="l">Hammers \\u00b7 30d</div><div class="v">' + n + '</div><div class="s">auction closes captured</div></div>' +
      '<div class="cp-cell"><div class="l">Median hammer</div><div class="v">' + (b.hammerMedian!=null ? fmt(b.hammerMedian) : '\\u2014') + '</div><div class="s">what buyers actually paid</div></div>' +
      '<div class="cp-cell"><div class="l">Watching</div><div class="v">' + (b.watching||0) + '</div><div class="s">live auctions tracked nightly</div></div></div>';
  }).catch(function(){});

  /* 4. verified live listings — this exact card (engine filter, server-side) */
  var list = $('cp-list'); if (!list) return;
  getJSON('/api/comps?card=' + encodeURIComponent(C.id) + '&customid=card-' + encodeURIComponent(C.id) + '&sort=price&limit=100').then(function(j){
    var fixed = j.verified, auct = j.auctions || [];
    if (!fixed) { /* verify mode unavailable: fall back to a plain title filter so the page still shows something honest */
      var must = C.must.toLowerCase(); fixed = (j.listings||[]).filter(function(l){ var t=(l.title||'').toLowerCase(); return l.price>0 && t.indexOf(must)!==-1 && (!C.code || t.replace(/[\\s#\\u2010-\\u2015-]/g,'').toUpperCase().indexOf(C.code.replace('-',''))!==-1); }).map(function(l){ l.total = l.price + (l.shipping||0); return l; }).sort(function(a,b){ return a.total-b.total; });
      $('cp-list-sub').textContent = 'Title-matched live listings (engine filter unavailable right now).';
    }
    var top = fixed.slice(0, 8);
    var html = top.map(function(l){
      return '<a class="cp-item" href="' + esc(l.url) + '" target="_blank" rel="noopener sponsored" onclick="if(window.gtag)gtag(\\'event\\',\\'click\\',{link_url:\\'ebay\\',card:\\'' + C.id + '\\',kind:\\'fixed\\'})">' +
        '<span class="ph">' + (l.image ? '<img src="' + esc(l.image) + '" alt="" loading="lazy">' : '') + '</span>' +
        '<span><span class="t">' + esc(l.title) + '</span><span class="m">' + esc(l.condition||'') + (l.seller && l.seller.feedbackPct ? ' \\u00b7 seller ' + esc(l.seller.feedbackPct) + '%' : '') + '</span></span>' +
        '<span class="p"><b>' + fmt(l.price) + '</b><span>' + (l.shipping>0 ? '+' + fmt(l.shipping) + ' ship' : l.shipping===0 ? 'free ship' : 'ship n/a') + '</span><span class="ebay">Buy on eBay \\u2192</span></span></a>';
    }).join('');
    auct.slice(0,4).forEach(function(l){
      var ends = l.endDate ? Math.max(0, (new Date(l.endDate).getTime() - Date.now())/36e5) : null;
      html += '<a class="cp-item auction" href="' + esc(l.url) + '" target="_blank" rel="noopener sponsored" onclick="if(window.gtag)gtag(\\'event\\',\\'click\\',{link_url:\\'ebay\\',card:\\'' + C.id + '\\',kind:\\'auction\\'})">' +
        '<span class="ph">' + (l.image ? '<img src="' + esc(l.image) + '" alt="" loading="lazy">' : '') + '</span>' +
        '<span><span class="t">' + esc(l.title) + '</span><span class="m">auction \\u00b7 ' + (l.bidCount||0) + ' bid' + (l.bidCount===1?'':'s') + (ends!=null ? ' \\u00b7 ends in ' + (ends>=48 ? Math.round(ends/24)+'d' : Math.round(ends)+'h') : '') + '</span></span>' +
        '<span class="p"><b>' + fmt(l.bid) + '</b><span>current bid</span><span class="ebay">Bid on eBay \\u2192</span></span></a>';
    });
    if (!html) html = '<div class="cp-empty">No live listing passes the exact-card filter right now (' + ((j.rejected&&j.rejected.count)||j.count||0) + ' listings looked at, none was this card). Check back tonight.</div>';
    list.innerHTML = html;
    var rej = j.rejected; var f = $('cp-list-foot');
    if (f) {
      var NICE = { not:'auctions / other formats', blocklist:'graded, parallels, lots, reprints', 'blocklist-2':'signed base cards, variations', duplicate:'repeat seller listings', missing:'wrong code or year', foreign:'other card codes', no:'no usable price' };
      var parts = []; if (rej) { for (var k in rej.reasons) parts.push(rej.reasons[k] + ' ' + (NICE[k] || k.replace(/-/g,' '))); }
      f.textContent = (fixed.length + ' verified fixed-price' + (auct.length ? ' \\u00b7 ' + auct.length + ' live auction' + (auct.length===1?'':'s') : '')) + (rej ? ' \\u00b7 ' + rej.count + ' excluded (' + parts.slice(0,4).join(', ') + ')' : '') + ' \\u00b7 asks, not solds \\u00b7 refreshes ~15 min';
    }
  }).catch(function(){ list.innerHTML = '<div class="cp-empty">Live listings are unavailable right now.</div>'; });
})();
`;

// ---------- page template ----------
function renderCard(c) {
  const f = facts(c);
  const url = `/card-${c.id}`;
  const canon = `https://www.shopcardhub.com${url}`;
  const last = f.latest && f.latest.last != null ? f.latest.last : null;
  const day = (latest && latest.day) || new Date().toISOString().slice(0, 10);
  const title = `${c.label} — Price Chart & Verified Live Listings | ShopCardHub`;
  const desc = `Nightly price chart for ${c.label}${last != null ? ` (engine mark ${fmt$(last)} as of ${day})` : ""}: verified live eBay listings for this exact card, auction hammers, and a ★ Track button for your Vault.`;
  const ld = { "@context": "https://schema.org", "@type": "WebPage", name: c.label + " — price chart", url: canon, description: desc, isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com" } };
  // Fallback title token for the client-side filter (only used if /api/comps card mode is unavailable):
  // the longest real word of the card name, never a rarity/prefix token.
  const must = c.label.split(/\s[—–]\s/)[0].split(/\s+/).filter((w) => !/^(ex|sir|mega|t\.r\.'s|team|rocket's|1st|#\S*)$/i.test(w)).sort((a, b) => b.length - a.length)[0] || c.id.split("-")[0];
  const crumbs = [`<a href="/">Home</a>`, `<span>/</span>`, `<a href="/cards">Card Charts</a>`, `<span>/</span>`, `<span>${esc(c.label.split(/\s[—–]\s/)[0])}</span>`].join(" ");
  const related = [];
  if (f.guideHref) related.push([f.isTcg ? "Set guide" : "Player guide", c.slug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()), f.guideHref]);
  if (f.indexHref) related.push(["Set index", `${f.ticker} — ${f.set}`, f.indexHref]);
  if (!f.isTcg) related.push(["The board", "2026 Bowman Bangers", "/bowman-bangers"]);
  related.push(["All tickers", "Set Indices", "/indices"]);
  related.push(["Methodology", "How our prices work", "/how-prices-work"]);
  related.push(["Your list", "Open the Vault", "/watchlist"]);
  const relHtml = related.slice(0, 6).map(([t, n, h]) => `<a href="${attr(h)}"><div class="rt">${esc(t)}</div><div class="rn">${esc(n)}</div></a>`).join("\n        ");
  const photo = f.img
    ? `<a class="cp-photo" id="cp-photo" href="${attr(f.ebaySearch)}" target="_blank" rel="noopener sponsored" aria-label="${attr(c.label)} on eBay"><img id="cp-img" src="${attr(f.img.url)}" alt="${attr(c.label)}" loading="eager"><span class="sch-ebay-tag" aria-hidden="true">eBay</span></a>`
    : `<a class="cp-photo" href="${attr(f.ebaySearch)}" target="_blank" rel="noopener sponsored" aria-label="${attr(c.label)} on eBay"><span class="cp-noimg">NO PHOTO YET</span><span class="sch-ebay-tag" aria-hidden="true">eBay</span></a>`;
  const cardObj = { id: c.id, label: c.label, code: f.code, must, type: f.type };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(desc)}">
  <link rel="canonical" href="${canon}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${attr(c.label + " — Price Chart & Live Listings")}">
  <meta property="og:description" content="${attr(desc)}">
  <meta property="og:url" content="${canon}">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/${f.isTcg ? "pokemon" : "bowman"}.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/${f.isTcg ? "pokemon" : "bowman"}.png">
  <script type="application/ld+json">${JSON.stringify(ld)}</script>
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
  <style>${pageCss}</style>
  <style>${CARD_CSS}</style>
  ${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
</head>
<body>

${nav}

<main class="cp-wrap" data-prices-updated="${day}">
  <div class="cp-crumbs">${crumbs}</div>

  <div class="cp-head">
    ${photo}
    <div>
      <div class="cp-eyebrow">Card chart · ${esc(f.set)} · engine-tracked</div>
      <h1 class="cp-title">${esc(c.label.split(/\s[—–]\s/)[0])}</h1>
      <div class="cp-lane"><b>${esc(f.lane)}</b>${f.code ? ` · <b>${esc(f.code)}</b>` : ""} · re-priced nightly from verified eBay asks</div>
    </div>
  </div>

  <div class="cp-strip">
    <div class="cp-cell"><div class="l">Engine mark</div><div class="v" id="cp-mark">${last != null ? fmt$(last) : "—"}</div><div class="s" id="cp-mark-d">${last != null ? "engine mark · " + esc(day) : "no verified mark yet"}</div></div>
    <div class="cp-cell"><div class="l">30-day change</div><div class="v" id="cp-roc">—</div><div class="s">vs 30 nights ago</div></div>
    <div class="cp-cell"><div class="l">Verified asks</div><div class="v" id="cp-n">—</div><div class="s" id="cp-n-s">in tonight's mark</div></div>
    <div class="cp-cell"><div class="l">Supply</div><div class="v" id="cp-sup">—</div><div class="s" id="cp-sup-s">live listings of this card</div></div>
  </div>
  <div class="cp-actions">
    <button class="sch-track-card" data-name="${attr(c.label)}" data-set="${attr(f.set)}" data-cat="${attr(f.cat)}" data-grade="Raw" data-feed="ebay:${attr(c.id)}">&#9733; Track this card</button>
    <span class="cp-sig hold" id="cp-sig"><span>engine · —</span></span>
    <a class="cp-jump" href="#live">Live listings &#8595;</a>
  </div>
  <div class="cp-note" id="cp-why" style="margin:-14px 0 22px;"></div>

  <section class="cp-sec" id="chart">
    <h2>Nightly price line</h2>
    <p class="sub">One point per night: the trimmed low-ask mark for <b>this exact card</b> (price + shipping, cheapest junk dropped). Asks proxy solds; the method is identical every night, so the shape is what matters. <span id="cp-chart-n"></span></p>
    <div class="cp-chart" id="cp-chart"><div class="cp-empty">Loading the nightly series&hellip;</div></div>
  </section>

  <section class="cp-sec" id="sold">
    <h2>What buyers paid</h2>
    <p class="sub">Auction closes the engine records itself. Hammer capture began in early September 2026 — this fills in as auctions for this card close.</p>
    <div id="cp-hammers"><div class="cp-empty">No auction close recorded for this card yet.</div></div>
  </section>

  <section class="cp-sec" id="live">
    <h2>Verified live listings</h2>
    <p class="sub" id="cp-list-sub">Only listings that pass the engine's exact-card filter — right code, right year, no graded slabs, parallels, lots or reprints. Cheapest first, price before shipping.</p>
    <div class="cp-list" id="cp-list"><div class="cp-empty">Pulling live listings&hellip;</div></div>
    <div class="cp-foot">
      <span class="cp-note" id="cp-list-foot">asks, not solds · refreshes ~15 min</span>
      <a class="more" href="${attr(f.ebaySearch)}" target="_blank" rel="noopener sponsored">All listings on eBay &#8594;</a>
    </div>
  </section>

  <!-- SIGNAL ALERTS — email capture (renders only when data/newsletter.json lists this page — MailerLite via /api/subscribe) -->
  <div class="sig-alerts" data-schsub="card-pages" style="display:none; background:var(--bg2); border:1px solid var(--border2); border-left:3px solid var(--accent); padding:22px 20px; margin:30px 0;">
    <div style="font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--accent); margin-bottom:8px;">&#9993; Signal Alerts</div>
    <div style="font-family:var(--fd); font-size:22px; font-weight:900; text-transform:uppercase; color:var(--text-head); letter-spacing:0.5px; margin-bottom:6px;">The Tape, In Your Inbox</div>
    <p style="font-size:14px; color:var(--text-dim); line-height:1.6; max-width:560px; margin-bottom:16px;">The engine re-prices every tracked card nightly. Get the weekly recap of what moved.</p>
    <form class="schsub-form" style="display:flex; gap:10px; flex-wrap:wrap; max-width:560px;">
      <input type="email" name="email_address" required placeholder="you@example.com" aria-label="Email address"
        style="flex:1 1 240px; min-width:0; background:var(--bg3); border:1px solid var(--border2); border-radius:2px; color:var(--text); font-family:var(--fm); font-size:13px; padding:12px 14px;">
      <button type="submit" class="btn-primary" style="border:none; cursor:pointer;">Get the Recap &#8594;</button>
    </form>
    <div class="schsub-msg" style="display:none; font-family:var(--fm); font-size:12px; color:var(--green); margin-top:12px;"></div>
    <div style="font-family:var(--fm); font-size:10px; color:var(--text-dim); letter-spacing:0.5px; margin-top:12px; opacity:0.7;">Weekly recap only. No spam, unsubscribe anytime.</div>
  </div>

  <section class="cp-sec">
    <h2>Keep going</h2>
    <div class="cp-related">
        ${relHtml}
    </div>
  </section>

  <p class="cp-note" style="margin-top:26px;">Prices are the engine's nightly marks from verified eBay asking prices and, where recorded, auction closes; they are dated, sourced, and never hand-typed. Nothing here is investment advice — cards are illiquid, think in 6–12 month holds. ShopCardHub earns a commission on eBay purchases made through links on this page.</p>
</main>

${footer}

<script>window.SCH_CARD = ${JSON.stringify(cardObj)};</script>
<script>${CLIENT_JS}</script>
<script>
  /* Signal Alerts signup — activates when data/newsletter.json lists this page (key = data-schsub). */
  (function () {
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.sig-alerts'));
    if (!blocks.length) return;
    fetch('/data/newsletter.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cfg) {
        if (!cfg || cfg.provider !== 'mailerlite' || !Array.isArray(cfg.pages)) return;
        blocks.forEach(function (b) {
          var key = b.getAttribute('data-schsub') || 'site';
          if (cfg.pages.indexOf(key) === -1) return;
          b.style.display = 'block';
          var form = b.querySelector('.schsub-form');
          var msg = b.querySelector('.schsub-msg');
          var btn = form.querySelector('button[type="submit"]');
          form.addEventListener('submit', function (ev) {
            ev.preventDefault();
            var email = form.querySelector('input[name="email_address"]').value.trim();
            if (!email) return;
            if (btn) btn.disabled = true;
            fetch('/api/subscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: email, source: 'signal-' + key }) })
              .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
              .then(function () {
                form.style.display = 'none';
                msg.textContent = '\\u2713 You\\u2019re on the list \\u2014 the next Tape Recap lands in your inbox.';
                msg.style.display = 'block';
                if (window.gtag) gtag('event', 'newsletter_signup', { method: 'mailerlite', location: 'signal-' + key });
              })
              .catch(function (status) {
                if (btn) btn.disabled = false;
                msg.textContent = status === 400 ? 'That address doesn\\u2019t look right \\u2014 check it and try again.' : 'Hmm \\u2014 that did not go through. Try again, or DM @shopcardhub.';
                msg.style.color = 'var(--orange)';
                msg.style.display = 'block';
              });
          });
        });
      })
      .catch(function () {});
  })();
</script>
<script src="/js/vault-track.js?v=5" defer></script>
</body>
</html>
`;
}

// ---------- hub page ----------
function renderHub(list) {
  const day = (latest && latest.day) || new Date().toISOString().slice(0, 10);
  const groups = [
    ["2026 Bowman · 1st Chrome Autos", (c) => facts(c).type === "chrome-auto"],
    ["2026 Bowman · Sapphire & Chrome base", (c) => /^(sapphire|chrome-base)/.test(facts(c).type)],
    ["Pokémon · index singles", (c) => facts(c).isTcg],
  ];
  const rows = groups.map(([name, pred]) => {
    const items = list.filter(pred);
    if (!items.length) return "";
    return `<h2 class="cp-sec-h">${esc(name)}</h2>
<div class="hub-list">
${items.map((c) => { const f = facts(c); const last = f.latest && f.latest.last != null ? fmt$(f.latest.last) : "—"; return `  <a class="hub-row" href="/card-${attr(c.id)}" data-key="ebay:${attr(c.id)}">
    <span class="ph">${f.img ? `<img src="${attr(f.img.url)}" alt="" loading="lazy">` : ""}</span>
    <span class="nm"><span class="t">${esc(c.label.split(/\s[—–]\s/)[0])}</span><span class="m">${esc(f.lane)}${f.code ? " · " + esc(f.code) : ""}</span></span>
    <span class="p"><b data-last>${last}</b><span data-roc>&nbsp;</span></span>
  </a>`; }).join("\n")}
</div>`;
  }).join("\n");
  const HUB_CSS = `
.cp-sec-h { font-family:var(--fd); font-size:20px; font-weight:900; text-transform:uppercase; letter-spacing:0.5px; color:var(--text-head); margin:26px 0 10px; }
.hub-list { display:flex; flex-direction:column; gap:6px; }
.hub-row { display:grid; grid-template-columns:44px 1fr auto; gap:12px; align-items:center; background:var(--bg2); border:1px solid var(--border2); padding:8px 12px 8px 8px; color:var(--text); min-height:60px; }
.hub-row:hover { border-color:var(--accent); text-decoration:none; color:var(--text); }
.hub-row .ph { width:44px; height:60px; background:var(--bg3); overflow:hidden; } .hub-row .ph img { width:100%; height:100%; object-fit:cover; display:block; }
.hub-row .t { display:block; font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.05; }
.hub-row .m { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:3px; }
.hub-row .p { text-align:right; } .hub-row .p b { font-family:var(--fd); font-size:22px; font-weight:900; color:var(--text-head); display:block; line-height:1; }
.hub-row .p span { font-family:var(--fm); font-size:10px; color:var(--text-dim); } .hub-row .p span.up { color:var(--green); } .hub-row .p span.dn { color:var(--red); }
`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Card Charts — Nightly Price Lines for Every Engine-Tracked Card | ShopCardHub</title>
  <meta name="description" content="One page per tracked card: the nightly engine mark, the price line, verified live eBay listings for that exact card, auction hammers, and a ★ Track button. 1st Bowman Chrome autos, Sapphire, and Pokémon index singles.">
  <link rel="canonical" href="https://www.shopcardhub.com/cards">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Card Charts — Nightly Price Lines">
  <meta property="og:description" content="One page per engine-tracked card: mark, price line, verified live listings, hammers, ★ Track.">
  <meta property="og:url" content="https://www.shopcardhub.com/cards">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/bowman.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/bowman.png">
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
  <style>${pageCss}</style>
  <style>${CARD_CSS}${HUB_CSS}</style>
  ${gtag}
  <link rel="stylesheet" href="/css/site-fixes.css">
</head>
<body>

${nav}

<main class="cp-wrap" data-prices-updated="${day}">
  <div class="cp-crumbs"><a href="/">Home</a> <span>/</span> <span>Card Charts</span></div>
  <div class="cp-eyebrow">Card charts · re-priced nightly</div>
  <h1 class="cp-title">Every tracked card,<br>one page each</h1>
  <p class="sub" style="font-size:14px; color:var(--text-dim); line-height:1.6; max-width:600px; margin:10px 0 6px;">The engine marks each of these cards every night from verified eBay asks. Open a card for its price line, what buyers paid at auction, and the live listings that pass the exact-card filter. ★ Track any of them into your <a href="/watchlist">Vault</a>. Set-level context lives on the <a href="/indices">Set Indices</a>.</p>
${rows}
  <p class="cp-note" style="margin-top:26px;">Marks as of <span data-day>${esc(day)}</span>. Asks, not solds, until hammers accumulate. ShopCardHub earns a commission on eBay purchases made through links on these pages.</p>
</main>

${footer}

<script>
(function(){
  fetch('${FEED_BASE}/prices-latest.json?t=' + Date.now(), {cache:'no-store'}).then(function(r){ return r.json(); }).then(function(d){
    var by = {}; (d.cards||[]).forEach(function(c){ by[c.key] = c; });
    var fmt = function(n){ if (n==null || !isFinite(n)) return '\\u2014'; return '$' + (n>=1000 ? Math.round(n).toLocaleString('en-US') : n>=100 ? String(Math.round(n)) : n.toFixed(2)); };
    document.querySelectorAll('.hub-row').forEach(function(row){
      var c = by[row.getAttribute('data-key')]; if(!c) return;
      var l = row.querySelector('[data-last]'); if (l && c.last!=null) l.textContent = fmt(c.last);
      var r = row.querySelector('[data-roc]'); if (r && c.roc30!=null && isFinite(c.roc30)) { r.textContent = (c.roc30>0?'+':'') + c.roc30.toFixed(1) + '% · 30d'; r.className = c.roc30>0.5?'up':c.roc30<-0.5?'dn':''; }
      var im = row.querySelector('.ph'); if (im && !im.querySelector('img') && c.image && c.image.url) im.innerHTML = '<img src="' + c.image.url + '" alt="" loading="lazy">';
    });
    var dd = document.querySelector('[data-day]'); if (dd && d.day) dd.textContent = d.day;
  }).catch(function(){});
})();
</script>
<script src="/js/vault-track.js?v=5" defer></script>
</body>
</html>
`;
}

// ---------- write ----------
const written = [];
for (const c of cards) {
  const html = renderCard(c);
  const file = `card-${c.id}.html`;
  if (!DRY) fs.writeFileSync(path.join(REPO, file), html);
  written.push(file);
}
const hub = renderHub(cards);
if (!DRY) fs.writeFileSync(path.join(REPO, "cards.html"), hub);
written.push("cards.html");
console.log(`${DRY ? "would write" : "wrote"} ${written.length} pages (feed day ${latest ? latest.day : "unavailable"}):\n  ` + written.join("\n  "));
