#!/usr/bin/env node
// tools/build-bcb26-index.mjs — BCB26 "2026 Bowman Chrome Chase Index" (per-set Bowman index #1).
//
// Two jobs, both idempotent, both driven by data/ — nothing hand-typed:
//   1. `--seed`  writes the BCB26 entry into data/indices.json from data/sets/2026-bowman-chrome-baseball.json
//               (status "pre": universe = every checklist card, basket [], history [], divisor null; NO prices).
//               Refuses to overwrite an entry that already has marks (basket/history non-empty) — the Monday
//               scan STEP 3.6 owns those; re-seeding would erase them.
//   2. default   renders bowman-chrome-2026-index.html from the BCB26 entry (PRE while status is "pre"; once
//               STEP 3.6 activates it — status "live", divisor set, history rows — the same renderer shows the
//               level and the per-row ask marks from basket[]). Re-run after every re-mark.
//
// Rules baked in (Mo Sep 4 + CoS Sep 6, charter 4.8):
//   PER SET — this is 2026 Bowman Chrome only. Never paper Bowman, never Sapphire. The Bangers board is the
//   cross-set instrument. BASE | AUTOS | PARALLELS tabs; AUTOS carries a 15% single-card weight cap at the
//   basket level (applied at (re)constitution via fractional units, logged in divisorLog). Ask basis, labeled,
//   until ≥60% SCP sold coverage allows a hammer restatement via a logged divisor adjustment (level unchanged).
//   1st tag only where the checklist's own rules allow (first:true / board:true) — untagged = unknown, never
//   "not a 1st". No price seed on ★ Track buttons (no verified price exists pre-street); no data-feed (no
//   engine-tracked card belongs to this set — the watchlist's CPA-* autos are May's paper-Bowman inserts).
//
// Usage: node tools/build-bcb26-index.mjs [--seed] [--check]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SET_PATH = path.join(REPO, "data/sets/2026-bowman-chrome-baseball.json");
const IDX_PATH = path.join(REPO, "data/indices.json");
const OUT_PATH = path.join(REPO, "bowman-chrome-2026-index.html");
const NAV_SRC = path.join(REPO, "ascended-heroes-index.html"); // nav block donor; tools/build-nav.js rewrites it anyway
const TICKER = "BCB26";
const SLUG = "bowman-chrome-2026-index";
const CUSTOMID = SLUG;
const BOARD_NAMES = ["Ethan Holliday", "Aiva Arquette", "Seong-Jun Kim", "Andrew Fischer", "Edward Florentino", "Daniel Pierce"]; // current Bangers board (Sep 1 2026)
const AUTO_CAP = 0.15;
const args = process.argv.slice(2);
const SEED = args.includes("--seed");
const CHECK = args.includes("--check");

const set = JSON.parse(fs.readFileSync(SET_PATH, "utf8"));
const rawIdx = fs.readFileSync(IDX_PATH, "utf8");
const idx = JSON.parse(rawIdx);

const TAB_OF = { bcp: "base", cpa: "autos" };
function universeFromSet() {
  const out = [];
  for (const g of set.groups || []) {
    const tab = TAB_OF[g.key];
    if (!tab) continue;
    for (const c of g.cards || []) {
      const row = { id: `${set.slug}:${c.n.toLowerCase()}`, number: c.n, player: c.player, team: c.team, tab };
      if (c.first) row.first = true;
      if (c.board) row.board = true;
      out.push(row);
    }
  }
  return out;
}

