// tools/lib/pt-holds.mjs — Price Truth raw-mark display holds (Nov 18 2026; KB P78, ledger O-14).
// data/price-truth/raw-holds.json lists card ids whose raw mark is under review. The mark itself is untouched (it is part of a
// published level; restating one is a CoS ruling), but the row is tagged ptHold:{since,until,why} in data/indices.json so no
// surface prints it as a price, a move ("Biggest move", home movers) or a ratio ("about N times"). Expired or removed holds are
// cleared at the next bake/save. Same pattern as move-guard.mjs tagReread.
import fs from "node:fs";
import path from "node:path";
import { cardId } from "./card-files.mjs";

const cache = new Map();
export function rawHolds(root, today = new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10)) {
  const k = root + "|" + today;
  if (cache.has(k)) return cache.get(k);
  let j = {};
  try { j = JSON.parse(fs.readFileSync(path.join(root, "data/price-truth/raw-holds.json"), "utf8")).raw || {}; } catch (e) { j = {}; }
  const out = {};
  for (const [id, h] of Object.entries(j)) if (h && (!h.until || today <= h.until)) out[id] = { since: h.since, until: h.until, why: h.why };
  cache.set(k, out);
  return out;
}
export function tagPtHold(root, x, today) {
  if (!x || !x.ticker || !Array.isArray(x.basket)) return 0;
  const H = rawHolds(root, today);
  let changed = 0;
  for (const b of x.basket) {
    const h = H[cardId(x.ticker, b.key != null ? b.key : b.num)];
    if (h) { if (!b.ptHold || b.ptHold.until !== h.until || b.ptHold.since !== h.since) { b.ptHold = { since: h.since, until: h.until }; changed++; } }
    else if (b.ptHold) { delete b.ptHold; changed++; }
  }
  return changed;
}
