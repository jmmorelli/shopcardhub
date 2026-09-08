#!/usr/bin/env node
// tools/build-auctions.mjs — generates auctions.html, the Auction Desk (Sep 8 2026).
//
// The page is a thin client over /api/auctions: every VERIFIED live eBay auction
// for every engine-tracked card, with the nightly mark (ask basis, dated) and the
// watched hammers beside it, sorted by time to close. Visitors bid on eBay through
// EPN-tagged links (customid=auctions). Nothing on the page is a number the engine
// didn't produce; the empty state is honest.
//
// Shell (tokens, nav, footer, gtag) is borrowed from how-prices-work.html exactly
// like tools/build-card-pages.mjs. Re-run after nav.json changes or when the
// watchlist gains cards (the card→chart-page map is embedded at build time).
//
//   node tools/build-auctions.mjs        # writes auctions.html
//   node tools/build-auctions.mjs --dry

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const exists = (f) => fs.existsSync(path.join(REPO, f));
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const SHELL = read("how-prices-work.html");
const pageCss = (SHELL.match(/<style>([\s\S]*?)<\/style>/) || [])[1];
const gtag = (SHELL.match(/(<!-- Google Analytics[\s\S]*?<\/script>)/) || [])[1];
const nav = (SHELL.match(/(<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->)/) || [])[1];
const footer = (SHELL.match(/(<footer>[\s\S]*?<\/footer>)/) || [])[1];
if (!pageCss || !gtag || !nav || !footer) throw new Error("shell pieces not found in how-prices-work.html");

const wl = JSON.parse(read("data/watchlist.json"));
const cards = (wl.cards || []).filter((c) => c && c.source === "ebay" && c.id && c.query);
const hostOf = (c) => (c.slug && exists(c.slug + ".html") ? c.slug : null);
const cardHref = (c) => (hostOf(c) ? "/" + hostOf(c) + "#engine-" + c.id : "/card-" + c.id);
const HREFS = Object.fromEntries(cards.map((c) => [c.id, cardHref(c)]));