/* ---------------- 1. seed ---------------- */
if (SEED) {
  const existing = idx[TICKER];
  if (existing && ((existing.basket || []).length || (existing.history || []).length)) {
    console.error(`${TICKER} already carries marks (basket ${existing.basket.length}, history ${existing.history.length}) — refusing to re-seed. STEP 3.6 owns it now.`);
    process.exit(1);
  }
  const entry = {
    _note: "PRE-ACTIVATION per-set Bowman index #1 (built 2026-09-07 by bcb26-index-prebuild, charter 4.8). Universe rows use {id, number, player, team, tab, first?, board?} (the Pokémon tickers use {num, name, rarity}; /indices reads only .length). basket rows, once STEP 3.6 writes them: {id, number, player, tab, price, basis:'ask (eBay verified, engine)'|'sold (SCP)', asOf, units?, prevPrice?, prevAsOf?}. AUTOS 15% single-card cap = fractional units at (re)constitution, logged in divisorLog. Activation: first re-mark where verified asks cover ≥60% of chase-basket value → divisor = basketValue/100, inception = that date, history[0] = {level 100.00}, status 'live', basis stays 'ask' (labeled on-page) until ≥60% SCP sold coverage → restate to 'sold' via a logged divisor adjustment (level identical before/after). Never blend asks and solds in one basket. Re-marks: every board-touching run (Mon/Tue/Fri) through street+21d, then weekly.",
    ticker: TICKER,
    name: "2026 Bowman Chrome Chase Index",
    slug: SLUG,
    page: "/" + SLUG,
    set: set.slug,
    status: "pre",
    basis: "ask",
    basisLabel: "ask basis (labeled) — restates to hammer basis at ≥60% SCP sold coverage",
    inception: null,
    base: 100.0,
    divisor: null,
    universeComplete: false,
    universeNote: `Checklist as published ${set.asof} (${set.source}); the CPA autograph list was still filling in. STEP 3.6 re-syncs the universe from data/sets/${set.slug}.json each re-mark — new cards enter via logged divisor adjustments.`,
    autosCap: AUTO_CAP,
    universe: universeFromSet(),
    basket: [],
    history: [],
    divisorLog: [],
    activationRule: "≥60% of chase-basket value with verified asks; restates to hammer basis via logged divisor adjustment at ≥60% SCP sold coverage",
    releaseDate: set.release,
    window: "street +21d, re-marks every board-touching run"
  };
  const tabs = entry.universe.reduce((a, u) => ((a[u.tab] = (a[u.tab] || 0) + 1), a), {});
  // splice textually before the trailing "updated" key so the rest of the file stays byte-identical
  const block = JSON.stringify(entry, null, 1).split("\n").map((l, i) => (i === 0 ? ` "${TICKER}": ${l}` : " " + l)).join("\n") + ",\n";
  const marker = '\n "updated":';
  const at = rawIdx.lastIndexOf(marker);
  if (at < 0) { console.error('could not find the "updated" key in data/indices.json'); process.exit(1); }
  let next;
  if (existing) {
    // replace the existing (mark-free) entry in place
    const start = rawIdx.indexOf(`\n "${TICKER}": {`);
    const end = rawIdx.indexOf("\n }", start) + 3; // "\n }" + trailing ","
    const tail = rawIdx.slice(end).startsWith(",") ? 1 : 0;
    next = rawIdx.slice(0, start + 1) + block.trimEnd().replace(/,$/, "") + rawIdx.slice(end + tail);
  } else {
    next = rawIdx.slice(0, at + 1) + block + rawIdx.slice(at + 1);
  }
  JSON.parse(next); // must still parse
  if (!CHECK) fs.writeFileSync(IDX_PATH, next);
  console.log(`${CHECK ? "[check] " : ""}seeded ${TICKER}: universe ${entry.universe.length} (base ${tabs.base || 0}, autos ${tabs.autos || 0}), basket 0, status pre`);
  process.exit(0);
}

/* ---------------- 2. render ---------------- */
const X = idx[TICKER];
if (!X) { console.error(`${TICKER} not in data/indices.json — run with --seed first`); process.exit(1); }
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
const isPre = X.status !== "live";
const uni = X.universe || [];
const byTab = { base: uni.filter((u) => u.tab === "base"), autos: uni.filter((u) => u.tab === "autos") };
const basketById = new Map((X.basket || []).map((b) => [b.id, b]));
const last = (X.history || []).length ? X.history[X.history.length - 1] : null;
const prev = (X.history || []).length > 1 ? X.history[X.history.length - 2] : null;
const boardInSet = uni.filter((u) => u.board);
const boardMissing = BOARD_NAMES.filter((n) => !boardInSet.some((u) => u.player === n));
const fmtD = (iso) => { if (!iso) return "—"; const [y, m, d] = iso.split("-"); return `${m}/${d}/${y.slice(2)}`; };
const fmtMoney = (n) => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = new Date().toISOString().slice(0, 10);

