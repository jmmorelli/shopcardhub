#!/usr/bin/env node
// build-chase-cards.mjs — card files for the six Pokémon CHASE indices (PB26 CR26 AH26 PRIS25 DR25 PF25), so their cards
// are in the nav card search and open /card?id=<tk>-<num> like every sector-index card (Oct 4 2026, Coverage Scout report:
// "our search can't find our own chase indices" — Umbreon ex #161, Mega Gengar ex #284, Mega Charizard X ex #125 …;
// build E, Mo: "resolve the issues as you see fit").
//
// Writes data/cards/<tk>.json (kind "chase") from data/indices.json + the chase page's own table (denominator and photo key
// per card), then rebuilds data/card-search.json (tools/lib/card-files.mjs writeSearch). Offline by default.
//   raw   = the basket row's price: the index's own dated sold mark (PriceCharting ungraded sold value, re-marked weekly by
//           tools/remark-indices.mjs) — the same number as the index table. Never an ask (R20).
//   path  = the card's PriceCharting item page, stored on the indices.json basket/universe row; the graded ladder
//           (tools/build-card-ladder.mjs) reads it for PSA 9 / PSA 10 / TAG 10. --resolve fills missing paths from the set's
//           PriceCharting console (bracketless "<name> #<num>" row; one console read per set).
// Usage: node tools/build-chase-cards.mjs [--resolve] [--dry]
// Called by tools/remark-indices.mjs after every re-mark, so the card pages follow the index.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cardId, writeSearch } from "./lib/card-files.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const CHASE = {
  PB26: { slug: "pokemon-pitch-black", set: "Pitch Black", page: "pitch-black-index", theme: "#a78bfa" },
  CR26: { slug: "pokemon-chaos-rising", set: "Chaos Rising", page: "chaos-rising-index", theme: "#00e0c0" },
  AH26: { slug: "pokemon-ascended-heroes", set: "Ascended Heroes", page: "ascended-heroes-index", theme: "#f5c800" },
  PRIS25: { slug: "pokemon-prismatic-evolutions", set: "Prismatic Evolutions", page: "prismatic-evolutions-index", theme: "#e879f9" },
  DR25: { slug: "pokemon-destined-rivals", set: "Destined Rivals", page: "destined-rivals-index", theme: "#ff2e55" },
  PF25: { slug: "pokemon-phantasmal-flames", set: "Phantasmal Flames", page: "phantasmal-flames-index", theme: "#4fa8ff" },
};
const nk = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/&amp;/g, "&").replace(/&#39;|&#x27;|’/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

async function resolvePaths(IDX) {
  const { consoleCards } = await import("./price-engine/pc-console.mjs");
  let filled = 0, missed = [];
  for (const [tk, m] of Object.entries(CHASE)) {
    const x = IDX[tk]; if (!x) continue;
    if (x.basket.every((b) => b.path) && x.universe.every((u) => u.path)) continue;
    const rows = await consoleCards(m.slug);
    const find = (num, name) => {
      const c = rows.filter((r) => { const t = r.title.match(/^(.*?)\s+#([A-Za-z0-9\/-]+)\s*$/); return t && t[2] === String(num) && !/\[/.test(r.title); });
      const byName = c.filter((r) => nk(r.title.replace(/\s+#\S+$/, "")) === nk(name));
      return byName.length === 1 ? byName[0].path : c.length === 1 ? c[0].path : null;
    };
    for (const r of [...x.basket, ...x.universe]) { if (r.path) continue; const p = find(r.num, r.name); if (p) { r.path = p; filled++; } else missed.push(`${tk} #${r.num} ${r.name}`); }
  }
  return { filled, missed };
}

// denominator + photo key per card number, read from the chase page's own holdings table
function pageCards(file, tk) {
  const html = fs.readFileSync(file, "utf8"), out = {};
  const re = new RegExp(`data-card-img="([^"]*)" data-card-name="([^"]*)" data-card-sub="pokemon" data-card-size="thumb" data-card-surface="${tk.toLowerCase()}-list"`, "g");
  for (const m of html.matchAll(re)) { const n = m[2].match(/#([A-Za-z0-9]+)\/(\d+)/); if (n) out[n[1]] = { key: m[1], denom: n[2] }; }
  return out;
}

export function writeChaseCards(root = ROOT, IDX = null, dry = false) {
  IDX = IDX || JSON.parse(fs.readFileSync(path.join(root, "data/indices.json"), "utf8"));
  const dir = path.join(root, "data/cards"); fs.mkdirSync(dir, { recursive: true });
  const counts = {};
  for (const [tk, m] of Object.entries(CHASE)) {
    const x = IDX[tk]; if (!x || x.status !== "live") continue;
    const h = x.history || [], last = h[h.length - 1];
    const pc = pageCards(path.join(root, m.page + ".html"), tk);
    const rows = x.basket.filter((b) => b.price != null).slice().sort((a, b) => b.price - a.price);
    const wOf = (b) => (b.w == null ? 1 : b.w);   // Oct 7 2026: chase baskets carry 25%-cap weights
    const bv = rows.reduce((s, b) => s + b.price * wOf(b), 0);
    const cards = rows.map((b, i) => {
      const p = pc[String(b.num)] || {};
      const img = p.key && /^ebay:/.test(p.key) ? p.key : `name:${b.name} ${b.num}${p.denom ? "/" + p.denom : ""} Pokemon ${m.set}`;
      return { id: cardId(tk, b.num), num: String(b.num), name: b.name, rarity: b.rarity || null, path: b.path || null, rank: i + 1, raw: b.price, n30: null, rawAsOf: b.asOf || (last && last.date), w: bv ? Math.round(((b.price * wOf(b)) / bv) * 10000) / 100 : null, q: `pokemon ${m.set.toLowerCase()} ${b.name} ${b.num}`, img };
    });
    const doc = {
      _comment: "GENERATED by tools/build-chase-cards.mjs — one row per chase-index card for /card?id=. raw = the index's own dated sold mark (PriceCharting ungraded sold value, re-marked weekly by tools/remark-indices.mjs). Graded marks live in g-<tk>.json.",
      kind: "chase", ticker: tk, name: x.name, set: `Pokémon TCG ${m.set}`, page: x.page, theme: m.theme, asOf: last ? last.date : x.inception, wotc: false, ed: null, window: null,
      level: last ? last.level : null, cards,
    };
    counts[tk] = cards.length;
    if (!dry) fs.writeFileSync(path.join(dir, `${tk.toLowerCase()}.json`), JSON.stringify(doc) + "\n");
  }
  if (!dry) writeSearch(root);
  return counts;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2), DRY = args.includes("--dry");
  const idxPath = path.join(ROOT, "data/indices.json");
  const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  if (args.includes("--resolve")) {
    const r = await resolvePaths(IDX);
    console.log(`paths: ${r.filled} filled${r.missed.length ? ` · ${r.missed.length} unresolved: ${r.missed.join("; ")}` : ""}`);
    // same serialisation as tools/remark-indices.mjs (the chase tickers' writer)
    if (r.filled && !DRY) fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + (fs.readFileSync(idxPath, "utf8").endsWith("\n") ? "\n" : ""));
  }
  const counts = writeChaseCards(ROOT, IDX, DRY);
  console.log(`${DRY ? "would write" : "wrote"} chase card files: ${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(" · ")}`);
}
