#!/usr/bin/env node
// build-collectors-desk.mjs — Gengar's Collector's Desk: one page per big Pokémon (Mo, Oct 5 2026: "make him love
// pokemon and collecting pokemon cards … suggests cards for big pokemon … 'these cards are true collectibles' …
// style it like the pokemon we are promoting, with animations, like the pikachu and lightning on the 30th").
//
// Editorial (Gengar's copy, shelves, print ids, theme) lives in data/collect/<pokemon>.json. EVERY price on the page is
// read here from data/cards/<tk>.json (the index's own raw sold mark) and data/cards/g-<tk>.json (dated PSA 9 / PSA 10 /
// TAG 10 marks, R18), so the page re-marks whenever the indices do — re-run after the Monday/Thursday lanes.
// Links are built by tools/lib/epn.mjs and the grade phrases mirror js/grade-links.js (1st Ed / Shadowless / Unlimited
// filters, the "TAG 10" slab phrase). 'collect', never 'buy' — NO CALLS. Nothing here is an ask.
//
//   node tools/build-collectors-desk.mjs [--only charizard] [--check]
//
// Writes <slug>.html at the repo root with empty NAV markers and a <!-- BUYSTRIP --> placeholder; the page is folded into
// buy-strip.json / sitemap / nav search / its hub by tools/league/integrate.mjs from tools/league/manifests/<slug>.json
// (R27 path), then build-buy-strip --only <slug> · build-signup · build-nav.js.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, assertClean, SACAT_TCG } from "./lib/epn.mjs";
import { THEMES, HERO_FX, HERO_JS } from "./collectors-desk/themes.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const ONLY = args.includes("--only") ? args[args.indexOf("--only") + 1] : null;
const rd = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const attr = (s) => esc(s).replace(/'/g, "&#39;");

// ---- grade phrases: keep in step with js/grade-links.js ------------------------------------------------------
const RAW_NOT = ' -psa -cgc -bgs -sgc -tag -beckett -graded -slab';
const TAG_Q = ' "TAG 10" -team -"tag team" -"all stars" -psa -cgc -bgs -sgc';
const UNL_NOT = ' -1st -shadowless -celebrations -celebration -"base set 2" -classic -1999-2000 -japanese -reprint';
const FIRST_NOT = ' -unlimited -celebration -celebrations';
const EXTRA = { ju99: ' -"no symbol"', aq03: " -reverse", sk03: " -reverse" };
const TT = { tu19: 1 };
const RAW_NOT_TT = ' -psa -cgc -bgs -sgc -"tag 10" -"tag 9" -beckett -graded -slab';
const TAG_Q_TT = ' "TAG 10" -psa -cgc -bgs -sgc';
function phrase(q, g, ed, tk) {
  const x = EXTRA[tk] || "";
  if (TT[tk]) return (g === "raw" ? q + RAW_NOT_TT : g === "psa9" ? q + ' psa 9 -"psa 10"' : g === "psa10" ? q + " psa 10" : q + TAG_Q_TT) + x;
  if (ed === "1st") return (g === "raw" ? q + RAW_NOT : g === "psa9" ? q + ' psa 9 -"psa 10"' + FIRST_NOT : g === "psa10" ? q + " psa 10" + FIRST_NOT : q + TAG_Q + FIRST_NOT) + x;
  if (ed === "shadowless") return (g === "raw" ? q + RAW_NOT : g === "psa9" ? q + ' psa 9 -"psa 10"' : g === "psa10" ? q + " psa 10" : q + TAG_Q) + " -1st" + x;
  if (g === "raw") return q + RAW_NOT + (ed ? " -1st -shadowless" : "") + x;
  const b = (ed ? q.replace(/\bunlimited\b/i, "").replace(/\s+/g, " ").trim() + UNL_NOT : q) + x;
  if (g === "psa9") return b + ' psa 9 -"psa 10"';
  if (g === "psa10") return b + " psa 10";
  return b + TAG_Q;
}

// ---- data ---------------------------------------------------------------------------------------------------
const setCache = {};
function loadSet(tk) {
  if (setCache[tk]) return setCache[tk];
  const j = JSON.parse(rd(`data/cards/${tk}.json`));
  const gf = path.join(ROOT, `data/cards/g-${tk}.json`);
  const g = fs.existsSync(gf) ? JSON.parse(fs.readFileSync(gf, "utf8")) : { cards: {} };
  const cards = Array.isArray(j.cards) ? j.cards : Object.values(j.cards || {});
  return (setCache[tk] = { meta: j, cards, g });
}
function card(id) {
  const tk = id.split("-")[0];
  const { meta, cards, g } = loadSet(tk);
  const c = cards.find((x) => x.id === id);
  if (!c) throw new Error(`card ${id} not in data/cards/${tk}.json`);
  const gr = (g.cards && g.cards[c.num]) || {};
  const ed = meta.ed === "1st" ? "1st" : meta.ed === "shadowless" ? "shadowless" : meta.wotc ? true : false;
  return { ...c, tk, set: meta.set, setName: meta.name, page: meta.page, ticker: meta.ticker, theme: meta.theme, ed, window: meta.window || 30, gr, gAsOf: g.day || gr.asOf || null, nCards: cards.length };
}

const money = (x) => x == null ? "" : x >= 1000 ? "$" + Math.round(x).toLocaleString("en-US") : "$" + x.toFixed(2);
const dateLong = (d) => { if (!d) return ""; const [y, m, dd] = d.split("-").map(Number); return new Date(Date.UTC(y, m - 1, dd)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }); };
const dateShort = (d) => dateLong(d).replace(/, \d{4}$/, "");