function ebayUrl(u) {
  const q = `2026 Bowman Chrome ${u.player} ${u.number}`;
  return `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q).replace(/%20/g, "+")}&LH_BIN=1&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001&customid=${CUSTOMID}`;
}
function trackName(u) {
  // identical to js/set-checklist.js naming so the Vault dedupes across the checklist and this page
  const kind = u.tab === "autos" ? "Prospect Auto" : "Prospects";
  return `${u.player} 2026 Bowman Chrome ${kind} #${u.number}`;
}
function row(u, i) {
  const b = basketById.get(u.id);
  const tag = u.board ? '<span class="tag board">BANGERS</span><span class="tag first">1ST BOWMAN</span>' : u.first ? '<span class="tag first">1ST BOWMAN</span>' : "";
  const mark = b && typeof b.price === "number"
    ? `<td class="num">${fmtMoney(b.price)} <span class="basis">${esc(b.basis || X.basis)}</span></td><td class="num dim2">${esc((b.asOf || "").slice(5))}</td>`
    : `<td class="num dim2">— <span class="basis">no verified ask yet</span></td><td class="num dim2">—</td>`;
  return `<tr${u.board ? ' class="boardrow"' : ""}><td class="rk">${i + 1}</td><td class="cn">${esc(u.number)}</td><td class="card"><b>${esc(u.player)}</b>${tag}</td><td class="team">${esc(u.team)}</td>${mark}` +
    `<td class="trk"><button class="sch-track-card" data-name="${esc(trackName(u))}" data-set="2026 Bowman Chrome Baseball" data-cat="baseball" data-grade="Raw">&#9733; Track</button></td>` +
    `<td class="trk"><a class="ebay" href="${ebayUrl(u)}" target="_blank" rel="noopener sponsored">Listings &rarr;</a></td></tr>`;
}
function table(rows) {
  if (!rows.length) return "";
  return `<div class="tbl-scroll"><table><thead><tr><th>#</th><th>Card</th><th>Player</th><th>Team</th><th>Mark</th><th>As Of</th><th>&#9733;</th><th>eBay</th></tr></thead><tbody>${rows.map(row).join("\n")}</tbody></table></div>`;
}

// nav block donor (build-nav.js rewrites between the markers; the head <style> nav rules travel with it)
const donor = fs.readFileSync(NAV_SRC, "utf8");
const navBlock = donor.slice(donor.indexOf("<!-- NAV:START -->"), donor.indexOf("<!-- NAV:END -->") + "<!-- NAV:END -->".length);
const navCss = donor.slice(donor.indexOf("/* NAV */"), donor.indexOf("</style>", donor.indexOf("/* NAV */")));

const title = `${TICKER} · 2026 Bowman Chrome Chase Index — ${isPre ? "pre-activation set tracker" : "live set tracker"} | ShopCardHub`;
const desc = isPre
  ? `${TICKER}: the 2026 Bowman Chrome chase index — ${byTab.base.length} Chrome Prospects + ${byTab.autos.length} Chrome Prospect Autos, one fixed per-set database. Pre-activation: streets Sep 9, 2026; ask basis, labeled, until sold coverage allows a hammer restatement. No level until ≥60% of the basket has verified asks. No calls — just the tape.`
  : `${TICKER}: the 2026 Bowman Chrome chase index — price-weighted over verified marks, ${esc(X.basisLabel || X.basis)}, re-marked from a 100.00 base. No calls — just the tape.`;
