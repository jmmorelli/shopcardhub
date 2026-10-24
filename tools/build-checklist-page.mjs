#!/usr/bin/env node
// build-checklist-page.mjs — the set checklist WORKSHEET page, /<slug>-checklist (P0-E v1, Oct 23 2026).
//
// Mo (DESIGN-DIRECTIVE-2026-10-23 §1/§4): "make it a worksheet on our site the user can tick, save, and see how many cards
// I have in this set and an estimated (not exact) value… the site must give people something to DO, not just look at a
// price and get sent to eBay." This tool writes the page; js/checklist-sheet.js does the ticking, the saving, the sort/
// filter and the live marks (from /data/indices.json, the same numbers the index page shows).
//
// What it writes (one file per CONFIG entry):
//   <slug>.html — the set-index page's shell (head styles, NAV block, SIGNUP block) with this page's title / metas /
//   canonical / LD, then: eyebrow → h1 → one line → the summary bar (count · estimated range · the yellow eBay button,
//   above the fold — R11) → the sheet. The baked table is a static, crawlable copy of data/sets/<set>.json (number, card,
//   team, section, a link per row: the card page where one exists, else a tagged eBay search built by tools/lib/epn.mjs);
//   the script replaces it with the worksheet on load. Nothing numeric is baked — marks arrive live.
//   The index page gets its "Checklist →" tile through build-sector-index.mjs (CONFIG.<tk>.checklist) — re-run it with
//   --ticker <tk> --bake. The NAV block is whatever the shell page carries; run tools/build-nav.js after if nav.json moved.
//
// v2.1 (Oct 24 2026): the sheet script adds the "Still need (N)" chip (gap rows tagged customid=<customid>-need, strip button
//   -need-top), Import CSV (merge by card number) and writes `total` into the saved sheet; the index-page tile reads it.
//
// Usage:
//   node tools/build-checklist-page.mjs [--set BCB26|DR25|PRIS25] [--check] [--dry]
//   --check: rebuild in memory and exit 1 if the page on disk differs (a stale page). Deterministic: no clock, no network.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ebaySearchUrl, SACAT_SPORTS, SACAT_TCG, assertClean } from "./lib/epn.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const has = (k) => args.includes(k);
const opt = (k, d) => (has(k) ? args[args.indexOf(k) + 1] : d);
const CHECK = has("--check"), DRY = has("--dry");
const ONLY = opt("--set", null);
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/* One entry per worksheet. shell = the set-index page whose head/nav this page borrows; setFile = data/sets/<setFile>.json;
   cardPageRe = how a card page's <title> names this product (card pages are matched by title + card number, never guessed);
   cardPageNumRe = where the number sits in that title when it is not at the end (v1's default); chaseCards = data/cards/<tk>.json
   rows open /card?id=<id> (the chase index's own card pages) for numbers with no static page.
   Pokémon (v2, Oct 24 2026): poke:true — rows are {n,name,rarity,id} from tools/fetch-pokemon-checklist.mjs, the eBay row search
   is the index page's own format ("<name> <n>/<printed> <EXCL>", CCG category), the third column is rarity, the accent is the
   set page's --iac (DR25 red, PRIS25 violet), and markNote says plainly which rows carry a number today. */