const CSS = `
.au-wrap { max-width:1060px; margin:0 auto; padding:28px 20px 60px; }
.au-wrap section { padding:0; border-top:0; animation:none; }
.au-crumbs { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text-dim); display:flex; gap:8px; flex-wrap:wrap; margin-bottom:18px; }
.au-crumbs a { color:var(--text-dim); } .au-crumbs a:hover { color:var(--accent); }
.au-eyebrow { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--accent); margin-bottom:8px; display:flex; align-items:center; gap:10px; }
.au-live { display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--green); box-shadow:0 0 0 0 rgba(0,224,122,0.6); animation:au-pulse 2s infinite; }
@keyframes au-pulse { 0%{box-shadow:0 0 0 0 rgba(0,224,122,0.6)} 70%{box-shadow:0 0 0 8px rgba(0,224,122,0)} 100%{box-shadow:0 0 0 0 rgba(0,224,122,0)} }
.au-title { font-family:var(--fd); font-size:clamp(30px,6vw,52px); font-weight:900; line-height:0.96; letter-spacing:-0.5px; text-transform:uppercase; color:var(--text-head); margin:0 0 10px; }
.au-title em { color:var(--accent); font-style:normal; }
.au-sub { font-size:15px; color:var(--text-dim); max-width:680px; line-height:1.65; margin:0 0 18px; }
.au-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:2px; background:var(--border); border:1px solid var(--border); margin:18px 0 20px; }
.au-cell { background:var(--bg2); padding:14px 12px; min-width:0; }
.au-cell .l { font-family:var(--fm); font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--text-dim); margin-bottom:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.au-cell .v { font-family:var(--fd); font-size:26px; font-weight:900; line-height:1; color:var(--text-head); }
.au-cell .v.g { color:var(--green); }
.au-cell .s { font-family:var(--fm); font-size:11px; color:var(--text-dim); margin-top:5px; }
.au-ctl { display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin:0 0 14px; }
.au-chip { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); border:1px solid var(--border2); background:var(--bg2); padding:9px 13px; cursor:pointer; min-height:38px; }
.au-chip[aria-pressed="true"] { color:#000; background:var(--accent); border-color:var(--accent); }
.au-chip:hover { color:var(--text-head); border-color:var(--accent); }
.au-chip[aria-pressed="true"]:hover { color:#000; }
.au-sel { font-family:var(--fm); font-size:11px; letter-spacing:1px; text-transform:uppercase; color:var(--text); background:var(--bg2); border:1px solid var(--border2); padding:9px 10px; min-height:38px; margin-left:auto; }
.au-list { display:flex; flex-direction:column; gap:6px; }
.au-row { display:grid; grid-template-columns:52px minmax(0,1fr) 120px 110px 130px 128px; gap:12px; align-items:center; background:var(--bg2); border:1px solid var(--border2); padding:10px 12px 10px 10px; color:var(--text); min-height:72px; }
.au-row.under { border-left:3px solid var(--green); }
.au-row.soon .au-end { color:var(--orange); }
.au-row .ph { width:52px; height:72px; background:var(--bg3); overflow:hidden; } .au-row .ph img { width:100%; height:100%; object-fit:cover; display:block; }
.au-row .nm { min-width:0; }
.au-row .nm a.c { display:block; font-family:var(--fd); font-size:18px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.05; }
.au-row .nm a.c:hover { color:var(--accent); text-decoration:none; }
.au-row .nm .t { display:block; font-size:12px; color:var(--text-dim); margin-top:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.au-row .nm .sl { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); opacity:0.7; margin-top:3px; }
.au-num { text-align:right; }
.au-num b { font-family:var(--fd); font-size:22px; font-weight:900; color:var(--text-head); display:block; line-height:1; }
.au-num span { font-family:var(--fm); font-size:11px; color:var(--text-dim); display:block; margin-top:4px; }
.au-end b { font-family:var(--fm); font-size:14px; font-weight:700; }
.au-vs { text-align:right; }
.au-vs b { display:inline-block; font-family:var(--fm); font-size:12px; font-weight:700; letter-spacing:0.5px; padding:5px 8px; border:1px solid var(--border2); color:var(--text); }
.au-vs b.g { color:var(--green); border-color:rgba(0,224,122,0.5); background:var(--green-dim); }
.au-vs b.r { color:var(--red); border-color:rgba(255,46,85,0.4); }
.au-vs span { display:block; font-family:var(--fm); font-size:10px; color:var(--text-dim); margin-top:5px; }
.au-bid { font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:var(--accent); color:#000; padding:12px 12px; text-align:center; display:block; min-height:44px; line-height:20px; }
.au-bid:hover { background:#fff; color:#000; text-decoration:none; }
.au-empty { background:var(--bg2); border:1px solid var(--border2); padding:26px 20px; font-size:14px; color:var(--text-dim); line-height:1.65; }
.au-empty b { color:var(--text-head); }
.au-note { font-family:var(--fm); font-size:11px; color:var(--text-dim); line-height:1.7; margin-top:22px; }
.au-legend { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:2px; background:var(--border); border:1px solid var(--border); margin:34px 0 0; }
.au-legend div { background:var(--bg2); padding:14px 14px; font-size:13px; color:var(--text-dim); line-height:1.55; }
.au-legend div b { display:block; font-family:var(--fm); font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--accent); margin-bottom:5px; }
.au-skel { height:72px; background:linear-gradient(90deg,var(--bg2),var(--bg3),var(--bg2)); background-size:200% 100%; animation:au-sh 1.2s infinite; border:1px solid var(--border); }
@keyframes au-sh { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
@media (max-width:860px) {
  .au-wrap { padding:18px 14px 50px; }
  .au-strip { grid-template-columns:repeat(2,1fr); }
  .au-row { grid-template-columns:44px minmax(0,1fr) auto; grid-template-areas:"ph nm num" "ph end vs" "bid bid bid"; row-gap:8px; }
  .au-row .ph { grid-area:ph; width:44px; height:60px; }
  .au-row .nm { grid-area:nm; } .au-row .au-num.price { grid-area:num; } .au-row .au-end { grid-area:end; text-align:left; } .au-row .au-vs { grid-area:vs; } .au-row .au-bid { grid-area:bid; }
  .au-row .au-end b { font-size:13px; } .au-row .au-end span { display:inline; margin-left:6px; }
  .au-sel { margin-left:0; width:100%; }
}
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Auction Desk — Live eBay Auctions Ending Under the Mark | ShopCardHub</title>
  <meta name="description" content="Every verified live eBay auction for the cards our price engine tracks — 1st Bowman Chrome autos, Sapphire, Pokémon index singles — with the nightly mark and recent hammers beside the current bid, sorted by time to close. Refreshed every 15 minutes.">
  <link rel="canonical" href="https://www.shopcardhub.com/auctions">
  <meta property="og:type" content="website">
  <meta property="og:title" content="Auction Desk — Live Auctions Ending Under the Mark">
  <meta property="og:description" content="Verified live eBay auctions for every engine-tracked card, current bid vs the nightly mark and recent hammers, sorted by time to close.">
  <meta property="og:url" content="https://www.shopcardhub.com/auctions">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/bowman.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/bowman.png">
  <script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Auction Desk — Live eBay Auctions Ending Under the Mark",
    url: "https://www.shopcardhub.com/auctions",
    description: "Every verified live eBay auction for the cards the ShopCardHub price engine tracks, with the nightly mark and recent hammers beside the current bid, sorted by time to close.",
    isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com" },
  })}</script>
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

<main class="au-wrap">
  <div class="au-crumbs"><a href="/">Home</a> <span>/</span> <a href="/cards">Card Charts</a> <span>/</span> <span>Auction Desk</span></div>
  <div class="au-eyebrow"><span class="au-live" aria-hidden="true"></span> Auction desk · live · refreshes every 15 min</div>
  <h1 class="au-title">Auctions ending <em>under the mark</em></h1>
  <p class="au-sub">Every live eBay auction that passes the exact-card filter for the ${cards.length} cards the engine tracks, with the card's nightly mark and what buyers actually paid at recent auctions beside the current bid. Sorted by time to close. A bid under the mark is the one thing on eBay you can act on today; whether it stays under is up to the last ten seconds.</p>

  <div class="au-strip" id="au-strip">
    <div class="au-cell"><div class="l">Live auctions</div><div class="v" id="k-count">—</div><div class="s">verified, ${cards.length} cards</div></div>
    <div class="au-cell"><div class="l">Under the mark</div><div class="v g" id="k-under">—</div><div class="s">bid + ship below the ask floor</div></div>
    <div class="au-cell"><div class="l">Closing in 6h</div><div class="v" id="k-soon">—</div><div class="s">act-now window</div></div>
    <div class="au-cell"><div class="l">Marks as of</div><div class="v" id="k-day" style="font-size:20px;">—</div><div class="s" id="k-gen">feed —</div></div>
  </div>

  <div class="au-ctl" role="group" aria-label="Filter auctions">
    <button class="au-chip" data-f="all" aria-pressed="true">All verified</button>
    <button class="au-chip" data-f="under" aria-pressed="false">Under the mark</button>
    <button class="au-chip" data-f="soon" aria-pressed="false">Closing in 6h</button>
    <select class="au-sel" id="au-card" aria-label="Card"><option value="">Every card</option>${cards.map((c) => `<option value="${esc(c.id)}">${esc(c.label)}</option>`).join("")}</select>
  </div>

  <div class="au-list" id="au-list"><div class="au-skel"></div><div class="au-skel"></div><div class="au-skel"></div><div class="au-skel"></div></div>

  <p class="au-note" id="au-note">Mark = the engine's verified ask floor for the exact card (ask basis, re-marked nightly). Hammers = the median of auction closes we watched for that card, shown only after two or more closes. Bid + shipping is compared to each separately; they are never blended. Auctions that fail the exact-card filter (parallels, slabs, lots, other card codes) are not shown. ShopCardHub earns a commission on eBay purchases made through links on this page.</p>

  <div class="au-legend">
    <div><b>Under the mark</b>Current bid + shipping is below the engine's ask floor for the card. That is where the ask side is tonight, not a promise of the hammer.</div>
    <div><b>vs hammers</b>The same bid against the median of closes the engine has watched for this card. Fewer than two closes and it says "no hammers yet".</div>
    <div><b>Verified</b>Title must carry the card code, the year, and none of the parallel/slab/lot words. Same filter that makes the nightly mark.</div>
    <div><b>What we don't know</b>The reserve, the snipes queued for the last ten seconds, and whether the seller's photo matches the title. Read the listing.</div>
  </div>
</main>

${footer}

<script>
(function(){
  var HREFS = ${JSON.stringify(HREFS)};
  var state = { f:'all', card:'', rows:[], gen:null, day:null };
  var list = document.getElementById('au-list');
  var fmt = function(n){ if (n==null || !isFinite(n)) return '\\u2014'; return '$' + (n>=1000 ? Math.round(n).toLocaleString('en-US') : n>=100 ? String(Math.round(n)) : n.toFixed(2)); };
  var pct = function(x){ if (x==null || !isFinite(x)) return null; var p = Math.round(x*100); return (p>0?'+':'') + p + '%'; };
  var esc = function(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  function left(end){ var ms = new Date(end).getTime() - Date.now(); if (!isFinite(ms)) return {t:'\\u2014', soon:false, over:false}; if (ms <= 0) return {t:'ended', soon:false, over:true};
    var m = Math.floor(ms/60000), h = Math.floor(m/60), d = Math.floor(h/24);
    var t = d >= 1 ? d + 'd ' + (h%24) + 'h' : h >= 1 ? h + 'h ' + (m%60) + 'm' : m + 'm';
    return {t:t, soon: ms < 6*3600e3, over:false}; }
  function endsAt(end){ try { return new Date(end).toLocaleString('en-US', {weekday:'short', hour:'numeric', minute:'2-digit'}); } catch(e){ return ''; } }
  function render(){
    var rows = state.rows.filter(function(r){ var l = left(r.endDate); if (l.over) return false; if (state.card && r.id !== state.card) return false; if (state.f==='under') return r.vsMark!=null && r.vsMark < 0; if (state.f==='soon') return l.soon; return true; });
    if (!rows.length) { list.innerHTML = '<div class="au-empty"><b>Nothing here right now.</b> ' + (state.f==='under' ? 'No verified auction is bidding under its card\\u2019s mark at the moment \\u2014 that happens; the desk refreshes every 15 minutes and most of the action is in the last hour.' : state.f==='soon' ? 'No verified auction closes in the next six hours.' : 'No verified live auctions for ' + (state.card ? 'this card' : 'the tracked cards') + ' at the moment.') + ' <a href="/cards">Card charts \\u2192</a></div>'; return; }
    list.innerHTML = rows.map(function(r){ var l = left(r.endDate); var under = r.vsMark!=null && r.vsMark < 0; var href = HREFS[r.id] || ('/card-' + r.id);
      var vsM = r.mark ? '<b class="' + (under?'g':'r') + '">' + pct(r.vsMark) + ' vs mark ' + fmt(r.mark) + '</b>' : '<b>no mark</b>';
      var vsH = r.hammerMedian ? '<span>' + pct(r.vsHammer) + ' vs hammers ' + fmt(r.hammerMedian) + ' (' + r.closes + ' closes)</span>' : '<span>no hammers yet</span>';
      return '<div class="au-row' + (under?' under':'') + (l.soon?' soon':'') + '">' +
        '<a class="ph" href="' + esc(href) + '">' + (r.image ? '<img src="' + esc(r.image) + '" alt="" loading="lazy">' : '') + '</a>' +
        '<div class="nm"><a class="c" href="' + esc(href) + '">' + esc(r.label.split(/\\s[\\u2014\\u2013]\\s/)[0]) + '</a><span class="t" title="' + esc(r.title) + '">' + esc(r.title) + '</span><span class="sl">' + (r.seller ? esc(r.seller.username) + ' \\u00b7 ' + esc(r.seller.feedbackPct) + '% (' + esc(r.seller.feedbackScore) + ')' : '') + '</span></div>' +
        '<div class="au-num price"><b>' + fmt(r.total) + '</b><span>' + fmt(r.bid) + ' + ' + (r.shipping==null ? 'ship ?' : r.shipping===0 ? 'free ship' : fmt(r.shipping) + ' ship') + ' \\u00b7 ' + (r.bidCount==null ? '' : r.bidCount + ' bid' + (r.bidCount===1?'':'s')) + '</span></div>' +
        '<div class="au-num au-end"><b>' + l.t + '</b><span>' + esc(endsAt(r.endDate)) + '</span></div>' +
        '<div class="au-vs">' + vsM + vsH + '</div>' +
        '<a class="au-bid" href="' + esc(r.url) + '" target="_blank" rel="nofollow sponsored noopener" data-card="' + esc(r.id) + '">Bid on eBay \\u2192</a>' +
      '</div>'; }).join('');
    list.querySelectorAll('a.au-bid').forEach(function(a){ a.addEventListener('click', function(){ if (window.gtag) gtag('event', 'click', { link_url:'ebay', card:a.getAttribute('data-card'), kind:'auction', page:location.pathname }); }); });
  }
  function kpis(){ var live = state.rows.filter(function(r){ return !left(r.endDate).over; });
    document.getElementById('k-count').textContent = live.length;
    document.getElementById('k-under').textContent = live.filter(function(r){ return r.vsMark!=null && r.vsMark<0; }).length;
    document.getElementById('k-soon').textContent = live.filter(function(r){ return left(r.endDate).soon; }).length;
    document.getElementById('k-day').textContent = state.day || '\\u2014';
    document.getElementById('k-gen').textContent = state.gen ? 'feed ' + new Date(state.gen).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'}) : 'feed \\u2014'; }
  function load(){ fetch('/api/auctions', {cache:'default'}).then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); }).then(function(d){ state.rows = d.rows || []; state.gen = d.generated; state.day = d.markDay; kpis(); render(); })
    .catch(function(){ list.innerHTML = '<div class="au-empty"><b>The feed didn\\u2019t answer.</b> eBay or the engine is not responding right now; this page shows nothing rather than a stale number. Try again in a minute.</div>'; }); }
  document.querySelectorAll('.au-chip').forEach(function(b){ b.addEventListener('click', function(){ document.querySelectorAll('.au-chip').forEach(function(x){ x.setAttribute('aria-pressed','false'); }); b.setAttribute('aria-pressed','true'); state.f = b.getAttribute('data-f'); render(); }); });
  document.getElementById('au-card').addEventListener('change', function(e){ state.card = e.target.value; render(); });
  load();
  setInterval(function(){ kpis(); render(); }, 60000);
  setInterval(load, 15*60000);
})();
</script>
</body>
</html>
`;

if (!DRY) fs.writeFileSync(path.join(REPO, "auctions.html"), html);
console.log(`${DRY ? "would write" : "wrote"} auctions.html (${cards.length} tracked cards; hrefs: ${Object.keys(HREFS).length})`);
