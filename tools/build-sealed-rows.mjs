#!/usr/bin/env node
// build-sealed-rows.mjs — the SEALED row on every set-index page (Sep 13 2026, Mo:
// "track the box price with a link to eBay on each index page" — Pokémon first).
//
// For every data/watchlist.json card with cardType "sealed" and a `sealedOf`
// ticker, writes a <!-- SEALED:START --> … <!-- SEALED:END --> block into that
// ticker's index page (data/indices.json → page), directly after the
// `.statnote` line under the stats grid. The block is a generated block —
// never hand-edit inside the markers; re-run this tool. Idempotent.
//
// The block is complete at rest (product name, the honest "first mark tonight"
// empty state, the EPN search link with the full mandatory param set) and
// /js/sealed-row.js fills the numbers from the nightly feed in the browser:
// ask mark (labeled asks, thin-flagged under 8 verified asks), verified-ask
// count, 30-day move, and the same 30-day move for the index itself so the two
// sit side by side. No EV is claimed — that needs pull rates we do not publish.
//
// Usage: node tools/build-sealed-rows.mjs [--dry]

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DRY = process.argv.includes("--dry");
const read = (f) => fs.readFileSync(path.join(REPO, f), "utf8");
const watch = JSON.parse(read("data/watchlist.json"));
const indices = JSON.parse(read("data/indices.json"));
// Retail (Amazon) line — Sep 25 2026, Mo: the 30th page's "Retail (Amazon) →" search links extended to every
// Pokémon set-index page, plus a set binder. Search links with the Associates tag; no price is ever shown.
const retail = JSON.parse(read("data/retail-links.json"));
const amz = (q) => "https://www.amazon.com/s?k=" + encodeURIComponent(q).replace(/%20/g, "+") + "&tag=" + retail.tag;
function retailLine(ticker) {
  const r = retail.tickers[ticker]; if (!r) return "";
  const links = r.items.map((it) => `<a href="${esc(amz(r.set + " " + it))}" target="_blank" rel="noopener sponsored nofollow" onclick="if(typeof gtag==='function')gtag('event','retail_click',{item:'${esc(it.toLowerCase().replace(/\s+/g, "-"))}',page:location.pathname})">${esc(it === "Elite Trainer Box" ? "ETB" : it)}</a>`);
  if (retail.binder) links.push(`<a href="${esc(amz(retail.binder.q))}" target="_blank" rel="noopener sponsored nofollow" onclick="if(typeof gtag==='function')gtag('event','retail_click',{item:'binder',page:location.pathname})">${esc(retail.binder.label)}</a>`);
  return `\n  <div class="sr"><span class="srk">Retail (Amazon) →</span> ${links.join(" · ")} <span class="srs">Search links, no price shown. As an Amazon Associate, ShopCardHub earns from qualifying purchases made through these links.</span></div>`;
}

const EPN = "LH_BIN=1&_sacat=183456&mkcid=1&mkrid=711-53200-19255-0&siteid=0&mkevt=1&campid=5339155990&toolid=10001";
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const searchTerms = (c) => c.query.replace(/\s-\S+/g, "").trim(); // the positive words only