const EXCL = "-lot -case -proxy -proxies -reprint -digital -custom -diy -skin -metal -display -sticker";   // = build-index-listings-col.mjs
const CONFIG = {
  BCB26: {
    slug: "bowman-chrome-2026-checklist", shell: "bowman-chrome-2026-index", setFile: "2026-bowman-chrome-baseball",
    ticker: "BCB26", cat: "baseball", sacat: SACAT_SPORTS, customid: "cl-bowman-chrome-2026",
    name: "2026 Bowman Chrome", family: "Bowman Baseball", crumb: "BCB26", indexHref: "/bowman-chrome-2026-index", guideHref: "/bowman-chrome-baseball-2026", guideLabel: "2026 Bowman Chrome release guide",
    singlesQ: "2026 Bowman Chrome -box -case -lot -break -sapphire", cardPageRe: /2026 Bowman Chrome/, refresh: "Monday and Thursday",
    scopeNote: "Chrome Prospects (BCP-151 up) and Chrome Prospect Autographs (CPA-), as Topps published them. The 100-card veteran and rookie base (#1–100) is not in this sheet yet.",
  },
  DR25: {
    slug: "destined-rivals-checklist", shell: "destined-rivals-index", setFile: "destined-rivals", poke: true, accent: "var(--iac)",
    ticker: "DR25", cat: "pokemon", sacat: SACAT_TCG, customid: "cl-destined-rivals",
    name: "Destined Rivals", family: "Pokémon", crumb: "DR25", indexHref: "/destined-rivals-index", guideHref: "/prismatic-evolutions-vs-destined-rivals", guideLabel: "Prismatic Evolutions vs Destined Rivals",
    singlesQ: "pokemon Destined Rivals -box -case -lot -break -etb -bundle -booster", chaseCards: true, refresh: "every week",
    scopeNote: "every card pokemontcg.io lists for the set — the 182-card printed set plus the 62 secret rares, #183–244",
    markNote: "Today the numbers cover the secret rares (#183–244, the cards the DR25 index tracks). Base-set cards (#1–182) show “no recent sales” and stay out of the range until we track them.",
  },
  PRIS25: {
    slug: "prismatic-evolutions-checklist", shell: "prismatic-evolutions-index", setFile: "prismatic-evolutions", poke: true, accent: "var(--iac)",
    ticker: "PRIS25", cat: "pokemon", sacat: SACAT_TCG, customid: "cl-prismatic-evolutions",
    name: "Prismatic Evolutions", family: "Pokémon", crumb: "PRIS25", indexHref: "/prismatic-evolutions-index", guideHref: "/prismatic-evolutions-vs-destined-rivals", guideLabel: "Prismatic Evolutions vs Destined Rivals",
    singlesQ: "pokemon Prismatic Evolutions -box -case -lot -break -etb -bundle -booster", chaseCards: true, refresh: "every week",
    cardPageRe: /Prismatic Evolutions Price/, cardPageNumRe: /#(\d{1,3}) Prismatic Evolutions Price/,
    scopeNote: "every card pokemontcg.io lists for the set — the 131-card printed set plus the 49 secret rares, #132–180",
    markNote: "Today the numbers cover the secret rares (#132–180, the cards the PRIS25 index tracks). Base-set cards (#1–131) show “no recent sales” and stay out of the range until we track them.",
  },
};

function cardPages(c) {
  // card-*.html whose <title> names this product and a card number from the set: "… 2026 Bowman Chrome 1st Bowman Auto CPA-AG …"
  const out = {};
  if (c.cardPageRe) for (const f of fs.readdirSync(ROOT).filter((n) => /^card-.+\.html$/.test(n)).sort()) {
    const t = (/<title>([^<]*)<\/title>/.exec(read(f)) || [])[1] || "";
    if (!c.cardPageRe.test(t)) continue;
    const m = c.cardPageNumRe ? c.cardPageNumRe.exec(t) : /#?\b([A-Z]{2,4}-[A-Z0-9]{1,5}|\d{1,3})\b(?=\s*[—|-]|\s*$)/.exec(t.replace(/\s*[—|-]\s*Price Chart.*$/, ""));
    if (m) out[m[1].toUpperCase()] = "/" + f.replace(/\.html$/, "");
  }
  // the chase index's own card pages (/card?id=<tk>-<num>, tools/build-chase-cards.mjs) for every tracked number without a static page
  if (c.chaseCards) {
    const f = `data/cards/${c.ticker.toLowerCase()}.json`;
    if (fs.existsSync(path.join(ROOT, f))) for (const x of JSON.parse(read(f)).cards || []) { const k = String(x.num).toUpperCase(); if (x.id && !out[k]) out[k] = `/card?id=${x.id}`; }
  }
  return out;
}

