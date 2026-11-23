#!/usr/bin/env node
// link-index-cards.mjs — BET-20261119-1 (CEO Desk Nov 19 2026; Night Crew Mon Nov 23): on the hand-built chase index pages
// (PB26 / CR26 / AH26 / PRIS25 / DR25 / PF25, re-marked in place by tools/remark-indices.mjs), the card name in each
// holdings row links to its static /card-<slug> page when that page is in sitemap.xml. The row's id is read from its own
// eBay link (data-cid); the URL from js/card-pages.json (tools/build-nav.js). A name already wrapped in a link (Umbreon,
// the Pitch Black set-guide anchors) is left alone; a card with no listed page stays plain text. Idempotent: re-run after
// a new card page lands. No price, eBay link, customid or row order is touched; remark-indices.mjs moves whole row blocks,
// so the link survives a re-mark.
//   node tools/link-index-cards.mjs [--check]   (--check: print what would change, write nothing; exit 1 if anything would)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const TICKERS = ["PB26", "CR26", "AH26", "PRIS25", "DR25", "PF25"];
const IDX = JSON.parse(fs.readFileSync(path.join(ROOT, "data/indices.json"), "utf8"));
const STATIC = JSON.parse(fs.readFileSync(path.join(ROOT, "js/card-pages.json"), "utf8")).static || {};
const SITEMAP = new Set([...fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8").matchAll(/<loc>https:\/\/www\.shopcardhub\.com(\/[^<]*)<\/loc>/g)].map((m) => m[1]));
const rowRe = /<tr class="hrow" data-i="\d+"[^>]*>[\s\S]*?<\/tr>/g;
let total = 0;
for (const tk of TICKERS) {
  const pg = IDX[tk] && IDX[tk].page; if (!pg) { console.warn(`${tk}: no page in indices.json — skipped`); continue; }
  const file = path.join(ROOT, pg.replace(/^\//, "") + ".html");
  const html = fs.readFileSync(file, "utf8");
  let n = 0, have = 0;
  const out = html.replace(rowRe, (blk) => {
    const cid = (blk.match(/data-cid="([^"]+)"/) || [])[1];
    const url = cid && STATIC[cid];
    if (!url || !SITEMAP.has(url)) return blk;
    if (/<div><b><a [^>]*href="\/card-/.test(blk)) { have++; return blk; }
    const m = blk.match(/<div><b>([^<]+)<\/b>( <span class="cn">)/);
    if (!m) return blk;
    n++;
    return blk.replace(m[0], `<div><b><a class="cardlk" href="${url}" style="color:inherit;text-decoration:none;border-bottom:1px dotted var(--iac);" onclick="event.stopPropagation()" title="Raw vs PSA 9 vs PSA 10 vs TAG: the card's own page">${m[1]}</a></b>${m[2]}`);
  });
  console.log(`${tk} ${pg}: ${n} name${n === 1 ? "" : "s"} linked now, ${have} already linked`);
  total += n;
  if (n && !CHECK) fs.writeFileSync(file, out);
}
if (CHECK && total) process.exit(1);