function block(c, ticker) {
  const key = c.source + ":" + c.id;
  const product = c.product || "Booster box";
  const cust = ticker.toLowerCase() + "-box";
  const href = "https://www.ebay.com/sch/i.html?_nkw=" + encodeURIComponent(searchTerms(c)).replace(/%20/g, "+") + "&" + EPN + "&customid=" + cust;
  return `<!-- SEALED:START ${key} -->
<style>
.sealed{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 18px;align-items:center;margin:12px 0 0;padding:10px 14px;border:1px solid var(--bd);border-left:2px solid var(--gd);background:var(--p1);font-family:var(--fm);font-size:11px;color:var(--tx);}
.sealed>div{grid-column:1;min-width:0;}
.sealed .sk{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:var(--dim);}
.sealed .sk b{color:var(--gd);font-weight:700;letter-spacing:2px;}
.sealed .sv{font-family:var(--fd);font-size:22px;line-height:1;color:var(--th);margin-top:4px;}
.sealed .sv small{font-family:var(--fm);font-size:10px;color:var(--dim);margin-left:8px;}
.sealed .sc{font-size:10px;color:var(--dim);margin-top:5px;}
.sealed .sc i{font-style:normal;color:var(--tx);}
.sealed .up{color:var(--gn);} .sealed .dn{color:var(--rd);} .sealed .thin{color:var(--gd);}
.sealed .buy{grid-column:2;grid-row:1/4;align-self:center;white-space:nowrap;text-decoration:none;font-family:var(--fm);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#000;background:var(--gd);padding:9px 12px;border-radius:2px;font-weight:700;}
.sealed .buy:hover{filter:brightness(1.08);}
.sealed .sr{grid-column:1/-1;font-size:10.5px;color:var(--dim);margin-top:4px;padding-top:7px;border-top:1px dashed var(--bd);line-height:1.7;}
.sealed .sr .srk{color:var(--gd);font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:9px;margin-right:4px;}
.sealed .sr a{color:var(--tx);text-decoration:underline;text-decoration-color:rgba(255,255,255,.25);}
.sealed .sr a:hover{color:var(--th);}
.sealed .sr .srs{display:block;font-size:9px;letter-spacing:.3px;opacity:.75;}
@media(max-width:560px){.sealed{grid-template-columns:1fr;}.sealed .buy{grid-column:1;grid-row:auto;justify-self:start;}}
</style>
<div class="sealed" data-box-feed="${esc(key)}" data-box-index="${esc(ticker)}" data-box-product="${esc(product)}">
  <div class="sk"><b>Sealed</b> · ${esc(product)} · nightly eBay ask mark · asks, not solds</div>
  <div class="sv"><span class="sealed-price">first mark tonight</span><small class="sealed-sup"></small></div>
  <div class="sc">30D · box <i class="sealed-box30">—</i> · index <i class="sealed-idx30">—</i> <span class="sealed-note"></span></div>
  <a class="buy" href="${esc(href)}" target="_blank" rel="sponsored nofollow noopener">Shop ${esc(product === "Booster box" ? "booster boxes" : "ETBs")} on eBay ↗</a>${retailLine(ticker)}
</div>
<script src="/js/sealed-row.js?v=2" defer></script>
<!-- SEALED:END -->`;
}

const sealed = watch.cards.filter((c) => c.cardType === "sealed" && c.sealedOf);
let changed = 0;
for (const c of sealed) {
  const idx = indices[c.sealedOf];
  if (!idx || !idx.page) { console.error(`${c.id}: no index page for ${c.sealedOf}`); continue; }
  const file = idx.page.replace(/^\//, "") + ".html";
  if (!fs.existsSync(path.join(REPO, file))) { console.error(`${c.id}: ${file} missing`); continue; }
  let html = read(file);
  const out = block(c, c.sealedOf);
  const re = /<!-- SEALED:START [^>]*-->[\s\S]*?<!-- SEALED:END -->/;
  let next;
  if (re.test(html)) next = html.replace(re, out);
  else {
    // insert after the statnote that closes the stats grid
    const m = html.match(/<div class="statnote">[\s\S]*?<\/div>\n/);
    if (!m) { console.error(`${c.id}: no .statnote anchor in ${file}`); continue; }
    const at = m.index + m[0].length;
    next = html.slice(0, at) + out + "\n" + html.slice(at);
  }
  if (next !== html) { changed++; if (!DRY) fs.writeFileSync(path.join(REPO, file), next); }
  console.log(`${DRY ? "would write" : "wrote"} ${file} ← ${c.id} (${c.product})`);
}
console.log(`${changed} page(s) ${DRY ? "would change" : "changed"}`);