function build(key, c) {
  const data = JSON.parse(read(`data/sets/${c.setFile}.json`));
  if (!data.set || !Array.isArray(data.groups)) throw new Error(`${c.setFile}: not a checklist file`);
  const groups = data.groups.filter((g) => (g.cards || []).length);
  const total = groups.reduce((n, g) => n + g.cards.length, 0);
  if (!total) throw new Error(`${c.setFile}: no cards`);
  const setName = data.set.replace(/ (Baseball|Basketball|Football|Soccer)$/, "");
  const nameOf = (x) => x.name || x.player;                       // Pokémon rows carry name; Bowman rows carry player
  const printed = data.tcg && data.tcg.printedTotal;               // "231/182" — the printed-set size the eBay search needs
  const hasTeam = groups.some((g) => g.cards.some((x) => x.team));
  const col3 = hasTeam ? "Team" : "Rarity";
  const pages = cardPages(c);
  const pageN = groups.reduce((n, g) => n + g.cards.filter((x) => pages[String(x.n).toUpperCase()]).length, 0);

  const shell = read(`${c.shell}.html`);
  let head = shell.slice(0, shell.indexOf("</head>"));
  const nav = (() => { const a = shell.indexOf("<!-- NAV:START -->"), b = shell.indexOf("<!-- NAV:END -->"); if (a < 0 || b < 0) throw new Error(`${c.shell}: no NAV block`); return shell.slice(a, b + "<!-- NAV:END -->".length); })();

  const title = `${c.name} checklist — track what you have | ShopCardHub`;
  const desc = `Every ${c.name} card on one sheet${c.poke ? ` (${total} cards, secret rares included)` : ""}. Tick the cards you have, save on your device, and see how many you own and an estimated value from recent sales — a range, not a total.${c.poke ? "" : ` ${total} cards.`}`;
  const url = `https://www.shopcardhub.com/${c.slug}`;
  // head: this page's title, description, canonical, og/twitter, robots, LD — the shell's styles and fonts stay
  head = head.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`)
    .replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">\n  <meta name="robots" content="index,follow">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(`${c.name} checklist — track what you have`)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`)
    .replace(/<meta name="robots" content="[^"]*">(?=[\s\S]*<meta name="robots")/, "")   // keep one robots meta (ours)
    .replace(/<script type="application\/ld\+json">\{"@context": "https:\/\/schema.org", "@type": "WebPage"[\s\S]*?<\/script>/, "")
    .replace(/<!-- LD:[A-Z0-9]+:START -->[\s\S]*?<!-- LD:[A-Z0-9]+:END -->\n?/, "");
  if (!head.includes('name="robots"')) throw new Error("robots meta missing");
  const ld = { "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": url + "#page", url, name: `${c.name} checklist — track what you have`, description: desc, isPartOf: { "@type": "WebSite", "@id": "https://www.shopcardhub.com/#website", url: "https://www.shopcardhub.com/", name: "ShopCardHub" } },
    { "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Set indices", item: "https://www.shopcardhub.com/indices" },
      { "@type": "ListItem", position: 2, name: `${c.ticker} · ${c.name}`, item: "https://www.shopcardhub.com" + c.indexHref },
      { "@type": "ListItem", position: 3, name: "Checklist", item: url } ] } ] };
  head += `<script type="application/ld+json">${JSON.stringify(ld)}</script>\n`;

  const css = `<style id="clp-css">
.clp{margin:18px 0 0;font-family:var(--fb,Barlow,system-ui,sans-serif)${c.accent ? `;--clw-acc:${c.accent}` : ""}}
.clp .eyebrow{margin-bottom:6px}
.clp h1{font-size:clamp(26px,3.4vw,38px);margin:0 0 6px}
.clp-lead{font-size:16px;line-height:1.5;color:var(--tx,#b8cdd4);margin:0;max-width:60ch}.clp-lead b{color:var(--th,#e4f0f4)}
.clp-top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.clp-links{font-family:var(--fm,ui-monospace,monospace);font-size:11px;color:var(--dim,#5a7880);letter-spacing:.5px}.clp-links a{color:var(--ac,#00ccf5);text-decoration:none}.clp-links a:hover{text-decoration:underline}
.clp-static table{width:100%;border-collapse:collapse;font-family:var(--fm,ui-monospace,monospace);font-size:12.5px}.clp-static th{text-align:left;font-size:9.5px;letter-spacing:1.5px;text-transform:uppercase;color:var(--dim,#5a7880);padding:8px 10px;border-bottom:1px solid var(--bd2,rgba(255,255,255,.12))}.clp-static td{padding:7px 10px;border-bottom:1px solid var(--bd,rgba(255,255,255,.07))}.clp-static td.n{color:var(--ac,#00ccf5);font-weight:700}.clp-static a{color:var(--th,#e4f0f4)}.clp-static .clw-sum{position:static}
.clp-static .clw-sum{border:1px solid var(--bd2,rgba(255,255,255,.12));border-left:3px solid var(--clw-acc,var(--gd,#f5c800));border-radius:3px;padding:12px 16px;margin:14px 0 12px;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;font-family:var(--fm,ui-monospace,monospace)}
.clp-static .clw-go{display:inline-flex;align-items:center;gap:7px;font-family:var(--fm,ui-monospace,monospace);font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:11px 16px;border-radius:2px;background:var(--gd,#f5c800);color:#000!important;text-decoration:none;white-space:nowrap}
.clp-static .clw-k{font-size:9.5px;letter-spacing:2px;text-transform:uppercase;color:var(--dim,#5a7880);display:block;margin-bottom:4px}.clp-static .clw-n{font-size:24px;font-weight:700;color:var(--th,#e4f0f4)}
details.clp-how{margin:16px 0 0;border:1px solid var(--bd,rgba(255,255,255,.07));border-radius:3px;background:var(--p1,#0c1017)}
details.clp-how>summary{cursor:pointer;list-style:none;display:flex;align-items:center;min-height:44px;padding:10px 16px;font-family:var(--fd,'Barlow Condensed',sans-serif);font-weight:700;font-size:14px;letter-spacing:1.2px;text-transform:uppercase;color:var(--th,#e4f0f4)}
details.clp-how>summary::-webkit-details-marker{display:none}details.clp-how>summary::after{content:"▸";margin-left:8px;color:var(--gd,#f5c800);transition:transform .15s}details.clp-how[open]>summary::after{transform:rotate(90deg)}
details.clp-how>div{padding:4px 16px 16px;border-top:1px solid var(--bd,rgba(255,255,255,.07));font-size:13px;line-height:1.6;color:var(--tx,#b8cdd4)}details.clp-how p{margin:10px 0 0;max-width:78ch}details.clp-how b{color:var(--th,#e4f0f4)}details.clp-how a{color:var(--ac,#00ccf5)}
.clp-fine{font-size:11px;line-height:1.55;color:var(--dim,#5a7880);margin:14px 0 0;max-width:90ch}.clp-fine a{color:var(--dim,#5a7880)}
@media(max-width:760px){.clp{margin-top:12px}.clp-lead{font-size:15px}}
</style>`;

  const topUrl = assertClean(ebaySearchUrl({ q: c.singlesQ, customid: `${c.customid}-top`, sacat: c.sacat }));
  const rowsHtml = groups.map((g) => g.cards.map((x) => {
    const n = String(x.n), k = n.toUpperCase(), href = pages[k], nm = nameOf(x);
    if (!nm) throw new Error(`${c.setFile}: ${g.key || g.title} #${n} has no name`);
    // the row search: Bowman "<set> <player> <num>[ auto]"; Pokémon the index page's own "<name> <num>/<printed> <EXCL>"
    const q = c.poke ? `${nm} ${n}${printed ? "/" + printed : ""} ${EXCL}` : `${setName} ${nm} ${n}${/auto/i.test(g.kind || g.title || "") ? " auto" : ""}`;
    const link = href ? `<a href="${href}">${esc(nm)}</a>` : esc(nm);
    const open = href ? `<a href="${href}">Chart</a>` : `<a href="${assertClean(ebaySearchUrl({ q, customid: c.customid, sacat: c.sacat }))}" target="_blank" rel="noopener sponsored">eBay</a>`;
    return `<tr><td class="n">${esc(n)}</td><td>${link}${x.first ? ' <small>1ST</small>' : ""}</td><td>${esc(hasTeam ? (x.team || "") : (x.rarity || g.title))}</td>${hasTeam ? `<td>${esc(g.title)}</td>` : ""}<td>${open}</td></tr>`;
  }).join("\n")).join("\n");

  const body = `${nav}

<!-- SIGNUP:START — email capture under the buy strip. Generated by tools/build-signup.mjs; rendered by /js/signup.js. Do not hand-edit. -->
<div class="sch-signup" data-signup="${c.slug}" data-variant="tape"></div>
<script src="/js/signup.js?v=3" defer></script>
<!-- SIGNUP:END -->

<div class="wrap">
<div class="crumb" style="padding:14px 0 0;">RESEARCH / <a href="/indices" style="color:var(--dim);">SET INDICES</a> / <a href="${c.indexHref}" style="color:var(--dim);">${esc(c.crumb)}</a> / <b>CHECKLIST</b></div>
${css}
<section class="clp" id="checklist">
  <div class="clp-top">
    <div>
      <div class="eyebrow">▮ Checklist · ${esc(c.family)}</div>
      <h1>${esc(c.name)} checklist</h1>
      <p class="clp-lead">Tick the cards you have. We&rsquo;ll estimate what the stack is worth from recent sales.</p>
    </div>
    <div class="clp-links"><a href="${c.indexHref}">${esc(c.ticker)} index &rarr;</a> &nbsp;·&nbsp; <a href="/watchlist">Your Vault &rarr;</a></div>
  </div>
<!-- CHECKLIST:START — generated by tools/build-checklist-page.mjs from data/sets/${c.setFile}.json (checklist as published ${esc(data.asof || "")}). The static table is the crawlable copy; /js/checklist-sheet.js replaces it with the worksheet and loads marks live from /data/indices.json. Do not hand-edit. -->
<div class="clp-static" data-checklist-sheet="/data/sets/${c.setFile}.json" data-ticker="${c.ticker}" data-cat="${c.cat}" data-customid="${c.customid}" data-sacat="${c.sacat}" data-top-url="${topUrl}"${fs.existsSync(path.join(ROOT, `data/cards/g-${c.ticker.toLowerCase()}.json`)) ? ` data-grades="/data/cards/g-${c.ticker.toLowerCase()}.json"` : ""} data-card-pages="${esc(JSON.stringify(pages))}">
  <div class="clw-sum"><div><span class="clw-k">You have</span><span class="clw-n">0 of ${total}</span></div><div><span class="clw-k">Estimated value</span><span style="color:var(--dim,#5a7880)">Tick the cards you have &mdash; needs JavaScript</span></div><a class="clw-go" href="${topUrl}" target="_blank" rel="noopener sponsored">Shop ${esc(setName)} singles on eBay &rarr;</a></div>
  <table><thead><tr><th>#</th><th>Card</th><th>${col3}</th>${hasTeam ? "<th>Section</th>" : ""}<th>Open</th></tr></thead><tbody>
${rowsHtml}
  </tbody></table>
</div>
<!-- CHECKLIST:END -->
  <details class="clp-how" id="checklist-method"><summary>How the estimate works</summary><div>
    <p><b>The count</b> is simply the rows you tick as Have, out of the ${total} cards on this sheet (${esc(c.scopeNote)}).</p>
    <p><b>The value is a range on purpose.</b> Each card&rsquo;s number is our latest <b>recent-sales mark</b> for the grade you picked &mdash; the median of dated eBay sales, the same figure the <a href="${c.indexHref}">${esc(c.ticker)} index page</a> shows, refreshed ${esc(c.refresh || "every week")}. We add those up for your Have rows (times quantity) and show <b>10% under to 10% over</b> that sum, with the date of the newest sale in it. Cards with no recent sales &mdash; or no recent sales in the grade you picked &mdash; say so and are left out, and the bar tells you how many were left out. Nothing here is an appraisal or an offer.${c.markNote ? " " + esc(c.markNote) : ""}</p>
    <p><b>Saved on this device.</b> Ticks live in your browser (no account). Have also puts the card in <a href="/watchlist">your Vault</a> as My cards and Want as Hunting, so the two agree; untick and it leaves. <b>Export CSV</b> keeps a copy; <b>Import CSV</b> brings it back on another device or browser &mdash; it adds to what is ticked here and never clears anything. <b>Still need</b> lists every card you have not ticked, each with its eBay search.</p>
    <p><a href="/how-prices-work">How prices work &rarr;</a></p>
  </div></details>
  <p class="clp-fine">Affiliate links &mdash; ShopCardHub earns an eBay Partner Network commission on qualifying purchases at no extra cost to you. Every eBay button here is a search, not a price. Checklist as published ${esc(data.asof || "")} &middot; ${esc(data.source || "")}. <a href="/affiliate-disclosure">Disclosure</a>${c.guideHref ? ` &middot; <a href="${c.guideHref}">${esc(c.guideLabel || c.name + " release guide")} &rarr;</a>` : ""}</p>
</section>
</div>

<script src="/js/vault-track.js?v=6" defer></script>
<script src="/js/checklist-sheet.js?v=3" defer></script>
</body></html>
`;
  const html = head + "</head><body>\n" + body;
  return { html, total, pageN };
}

let stale = 0;
for (const [key, c] of Object.entries(CONFIG)) {
  if (ONLY && ONLY !== key) continue;
  const { html, total, pageN } = build(key, c);
  const out = path.join(ROOT, c.slug + ".html");
  const before = fs.existsSync(out) ? fs.readFileSync(out, "utf8") : null;
  const changed = before !== html;
  if (CHECK) { if (changed) { stale++; console.log(`${key}: /${c.slug} is stale`); } else console.log(`${key}: /${c.slug} up to date`); continue; }
  if (!DRY && changed) fs.writeFileSync(out, html);
  console.log(`${key}: ${changed ? (DRY ? "would write" : "wrote") : "unchanged"} /${c.slug} — ${total} rows, ${pageN} with a card page`);
}
if (CHECK && stale) process.exit(1);
