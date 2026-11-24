#!/usr/bin/env node
/* build-mlb-cards.mjs — writes /mlb-cards from data/mlb-cards.json (Oct 13 2026, Mo: "consolidate MLB stars and what
 * to buy on a single page … 5–10 cards per player, list or tables, no thesis per player"; CoS handoff
 * claude/handoffs/mlb-cards-board-2026-10-13.md).
 *
 * One page, one table per player, three tiers (Grail / Core / Value). Every price is a SportsCardsPro sold-listing range
 * inside the 30-day window in the data file; rows with no in-window sale carry the SCP price point marked "pt". The Raw /
 * PSA 9 / PSA 10 / TAG eBay links are baked here with the same phrase rules as js/grade-links.js (sports category 212),
 * full EPN param set, customid mlb-<player>-<n>[-psa9|-psa10|-tag]. No new link family (R33 freeze): same four grade
 * links the index rows carry, same ★ Track button, same buy strip (data/buy-strip.json → tools/build-buy-strip.mjs).
 *
 *   node tools/build-mlb-cards.mjs          # writes mlb-cards.html, then run build-nav.js + build-buy-strip.mjs
 *
 * Shell pieces (global CSS, gtag) live in tools/mlb-cards/ so the page does not borrow from a page that may be culled.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { carryFooter } from "./lib/footer.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const D = JSON.parse(fs.readFileSync(path.join(REPO, "data/mlb-cards.json"), "utf8"));
const SHELL_CSS = fs.readFileSync(path.join(REPO, "tools/mlb-cards/shell.css"), "utf8");
const GTAG = fs.readFileSync(path.join(REPO, "tools/mlb-cards/gtag.html"), "utf8");

const SLUG = "mlb-cards";
const URL = "https://www.shopcardhub.com/" + SLUG;
const P = "mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const RAW_NOT = " -psa -cgc -bgs -sgc -tag -beckett -graded -slab";
const TAG_Q = ' "TAG 10" -psa -cgc -bgs -sgc';

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const nkw = (q) => encodeURIComponent(String(q).replace(/\s+/g, " ").trim()).replace(/%20/g, "+").replace(/'/g, "%27").replace(/[!()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
function phrase(q, g) {
  if (g === "raw") return q + RAW_NOT;
  if (g === "psa9") return q + ' psa 9 -"psa 10"';
  if (g === "psa10") return q + " psa 10";
  return q + TAG_Q;
}
function ebay(q, g, cid) {
  return "https://www.ebay.com/sch/i.html?_nkw=" + nkw(phrase(q, g)) + "&_sacat=212&LH_BIN=1&" + P + "&customid=" + cid + (g === "raw" ? "" : "-" + g);
}
const money = (v) => {
  const n = Number(v);
  if (n >= 1000) return "$" + Math.round(n).toLocaleString("en-US");
  if (n >= 100) return "$" + Math.round(n);
  if (n >= 10) return "$" + (Math.round(n * 2) / 2).toString().replace(/\.0$/, "");
  return "$" + (Math.round(n * 4) / 4).toString().replace(/\.0+$/, "");
};
const nb = (t) => t.replace(/ /g, "&nbsp;");   // keep "to Oct 10" on one line (Cupertino run 25)
function range(x, pt, lab) {
  if (!x) return `<td class="num none" data-l="${lab}" aria-label="no sales in window"><span class="dot">·</span><span class="nos">no sale</span></td>`;
  // R18 + IW 2026-10-15 F1 (CoS ruling Oct 15): a guide point is never printed as a price; a cell needs 3+ in-window
  // sales to carry a number; a median (x.med) prints when the data file has one, else the middle half of the sales.
  if (x.n === 0 || pt) return `<td class="num none" data-l="${lab}"><span class="nos">${lab === "Raw" ? "No sale in 30 days" : "No verified sale"}</span></td>`;
  if (x.n < 3) return `<td class="num none" data-l="${lab}"><span class="nos">Too few sales</span><small>${x.n} sale${x.n === 1 ? "" : "s"} &middot; last&nbsp;${nb(fmtDate(x.asof))}</small></td>`;
  const cnt = x.n >= 30 ? "30+" : x.n;
  if (x.med != null) return `<td class="num" data-l="${lab}">${money(x.med)}<small>median of ${cnt} &middot; to&nbsp;${nb(fmtDate(x.asof))}</small></td>`;
  const txt = Math.abs(x.hi - x.lo) < 0.01 ? money(x.lo) : money(x.lo) + "&ndash;" + money(x.hi);
  return `<td class="num" data-l="${lab}">${txt}<small>mid of ${cnt} sales &middot; to&nbsp;${nb(fmtDate(x.asof))}</small></td>`;
}
// Bowman KB G32 (Oct 15): paper Bowman (BP-/BD-/BDPP codes, flagship Bowman base) gets no tier and no buy links.
const PAPER_SET = /^Bowman( Draft| Prospects| Paper Prospects)?$/;
const CHROME_NUM = /^(CPA|BCP|CDA|BDC|BCRA)/i;
for (const p of D.players) for (const c of p.cards) {
  if (PAPER_SET.test(c.set) && !CHROME_NUM.test(c.num)) throw new Error(`paper Bowman row refused (G32): ${p.name} ${c.year} ${c.set} #${c.num}`);
}
const fmtDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] + " " + d + (y !== 2026 ? " " + y : ""); };
const cardTitle = (c) => `${c.year} ${c.set}${c.num ? " #" + c.num : ""}${c.parallel && c.parallel !== "Base" ? " " + c.parallel : ""}`;

const TIER = { Grail: "The grail", Core: "Core", Value: "Value" };

function playerBlock(p, i) {
  const rows = p.cards.map((c, j) => {
    const cid = `mlb-${p.slug}-${j + 1}`;
    const pt = c.note && /scp-point/.test(c.note);
    const ok = (x) => x && x.n >= 3 && !pt;
    const seed = ok(c.raw) ? (c.raw.med ?? c.raw.lo) : ok(c.psa10) ? (c.psa10.med ?? c.psa10.lo) : 0;
    const seedGrade = ok(c.raw) || !ok(c.psa10) ? "Raw" : "PSA 10";
    const name = `${p.name} #${c.num} — ${c.year} ${c.set}${c.parallel && c.parallel !== "Base" ? " " + c.parallel : ""}`;
    return `<tr class="t-${c.tier.toLowerCase()}">
<td class="cd"><b>${esc(cardTitle(c))}</b><span class="lb">${esc(c.label)}</span><span class="tb t-${c.tier.toLowerCase()}">${TIER[c.tier]}</span></td>
<td class="tier"><span class="tb t-${c.tier.toLowerCase()}">${TIER[c.tier]}</span></td>
${range(c.raw, pt && c.raw && c.raw.n === 0, "Raw")}
${range(c.psa9, false, "PSA 9")}
${range(c.psa10, pt && c.psa10 && c.psa10.n === 0, "PSA 10")}
<td class="act"><span class="act-w"><button type="button" class="sch-track-card" data-name="${esc(name)}" data-set="${esc(c.year + " " + c.set)}" data-cat="baseball" data-grade="${seedGrade}" data-price="${seed}" title="Watch this card">★</button><span class="glk"><a class="ebay g-raw" href="${ebay(c.q, "raw", cid)}" target="_blank" rel="sponsored nofollow noopener" title="Raw (ungraded) copies on eBay">Raw</a><a class="ebay g-psa9" href="${ebay(c.q, "psa9", cid)}" target="_blank" rel="sponsored nofollow noopener" title="PSA 9 copies on eBay"><span class="gl">PSA&nbsp;</span>9</a><a class="ebay g-psa10" href="${ebay(c.q, "psa10", cid)}" target="_blank" rel="sponsored nofollow noopener" title="PSA 10 copies on eBay"><span class="gl">PSA&nbsp;</span>10</a><a class="ebay g-tag" href="${ebay(c.q, "tag", cid)}" target="_blank" rel="sponsored nofollow noopener" title="TAG 10 slabs on eBay (often none — TAG is a small share of graded volume)">TAG</a></span></span></td>
</tr>`;
  }).join("\n");
  const grails = p.cards.filter((c) => c.tier === "Grail").length;
  return `<details class="plr" id="${p.slug}"${i === 0 ? " open" : ""}>
<summary>
  <span class="pl-n"><span class="pl-i">${i + 1}</span><h2>${esc(p.name)} cards</h2><span class="pl-t">${esc(p.team)}${p.pos ? " · " + esc(p.pos) : ""}</span></span>
  <span class="pl-m">${p.cards.length} cards · ${grails} grail${grails === 1 ? "" : "s"}</span>
  <span class="pl-c" aria-hidden="true"></span>
</summary>
<div class="pl-b">
${p.note ? `<p class="pl-note"><span class="pl-d">Through ${esc(fmtDate(D.window.to))}</span> ${esc(p.note)} <small class="pl-src">(dated sales, ${esc(win)})</small></p>` : ""}
<div class="tw"><table>
<thead><tr><th class="cd">Card</th><th class="tier">Tier</th><th class="num">Raw</th><th class="num">PSA 9</th><th class="num">PSA 10</th><th class="act">On eBay</th></tr></thead>
<tbody>
${rows}
</tbody></table></div>
</div>
</details>`;
}

const stars = D.players.filter((p) => p.grp === "stars");
const prospects = D.players.filter((p) => p.grp === "prospects");
const nCards = D.players.reduce((a, p) => a + p.cards.length, 0);
const chips = (list) => list.map((p) => `<a class="chip" href="#${p.slug}">${esc(p.name.replace(/ Jr\.$/, " Jr"))}</a>`).join("");
const asof = fmtDate(D.asof) + " " + D.asof.slice(0, 4);
const win = `${fmtDate(D.window.from)}–${fmtDate(D.window.to)} ${D.window.to.slice(0, 4)}`;

const title = `MLB Cards to Buy — ${D.players.length} Players, ${nCards} Cards, Sold Prices | ShopCardHub`;
const desc = `What to buy for ${stars.map((p) => p.name.replace(/\s+(Jr\.|Sr\.|II|III|IV)$/, "").split(" ").pop()).slice(0, 6).join(", ")} and ${D.players.length - 6} more: 5–8 cards per player in three tiers (grail, core, value) with ${win} sold prices raw, PSA 9 and PSA 10, and a buy link for each.`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="view-transition" content="same-origin">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${URL}">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(title.replace(" | ShopCardHub", ""))}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:url" content="${URL}">
  <meta property="og:site_name" content="ShopCardHub">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:site" content="@shopcardhub">
  <meta property="og:image" content="https://www.shopcardhub.com/og/default.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="628">
  <script type="application/ld+json">
  ${JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: title.replace(" | ShopCardHub", ""), url: URL, publisher: { "@type": "Organization", name: "ShopCardHub", url: "https://www.shopcardhub.com" }, datePublished: "2026-10-14", dateModified: D.asof, about: D.players.map((p) => ({ "@type": "Person", name: p.name })) })}
  </script>
  <style>
${SHELL_CSS}
</style>
${GTAG}
  <link rel="stylesheet" href="/css/site-fixes.css">
  <style>
/* /mlb-cards — page styles (scoped). Cupertino run 25: the board on the design system (DESIGN-SYSTEM.md "The player board"). */
.mlb .intro, .mlb .close { max-width:42em; font-size:17px; line-height:1.47; color:var(--text); margin:0 0 24px; }
.mlb .close { margin:48px 0 0; }
html body .mlb .legend { display:flex; flex-wrap:wrap; gap:8px 16px; align-items:center; font:400 12px/1.33 var(--ds-font); font-size:12px !important; color:var(--text-dim); margin:0 0 40px; }
.mlb .legend .tb { margin:0; color:var(--text); }
.mlb .legend .tb + .tb::before { content:"· "; color:var(--text-dim); }
.mlb .chips { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 8px; }
.mlb .chips .gh { flex-basis:100%; font:600 12px/1.33 var(--ds-font); color:var(--text-dim); margin:16px 0 0; }
.mlb .chips .gh:first-child { margin-top:0; }
html body .mlb .chip { display:inline-flex; align-items:center; min-height:36px; padding:0 14px; border-radius:980px; background:var(--ds-surface-1); color:var(--text); font:400 14px/1 var(--ds-font); font-size:14px !important; letter-spacing:0; text-transform:none; transition:background .2s var(--ds-ease), color .2s var(--ds-ease); }
.mlb .chip:hover { background:var(--ds-surface-3); color:var(--text-head); text-decoration:none; }
.mlb .tools { display:flex; gap:16px; justify-content:flex-end; margin:16px 0 0; }
.mlb .tools button { min-height:44px; padding:0; border:0; background:none; color:var(--accent); font:400 14px/1 var(--ds-font); letter-spacing:0; text-transform:none; cursor:pointer; }
.mlb .tools button:hover { text-decoration:underline; }
.mlb .grp { font:600 var(--ds-fs-h2)/1.1 var(--ds-font); letter-spacing:-0.015em; color:var(--text-head); text-wrap:balance; margin:72px 0 16px; }
.mlb .plr { border-bottom:1px solid var(--border2); }
.mlb .plr summary { list-style:none; display:flex; align-items:center; gap:16px; min-height:44px; padding:20px 0; cursor:pointer; }
.mlb .plr summary::-webkit-details-marker { display:none; }
.mlb .pl-n { display:grid; grid-template-columns:32px minmax(0,1fr); align-items:baseline; column-gap:8px; min-width:0; }
.mlb .pl-i { font:400 14px/1 var(--ds-font); color:var(--ds-text-3); }
.mlb .plr h2 { font:600 var(--ds-fs-tile)/1.17 var(--ds-font); letter-spacing:0; text-transform:none; color:var(--text-head); margin:0; }
.mlb .pl-t { grid-column:2; font-size:14px; color:var(--text-dim); margin-top:4px; }
.mlb .pl-m { margin-left:auto; font-size:14px; color:var(--text-dim); white-space:nowrap; }
.mlb .pl-c { width:7px; height:7px; border-right:1.5px solid var(--text-dim); border-bottom:1.5px solid var(--text-dim); transform:rotate(45deg) translate(-2px,-2px); transition:transform .2s var(--ds-ease); flex-shrink:0; margin:0 4px 0 8px; }
.mlb .plr[open] .pl-c { transform:rotate(-135deg) translate(-2px,-2px); }
.mlb .plr summary:hover .pl-c { border-color:var(--text-head); }
.mlb .pl-b { margin:0 0 32px; padding:8px 24px 16px; background:var(--ds-surface-1); border-radius:18px; }
.mlb .pl-note { font-size:17px; line-height:1.47; color:var(--text); max-width:42em; margin:16px 0 16px; }
.mlb .pl-d { display:block; font:600 12px/1.33 var(--ds-font); letter-spacing:0; text-transform:none; color:var(--text-dim); margin-bottom:4px; }
.mlb .pl-src { font-size:12px; color:var(--text-dim); }
.mlb .tw { overflow-x:auto; }
.mlb table { width:100%; border-collapse:collapse; font-size:14px; }
html body .mlb th { font:600 12px/1.33 var(--ds-font); font-size:12px !important; letter-spacing:0; text-transform:none; color:var(--text-dim); text-align:left; padding:8px 8px 8px 0; border-bottom:1px solid var(--border2); white-space:nowrap; }
.mlb td { padding:14px 8px 14px 0; border-bottom:1px solid var(--border); vertical-align:middle; }
.mlb tr:last-child td { border-bottom:none; }
.mlb td.cd b { display:block; font-size:17px; font-weight:600; letter-spacing:0; color:var(--text-head); line-height:1.24; }
.mlb td.cd .lb { font-size:14px; color:var(--text-dim); margin:2px 4px 0 0; }
.mlb .tier { display:none; }
.mlb td.cd { min-width:200px; }
.mlb td.cd .tb::before { content:"· "; }
.mlb .tb { display:inline; font:400 14px/1.33 var(--ds-font); letter-spacing:0; text-transform:none; color:var(--text-dim); white-space:nowrap; }
.mlb th.num, .mlb td.num { text-align:right; white-space:nowrap; }
.mlb td.num { font-size:15px; font-weight:600; color:var(--text-head); }
.mlb td.num { width:16%; min-width:132px; }
.mlb td.num small { display:block; white-space:normal; font-size:12px; line-height:1.33; font-weight:400; color:var(--text-dim); margin-top:2px; }
.mlb td.num.none { color:var(--ds-text-3); font-weight:400; }
.mlb td.num .nos { display:none; }
.mlb th.act, .mlb td.act { text-align:right; padding-right:0; }
.mlb .act-w { display:inline-flex; align-items:center; gap:8px; justify-content:flex-end; flex-wrap:nowrap; }
.mlb .glk { display:inline-flex; gap:8px; }
.mlb .glk a.ebay, html body .mlb .sch-track-card { position:relative; display:inline-flex; align-items:center; justify-content:center; min-height:32px; padding:0 12px; border:0; border-radius:980px; background:var(--ds-surface-3); color:var(--text-head); font:600 12px/1 var(--ds-font); letter-spacing:0; text-transform:none; white-space:nowrap; transition:background .2s var(--ds-ease); }
.mlb .glk a.ebay::after, html body .mlb .sch-track-card::after { content:""; position:absolute; inset:-6px 0; }
.mlb .glk a.ebay:hover, html body .mlb .sch-track-card:hover { background:#3a3a3c; color:var(--text-head); text-decoration:none; }
.mlb .glk a.g-raw { background:var(--accent); color:#000; }
.mlb .glk a.g-raw:hover { background:#5cdcf8; color:#000; }
html body .mlb .sch-track-card { padding:0; width:32px; font-size:14px; }
html body .mlb .sch-track-card.sch-tracked { width:auto; padding:0 12px; background:none; color:var(--text-dim); }
.mlb :is(.glk a.ebay, .chip):active { transform:scale(.98); }
.mlb .price-asof { max-width:75ch; font-size:12px; line-height:1.5; color:var(--text-dim); margin:24px 0 0; }
@media (prefers-reduced-motion:reduce) { .mlb .pl-c, .mlb .chip, .mlb .glk a.ebay { transition:none; } .mlb :is(.glk a.ebay, .chip):active { transform:none; } }
@media (max-width:760px) {
  .mlb .grp { margin-top:48px; }
  .mlb .plr summary { padding:16px 0; gap:8px; }
  .mlb .pl-n { grid-template-columns:24px minmax(0,1fr); }
  .mlb .pl-m { display:none; }
  .mlb .pl-c { margin-left:auto; }
  .mlb .pl-b { padding:4px 16px 8px; border-radius:12px; margin-bottom:24px; }
  .mlb .pl-note { font-size:15px; }
  .mlb .tw { overflow:visible; }
  .mlb table, .mlb tbody { display:block; width:100%; }
  .mlb thead { display:none; }
  .mlb tr { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:16px 0; border-bottom:1px solid var(--border); }
  .mlb tr:last-child { border-bottom:none; }
  .mlb td { display:block; border:none; padding:0; }
  .mlb td.cd { grid-column:1 / -1; }
  .mlb td.cd b { display:block; }
  .mlb td.cd .lb { display:inline; font-size:14px; }
  .mlb td.num { text-align:left; font-size:15px; white-space:normal; width:auto; min-width:0; }
  .mlb td.num small { white-space:normal; line-height:1.33; }
  .mlb td.num::before { content:attr(data-l); display:block; font:600 12px/1.33 var(--ds-font); letter-spacing:0; text-transform:none; color:var(--text-dim); margin-bottom:2px; }
  .mlb td.num.none .dot { display:none; }
  .mlb td.num.none .nos { display:inline; font-size:14px; }
  .mlb td.act { grid-column:1 / -1; text-align:left; margin-top:4px; }
  .mlb .act-w { display:flex; justify-content:flex-start; }
  .mlb .glk { flex-wrap:wrap; gap:6px; }
  .mlb .glk a.ebay { padding:0 11px; }
  .mlb .glk a.ebay, html body .mlb .sch-track-card { min-height:44px; }
  html body .mlb .sch-track-card { width:44px; }
}
  </style>
</head>
<body>
<!-- NAV:START -->
<!-- NAV:END -->
<section class="hero" style="border-top:none; padding-bottom:0;">
  <div class="container">
    <div class="hero-eyebrow">⚾ MLB · ${D.players.length} players · ${nCards} cards · sold prices</div>
    <h1>MLB cards<br><em>what to buy, player by player</em></h1>
    <p class="hero-sub">Pick a player, get ${Math.min(...D.players.map((p) => p.cards.length))}–${Math.max(...D.players.map((p) => p.cards.length))} cards worth owning at three price levels, each with what it sold for in the last 30 days raw, PSA 9 and PSA 10 where there were enough sales to say, and a button to go buy it. No essay per player. The one line under each name says what moved that market this month.</p>
    <div class="hero-meta">
      <span>● Sold comps ${esc(win)}</span>
      <span>⚾ ${stars.length} stars · ${prospects.length} rookies &amp; prospects</span>
      <span>📊 Raw · PSA 9 · PSA 10</span>
      <span>💰 eBay buy links on every row</span>
    </div>
  </div>
</section>
<!-- SIGNUP:START — email capture under the buy strip. Generated by tools/build-signup.mjs; rendered by /js/signup.js. Do not hand-edit. -->
<div class="sch-signup" data-signup="${SLUG}" data-variant="tape"></div>
<script src="/js/signup.js?v=3" defer></script>
<!-- SIGNUP:END -->

<div class="container mlb">
  <section style="border-top:none; padding-top:28px;">
    <p class="intro">Every number here comes from eBay sold listings for ${esc(win)}, read on SportsCardsPro. A price shows the middle half of that month's sales, with the count under it so you can see how thick the market is. Under 3 sales, we print no price. A grail is the card you buy once; core is the card most collectors of that player actually own; value is the sub-$30 way in with real daily volume. Tap a name to open its table, or tap Raw, PSA 9, PSA 10 or TAG to go straight to live copies on eBay.</p>
    <div class="legend"><span class="tb t-grail">The grail</span><span class="tb t-core">Core</span><span class="tb t-value">Value</span><span>No verified sale = nothing sold at that grade in the window</span><span>· = no sale at that grade inside the window</span></div>
    <div class="chips"><span class="gh">Stars</span>${chips(stars)}<span class="gh">2026 rookies &amp; Bowman prospects</span>${chips(prospects)}</div>
    <div class="tools"><button type="button" data-all="open">Open all</button><button type="button" data-all="close">Close all</button></div>

    <div class="grp">${esc(D.groups[0].title)}</div>
${stars.map(playerBlock).join("\n")}

    <div class="grp">${esc(D.groups[1].title)}</div>
${prospects.map((p, i) => playerBlock(p, stars.length + i)).join("\n")}

    <p class="price-asof" data-prices-updated="${D.asof}" style="font-size:12px;color:var(--text-dim);margin:10px 2px 0;">Prices updated ${esc(asof)} &middot; SportsCardsPro eBay sold-market comps, ${esc(win)} &middot; ranges are the middle of the month's sales rather than the extremes; check live solds before buying. Affiliate links: ShopCardHub earns an eBay Partner Network commission on qualifying purchases at no extra cost to you.</p>

    <p class="close">If a player you want is missing, the <a href="/bowman-bangers">Bowman Bangers board</a> covers the 2026 prospect class card by card, and the <a href="/bowman-chrome-2026-index">2026 Bowman Chrome index</a> tracks the whole release as one number. This page gets re-marked on the Monday build, so the sale counts tell you which rows to trust most.</p>
  </section>
</div>

<footer>
  <div class="footer-inner">
    <a href="/" class="logo" style="text-decoration:none;">Shop<span>Card</span>Hub</a>
    <nav class="footer-links">
      <a href="/">Home</a>
      <a href="/indices">Indices</a>
      <a href="/bowman-bangers">Bowman Bangers</a>
      <a href="/best-hobby-boxes-2026">Hobby Boxes</a>
      <a href="/watchlist">Watchlist</a>
      <a href="/tag-grading-guide">TAG Grading</a>
      <a href="https://twitter.com/shopcardhub" target="_blank" rel="noopener">@shopcardhub</a>
    </nav>
    <div class="footer-copy">
      <a href="/research" style="color:inherit;">All Guides</a> · <a href="/about" style="color:inherit;">About</a> · <a href="/affiliate-disclosure" style="color:inherit;">Affiliate Disclosure</a> · <a href="/privacy" style="color:inherit;">Privacy Policy</a><br>
      © 2026 ShopCardHub · shopcardhub.com · <a href="https://twitter.com/shopcardhub" style="color:inherit;" target="_blank" rel="noopener">@shopcardhub</a><br>
      ShopCardHub participates in the eBay Partner Network (campaign 5339155990). Tiers sort a player's cards the way collectors do. Nothing on this page is a buy or sell call. Not affiliated with Topps, Bowman or MLB.
    </div>
  </div>
</footer>

<script>
(function(){
  function openHash(){ var h=location.hash.replace('#',''); if(!h) return; var d=document.getElementById(h); if(d && d.tagName==='DETAILS'){ d.open=true; } }
  openHash(); window.addEventListener('hashchange', openHash);
  document.querySelectorAll('.mlb .tools button[data-all]').forEach(function(b){ b.addEventListener('click', function(){ var o=b.getAttribute('data-all')==='open'; document.querySelectorAll('.mlb details.plr').forEach(function(d){ d.open=o; }); }); });
  document.querySelectorAll('.mlb .glk a.ebay').forEach(function(a){ a.addEventListener('click', function(){ try{ if(typeof gtag==='function') gtag('event','grade_click',{grade:a.className.replace(/.*g-/,''),mode:'bin',item:(a.href.match(/customid=([^&]+)/)||[])[1]||'',page:location.pathname}); }catch(e){} }); });
})();
</script>
<script src="/js/vault-track.js?v=6" defer></script>
</body>
</html>
`;

// keep the generated site footer (tools/build-footer.js) if the page already has one; else the footer above
const OUTFILE = path.join(REPO, SLUG + ".html");
fs.writeFileSync(OUTFILE, html.replace(/<footer>[\s\S]*?<\/footer>/, (m) => carryFooter(OUTFILE, m)));
console.log(`build-mlb-cards: wrote ${SLUG}.html — ${D.players.length} players, ${nCards} rows, ${(html.length / 1024).toFixed(0)} KB`);
