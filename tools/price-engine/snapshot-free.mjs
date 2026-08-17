// Nightly price snapshot - ZERO-SECRET path (no paid subs, no tokens anywhere).
//
// Runs in GitHub Actions (.github/workflows/price-snapshot.yml), not Vercel.
// Price source is the site's own public /api/comps endpoint (eBay Browse API,
// already deployed on Vercel with working keys - see api/comps.js). This script
// therefore needs NO credentials: not eBay's, not Vercel's, not GitHub PATs.
//
// What it does each run:
//   1. Reads data/watchlist.json (cards with source:"ebay" and a query).
//   2. For each card, GETs /api/comps?q=<query>&sort=price&limit=50, keeps only
//      VERIFIED raw base-auto listings (title must contain the player's last
//      name and "auto"; graded slabs, refractors/parallels, numbered cards,
//      lots and reprints are excluded by title), then marks the card at a
//      trimmed median of the lowest fixed-price asks (drop the 2 cheapest as
//      junk/damaged floor, median the next 10, price+shipping). Ask-side marks
//      proxy solds; the methodology is IDENTICAL every night, and for
//      chart-derived signals consistency matters, not absolute level.
//   3. Appends today's point to the card's series (idempotent per day) and
//      recomputes TA via api/_lib/ta.js (trend stack, ROC, z-score, skew,
//      kurtosis - same math as the paid path).
//   4. Writes data/prices-history.json + data/prices-latest.json into --out;
//      the workflow commits them to the price-data branch. The front-end
//      (signal board + homepage panel) already reads that branch's raw URL.
//
// Usage: node tools/price-engine/snapshot-free.mjs --watchlist data/watchlist.json --out price-data/data
// Env (optional): SITE_URL (default https://shopcardhub.com)

import fs from "node:fs";
import path from "node:path";
import { analyze } from "../../api/_lib/ta.js";

const args = {};
for (let i = 2; i < process.argv.length; i += 2) args[process.argv[i].replace(/^--/, "")] = process.argv[i + 1];
const WATCHLIST = args.watchlist || "data/watchlist.json";
const OUT_DIR = args.out || "price-data/data";
const HISTORY_PATH = path.join(OUT_DIR, "prices-history.json");
const LATEST_PATH = path.join(OUT_DIR, "prices-latest.json");

const SITE = (process.env.SITE_URL || "https://shopcardhub.com").replace(/\/$/, "");
const LOW_N = 10;    // how many of the cheapest verified asks form the mark window
const TRIM = 2;      // drop this many cheapest first (junk/damaged floor)
const MIN_COMPS = 4; // fewer verified listings than this -> no mark tonight
const THROTTLE_MS = 1200; // gentle on the Vercel fn + eBay quota (CDN caches repeats)

// Title blocklist: graded slabs, parallels/colored refractors, serial-numbered
// cards, Sapphire/Mega variants, lots, reprints. Keeps the mark on the RAW BASE
// Chrome auto - the one canonical card per player the watchlist tracks.
const TITLE_BAD = /(psa|bgs|sgc|cgc|tag\s?grade|graded|gem\s?m(in)?t|slab|refractor|x-?fractor|superfractor|printing\s?plate|sapphire|mega|mojo|lava|speckle|logofractor|shimmer|atomic|mini\s?diamond|wave|prism|aqua|1st\s?edition\s?reprint|reprint|digital|custom|proxy|lot\s?of|\/\d{1,4}\b)/i;

// TCG singles (Pokemon etc): different noise profile. Card numbers like 161/131
// are REQUIRED in titles (so no serial-number exclusion), "mega"/"prism" are set
// names not parallels. Excluded instead: grading, accessories, pick-a-card
// storefronts, lots, customs.
const TITLE_BAD_TCG = /(psa|bgs|sgc|cgc|tag\s?grade|graded|gem\s?m(in)?t|slab|reprint|digital|custom|proxy|metal\s?card|gold\s?card|lot\s?of|bulk|pick|choose|you\s?pick|case|sleeve|playmat|binder|jumbo|oversize|sticker)/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10); // UTC

function readJsonFile(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return fallback; }
}