function gradeCell(k, label, r, c) {
  r = r || {};
  if (r.m != null) {
    return `<div class="lad-cell"><div class="lad-k">${label}</div><div class="lad-v">${money(r.m)}</div><div class="lad-s">median of ${r.n} ${r.n === 1 ? "sale" : "sales"} · ${r.basis === "90d" ? "90 days" : "30 days"}${r.asOf || c.gAsOf ? " · as of " + dateShort(r.asOf || c.gAsOf) : ""}</div></div>`;
  }
  // R18 one-row form — but a lone TAG row far above the PSA 10 mark is a mislisted slab, not a sale worth printing
  const p10 = c.gr && c.gr.psa10 && c.gr.psa10.m;
  const sane = !(k === "tag10" && p10 && r.last && r.last.p > 3 * p10);
  if (r.last && r.last.d && sane) {
    return `<div class="lad-cell lad-na"><div class="lad-k">${label}</div><div class="lad-v">No mark</div><div class="lad-s">1 dated sale, ${dateLong(r.last.d)}: ${money(r.last.p)}</div></div>`;
  }
  return `<div class="lad-cell lad-na"><div class="lad-k">${label}</div><div class="lad-v">${k === "tag10" ? "No TAG sale" : "No verified sale"}</div><div class="lad-s">${k === "tag10" ? "TAG is a small share of graded volume" : "no title-verified sale in 90 days"}</div></div>`;
}