const priced = (X.basket || []).length;
const levelBox = isPre
  ? `<div class="levelbox"><div class="level pre">PRE</div><div class="levelchg">no level yet · base 100.00 at activation · ask basis, labeled · streets ${fmtD(X.releaseDate)}</div></div>`
  : `<div class="levelbox"><div class="level">${last ? last.level.toFixed(2) : "—"}</div><div class="levelchg">base 100.00 · inception ${fmtD(X.inception)} · re-marked ${fmtD(last && last.date)} · ${esc(X.basisLabel || X.basis)}${prev && last ? ` · ${last.level >= prev.level ? "▲" : "▼"} ${((last.level / prev.level - 1) * 100).toFixed(1)}% vs prior mark` : ""}</div></div>`;

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="view-transition" content="same-origin">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="preload" href="/fonts/barlow-400.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/css/fonts.css"><style>
:root { --bg:#07090c; --p1:#0c1017; --p2:#111820; --bd:rgba(255,255,255,0.07); --bd2:rgba(255,255,255,0.12); --tx:#b8cdd4; --th:#e4f0f4; --dim:#5a7880; --ac:#00ccf5; --gn:#00e07a; --gd:#f5c800; --rd:#ff2e55; --or:#ff9f1c; --iac:#00ccf5; --iac2:#0099b8;
--text:#b8cdd4; --text-head:#e4f0f4; --text-dim:#5a7880; --border:rgba(255,255,255,0.07); --border2:rgba(255,255,255,0.12); --accent:#00ccf5; --accent-dim:rgba(0,204,245,0.1); --accent-glow:rgba(0,204,245,0.22); --gold:#f5c800; --green:#00e07a; --red:#ff2e55; --fb:'Barlow',-apple-system,sans-serif; --fd:'Barlow Condensed',Impact,sans-serif; --fm:'JetBrains Mono',Menlo,monospace; }
* { margin:0; padding:0; box-sizing:border-box; }
body { background:var(--bg); color:var(--tx); font-family:var(--fb); font-size:13px; line-height:1.5; padding-bottom:60px; -webkit-font-smoothing:antialiased; }
a { color:var(--ac); text-decoration:none; } a:hover { color:#fff; }
.wrap { max-width:1060px; margin:0 auto; padding:0 24px; }
.livebar { background:color-mix(in srgb, var(--or) 8%, transparent); border-bottom:1px solid color-mix(in srgb, var(--or) 40%, transparent); padding:7px 0; text-align:center; font-family:var(--fm); font-size:10px; letter-spacing:1.5px; color:var(--or); text-transform:uppercase; }
.livebar.live { background:color-mix(in srgb, var(--iac) 8%, transparent); border-color:color-mix(in srgb, var(--iac) 40%, transparent); color:var(--iac); }
.crumb { font-family:var(--fm); font-size:10px; letter-spacing:2px; color:var(--dim); text-transform:uppercase; } .crumb b { color:var(--iac); }
.strip { display:flex; gap:8px; overflow-x:auto; padding:12px 0; border-bottom:1px solid var(--bd); min-height:52px; }
.chip { flex:0 0 auto; background:var(--p1); border:1px solid var(--bd); border-radius:3px; padding:6px 12px; font-family:var(--fm); font-size:10px; color:var(--dim); text-decoration:none; }
.chip b { color:var(--th); letter-spacing:1px; } .chip.on { border-color:color-mix(in srgb, var(--or) 50%, transparent); background:color-mix(in srgb, var(--or) 6%, transparent); } .chip.on b { color:var(--or); } .chip .soon { color:var(--dim); font-style:italic; } .chip .up { color:var(--gn); } .chip .dn { color:var(--rd); }
.mast { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; padding:26px 0 4px; flex-wrap:wrap; }
.eyebrow { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:3px; text-transform:uppercase; color:var(--iac); margin-bottom:8px; }
h1 { font-family:var(--fd); font-weight:900; font-size:34px; letter-spacing:1.5px; text-transform:uppercase; color:var(--th); line-height:1.05; } h1 .tick { color:var(--iac); }
.subline { font-size:12px; color:var(--dim); margin-top:6px; max-width:640px; }
.levelbox { text-align:right; }
.level { font-family:var(--fm); font-weight:700; font-size:40px; color:var(--th); line-height:1; } .level.pre { color:var(--or); letter-spacing:4px; }
.levelchg { font-family:var(--fm); font-size:11px; margin-top:4px; color:var(--dim); max-width:360px; }
.activate { margin:18px 0 6px; background:color-mix(in srgb, var(--or) 6%, transparent); border:1px solid color-mix(in srgb, var(--or) 45%, transparent); border-left:3px solid var(--or); border-radius:4px; padding:14px 16px; }
.activate h3 { font-family:var(--fd); font-weight:900; font-size:15px; letter-spacing:2px; text-transform:uppercase; color:var(--or); margin-bottom:6px; }
.activate p { font-size:12.5px; color:var(--tx); line-height:1.65; } .activate p b { color:var(--th); }
.stats { display:grid; grid-template-columns:repeat(8,1fr); gap:1px; background:var(--bd); border:1px solid var(--bd); border-radius:4px; overflow:hidden; margin:16px 0 6px; }
.stat { background:var(--p1); padding:10px 12px; }
.stat .k { font-family:var(--fm); font-size:8.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); }
.stat .v { font-family:var(--fm); font-size:15px; font-weight:700; color:var(--th); margin-top:3px; } .stat .v.acc { color:var(--iac); } .stat .v.or { color:var(--or); } .stat .v.gold { color:var(--gd); } .stat .v.dim { color:var(--dim); }
.statnote { font-family:var(--fm); font-size:9px; color:var(--dim); margin:4px 2px 0; }
.bench { margin:14px 0 4px; background:var(--p1); border:1px solid var(--bd); border-left:3px solid var(--gd); border-radius:4px; padding:12px 16px; font-size:12.5px; }
.bench b { color:var(--th); } .bench .lbl { font-family:var(--fm); font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--gd); display:block; margin-bottom:4px; }
.tabs { display:flex; gap:2px; margin:18px 0 0; border-bottom:1px solid var(--bd2); }
.tab { font-family:var(--fd); font-weight:600; font-size:13px; letter-spacing:2px; text-transform:uppercase; padding:8px 18px; color:var(--dim); background:none; border:none; cursor:pointer; }
.tab.on { color:var(--iac); background:var(--p1); border:1px solid var(--bd2); border-bottom:none; border-radius:3px 3px 0 0; }
.tab .ct { font-size:10px; color:var(--dim); margin-left:6px; letter-spacing:0; }
.pane { display:none; } .pane.on { display:block; }
.panenote { font-family:var(--fm); font-size:10px; color:var(--dim); padding:10px 2px 6px; line-height:1.7; } .panenote b { color:var(--tx); }
.tbl-scroll { overflow-x:auto; }
table { width:100%; border-collapse:collapse; font-family:var(--fm); font-size:11px; }
thead th { font-size:8.5px; letter-spacing:1.5px; text-transform:uppercase; color:var(--dim); text-align:left; padding:8px 10px; border-bottom:1px solid var(--bd2); background:var(--p1); white-space:nowrap; }
td { padding:6px 10px; border-bottom:1px solid var(--bd); vertical-align:middle; }
td.rk { color:var(--dim); width:34px; } td.cn { color:var(--iac); font-weight:700; white-space:nowrap; }
td.card { font-family:var(--fb); font-size:12.5px; color:var(--th); white-space:nowrap; } td.team { color:var(--dim); white-space:nowrap; }
td.num { white-space:nowrap; color:var(--tx); } .dim2 { color:var(--dim); } .basis { font-size:8.5px; letter-spacing:1px; text-transform:uppercase; color:var(--dim); }
td.trk { white-space:nowrap; }
.tag { font-family:var(--fm); font-size:8.5px; letter-spacing:1.5px; border-radius:2px; padding:1px 5px; margin-left:8px; vertical-align:middle; }
.tag.first { color:var(--gn); border:1px solid rgba(0,224,122,0.4); } .tag.board { color:var(--gd); border:1px solid rgba(245,200,0,0.4); }
tr.boardrow td { background:color-mix(in srgb, var(--gd) 4%, transparent); }
tbody tr:hover td { background:color-mix(in srgb, var(--iac) 5%, transparent); }
.sch-track-card { font-family:var(--fm); font-size:10px; font-weight:700; letter-spacing:1px; text-transform:uppercase; background:none; border:1px solid var(--bd2); color:var(--tx); padding:4px 9px; border-radius:2px; cursor:pointer; }
.sch-track-card:hover { border-color:var(--gd); color:var(--gd); }
a.ebay { font-family:var(--fm); font-size:10px; letter-spacing:1px; text-transform:uppercase; color:var(--dim); } a.ebay:hover { color:var(--iac); }
.placeholder { background:var(--p1); border:1px dashed var(--bd2); border-radius:4px; padding:26px 20px; text-align:center; font-family:var(--fm); font-size:11px; color:var(--dim); line-height:1.8; margin-top:12px; } .placeholder b { color:var(--th); letter-spacing:1px; }
.block { background:var(--p1); border:1px solid var(--bd); border-radius:4px; padding:14px 16px; margin:18px 0; }
.block h3 { font-family:var(--fd); font-weight:900; font-size:14px; letter-spacing:2px; text-transform:uppercase; color:var(--th); margin-bottom:8px; }
.legend { font-family:var(--fm); font-size:10px; color:var(--dim); line-height:1.8; } .legend b { color:var(--tx); }
.foot { font-family:var(--fm); font-size:9px; color:var(--dim); margin-top:24px; line-height:1.7; }
@media (max-width:760px) { .stats { grid-template-columns:repeat(4,1fr); } h1 { font-size:26px; } .levelbox { text-align:left; } .tab { padding:8px 10px; font-size:12px; } }
${navCss}
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
  <link rel="canonical" href="https://www.shopcardhub.com/${SLUG}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="https://www.shopcardhub.com/${SLUG}">
  <meta property="og:type" content="website">
  <meta property="og:image" content="https://www.shopcardhub.com/og/indices.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="https://www.shopcardhub.com/og/indices.png">
  <script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "WebPage", name: title, description: desc, url: `https://www.shopcardhub.com/${SLUG}`, isPartOf: { "@type": "WebSite", name: "ShopCardHub", url: "https://www.shopcardhub.com" }, about: { "@type": "Thing", name: `${TICKER} · 2026 Bowman Chrome Chase Index` } })}</script>
