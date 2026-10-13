#!/usr/bin/env node
/* merge-links.mjs — the R35 merge step for the ten baseball pages folded into /mlb-cards (Oct 13 2026).
 * Idempotent. Run from the repo root AFTER tools/build-mlb-cards.mjs and BEFORE build-card-pages / build-buy-strip /
 * build-nav / build-rail / build-auctions:
 *   1. deletes the ten merged pages (301s live in vercel.json);
 *   2. rewrites every internal href to them → /mlb-cards#<player> on the remaining pages;
 *   3. drops them from sitemap.xml and adds /mlb-cards (lastmod = the day the page shipped);
 *   4. empties the Bowman Bangers CARD_HREF map (Holliday / Arquette chart pages are /card-<id> again).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MERGED = {
  "shohei-ohtani-cards": "shohei-ohtani",
  "munetaka-murakami-rookie-cards": "munetaka-murakami",
  "aiva-arquette-1st-bowman": "aiva-arquette",
  "ethan-holliday-rookie-cards": "ethan-holliday",
  "roman-anthony-rookie-cards": "roman-anthony",
  "jacob-misiorowski-rookie-cards": "jacob-misiorowski",
  "pete-crow-armstrong-cards": "pete-crow-armstrong",
  "adley-rutschman-cards": "adley-rutschman",
  "chase-delauter-rookie-cards": "chase-delauter",
  "best-baseball-cards-under-50": "",
};
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const dest = (a) => "/mlb-cards" + (a ? "#" + a : "");

let removed = 0, files = 0, refs = 0;
for (const slug of Object.keys(MERGED)) {
  const f = path.join(REPO, slug + ".html");
  if (fs.existsSync(f)) { fs.unlinkSync(f); removed++; }
}
for (const f of fs.readdirSync(REPO).filter((x) => x.endsWith(".html"))) {
  const p = path.join(REPO, f);
  let s = fs.readFileSync(p, "utf8"); const o = s;
  for (const [old, a] of Object.entries(MERGED)) {
    s = s.replace(new RegExp(`(href=")/${esc(old)}(#[^"]*)?"`, "g"), (m) => { refs++; return `href="${dest(a)}"`; });
    s = s.replace(new RegExp(`https://www\\.shopcardhub\\.com/${esc(old)}(?=["\\s<#])`, "g"), () => { refs++; return "https://www.shopcardhub.com" + dest(a); });
  }
  if (f === "bowman-bangers.html") {
    s = s.replace(
      "  /* B38 (Night Crew, Oct 8): two chart slugs 308-redirect (vercel.json) to their player pages; link there directly */\n  var CARD_HREF = { 'ethan-holliday': '/ethan-holliday-rookie-cards', 'aiva-arquette': '/aiva-arquette-1st-bowman' };",
      "  /* Oct 13 2026: the Holliday / Arquette player pages merged into /mlb-cards; their chart pages are /card-<id> again */\n  var CARD_HREF = {};"
    );
  }
  if (s !== o) { fs.writeFileSync(p, s); files++; }
}
const smP = path.join(REPO, "sitemap.xml");
let sm = fs.readFileSync(smP, "utf8"); const smO = sm;
for (const old of Object.keys(MERGED)) sm = sm.replace(new RegExp(`\\s*<url>\\s*<loc>https://www\\.shopcardhub\\.com/${esc(old)}</loc>[\\s\\S]*?</url>`), "");
if (!sm.includes("/mlb-cards</loc>")) sm = sm.replace("</urlset>", "  <url>\n    <loc>https://www.shopcardhub.com/mlb-cards</loc>\n    <lastmod>2026-10-14</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.9</priority>\n  </url>\n</urlset>");
if (sm !== smO) fs.writeFileSync(smP, sm);
console.log(`merge-links: ${removed} page(s) removed, ${refs} href(s) rewritten on ${files} page(s), sitemap ${sm === smO ? "unchanged" : "updated"} (${(sm.match(/<loc>/g) || []).length} URLs)`);
