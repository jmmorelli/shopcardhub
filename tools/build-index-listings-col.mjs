#!/usr/bin/env node
// build-index-listings-col.mjs — the per-card "Listings" column on the Pokemon set indices.
// Idea #36 (Earnings Ideas Desk, 2026-09-22), shipped same day on Mo's go-ahead.
//
// WHAT AND WHY. Until today the six Pokemon index pages carried ZERO eBay links inside
// the holdings table — 289 priced rows, ~$13.7k of basket, and the only per-card link was
// two taps deep in the row popup, where every card on a page also shared ONE custom ID
// (pris25-index). So a click on the $1,250 Umbreon and a click on the $0.94 Atticus were
// indistinguishable in EPN, and most visitors never found either. bowman-chrome-2026-index
// has had this column since it shipped. This ports it, with a per-card custom ID
// (<ticker>-<num>) so the read is per constituent.
//
// THE QUERY, and the one thing that is easy to get wrong: the card number is used EXACTLY
// as the page prints it, zero padding and all. Verified on eBay 2026-09-22 (Browser 2):
//   "Mega Charizard X ex 125/094"  -> 753 results, the right card first
//   "Mega Charizard X ex 125/94"   ->   8 results
// js/card-img.js normalises 0-padding away for its Browse API matching; doing the same
// here would have cut this page's reach by ~99%. Do not "tidy" the number.
//
// $200+ rows get eBay's Authenticity Guarantee filter (LH_AV=1, idea #33's variant).
// Checked before shipping, same session: Umbreon 161/131 = 329 results plain, 145 under
// LH_AV — the filter has a real book here, unlike the Holliday PSA 10 query that went
// 1 -> 0 and kept #33 off that page. Those rows are labelled and the table carries one
// line of fine print naming the program as eBay's.
//
// IDEMPOTENT: re-run it after a re-mark or a universe change; it replaces its own column
// rather than appending a second one. It does not touch a price, a weight, a level or a
// stamp — only the link cells, the CARDS popup URLs, one <th>, the TOTAL row's cell count
// and its own CSS.
//
// Usage: node tools/build-index-listings-col.mjs [--dry]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ebaySearchUrl, withCustomId, assertClean, SACAT_TCG } from "./lib/epn.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const POKE = ["PB26", "CR26", "AH26", "PRIS25", "DR25", "PF25"];
const AV_FLOOR = 200;
const AUC_TOP = 5;        // live-auction "Bid" button on each index's five most valuable cards (Sep 25 2026, Mo: "did you do that to all of the pages?")
const DESK_EXCL = "-psa -bgs -cgc -graded -lot -proxy -custom -digital";
// Junk shapes seen in the live result sets on 2026-09-22: credit-card skins, metal
// novelty cards, "art display piece", DIY fan art, proxy sets, stickers.
// "art" itself is NOT excluded — "Full Art" is the card.
const EXCL = "-lot -case -proxy -proxies -reprint -digital -custom -diy -skin -metal -display -sticker";

const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = 'td.lst{white-space:nowrap;text-align:right;}td.lst .act-w{display:inline-grid;grid-template-columns:minmax(150px,max-content) 176px;gap:6px;align-items:center;justify-items:stretch;}.sidx-auc-slot a.auc{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}a.ebay{display:inline-block;text-align:center;font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--gd);padding:6px 11px;border-radius:2px;text-decoration:none;}a.ebay:hover{filter:brightness(1.1);color:#000;}.sidx-auc-slot{display:block;min-width:0;overflow:hidden;}.sidx-auc-slot a.auc{display:inline-block;max-width:100%;box-sizing:border-box;vertical-align:middle;font-family:var(--fd);font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--th);background:var(--p2);border:1px solid var(--gd);padding:5px 10px;border-radius:2px;text-decoration:none;}.sidx-auc-slot a.auc small{font-family:var(--fm);font-weight:400;letter-spacing:0;text-transform:none;color:var(--dim);margin-left:6px;font-size:10px;}.sidx-auc-slot a.auc:hover{background:var(--gd);color:#000;}.sidx-auc-slot a.auc:hover small{color:#000;}@media(max-width:700px){td.lst .act-w{grid-template-columns:minmax(96px,max-content) 92px;}.sidx-auc-slot a.auc small{display:none;}}';
const FP_STYLE = 'font-family:var(--fm);font-size:9px;color:var(--dim);margin-top:4px;';
const FINEPRINT = `<div style="${FP_STYLE}">Listings links go to eBay (affiliate). Rows marked &#10003; are filtered to eBay&rsquo;s Authenticity Guarantee &mdash; eBay&rsquo;s program, not ours, offered on singles over $200 (filter verified 09/22/26).</div>`;