</head><body>
${navBlock}

<div class="livebar${isPre ? "" : " live"}">${isPre
  ? `Pre-activation · streets Wed Sep 9, 2026 · ask basis, labeled · no level until &ge;60% of the basket has verified asks · no calls, just the tape`
  : `Live index · ${esc(X.basisLabel || X.basis)} · every mark dated per row · re-marked every board-touching run through street +21d, then weekly · no calls, just the tape`}</div>
<!-- Tuesday Tape capture (newsletter-visibility-aug30, approved Aug 31) -->
<div id="tapecap" style="background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.08); padding:10px 16px;">
  <div style="max-width:1080px; margin:0 auto; display:flex; gap:12px; align-items:center; flex-wrap:wrap; justify-content:center;">
    <span style="font-family:var(--fm); font-size:11px; letter-spacing:1px; color:var(--iac); text-transform:uppercase; font-weight:700;">&#128236; The Tuesday Tape</span>
    <span style="font-size:12px; color:var(--dim,#5a7880);">Bowman Chrome's first marks and the board's weekly moves, in your inbox. One email, Tuesdays.</span>
    <form id="tapecap-form" style="display:flex; gap:8px; flex-wrap:wrap;" novalidate>
      <input type="email" required placeholder="your@email.com" aria-label="Email address" style="background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.15); color:#e4f0f4; font-size:12px; padding:7px 12px; border-radius:2px; min-width:190px;">
      <button type="submit" style="background:var(--iac); color:#000; border:none; font-family:var(--fm); font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; padding:7px 16px; border-radius:2px; cursor:pointer;">Get it</button>
    </form>
    <span id="tapecap-ok" style="display:none; font-size:12px; color:#00e07a;">&#10003; You're in — see you Tuesday.</span>
    <span id="tapecap-err" style="display:none; font-size:12px; color:#ff2e55;">That email didn't take — try again.</span>
  </div>