function printBlock(slug, p, multi) {
  const c = card(p.id);
  const q = c.q;
  const cid = `${slug}-${c.id}`;
  const raw = assertClean(ebaySearchUrl({ q: phrase(q, "raw", c.ed, c.tk), customid: cid, sacat: SACAT_TCG }));
  const p10 = assertClean(ebaySearchUrl({ q: phrase(q, "psa10", c.ed, c.tk), customid: cid + "-psa10", sacat: SACAT_TCG }));
  const tag = assertClean(ebaySearchUrl({ q: phrase(q, "tag", c.ed, c.tk), customid: cid + "-tag", sacat: SACAT_TCG }));
  const track = (id) => `onclick="if(typeof gtag==='function')gtag('event','click',{item:'${id}',page:location.pathname})"`;
  const rawCell = c.raw != null
    ? `<div class="lad-cell lad-raw"><div class="lad-k">Raw</div><div class="lad-v">${money(c.raw)}</div><div class="lad-s">${c.n30 ? `median of ${c.n30} sales · ${c.window} days` : "index sold mark"}${c.rawAsOf ? " · as of " + dateShort(c.rawAsOf) : ""}</div></div>`
    : `<div class="lad-cell lad-na"><div class="lad-k">Raw</div><div class="lad-v">Not priced</div><div class="lad-s">too few clean raw sales to mark — trades graded</div></div>`;
  const ratio = c.raw && c.gr.psa10 && c.gr.psa10.m ? `<span class="lad-ratio">PSA 10 = <b>${(c.gr.psa10.m / c.raw).toFixed(1)}×</b> raw</span>` : "";
  const rank = c.rank ? `<span class="lad-rank">#${c.rank} of ${c.nCards} by weight in <a href="${c.page}">${esc(c.ticker)}</a></span>` : `<span class="lad-rank">tracked outside the <a href="${c.page}">${esc(c.ticker)}</a> level</span>`;
  const imgName = `${c.name} #${c.num} ${c.set.replace(/^Pokémon TCG /, "")}`;
  return `
        <div class="print${multi ? " print-multi" : ""}" data-card="${attr(c.id)}">
          <div class="print-head">
            <span class="print-img" data-card-img="${attr(c.img || "")}" data-card-name="${attr(imgName)}" data-card-sub="pokemon" data-card-size="${multi ? "row" : "card"}"></span>
            <div class="print-id">
              ${multi ? `<div class="print-label">${esc(p.label)}</div>` : ""}
              <div class="print-set">${esc(c.name)} #${esc(c.num)} · ${esc(c.set.replace(/^Pokémon TCG /, ""))}</div>
              <div class="print-meta">${rank}${ratio}</div>
            </div>
          </div>
          <div class="ladder">
            ${rawCell}
            ${gradeCell("psa9", "PSA 9", c.gr.psa9, c)}
            ${gradeCell("psa10", "PSA 10", c.gr.psa10, c)}
            ${gradeCell("tag10", "TAG 10", c.gr.tag10, c)}
          </div>
          <div class="print-links">
            <a class="lk lk-raw" href="${raw}" target="_blank" rel="noopener sponsored" ${track(cid)}>Raw on eBay &rarr;</a>
            <a class="lk lk-10" href="${p10}" target="_blank" rel="noopener sponsored" ${track(cid + "-psa10")}>PSA 10 &rarr;</a>
            <a class="lk lk-tag" href="${tag}" target="_blank" rel="noopener sponsored" title="TAG 10 slabs of this card on eBay (often none: TAG is a small share of graded volume)" ${track(cid + "-tag")}>TAG 10 &rarr;</a>
            <a class="lk lk-card" href="/card?id=${attr(c.id)}">Card page &rarr;</a>
          </div>
        </div>`;
}

function searchBlock(slug, e, i) {
  const cid = `${slug}-search-${i}`;
  const u = assertClean(ebaySearchUrl({ q: e.search.q, customid: cid, sacat: SACAT_TCG }));
  return `
        <div class="print print-search">
          <div class="print-set">${esc(e.search.sub || "not in our index yet · a search, not a price")}</div>
          <div class="print-links"><a class="lk lk-raw" href="${u}" target="_blank" rel="noopener sponsored" onclick="if(typeof gtag==='function')gtag('event','click',{item:'${cid}',page:location.pathname})">${e.search.label}</a></div>
        </div>`;
}

