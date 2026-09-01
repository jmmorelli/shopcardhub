// One-shot card image resolver (Sep 1 2026).
//
// The nightly engine now stores a verified listing photo per card in the
// price-data feed. This script does the same thing on demand and writes the
// result into the SITE repo (data/card-images.json) so every page has a photo
// immediately - and keeps one even when the feed is thin for a card.
//
// Same verification as the mark: same query, same title filters, same window.
// Photos are eBay CDN URLs (never copied) shown inside EPN listing links.
//
// Usage: node tools/price-engine/resolve-images.mjs [--watchlist data/watchlist.json] [--out data/card-images.json]
// Env: SITE_URL (default https://shopcardhub.com)

import fs from "node:fs";
import { compsMark } from "./snapshot-free.mjs";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const WATCHLIST = args.watchlist || "data/watchlist.json";
const OUT = args.out || "data/card-images.json";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const wl = JSON.parse(fs.readFileSync(WATCHLIST, "utf8"));
const prev = (() => { try { return JSON.parse(fs.readFileSync(OUT, "utf8")); } catch { return { cards: {} }; } })();
const out = { generated: new Date().toISOString(), _comment: "Verified eBay listing photo per watchlist card. Hot-linked from i.ebayimg.com, shown inside EPN links. Regenerate: node tools/price-engine/resolve-images.mjs", cards: { ...(prev.cards || {}) } };
let ok = 0, miss = 0;
for (const card of (wl.cards || []).filter((c) => c && c.source === "ebay" && c.id && c.query)) {
  const key = card.source + ":" + card.id;
  try {
    const { image, comps } = await compsMark(card.query, card.label, card);
    if (image) { out.cards[key] = { ...image, label: card.label, d: new Date().toISOString().slice(0, 10) }; ok++; console.log("ok  ", key, comps, "verified ->", image.url); }
    else { miss++; console.log("miss", key, comps, "verified, no photo" + (out.cards[key] ? " (kept previous)" : "")); }
  } catch (e) { miss++; console.log("err ", key, String(e.message || e)); }
  await sleep(900);
}
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ ok, miss, total: Object.keys(out.cards).length, out: OUT }));
