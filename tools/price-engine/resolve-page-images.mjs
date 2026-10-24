// Resolve page-level card photos once, server-side (Sep 1 2026).
//
// Pages carry <span data-card-img="ph:…|name:…" data-card-name="…" data-card-sub="pokemon"> markers.
// js/card-img.js can look those up per visitor through /api/comps, but a set index has 60+ rows —
// that is 60 eBay calls per new visitor. This script does the same lookup ONCE, with the same rules
// as card-img.js byName(), and stores the result in data/card-images.json under the marker's key,
// so the page paints from the map with zero API calls. Re-run whenever a list page changes.
//
// Usage: node tools/price-engine/resolve-page-images.mjs [page.html …]   (default: all *.html)
// Env: SITE_URL (default https://www.shopcardhub.com) · FORCE=<regex> re-resolves matching keys inside the 14-day cache
// Cloud runs: NODE_USE_ENV_PROXY=1 NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt
// Oct 14 2026 (Photo Keeper): an entry carrying "official": true is a hand-set official scan (images.pokemontcg.io /
// images.scrydex.com) for a key the listing search cannot place; the resolver never overwrites it.

import fs from "node:fs";
import path from "node:path";

const SITE = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const OUT = "data/card-images.json";
const TCG = "183454"; // eBay: Collectible Card Games > CCG Individual Cards
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FORCE = process.env.FORCE ? new RegExp(process.env.FORCE, "i") : null;
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(".").filter((f) => f.endsWith(".html"));