function entryBlock(slug, e, i, shelfKey) {
  const multi = e.prints.length > 1;
  return `
      <article class="ck ck-${shelfKey} reveal" style="--i:${i}">
        <div class="ck-top">
          <span class="ck-tag">${esc(e.tag)}</span>
          <h3>${esc(e.title)}</h3>
        </div>
        <p class="ck-why">${e.why}</p>
        ${e.note ? `<p class="ck-note">${esc(e.note)}</p>` : ""}
        <div class="prints">${e.prints.map((p) => printBlock(slug, p, multi)).join("")}${e.search ? searchBlock(slug, e, i) : ""}
        </div>
      </article>`;
}

function build(d) {
  const slug = d.slug;
  const base = rd("tools/collectors-desk/base.css");
  const cards = d.shelves.flatMap((s) => s.entries.flatMap((e) => e.prints.map((p) => card(p.id))));
  const stamps = cards.flatMap((c) => [c.rawAsOf, c.gAsOf]).filter(Boolean).sort();
  const updated = stamps[stamps.length - 1];
  const oldest = stamps[0];
  const nPrints = cards.length;
  const url = `https://www.shopcardhub.com/${slug}`;
  const col = d.colors;

  const themeCss = THEMES[d.theme](col);
  const hc = d.heroCard ? card(d.heroCard) : null;
  const heroCard = hc ? `<div class="hero-card-photo hero-card"><span data-card-img="${attr(hc.img || "")}" data-card-name="${attr(hc.name + " #" + hc.num)}" data-card-sub="pokemon" data-card-size="hero" data-card-tilt="1"></span><div class="hero-card-cap">${esc(hc.name)} #${esc(hc.num)} &middot; ${esc(hc.set.replace(/^Pokémon TCG /, ""))}</div></div>` : "";
  const shelves = d.shelves.map((s) => `
    <section class="shelf shelf-${s.key}" id="${s.key}">
      <div class="section-eyebrow">${esc(s.eyebrow)} · ${esc(s.label)}</div>
      <h2>${esc(s.label)}</h2>
      <p class="section-intro">${esc(s.blurb)}</p>
      <div class="ck-grid">${s.entries.map((e, i) => entryBlock(slug, e, i, s.key)).join("")}
      </div>
    </section>`).join("");

  const notes = d.collectingNotes.map((n) => `<div class="cn"><h3>${esc(n.h)}</h3><p>${n.p}</p></div>`).join("");
  const toc = d.shelves.map((s) => `<a href="#${s.key}">${esc(s.label)}</a>`).join("");

  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: d.title.replace(/ \| .*$/, ""), url, datePublished: "2026-10-05", dateModified: updated, author: { "@type": "Organization", name: "ShopCardHub" }, publisher: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" }, description: d.description });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${esc(d.title)}</title>
  <meta name="description" content="${attr(d.description)}">
  <meta name="keywords" content="${attr(d.keywords)}">
  <link rel="canonical" href="${url}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${attr(d.title)}">
  <meta property="og:description" content="${attr(d.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/pokemon.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/pokemon.png">
  <script type="application/ld+json">${jsonld}</script>
  <link rel="preload" href="/fonts/barlow-condensed-800.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-condensed-900.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/fonts.css">
<style>
${base}
</style>
  <!-- Google Analytics — gtag.js is deferred until first interaction or idle (tools/apply-site-fixes.mjs) -->
  <script data-gtag-deferred="G-2Q52C5EKG7">
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-2Q52C5EKG7');
    (function(){
      var done = false;
      function load(){
        if (done) return; done = true;
        var s = document.createElement('script'); s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=G-2Q52C5EKG7';
        document.head.appendChild(s);
      }
      var evs = ['pointerdown','keydown','scroll','touchstart'];
      function onEv(){ load(); evs.forEach(function(e){ window.removeEventListener(e, onEv); }); }
      evs.forEach(function(e){ window.addEventListener(e, onEv, { passive:true }); });
      function idle(){ if ('requestIdleCallback' in window) window.requestIdleCallback(load, { timeout:4000 }); else window.setTimeout(load, 4000); }
      if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle);
    })();
  </script>
  <link rel="stylesheet" href="/css/site-fixes.css">
  <!-- COLLECTOR'S DESK THEME (${d.theme}) — generated by tools/build-collectors-desk.mjs from data/collect/${d.pokemon.toLowerCase()}.json -->
  <style id="desk-theme">