</div>
<script>
(function(){
  var f=document.getElementById('tapecap-form'); if(!f) return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var em=(f.querySelector('input[type=email]')||{}).value||'';
    var ok=document.getElementById('tapecap-ok'), er=document.getElementById('tapecap-err');
    if(er) er.style.display='none';
    fetch('/api/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:em,source:'bcb26-index'})})
      .then(function(r){
        if(r.ok){ f.style.display='none'; if(ok) ok.style.display='inline'; if(window.gtag) gtag('event','newsletter_signup',{method:'mailerlite',location:'bcb26-index'}); }
        else { if(er) er.style.display='inline'; }
      })
      .catch(function(){ if(er) er.style.display='inline'; });
  });
})();
</script>

<div class="wrap">
<div class="crumb" style="padding:14px 0 0;">RESEARCH / <a href="/indices" style="color:var(--dim);">SET INDICES</a> / <b>${TICKER}</b></div>

<div class="strip" id="strip"><a class="chip on" href="/${SLUG}"><b>${TICKER}</b> <span class="soon">${isPre ? "pre · streets 09/09" : "live"}</span></a></div>

<div class="mast">
<div>
<div class="eyebrow">&#9646; Set Index &middot; Per-Set &middot; Price-Weighted &middot; ${isPre ? "Pre-Activation" : esc(X.basis === "sold" ? "Sold Basis" : "Ask Basis (labeled)")}</div>
<h1>${TICKER} <span class="tick">&middot;</span> 2026 Bowman Chrome Chase Index</h1>
<div class="subline">2026 Bowman Chrome Baseball — streets ${fmtD(X.releaseDate)}. One fixed database for this set only: the ${byTab.base.length} Chrome Prospects (BASE) and the ${byTab.autos.length} published Chrome Prospect Autographs (AUTOS, 15% single-card cap). Not a cross-set 1st Bowman index — that market is the <a href="/bowman-bangers" style="color:var(--iac);">Bangers board</a>. This page tracks the set; it does not recommend cards. <a href="/bowman-chrome-baseball-2026" style="color:var(--iac);">Set guide &rarr;</a></div>
</div>
${levelBox}
</div>

${isPre ? `<div class="activate"><h3>Pre-activation &middot; what happens next</h3>
<p><b>Activates when &ge;60% of the chase basket (by value) has verified asks</b> — expected within days of Sep 9. The first mark sets the divisor so the index opens at <b>100.00</b>; from then on the level IS the cumulative move. Marks are on an <b>ask basis, labeled on every row</b>, until SCP sold coverage reaches &ge;60% of basket value — then the index restates to hammer basis through a logged divisor adjustment (the level does not move on a basis change). Asks are never called solds, and the two are never blended in one basket. Re-marked on every board-touching run (Mon / Tue / Fri) through street +21 days, then weekly. No level, no sparkline and no history are shown until they exist.</p></div>` : ""}

