// classic-collection.mjs — which index rows are CLASSIC COLLECTION REPRINTS (Price Truth desk, Nov 4 2026; Pokémon KB GAPS P42).
//
// Why: Celebrations (2021, CEL21) and the 30th Celebration (2026, TH26) reprint older cards on their ORIGINAL numbers. The
// pages printed "Charizard #4 $150" bare on /celebrations-index (chase strip, table, plain read) beside Base Set's $400
// Charizard #4 — the reprint trap (README #19), re-logged unchanged by the KB from Oct 24 to Nov 4. A label, not a price
// change: the mark is right for the reprint; the row must say it is the reprint.
//
// Source: data/kb/pokemon-rarity.json sets cel25c (25 cards) and me55c (30 cards), written by tools/kb/build-rarity.mjs from
// the pokemon-tcg-data mirror (pokemontcg.io). A row is a reprint when its number matches a list row and its name matches
// after normalising ("Umbreon" = "Umbreon ★", "Mewtwo EX" = "Mewtwo-EX", "Gardevoir ex (Delta Species)" = "Gardevoir ex δ").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const CC_SETS = { CEL21: "cel25c", TH26: "me55c" };
export const CC_LABEL = "Classic Collection reprint";

const norm = (s) => String(s || "").toLowerCase().replace(/\(delta species\)|δ|★|☆/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
let LISTS = null;
function lists() {
  if (LISTS) return LISTS;
  LISTS = {};
  let sets = {};
  try { sets = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kb/pokemon-rarity.json"), "utf8")).sets || {}; } catch (e) { sets = {}; }
  for (const [tk, id] of Object.entries(CC_SETS)) {
    const m = new Map();
    for (const [num, name] of sets[id] || []) { const k = String(num); if (!m.has(k)) m.set(k, []); m.get(k).push(norm(name)); }
    LISTS[tk] = m;
  }
  return LISTS;
}

// true when the (ticker, num, name) row is a Classic Collection reprint
export function isClassicCollection(ticker, num, name) {
  const m = lists()[String(ticker || "").toUpperCase()];
  if (!m) return false;
  const cand = m.get(String(num)); if (!cand) return false;
  const n = norm(name);
  return cand.some((c) => c === n || (c.length >= 3 && (n.startsWith(c + " "))) || (c === "s pikachu" && /\bpikachu\b/.test(n) && /\bbirthday\b/.test(n)));   // "_____'s Pikachu" = Birthday Pikachu
}

// sets b.cc = true on every reprint row of a ticker's basket / universe (and deletes a stale flag); returns the count changed
export function tagClassicCollection(x) {
  if (!x || !CC_SETS[x.ticker]) return 0;
  let changed = 0;
  for (const arr of [x.basket, x.universe]) for (const b of arr || []) {
    const f = isClassicCollection(x.ticker, b.num, b.name);
    if (f && !b.cc) { b.cc = true; changed++; } else if (!f && b.cc) { delete b.cc; changed++; }
  }
  return changed;
}
