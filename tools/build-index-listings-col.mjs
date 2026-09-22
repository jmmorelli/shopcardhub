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
// Junk shapes seen in the live result sets on 2026-09-22: credit-card skins, metal
// novelty cards, "art display piece", DIY fan art, proxy sets, stickers.
// "art" itself is NOT excluded — "Full Art" is the card.
const EXCL = "-lot -case -proxy -proxies -reprint -digital -custom -diy -skin -metal -display -sticker";

const idx = JSON.parse(fs.readFileSync(path.join(REPO, "data/indices.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = 'td.lst{white-space:nowrap;text-align:right;}a.ebay{font-family:var(--fm);font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--dim);text-decoration:none;}a.ebay:hover{color:var(--iac);}';
const FP_STYLE = 'font-family:var(--fm);font-size:9px;color:var(--dim);margin-top:4px;';
const FINEPRINT = `<div style="${FP_STYLE}">Listings links go to eBay (affiliate). Rows marked &#10003; are filtered to eBay&rsquo;s Authenticity Guarantee &mdash; eBay&rsquo;s program, not ours, offered on singles over $200 (filter verified 09/22/26).</div>`;

let total = 0, avTotal = 0;
const report = [];

for (const tk of POKE) {
  const ix = idx[tk];
  if (!ix) throw new Error(`${tk}: not in indices.json`);
  const file = path.join(REPO, ix.page.replace(/^\//, "") + ".html");
  let html = fs.readFileSync(file, "utf8");
  const byNum = new Map(ix.basket.map((b) => [String(b.num), b]));
  const slug = tk.toLowerCase();
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
    const td = `<td class="lst"><a class="ebay" data-cid="${cid}"${useAv ? ' data-av="1" title="Authenticity Guarantee listings on eBay"' : ""}`
      + ` href="${esc(url)}" target="_blank" rel="noopener sponsored" onclick="event.stopPropagation()">Listings ${useAv ? "&#10003;" : "&rarr;"}</a></td>`;
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
  if (!/a\.ebay\s*\{/.test(html)) html = html.replace("</style>", CSS + "</style>");
  if (av && !html.includes("Authenticity Guarantee &mdash; eBay")) {
    const stamp = /(<div style="font-family:var\(--fm\)[^"]*">\*Holdings as of[\s\S]*?<\/div>)/;
    if (!stamp.test(html)) throw new Error(`${tk}: holdings stamp not found for the fine print`);
    html = html.replace(stamp, `$1${FINEPRINT}`);
  }

  if (!DRY) fs.writeFileSync(file, html);
  total += n; avTotal += av;
  report.push(`${tk}: ${n} links (${av} AG) -> ${path.basename(file)}`);
}

report.forEach((r) => console.log(r));
console.log(`${DRY ? "(dry run — nothing written) " : ""}total ${total} per-card links, ${avTotal} Authenticity-Guarantee filtered`);