function median(xs) {
  const v = [...xs].sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

// Last name of the player from a label like "Ethan Holliday - 1st Bowman Chrome Auto"
function lastNameOf(label) {
  const player = String(label || "").split(/\s+[-\u2014]\s+/)[0].trim();
  const parts = player.split(/\s+/);
  return (parts[parts.length - 1] || "").toLowerCase();
}

// Trimmed-median mark of the cheapest VERIFIED fixed-price asks for a query,
// via the site's own public comps endpoint (which handles eBay auth).
async function compsMark(query, label, card = {}) {
  const type = card.cardType || "chrome-auto";
  const isTcg = type === "tcg-single";
  let url = SITE + "/api/comps?q=" + encodeURIComponent(query) + "&sort=price&limit=50";
  if (card.categoryIds) url += "&category_ids=" + encodeURIComponent(card.categoryIds);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error('/api/comps "' + query + '" -> HTTP ' + r.status);
  const j = await r.json();
  // required title tokens: explicit card.titleMust, else the player's last name
  const musts = (Array.isArray(card.titleMust) && card.titleMust.length
    ? card.titleMust : [lastNameOf(label)]).map((m) => String(m).toLowerCase());
  const bad = isTcg ? TITLE_BAD_TCG : TITLE_BAD;
  const asks = (j.listings || [])
    .filter((l) => l.buyingOption === "FIXED_PRICE")
    .filter((l) => {
      const t = String(l.title || "").toLowerCase();
      if (!musts.every((m) => t.includes(m))) return false; // must be this card
      if (type === "chrome-auto" && !/auto/.test(t)) return false; // autograph only for chrome-auto
      if (bad.test(t)) return false;               // no slabs/parallels/accessories/lots
      return true;
    })
    .map((l) => (Number.isFinite(l.price) ? l.price + (Number.isFinite(l.shipping) ? l.shipping : 0) : null))
    .filter((x) => Number.isFinite(x) && x >= 3)
    .sort((a, b) => a - b);
  if (asks.length < MIN_COMPS) return { price: null, comps: asks.length };
  const window = asks.slice(TRIM, TRIM + LOW_N);
  return { price: Number(median(window).toFixed(2)), comps: asks.length };
}

async function main() {
  const wl = readJsonFile(WATCHLIST, null);
  const cards = (wl?.cards || []).filter((c) => c && c.source === "ebay" && c.id && c.query);
  if (!cards.length) { console.log("No ebay-source cards in watchlist - nothing to do."); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const history = readJsonFile(HISTORY_PATH, {});
  const day = today();
  const summary = { day, updated: 0, thin: 0, errors: [] };

  for (const card of cards) {
    const key = card.source + ":" + card.id;
    try {
      const { price, comps } = await compsMark(card.query, card.label, card);
      const entry = history[key] || { key, id: card.id, source: card.source, label: card.label, slug: card.slug || null, series: [] };
      entry.label = card.label || entry.label;
      entry.slug = card.slug || entry.slug || null;
      if (price != null) {
        entry.series = entry.series.filter((pt) => pt.d !== day); // idempotent per day
        entry.series.push({ d: day, p: price, n: comps });
        summary.updated++;
      } else {
        summary.thin++;
        // drop any same-day point from a previous (less filtered) run today
        entry.series = entry.series.filter((pt) => pt.d !== day);
        console.log("thin market (" + comps + " verified asks) - no mark tonight: " + card.label);
      }
      history[key] = entry;
    } catch (e) {
      summary.errors.push(key + ": " + String(e.message || e));
    }
    await sleep(THROTTLE_MS);
  }

  // ---- recompute TA + build the compact latest feed (same shape the pages read) ----
  const byKey = new Map(cards.map((c) => [c.source + ":" + c.id, c]));
  const latest = Object.values(history).map((e) => {
    const prices = e.series.map((pt) => pt.p);
    const ta = analyze(prices, null);
    const wlCard = byKey.get(e.key) || {};
    return {
      key: e.key, label: e.label, source: e.source, slug: e.slug || null,
      cardType: wlCard.cardType || null, boardHide: !!wlCard.boardHide,
      last: ta.last, signal: ta.signal, confidence: ta.confidence,
      roc30: ta.roc30, sma30: ta.sma30, z: ta.z,
      retSkew: ta.retSkew, retKurtosis: ta.retKurtosis,
      retailBuy: null, retailSell: null,
      points: ta.points, reasons: ta.reasons,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  fs.writeFileSync(LATEST_PATH, JSON.stringify({ generated: new Date().toISOString(), day, cards: latest }, null, 2));
  console.log(JSON.stringify({ ok: true, ...summary, cards: latest.length }));
  if (summary.errors.length) { console.error("errors:", summary.errors.join(" | ")); process.exitCode = summary.updated ? 0 : 1; }
}

main().catch((e) => { console.error("fatal:", e); process.exit(1); });