<div class="stats">
<div class="stat"><div class="k">Universe</div><div class="v">${uni.length}<i style="font-size:9px;color:var(--dim);font-style:normal"> ${byTab.base.length} base + ${byTab.autos.length} autos</i></div></div>
<div class="stat"><div class="k">Priced / Universe</div><div class="v${priced ? "" : " dim"}">${priced} <i style="font-size:10px;color:var(--dim);font-style:normal">/ ${uni.length}</i></div></div>
<div class="stat"><div class="k">Level</div><div class="v${isPre ? " or" : ""}">${isPre ? "PRE" : last ? last.level.toFixed(2) : "—"}</div></div>
<div class="stat"><div class="k">Basis</div><div class="v acc">${esc((X.basis || "ask").toUpperCase())}<i style="font-size:9px;color:var(--dim);font-style:normal"> labeled</i></div></div>
<div class="stat"><div class="k">Board names in set</div><div class="v gold">${boardInSet.length} <i style="font-size:10px;color:var(--dim);font-style:normal">/ ${BOARD_NAMES.length}</i></div></div>
<div class="stat"><div class="k">Divisor</div><div class="v${X.divisor ? "" : " dim"}">${X.divisor ? X.divisor : "—"}</div></div>
<div class="stat"><div class="k">Street</div><div class="v">${esc(fmtD(X.releaseDate))}</div></div>
<div class="stat"><div class="k">Re-mark</div><div class="v" style="font-size:11px;line-height:1.3;">MON&middot;TUE&middot;FRI<br><span style="color:var(--dim);font-weight:400;">street +21d</span></div></div>
</div>
<div class="statnote">UNIVERSE = every card on the published checklist (as of ${esc(set.asof)}; the autograph list was still filling in — new cards enter via logged divisor adjustments). Unpriced cards carry zero weight until their first verified mark. ${isPre ? "No number on this page is a price: none exists yet that the site can attribute." : "Every mark is dated per row and labeled by basis."}</div>

<div class="bench"><span class="lbl">Board vs Index &middot; benchmark line</span>
<b>${boardInSet.length} of ${BOARD_NAMES.length} Bangers board names have a card in this set:</b> ${boardInSet.map((u) => `${esc(u.player)} (${esc(u.number)})`).join(", ") || "none"}.${boardMissing.length ? ` <b>Not on the published checklist as of ${esc(set.asof)}:</b> ${boardMissing.map(esc).join(", ")} — their 1st Bowman Chrome Autos were in May's 2026 Bowman; if the final Chrome checklist adds them they enter at the next re-mark.` : ""} ${isPre ? "Once BCB26 activates, this line carries the board's move vs the index's move over the same window — the board is the cross-set instrument, this index is the set." : "This line compares the board's move to the index's move over the same window."} <a href="/bowman-bangers">The board &rarr;</a></div>

<div class="tabs" role="tablist">
<button class="tab on" role="tab" data-pane="base">Base <span class="ct">${byTab.base.length}</span></button>
<button class="tab" role="tab" data-pane="autos">Autos <span class="ct">${byTab.autos.length}</span></button>
<button class="tab" role="tab" data-pane="parallels">Parallels <span class="ct">&mdash;</span></button>
</div>