${DESK_CSS(col)}
${themeCss}
  </style>
</head>
<body>

<!-- NAV -->
<!-- NAV:START -->
<!-- NAV:END -->

<section class="hero desk-hero" style="border-top:none;">
  <div class="hero-fx" aria-hidden="true">${HERO_FX[d.theme]()}</div>
  <div class="container">
   <div class="hero-copy">
    <div class="hero-eyebrow">Gengar's Collector's Desk &middot; No. ${d.deskNo} &middot; ${esc(d.pokemon)}</div>
    <h1>${d.h1}</h1>
    <p class="hero-sub">${esc(d.intro)}</p>
    <div class="desk-toc">${toc}<a href="#notes">Collecting notes</a></div>
    <div class="hero-meta">
      <span data-prices-updated="${updated}">&#128337; Sold marks as of ${dateLong(updated)}</span>
      <span>&#128202; ${nPrints} prints, each from its own set index</span>
      <span>&#127991;&#65039; Raw &middot; PSA 9 &middot; PSA 10 &middot; TAG 10</span>
    </div>
   </div>
   ${heroCard}
  </div>
</section>

<!-- BUYSTRIP -->

<div class="container">

  <aside class="narrator reveal">
    <div class="narrator-chip"><span class="narrator-eye"></span>Gengar</div>
    <p>${esc(d.narratorNote)}</p>
  </aside>
${shelves}

  <section id="notes">
    <div class="section-eyebrow">The desk notes</div>
    <h2>How to collect ${esc(d.pokemon)} without getting burned</h2>
    <div class="cn-grid">${notes}</div>
  </section>

  <section class="means">
    <div class="section-eyebrow cyan">Where every number came from</div>
    <h2>Method</h2>
    <p class="section-intro" style="margin-bottom:0;"><b>Raw</b> is each card's sold mark in its own ShopCardHub set index: the median of its clean ungraded sold comps (PriceCharting completed sales) over the trailing 30 days, 90 days on the 1st Edition and Shadowless indices, re-marked Monday and Thursday — the same number as the index table and the card page. <b>PSA 9, PSA 10 and TAG 10</b> are read from dated completed sales whose own listing title names that grade: the median of 3+ sales in 30 days, else 2+ in 90 days. Fewer than that is no mark; a single sale is shown as one dated sale, never as a price. A raw vintage copy can be in any condition, so a raw mark on a 1999 card is a typical raw sale, not a near-mint price. Marks on this page were read between ${dateLong(oldest)} and ${dateLong(updated)}. eBay links are searches for the exact print on each row, with our affiliate tag — live listings, never a price. Nothing on this desk is a call to buy or sell. <a href="/how-prices-work">How prices work →</a></p>
  </section>

  <div class="disclosure">ShopCardHub earns an eBay Partner Network commission on qualifying purchases made through the links on this page, at no extra cost to you. Prices shown are dated sold comps from our index data; they are not offers and not advice. Card images are verified eBay listing photos and link to that listing. <a href="/affiliate-disclosure">Affiliate disclosure</a></div>

</div>