const out = (() => { try { return JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { return { cards: {} }; } })();
out.cards = out.cards || {};
const unesc = (s) => s.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const RARITY = /\b(IR|SIR|UR|HR|AR|SAR|DR|ACE|RR|SR)\b/g; // rarity codes are ours, not sellers' — they break eBay's AND search
const normNum = (s) => s.replace(/\b0*(\d+)\/0*(\d+)\b/g, "$1/$2"); // 090/084 and 90/84 are the same card
function pick(listings, q) {
  const num = (normNum(q).match(/\b\d{1,3}\/\d{1,3}\b/) || [])[0];
  // Sep 30 2026 (Photo Keeper): an eBay exclusion in the key ("… Celebrations -japanese", the classic-set imgKey) is a
  // negative term, not a word the title must contain — as a required token it failed every listing (7 CEL21 rows never resolved).
  const words = q.toLowerCase().replace(RARITY, "").split(" ");
  const negs = words.filter((t) => /^-[a-z]{3,}$/.test(t)).map((t) => t.slice(1));
  const toks = words.filter((t) => t.length > 2 && !t.startsWith("-") && !/[#\d]/.test(t)).slice(0, num ? 2 : 4);
  const bareTok = words.find((t) => /^(?:#?\d{1,3}[a-z]?|swsh\d{1,3}|svp?\d{1,3})$/.test(t) && !/^(19|20)\d\d$/.test(t));
  const bare = bareTok ? new RegExp("(^|[^a-z0-9])#?0*" + bareTok.replace(/^#/, "").replace(/^0+(?=\d)/, "") + "(?![a-z0-9])") : null;
  let best = null;
  for (const l of listings) {
    const t = normNum(String(l.title || "").toLowerCase());
    if (!l.image || !/^https:\/\/i\.ebayimg\.com\//.test(l.image)) continue;
    if (num && !t.includes(num)) continue;
    // Oct 21 2026 (Photo Keeper): a bare card number ("Pikachu 40 Pokemon 30th Celebration", "SWSH138") was never required,
    // so a Jangmo-o listing that mentioned Pikachu won the 30th Celebration #40 slot. When the key has no n/n number, its
    // bare number (or promo code) must appear in the title as a whole token.
    if (!num && bare && !bare.test(t)) continue;
    // AR / SAR / CHR / CSR are the Japanese rarity names (English prints say IR / SIR); no Pokémon key of ours uses them.
    if (/\bpokemon\b/.test(q.toLowerCase()) && /\b(ar|sar|chr|csr|art rare|special art rare)\b/.test(t)) continue;
    if (/\bsv2a\b|pok[eé]mon card 151/.test(t)) continue; // "Pokémon Card 151" is the Japanese set's own name
    if (/code card|\+ code\b/.test(t)) continue; // photographed with a code card / bundle, not the single // the Japanese 151 set code — same /165 numbering as English 151
    if (!toks.every((k) => t.includes(k))) continue;
    if (negs.some((k) => t.includes(k))) continue;
    // Oct 14 2026 (Photo Keeper): "Bowman Chrome" is a product, not two words. "2026 BOWMAN BASEBALL HOBBY BOX w/Chrome"
    // (paper Bowman, photographed in a shipping carton) sat on the Bowman Chrome guide hero for two weeks.
    if (/\bbowman chrome\b/.test(q.toLowerCase()) && !/\bbowman(?:®|™)? chrome\b/.test(t)) continue;
    // Oct 21 2026 (Photo Keeper): every set we index is the English print. Japanese 151 (SV2a) shares the /165 numbering,
    // so "Nidoking 174/165 Pokemon 151" resolved to the Japanese card. A foreign-language listing is skipped unless the
    // key asks for that language.
    if (!/\b(japanese|japan|korean|chinese)\b/.test(q.toLowerCase().replace(/(^|\s)-\S+/g, " ")) && /\b(japanese|japan|jpn|jp|korean|chinese|s-chinese|t-chinese|thai|indonesian)\b/.test(t)) continue;
    // A redemption card is a voucher, not the card (the BCB26 hero resolved to a CPA-LH redemption on Oct 14).
    if (/redemption|\bredemp\b/.test(t)) continue;
    // Sep 13 2026 (Mo: a DR25 hero was a card CASE, not the card): accessories and
    // display products never picture the card; graded slabs are allowed but a raw
    // listing wins when one exists (the loop keeps the first raw fixed-price hit).
    if (/(lot of|reprint|digital|custom|proxy|you pick|choose|\bcase\b|cases|frame|display|magnetic|toploader|top loader|sleeve|binder|stand|holder|acrylic|protector|playmat|deck box|storage)/.test(t)) continue;
    // fp/px (Oct 23 2026): the "vs sold mark" chip on index rows used to re-read this listing live per visitor; now it
    // prints from the map, so the pick carries whether it is Buy It Now and its price + shipping.
    const hit = { url: l.image.replace(/s-l\d+\./, "s-l500."), item: l.url || null, title: l.title || null,
      fp: l.buyingOption === "FIXED_PRICE", px: (typeof l.price === "number" && l.price > 0) ? l.price + (typeof l.shipping === "number" ? l.shipping : 0) : null };
    if (/(psa|bgs|cgc|sgc|graded|slab)\b/.test(t)) { if (!best) best = hit; continue; }
    best = hit;
    if (l.buyingOption === "FIXED_PRICE") break;
  }
  return best;
}

const seen = new Set();
let ok = 0, miss = 0, cached = 0;
// Oct 21 2026 (Photo Keeper): /card?id= pages are built by js/card-page.js from data/cards/<tk>.json, whose `img`
// name: keys reached the map only per visitor (725 keys across the modern chase/set files). Passing a card file
// (node … data/cards/dr25.json) resolves those keys the same way as a page marker (Pokémon category, same pick()).
const asMarkers = (f) => {
  const d = JSON.parse(fs.readFileSync(f, "utf8"));
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return (d.cards || []).filter((c) => c && typeof c.img === "string" && c.img.startsWith("name:"))
    .map((c) => '<span data-card-img="' + esc(c.img) + '" data-card-sub="pokemon">').join("\n");
};
for (const f of files) {
  const html = f.endsWith(".json") ? asMarkers(f) : fs.readFileSync(f, "utf8");
  const re = /<span[^>]*data-card-img="((?:ph|name):[^"]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(html))) {
    const tag = m[0];
    const key = unesc(m[1]);
    if (seen.has(key)) continue;
    seen.add(key);
    const attr = (n) => { const x = tag.match(new RegExp('data-card-' + n + '="([^"]*)"')); return x ? unesc(x[1]) : ""; };
    const name = key.startsWith("name:") ? key.slice(5) : attr("name");
    if (!name) continue;
    const sub = attr("sub"); const catid = attr("catid") || (/pok[eé]mon|tcg/i.test(sub) ? TCG : "");
    const q = name.replace(/[—–].*$/, "").replace(/#/g, "").replace(RARITY, "").replace(/\s+/g, " ").trim();
    const prev = out.cards[key];
    if (prev && prev.official) { cached++; continue; }
    if (prev && prev.url && prev.d && !(FORCE && FORCE.test(key)) && Date.now() - new Date(prev.d).getTime() < 14 * 864e5) { cached++; continue; }
    try {
      const get = async (qq) => { const r = await fetch(SITE + "/api/comps?q=" + encodeURIComponent(qq) + "&sort=price&limit=30&customid=img-resolver" + (catid ? "&category_ids=" + catid : ""), { headers: { Accept: "application/json", "x-shopcardhub-client": "tool" } }); return r.ok ? r.json() : null; };
      let j = await get(q);
      let best = pick((j && j.listings) || [], q);
      if (!best) { // retry with the number written the way sellers write it (90/84), then without it
        const q2 = normNum(q); if (q2 !== q) { await sleep(400); j = await get(q2); best = pick((j && j.listings) || [], q); }
        if (!best) { const q3 = q.replace(/\b\d{1,3}\/\d{1,3}\b/, "").replace(/\s+/g, " ").trim(); await sleep(400); j = await get(q3); best = pick((j && j.listings) || [], q); }
      }
      // Card-file photos render with data-card-link="off" on /card, so the listing link is never used — not stored (map size).
      // A key an HTML page also carries (index rows repoint their listing link to `item`) keeps its item and its page.
      const shared = f.endsWith(".json") && prev && prev.page && !String(prev.page).endsWith(".json");
      if (best && f.endsWith(".json") && !shared) delete best.item;
      if (best) { out.cards[key] = { ...best, label: name, d: new Date().toISOString().slice(0, 10), page: shared ? prev.page : path.basename(f) }; ok++; console.log("ok  ", f, key.slice(0, 48)); }
      else { miss++; console.log("miss", f, key.slice(0, 48), "(" + ((j && j.count) || 0) + " listings)"); }
    } catch (e) { miss++; console.log("err ", f, key.slice(0, 48), String(e.message || e)); }
    await sleep(500);
  }
}
out.generated = new Date().toISOString();
// R17 (2026-09-23): no raw eBay listing title or listing price is ever written to this public file.
for (const c of Object.values(out.cards || {})) { if (c) { delete c.title; delete c.price; } }
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ok, miss, cached, total: Object.keys(out.cards).length }));
