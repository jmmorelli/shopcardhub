// Resolve page-level card photos once, server-side (Sep 1 2026).
//
// Pages carry <span data-card-img="ph:…|name:…" data-card-name="…" data-card-sub="pokemon"> markers.
// js/card-img.js can look those up per visitor through /api/comps, but a set index has 60+ rows —
// that is 60 eBay calls per new visitor. This script does the same lookup ONCE, with the same rules
// as card-img.js byName(), and stores the result in data/card-images.json under the marker's key,
// so the page paints from the map with zero API calls. Re-run whenever a list page changes.
//
// Usage: node tools/price-engine/resolve-page-images.mjs [page.html …]   (default: all *.html)
// Env: SITE_URL (default https://www.shopcardhub.com)

import fs from "node:fs";
import path from "node:path";

const SITE = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const OUT = "data/card-images.json";
const TCG = "183454"; // eBay: Collectible Card Games > CCG Individual Cards
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const files = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(".").filter((f) => f.endsWith(".html"));

const out = (() => { try { return JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { return { cards: {} }; } })();
out.cards = out.cards || {};
const unesc = (s) => s.replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

const RARITY = /\b(IR|SIR|UR|HR|AR|SAR|DR|ACE|RR|SR)\b/g; // rarity codes are ours, not sellers' — they break eBay's AND search
const normNum = (s) => s.replace(/\b0*(\d+)\/0*(\d+)\b/g, "$1/$2"); // 090/084 and 90/84 are the same card
function pick(listings, q) {
  const num = (normNum(q).match(/\b\d{1,3}\/\d{1,3}\b/) || [])[0];
  const toks = q.toLowerCase().replace(RARITY, "").split(" ").filter((t) => t.length > 2 && !/[#\d]/.test(t)).slice(0, num ? 2 : 4);
  let best = null;
  for (const l of listings) {
    const t = normNum(String(l.title || "").toLowerCase());
    if (!l.image || !/^https:\/\/i\.ebayimg\.com\//.test(l.image)) continue;
    if (num && !t.includes(num)) continue;
    if (!toks.every((k) => t.includes(k))) continue;
    if (/(lot of|reprint|digital|custom|proxy|you pick|choose)/.test(t)) continue;
    best = { url: l.image.replace(/s-l\d+\./, "s-l500."), item: l.url || null, title: l.title || null };
    if (l.buyingOption === "FIXED_PRICE") break;
  }
  return best;
}

const seen = new Set();
let ok = 0, miss = 0, cached = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
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
    if (prev && prev.url && prev.d && Date.now() - new Date(prev.d).getTime() < 14 * 864e5) { cached++; continue; }
    try {
      const get = async (qq) => { const r = await fetch(SITE + "/api/comps?q=" + encodeURIComponent(qq) + "&sort=price&limit=30&customid=img-resolver" + (catid ? "&category_ids=" + catid : ""), { headers: { Accept: "application/json" } }); return r.ok ? r.json() : null; };
      let j = await get(q);
      let best = pick((j && j.listings) || [], q);
      if (!best) { // retry with the number written the way sellers write it (90/84), then without it
        const q2 = normNum(q); if (q2 !== q) { await sleep(400); j = await get(q2); best = pick((j && j.listings) || [], q); }
        if (!best) { const q3 = q.replace(/\b\d{1,3}\/\d{1,3}\b/, "").replace(/\s+/g, " ").trim(); await sleep(400); j = await get(q3); best = pick((j && j.listings) || [], q); }
      }
      if (best) { out.cards[key] = { ...best, label: name, d: new Date().toISOString().slice(0, 10), page: path.basename(f) }; ok++; console.log("ok  ", f, key.slice(0, 48), "->", best.title.slice(0, 60)); }
      else { miss++; console.log("miss", f, key.slice(0, 48), "(" + ((j && j.count) || 0) + " listings)"); }
    } catch (e) { miss++; console.log("err ", f, key.slice(0, 48), String(e.message || e)); }
    await sleep(500);
  }
}
out.generated = new Date().toISOString();
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ok, miss, cached, total: Object.keys(out.cards).length }));