<footer>
  <div class="footer-inner">
    <a href="/" class="logo" style="text-decoration:none;">Shop<span>Card</span>Hub</a>
    <nav class="footer-links">
      <a href="/">Home</a>
      <a href="/indices">Indices</a>
      <a href="/cards">Card pages</a>
      <a href="/tag-grading-guide">TAG Grading</a>
      <a href="/psa-grading-guide">Grading Guide</a>
      <a href="https://twitter.com/shopcardhub" target="_blank" rel="noopener">@shopcardhub</a>
    </nav>
    <div class="footer-copy">
      <a href="/research" style="color:inherit;">All Guides</a> · <a href="/about" style="color:inherit;">About</a> · <a href="/affiliate-disclosure" style="color:inherit;">Affiliate Disclosure</a> · <a href="/privacy" style="color:inherit;">Privacy Policy</a><br>
      © 2026 ShopCardHub · shopcardhub.com · <a href="https://twitter.com/shopcardhub" style="color:inherit;" target="_blank" rel="noopener">@shopcardhub</a><br>
      ShopCardHub participates in the eBay Partner Network. Not affiliated with PSA, TAG or The Pokémon Company.
    </div>
  </div>
</footer>

<script>
(function(){
  // scroll reveal (same contract as the guide pages: .reveal → .visible)
  var els = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) { els.forEach(function(e){ e.classList.add('visible'); }); return; }
  var io = new IntersectionObserver(function(en){ en.forEach(function(x){ if (x.isIntersecting) { x.target.classList.add('visible'); io.unobserve(x.target); } }); }, { rootMargin:'0px 0px -8% 0px', threshold:0.08 });
  els.forEach(function(e){ io.observe(e); });
})();
${HERO_JS[d.theme]()}
</script>
<script src="/js/card-img.js?v=3" defer></script>
</body>
</html>
`;
}

// ---- desk layout CSS (theme-independent; colors come in as tokens) ----------------------------------------------
const DESK_CSS = (c) => `
    :root { --accent:${c.accent}; --accent-dim:${hexa(c.accent, 0.10)}; --accent-glow:${hexa(c.accent, 0.28)}; --pb:${c.accent}; --dk2:${c.accent2}; --dkg:${c.glow}; --nar:${c.narrator}; --nar-dim:${hexa(c.narrator, 0.12)}; }
    ::selection { background:${hexa(c.accent, 0.9)}; color:#000; }
    .hero.desk-hero { padding:72px 0 44px; }
    .hero::before { background:radial-gradient(ellipse at 18% 0%, ${hexa(c.accent, 0.13)} 0%, transparent 62%) !important; }
    .hero-eyebrow { color:var(--nar); } .hero-eyebrow::before { background:var(--nar); }
    .hero h1 em { color:var(--accent); font-style:normal; display:block; }
    .hero-sub { max-width:640px; color:var(--text); }
    .hero-fx { position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0; }
    .hero .container { position:relative; z-index:2; }
    .hero-copy { display:contents; }
    .hero-card { text-align:center; filter:drop-shadow(0 24px 40px rgba(0,0,0,0.6)); animation:hero-card-in 1.1s ease-out .3s both; }
    @keyframes hero-card-in { 0% { opacity:0; transform:translateY(18px) rotate(-4deg); } 100% { opacity:1; transform:none; } }
    .hero-card .sch-cimg-hero { box-shadow:0 0 0 1px ${hexa(c.accent, 0.35)}, 0 24px 60px -24px ${hexa(c.accent, 0.7)} !important; }
    .hero-card-cap { font-family:var(--fm); font-size:10px; letter-spacing:1.5px; text-transform:uppercase; color:var(--text-dim); margin-top:12px; }
    @media (max-width: 760px) { .hero-card { display:none !important; } }
    .desk-toc { display:flex; flex-wrap:wrap; gap:8px; margin:22px 0 4px; }
    .desk-toc a { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--text-head); border:1px solid var(--border2); padding:7px 12px; border-radius:2px; background:rgba(255,255,255,0.03); transition:border-color .15s, background .15s; }
    .desk-toc a:hover { border-color:var(--accent); background:var(--accent-dim); text-decoration:none; }
    /* narrator */
    .narrator { margin:40px 0 8px; padding:20px 22px 18px; background:var(--bg2); border:1px solid var(--border); border-left:3px solid var(--nar); position:relative; }
    .narrator p { font-size:15px; line-height:1.7; color:var(--text); margin:0; }
    .narrator-chip { display:inline-flex; align-items:center; gap:8px; font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--nar); margin-bottom:10px; }
    .narrator-eye { width:10px; height:10px; border-radius:50%; background:var(--nar); box-shadow:0 0 10px var(--nar); animation:nar-blink 4s ease-in-out infinite; }
    @keyframes nar-blink { 0%,88%,100% { transform:scaleY(1); } 92% { transform:scaleY(0.15); } }
    /* shelves */
    section.shelf { padding:56px 0 24px; }
    .section-eyebrow { color:var(--accent); } .section-eyebrow::after { background:linear-gradient(90deg, ${hexa(c.accent, 0.5)}, transparent); }
    .ck-grid { display:grid; gap:18px; margin-top:8px; }
    .ck { background:var(--bg2); border:1px solid var(--border); border-left:3px solid var(--accent); padding:22px 24px 18px; position:relative; transition:box-shadow .25s, border-color .25s, transform .25s; }
    .ck:hover { box-shadow:0 0 0 1px ${hexa(c.accent, 0.25)}, 0 20px 50px -30px ${hexa(c.accent, 0.6)}; }
    .ck-grail { border-left-color:var(--dkg); }
    .ck-grail::before { content:''; position:absolute; inset:0; pointer-events:none; background:linear-gradient(120deg, transparent 30%, ${hexa(c.glow, 0.05)} 50%, transparent 70%); background-size:200% 100%; animation:ck-sheen 9s linear infinite; }
    @keyframes ck-sheen { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
    .ck-top { display:flex; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:10px; }
    .ck-top h3 { margin:0; font-size:24px; }
    .ck-tag { font-family:var(--fm); font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#000; background:var(--accent); padding:4px 8px; border-radius:2px; white-space:nowrap; }
    .ck-grail .ck-tag { background:var(--dkg); }
    .ck-starter .ck-tag { background:var(--green); }
    .ck-why { font-size:15px; line-height:1.72; color:var(--text); max-width:820px; margin-bottom:8px; }
    .ck-note { font-size:13px; line-height:1.6; color:var(--text-dim); border-left:2px solid var(--border2); padding-left:12px; max-width:820px; margin:10px 0 6px; }
    .prints { display:grid; gap:14px; margin-top:16px; }
    .print { background:var(--bg3); border:1px solid var(--border); padding:14px 16px 12px; }
    .print-head { display:flex; gap:14px; align-items:flex-start; margin-bottom:12px; }
    .print-img { flex-shrink:0; }
    .print-label { font-family:var(--fd); font-size:19px; font-weight:800; text-transform:uppercase; color:var(--text-head); line-height:1.1; }
    .print-set { font-size:13px; color:var(--text-dim); margin-top:2px; }
    .print-meta { display:flex; flex-wrap:wrap; gap:6px 16px; margin-top:6px; font-family:var(--fm); font-size:11px; letter-spacing:.5px; color:var(--text-dim); }
    .print-meta b { color:var(--text-head); }
    .ladder { display:grid; grid-template-columns:repeat(4, minmax(0,1fr)); gap:8px; }
    .lad-cell { background:var(--bg2); border:1px solid var(--border); padding:10px 12px 9px; min-width:0; }
    .lad-raw { border-top:2px solid var(--accent); }
    .lad-k { font-family:var(--fm); font-size:9px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--text-dim); margin-bottom:4px; }
    .lad-v { font-family:var(--fd); font-size:24px; font-weight:900; color:var(--text-head); line-height:1; }
    .lad-na .lad-v { font-size:15px; font-weight:700; color:var(--text-dim); padding-top:4px; }
    .lad-s { font-size:11px; color:var(--text-dim); margin-top:5px; line-height:1.4; }
    .print-links { display:flex; flex-wrap:wrap; gap:8px; margin-top:12px; }
    .lk { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; padding:8px 12px; border-radius:2px; border:1px solid var(--border2); color:var(--text-head); background:rgba(255,255,255,0.03); transition:background .15s, border-color .15s, color .15s; }
    .lk:hover { text-decoration:none; color:#fff; border-color:var(--accent); background:var(--accent-dim); }
    .lk-raw { background:var(--accent); color:#000; border-color:var(--accent); }
    .lk-raw:hover { background:#fff; color:#000; }
    .lk-10 { border-color:${hexa("#f5c800", 0.5)}; } .lk-10:hover { border-color:#f5c800; background:rgba(245,200,0,0.12); }
    .lk-tag { border-color:${hexa("#00e07a", 0.5)}; } .lk-tag:hover { border-color:#00e07a; background:rgba(0,224,122,0.12); }
    .lk-card { color:var(--text-dim); }
    /* notes */
    .cn-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:16px; margin-top:28px; }
    .cn { background:var(--bg2); border:1px solid var(--border); border-top:2px solid var(--accent); padding:20px 22px; }
    .cn h3 { font-size:19px; margin-bottom:8px; }
    .cn p { font-size:14px; line-height:1.7; color:var(--text); margin:0; }
    /* reveal */
    .reveal { opacity:0; transform:translateY(14px); transition:opacity .5s ease, transform .5s ease; transition-delay:calc(var(--i, 0) * 60ms); }
    .reveal.visible { opacity:1; transform:none; }
    @media (max-width: 760px) {
      .hero.desk-hero { padding:48px 0 32px; }
      .ck { padding:18px 16px 14px; }
      .ck-top h3 { font-size:21px; }
      .ladder { grid-template-columns:repeat(2, minmax(0,1fr)); }
      .lad-v { font-size:21px; }
      .print-links { gap:6px; } .lk { padding:9px 10px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity:1; transform:none; transition:none; }
      .ck-grail::before, .narrator-eye { animation:none; }
    }`;

function hexa(hex, a) { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; }

// ---- themes: the Pokémon's own element, like Pikachu's lightning on the 30th page ---------------------------------
// ---- run ----------------------------------------------------------------------------------------------------
const files = fs.readdirSync(path.join(ROOT, "data/collect")).filter((n) => n.endsWith(".json") && (!ONLY || n === ONLY + ".json"));
for (const f of files) {
  const d = JSON.parse(rd(`data/collect/${f}`));
  if (!THEMES[d.theme]) throw new Error(`no theme "${d.theme}" (have ${Object.keys(THEMES).join(", ")})`);
  const out = path.join(ROOT, d.slug + ".html");
  let html = build(d);
  // keep the generated NAV / BUYSTRIP / SIGNUP blocks of an existing page (they are machine-owned by other tools)
  if (fs.existsSync(out)) {
    const prev = fs.readFileSync(out, "utf8");
    const keep = (re) => { const m = prev.match(re); return m ? m[0] : null; };
    const nav = keep(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/);
    if (nav) html = html.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, () => nav);
    const strip = keep(/<!-- BUYSTRIP:START[\s\S]*?<!-- BUYSTRIP:END -->(\s*<!-- SIGNUP:START[\s\S]*?<!-- SIGNUP:END -->)?/);
    if (strip) html = html.replace("<!-- BUYSTRIP -->", () => strip);
  }
  // self-test every EPN link outside the machine-owned NAV block (its search script holds a URL template, checked by build-nav)
  const own = html.replace(/<!-- NAV:START -->[\s\S]*?<!-- NAV:END -->/, "");
  const links = (own.match(/https:\/\/www\.ebay\.com\/sch\/[^"']+/g) || []);
  links.forEach((u) => assertClean(u.replace(/&amp;/g, "&")));
  if (/\$\$/.test(html)) throw new Error("placeholder price in output");
  console.log(`${CHECK ? "[check] " : ""}${d.slug}.html — ${links.length} EPN links, ${html.length} bytes`);
  if (!CHECK) fs.writeFileSync(out, html);
}