<div class="pane on" id="pane-base">
<div class="panenote"><b>BASE</b> — the ${byTab.base.length} Chrome Prospects, BCP-151 to BCP-250 (numbering continues from May's paper set). Chromium stock, non-auto, unnumbered; "base" here never means the paper card. Price-weighted once marks exist. <b>1ST BOWMAN</b> is shown only where the checklist's own rules allow it — an untagged name is unknown, not "not a 1st".</div>
${table(byTab.base)}
</div>
<div class="pane" id="pane-autos">
<div class="panenote"><b>AUTOS</b> — the ${byTab.autos.length} published Chrome Prospect Autographs (CPA-), on-card. <b>15% single-card weight cap at the basket level:</b> at (re)constitution any auto whose share would exceed 15% of the autos basket gets fractional units so its share is exactly 15%; the cap is applied and logged in the divisor log, never by editing a price. The published auto list was still filling in on ${esc(set.asof)}; additions enter via logged divisor adjustments.</div>
${table(byTab.autos)}
</div>
<div class="pane" id="pane-parallels">
<div class="placeholder"><b>PARALLELS &middot; NOT YET ACTIVE</b><br>Activates when parallel asks are verifiable — refractor-ladder rows appear only once the engine can verify a numbered parallel's ask against a live listing. No rows are invented before that.</div>
</div>

<div style="font-family:var(--fm);font-size:9px;color:var(--dim);margin-top:8px;" data-universe-asof="${esc(set.asof)}">*Universe from the published checklist as of ${esc(set.asof)} (${esc(set.source)}) &middot; ${isPre ? "no marks yet — the first ask marks land at the first board-touching run after street" : `marks as of ${esc(last ? last.date : "")}`} &middot; eBay links open a live search (EPN-tracked); the mark column never reads from them.</div>

<div class="block"><h3>Legend &amp; Methodology</h3>
<div class="legend">
<b>PER SET</b> — ${TICKER} is 2026 Bowman Chrome only. May's paper Bowman, Sapphire and Draft each get their own ticker; nothing is mixed across sets. The Bangers board is the cross-set 1st Bowman instrument. &middot;
<b>TABS</b> — BASE (Chrome Prospects) and AUTOS (Chrome Prospect Autographs, 15% single-card cap) are separate baskets; PARALLELS activates when parallel asks are verifiable. &middot;
<b>BASIS</b> — ask basis, labeled on every row: a verified ask is what a seller is asking on a live, engine-verified listing — it is not a sale and is never called one. When SCP sold coverage reaches &ge;60% of basket value the index restates to hammer basis through a logged divisor adjustment; the level is identical before and after. Asks and solds are never blended. &middot;
<b>ACTIVATION</b> — first re-mark with verified asks covering &ge;60% of chase-basket value: divisor = basket value &divide; 100, inception = that date, level 100.00. &middot;
<b>WEIGHT</b> — price &divide; basket value within a tab; unpriced cards carry zero weight and enter via logged divisor adjustments so inclusion never moves the level. &middot;
<b>1ST BOWMAN</b> — the 1st logo is on every Bowman card a player gets in his debut year (paper, Chrome, Sapphire, parallels). No checklist marks it per card, so the tag appears only on the Bangers board names and players the sources explicitly named as 2026 1st Bowmans. Untagged = unknown. &middot;
<b>&#9733;</b> — Track in your Vault (free, no account): Hunting or I Own It. No price is seeded pre-activation. &middot;
<b>FULL METHODOLOGY</b> — solds vs asks vs engine marks: <a href="/how-prices-work" style="color:var(--iac);">/how-prices-work</a>. &middot;
<b>NO CALLS</b> — an index is a measurement, not a recommendation. The board makes calls and is graded in public on <a href="/track-record" style="color:var(--iac);">the Scorecard</a>; this page does not.
</div></div>

<div class="foot">${TICKER} &middot; ShopCardHub Set Indices &middot; per-set Bowman index #1 &middot; ${isPre ? "pre-activation, streets Sep 9, 2026" : `inception ${fmtD(X.inception)} at 100.00`} &middot; ask basis labeled until hammer restatement, dated per mark, divisor-continuous &middot; affiliate disclosure: eBay listing links are EPN-tracked; marks and index math are independent of them.</div>
</div>

<script src="/js/vault-track.js?v=5" defer></script>
<script>
(function(){
  var tabs = document.querySelectorAll('.tab'), panes = document.querySelectorAll('.pane');
  tabs.forEach(function(t){ t.addEventListener('click', function(){
    tabs.forEach(function(x){ x.classList.toggle('on', x === t); });
    panes.forEach(function(p){ p.classList.toggle('on', p.id === 'pane-' + t.dataset.pane); });
    if (window.gtag) gtag('event', 'index_tab', { ticker: '${TICKER}', tab: t.dataset.pane });
  }); });
  // ticker strip — levels load live from data/indices.json, never typed here
  fetch('/data/indices.json').then(function(r){ return r.json(); }).then(function(D){
    var el = document.getElementById('strip'); if (!el) return;
    var html = '';
    Object.keys(D).forEach(function(t){
      var x = D[t]; if (!x || typeof x !== 'object' || !x.page) return;
      var on = (t === '${TICKER}');
      var hist = x.history || [], last = hist.length ? hist[hist.length-1] : null, prev = hist.length > 1 ? hist[hist.length-2] : null;
      var pre = (x.status === 'pre' || x.status === 'pre-activation' || !last);
      var body = pre ? '<span class="soon">' + (x.releaseDate ? 'pre · streets ' + x.releaseDate.slice(5).replace('-', '/') : 'pre') + '</span>'
        : '<span style="color:var(--tx)">' + last.level.toFixed(2) + '</span>' + (prev ? ' <span class="' + (last.level >= prev.level ? 'up' : 'dn') + '">' + (last.level >= prev.level ? '+' : '') + ((last.level / prev.level - 1) * 100).toFixed(1) + '%</span>' : '');
      html += '<a class="chip' + (on ? ' on' : '') + '" href="' + x.page + '"><b>' + t + '</b> ' + body + '</a>';
    });
    if (html) el.innerHTML = html;
  }).catch(function(){});
})();
</script>
</body></html>
`;

if (CHECK) { console.log(`[check] would write ${OUT_PATH} (${html.length} bytes) — status ${X.status}, universe ${uni.length}, priced ${priced}`); process.exit(0); }
fs.writeFileSync(OUT_PATH, html);
console.log(`wrote ${path.relative(REPO, OUT_PATH)} — status ${X.status}, universe ${uni.length} (base ${byTab.base.length}, autos ${byTab.autos.length}), priced ${priced}, board-in-set ${boardInSet.length}/${BOARD_NAMES.length}`);