let total = 0, avTotal = 0;
const report = [];
// data/auction-desk.json — desk-only cards /api/auctions searches for live auctions (never marked, R20). This
// generator owns every entry whose index is one of POKE: it rewrites them each run from the current top-N, so a
// re-mark that changes the top five changes the desk with it. Entries for other indices (TH26 …) are left alone.
const DESK_PATH = path.join(REPO, "data/auction-desk.json");
const desk = JSON.parse(fs.readFileSync(DESK_PATH, "utf8"));
desk.cards = (desk.cards || []).filter((c) => !POKE.includes(c.index));
const SETNAME = { PB26: "Pitch Black", CR26: "Chaos Rising", AH26: "Ascended Heroes", PRIS25: "Prismatic Evolutions", DR25: "Destined Rivals", PF25: "Phantasmal Flames" };
const STOP = new Set(["mega", "ex", "sir", "team", "rocket's", "rockets", "cynthia's", "ethan's", "misty's", "arven's", "marnie's", "steven's", "lillie's", "n's", "iono's", "the", "of"]);
const mustToken = (name) => { const w = String(name).toLowerCase().replace(/[^a-z0-9' ]/g, " ").split(/\s+/).filter((t) => t && !STOP.has(t)); return (w.sort((a, b) => b.length - a.length)[0] || String(name).toLowerCase().split(" ")[0]); };

for (const tk of POKE) {
  const ix = idx[tk];
  if (!ix) throw new Error(`${tk}: not in indices.json`);
  const file = path.join(REPO, ix.page.replace(/^\//, "") + ".html");
  let html = fs.readFileSync(file, "utf8");
  const byNum = new Map(ix.basket.map((b) => [String(b.num), b]));
  const slug = tk.toLowerCase();
  const aucNums = new Set(ix.basket.filter((b) => b.price != null).sort((a, b) => b.price - a.price).slice(0, AUC_TOP).map((b) => String(b.num)));
  const urlByNum = new Map();
  let n = 0, av = 0;

  // ---- 1. rows -------------------------------------------------------------
  const rowRe = /<tr class="hrow" data-i="\d+"[^>]*>[\s\S]*?<\/tr>/g;
  const rows = [...html.matchAll(rowRe)];
  if (rows.length !== ix.basket.length) throw new Error(`${tk}: ${rows.length} rows vs ${ix.basket.length} basket cards`);
  html = html.replace(rowRe, (blk) => {
    const cnM = blk.match(/<span class="cn">#([^<]+)<\/span>/);
    if (!cnM) throw new Error(`${tk}: row without a card number`);
    const cn = cnM[1].trim();                    // "161/131" — printed form, padding kept
    const num = cn.split("/")[0];
    const b = byNum.get(num);
    if (!b) throw new Error(`${tk}: page row #${cn} not in basket`);
    const useAv = b.price >= AV_FLOOR;
    const cid = `${slug}-${num}`;
    const url = assertClean(ebaySearchUrl({
      q: `${b.name} ${cn} ${EXCL}`, customid: cid, sacat: SACAT_TCG, av: useAv,
    }));
    urlByNum.set(num, url);
    n++; if (useAv) av++;
    let slot = '<span class="sidx-auc-slot"></span>';   // empty slot keeps the Listings button in one column on every row
    if (aucNums.has(num)) {
      const deskId = `${slug}-${num}`;
      desk.cards.push({ id: deskId, index: tk, name: b.name, num: String(b.num), label: `${b.name} #${cn} — ${SETNAME[tk] || tk}`, query: `${b.name} ${cn} ${DESK_EXCL}`, titleMust: [mustToken(b.name), num], cardType: "tcg-single", categoryIds: "183454" });
      slot = `<span class="sidx-auc-slot" data-auc-card="${deskId}" data-auc-tk="${slug}"></span>`;
    }
    const td = `<td class="lst"><span class="act-w"><a class="ebay" data-cid="${cid}"${useAv ? ' data-av="1" title="Authenticity Guarantee listings on eBay"' : ""}`
      + ` href="${esc(url)}" target="_blank" rel="noopener sponsored" onclick="event.stopPropagation()">Listings ${useAv ? "&#10003;" : "&rarr;"}</a>${slot}</span></td>`;
    return blk.replace(/<td class="lst">[\s\S]*?<\/td>/, "").replace(/<\/tr>$/, td + "</tr>");
  });

  // ---- 2. header + TOTAL row cell count ------------------------------------
  if (!/<th>eBay<\/th>/.test(html)) {
    const thRe = /<th>(?:&#9733;|★)<\/th>/;
    if (!thRe.test(html)) throw new Error(`${tk}: star <th> not found`);
    html = html.replace(thRe, (m) => m + "<th>eBay</th>");
    html = html.replace(/<tr class="sumrow">[\s\S]*?<\/tr>/g, (r) =>
      (r.match(/<td[ >]/g) || []).length === 8 ? r.replace(/<\/tr>$/, "<td></td></tr>") : r);
  }

  // ---- 3. the popup array gets the same URL and the same per-card ID --------
  const cm = html.match(/var CARDS = (\[[\s\S]*?\]);\n/);
  if (!cm) throw new Error(`${tk}: CARDS array not found`);
  const cards = JSON.parse(cm[1]);
  for (const c of cards) {
    const num = (String(c.num).match(/#?(\w+)\//) || [])[1];
    const url = urlByNum.get(num);
    if (!url) throw new Error(`${tk}: CARDS entry ${c.num} has no row URL`);
    c.ebay = url;
  }
  html = html.replace(cm[0], `var CARDS = ${JSON.stringify(cards)};\n`);

  // ---- 4. CSS + fine print --------------------------------------------------
  // CSS: replace our own block if present (it starts with td.lst{ and ends at a.ebay:hover / the auc rules), else add it
  if (/td\.lst\{white-space:nowrap;text-align:right;\}/.test(html)) html = html.replace(/td\.lst\{white-space:nowrap;text-align:right;\}[^\n<]*?(?=<\/style>|\n)/, CSS);
  else html = html.replace("</style>", CSS + "</style>");
  if (!html.includes('src="/js/sector-auctions.js')) html = html.replace("</body>", '<script src="/js/sector-auctions.js?v=3" defer></script>\n</body>');
  if (av && !html.includes("Authenticity Guarantee &mdash; eBay")) {
    const stamp = /(<div style="font-family:var\(--fm\)[^"]*">\*Holdings as of[\s\S]*?<\/div>)/;
    if (!stamp.test(html)) throw new Error(`${tk}: holdings stamp not found for the fine print`);
    html = html.replace(stamp, `$1${FINEPRINT}`);
  }

  if (!DRY) fs.writeFileSync(file, html);
  total += n; avTotal += av;
  report.push(`${tk}: ${n} links (${av} AG) -> ${path.basename(file)}`);
}

if (!DRY) fs.writeFileSync(DESK_PATH, JSON.stringify(desk, null, 2) + "\n");
report.forEach((r) => console.log(r));
console.log(`auction desk: ${desk.cards.filter((c) => POKE.includes(c.index)).length} Pokémon-index cards (top ${AUC_TOP} per index) → data/auction-desk.json`);
console.log(`${DRY ? "(dry run — nothing written) " : ""}total ${total} per-card links, ${avTotal} Authenticity-Guarantee filtered`);
