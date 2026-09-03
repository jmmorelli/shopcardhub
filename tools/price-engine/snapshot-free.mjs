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
//   4. Keeps the photo of one verified listing per card (see pickImage) so the
//      pages can show the card the price describes.
//   5. Writes data/prices-history.json + data/prices-latest.json into --out;
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
const TRIM = 2;      // drop this many cheapest first (junk/damaged floor) - adaptive, see trimFor()
const MIN_COMPS = 4; // fewer verified listings than this -> no mark tonight. A 4-7 ask mark is
                     // published but flagged thin (untrimmed median of what exists) and cannot
                     // drive a BUY/SELL - see THIN_N and the signal gating in main().
const THIN_N = 8;    // a mark from fewer verified asks than this is published but flagged thin,
                     // and never drives a BUY/SELL on its own (see signal gating in main)
const STALE_DAYS = 4; // no fresh point for this many days -> signal parked at HOLD
// Trim the junk floor only when there is enough sample to spare.
function trimFor(n) { return n >= 12 ? TRIM : n >= 8 ? 1 : 0; }
const THROTTLE_MS = 1200; // gentle on the Vercel fn + eBay quota (CDN caches repeats)

// Title blocklist: graded slabs, parallels/colored refractors, serial-numbered
// cards, Sapphire/Mega variants, lots, reprints. Keeps the mark on the RAW BASE
// Chrome auto - the one canonical card per player the watchlist tracks.
const TITLE_BAD = /(psa|bgs|sgc|cgc|tag\s?grade|graded|gem\s?m(in)?t|slab|refractor|x-?fractor|superfractor|printing\s?plate|sapphire|mega|mojo|lava|speckle|logofractor|shimmer|atomic|mini\s?diamond|wave|prism|aqua|1st\s?edition\s?reprint|reprint|digital|custom|proxy|lot\s?of|redemption|redeemed|\bvar\b|\btag\s?(mint\s?)?\d|\/\d{1,4}\b)/i;

// Sep 3 2026 (Mo: "different cards are coming through the filter"): a second
// pass that catches what the regex above misses. Applied to every sports card
// type after team names are stripped (so "Red Sox" is not a red parallel).
//   - aftermarket signatures: IP / COA / JSA / hand-signed base cards were
//     pricing as "autos" (Kim, Houston) - a $20 signed base card is not a CPA auto
//   - colour parallels named without "refractor" or a serial (Gold, Purple,
//     Green Grass, True Blue, Black Gold Ink ...)
//   - variations and premium slots (Hangul, image variation, dual/triple, HTA,
//     Mega Box BMA-, mini, jumbo, snack pack / bubble gum, sealed)
const TEAM_WORDS = /\b(red sox|white sox|blue jays|cincinnati reds|reds|orange county|black knights|golden knights|brown)\b/gi;
const TITLE_BAD_2 = /(\bcoa\b|\bjsa\b|beckett|\bip\b|in.?person|hand.?signed|witnessed|autographed signed|signed .*autographed|reptil+ian|hangul|variation|\bink\b|snack|bubble|\bdual\b|triple|\bquad\b|jumbo|\bmini\b|\bhta\b|mega.?box|\bbma-|\bssp\b|\bsp\b|lazer|laser|\bgrass\b|true blue|foil|sealed|\b(gold|orange|green|blue|purple|red|yellow|pink|black|white|silver|fuchsia|magenta|sepia|neon|platinum|bronze|camo|zebra|tie.?dye|pulsar|padparadscha)\b)/i;

// Card code from the watchlist query (e.g. CPA-EH, BDC-1). When a query carries
// one, every verified title must carry it too - the code is the one token that
// separates the pack auto (CPA-SK) from a signed base card (BCP-45) or the Mega
// Box auto (BMA-SK) of the same player. Sellers write it with '#', spaces,
// unicode dashes or none at all, so both sides are normalised first.
export function cardCode(card) {
  if (card && card.code) return String(card.code).toUpperCase();
  const m = String((card && card.query) || "").match(/\b([A-Z]{2,4}-[A-Z]{1,3}\d{0,3}|[A-Z]{2,4}-\d{1,3})\b/);
  return m ? m[1].toUpperCase() : null;
}
export function normTitle(t) {
  return String(t || "").toUpperCase().replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-").replace(/#/g, " ").replace(/\s*-\s*/g, "-").replace(/\s+/g, " ");
}
// Any OTHER Bowman-family card code in the title = a different card.
const FOREIGN_CODE = /\b(CPA|BCP|BMA|BCA|BDC|CDA|BPA|BSPA|BP|BD|BTP|BSA)-?[A-Z0-9]{1,4}\b/g;

// Year token from the query ("2026 bowman ..."), required in the title for
// sports cards so a 2025 Bowman Draft auto never prices a 2026 1st Bowman.
function yearOf(query) { const m = String(query || "").match(/\b(20\d{2})\b/); return m ? m[1] : null; }

// Explainable verification: returns the verified listings AND every rejection
// with its reason, so audit-comps.mjs can show a human exactly what the mark is
// made of. compsMark() below uses the same function - one filter, two callers.
export function verifyListings(listings, card, label) {
  const type = (card && card.cardType) || "chrome-auto";
  const isTcg = type === "tcg-single";
  const query = (card && card.query) || "";
  const musts = (Array.isArray(card?.titleMust) && card.titleMust.length
    ? card.titleMust : [lastNameOf(label)]).map((m) => String(m).toLowerCase());
  const bad = isTcg ? TITLE_BAD_TCG : (type === "sapphire-base" ? TITLE_BAD_SAPPHIRE : TITLE_BAD);
  const code = isTcg ? null : cardCode(card);
  const year = isTcg ? null : yearOf(query);
  const verified = [], rejected = [], seen = new Map();
  for (const l of listings || []) {
    const t = String(l.title || "").toLowerCase();
    const reject = (why) => rejected.push({ title: l.title, price: l.price, why });
    if (l.buyingOption !== "FIXED_PRICE") { reject("not fixed-price"); continue; }
    if (!musts.every((m) => t.includes(m))) { reject("missing required token " + musts.join("+")); continue; }
    if (type === "chrome-auto" && !/auto/.test(t)) { reject("no 'auto' in title"); continue; }
    if (bad.test(t)) { reject("blocklist: " + bad.exec(t)[0]); continue; }
    if (!isTcg) {
      const nt = normTitle(l.title);
      if (year && !nt.includes(year)) { reject("missing year " + year); continue; }
      if (code) {
        if (!new RegExp("\\b" + code.replace("-", "-?") + "\\b").test(nt)) { reject("missing card code " + code); continue; }
        const others = (nt.match(FOREIGN_CODE) || []).map((c) => c.replace(/^([A-Z]+)-?/, "$1-")).filter((c) => c !== code);
        if (others.length) { reject("foreign card code " + others[0]); continue; }
      } else if (type === "chrome-auto" && !/chrome/.test(t)) { reject("no 'chrome' in title"); continue; }
      const t2 = t.replace(TEAM_WORDS, " ");
      const m2 = TITLE_BAD_2.exec(t2);
      if (m2) { reject("blocklist-2: " + m2[0]); continue; }
    }
    const total = Number.isFinite(l.price) ? l.price + (Number.isFinite(l.shipping) ? l.shipping : 0) : null;
    if (!Number.isFinite(total) || total < 3) { reject("no usable price"); continue; }
    // one seller relisting the same card at the same price many times is
    // supply, not price discovery - cap it at two data points per seller/price
    const dupKey = (l.seller || "") + "|" + Math.round(total);
    const dups = (seen.get(dupKey) || 0) + 1; seen.set(dupKey, dups);
    if (dups > 2) { reject("duplicate seller/price"); continue; }
    verified.push({ ...l, total });
  }
  verified.sort((a, b) => a.total - b.total);
  return { verified, rejected, code, year, musts };
}

// Sapphire-base feeds (added Aug 31 2026): every matching title necessarily
// contains "sapphire", so that token must NOT be in the blocklist for this
// cardType — otherwise the feed verifies 0 asks forever (the Sep 1 bug).
// Everything else (slabs, parallels, serials, lots) still applies.
const TITLE_BAD_SAPPHIRE = /(psa|bgs|sgc|cgc|tag\s?grade|graded|gem\s?m(in)?t|slab|refractor|x-?fractor|superfractor|printing\s?plate|mega|mojo|lava|speckle|logofractor|shimmer|atomic|mini\s?diamond|wave|prism|aqua|1st\s?edition\s?reprint|reprint|digital|custom|proxy|lot\s?of|redemption|redeemed|padparadscha|\btag\s?(mint\s?)?\d|\/\d{1,4}\b)/i;

// TCG singles (Pokemon etc): different noise profile. Card numbers like 161/131
// are REQUIRED in titles (so no serial-number exclusion), "mega"/"prism" are set
// names not parallels. Excluded instead: grading, accessories, pick-a-card
// storefronts, lots, customs.
const TITLE_BAD_TCG = /(psa|bgs|sgc|cgc|tag\s?grade|graded|gem\s?m(in)?t|slab|reprint|digital|custom|proxy|metal\s?card|gold\s?card|lot\s?of|bulk|pick|choose|you\s?pick|case|sleeve|playmat|binder|jumbo|oversize|sticker|fan\s?art|\bdiy\b|placeholder|damage|\btag\s?(mint\s?)?\d|contender|\bace\s?\d|\bcga\b|\bpgi\b)/i;

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

// Quantile of an ALREADY-SORTED array, linear interpolation.
function quantile(sorted, p) {
  if (!sorted.length) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

const r2 = (x) => (x == null || !Number.isFinite(x) ? null : Math.round(x * 100) / 100);

// Shape of the verified ask distribution for one card on one night.
//
// WHY THIS EXISTS (Aug 20 2026): the nightly mark `p` is a trimmed median of the
// CHEAPEST asks. So when someone buys the floor listing, `p` rises and `n` falls
// MECHANICALLY - the two series are not independent measurements, and any
// "supply fell, price rose" correlation computed from them alone is partly pure
// arithmetic. Storing the full distribution lets a later analysis separate:
//   floor bought out  -> q1 up, q3 flat   (artifact, ignore)
//   market re-rated   -> every quantile up (real)
// It also gives us a data-quality tripwire: see dispersionFlag().
function askShape(sortedAsks) {
  const n = sortedAsks.length;
  if (!n) return null;
  const mean = sortedAsks.reduce((s, x) => s + x, 0) / n;
  const m2 = sortedAsks.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const sd = Math.sqrt(m2);
  let skew = null;
  if (sd > 0 && n > 2) {
    skew = sortedAsks.reduce((s, x) => s + (x - mean) ** 3, 0) / n / sd ** 3;
  }
  return {
    q1: r2(quantile(sortedAsks, 0.25)),
    med: r2(quantile(sortedAsks, 0.5)),
    q3: r2(quantile(sortedAsks, 0.75)),
    sd: r2(sd),
    sk: r2(skew),
    lo: r2(sortedAsks[0]),
    hi: r2(sortedAsks[n - 1]),
  };
}

// Data-quality tripwire, NOT a market signal.
//
// A clean single-card query produces asks clustered around one level. When the
// spread blows out or the distribution splits into two clumps, the query is
// almost always matching two different cards (base + auto, raw + graded, single
// + lot). That is the failure mode that ran silently for 20 nights on the Justin
// Gonzalez query - it produced numbers the whole time, they were just numbers
// about the wrong cards. Nobody can eyeball this; the engine has to say it.
function dispersionFlag(shape, n) {
  if (!shape || n < 6 || !shape.med) return null;
  const cv = shape.sd / shape.med;                    // coefficient of variation
  const spread = shape.q1 ? shape.q3 / shape.q1 : null; // interquartile ratio
  if (spread != null && spread >= 4) return `IQR ratio ${spread.toFixed(1)}x (q1 $${shape.q1} -> q3 $${shape.q3}) - query is probably matching two different cards`;
  if (cv >= 1.5) return `CV ${cv.toFixed(2)} on ${n} asks ($${shape.lo}-$${shape.hi}) - implausibly dispersed for one card`;
  return null;
}

// Last name of the player from a label like "Ethan Holliday - 1st Bowman Chrome Auto"
function lastNameOf(label) {
  const player = String(label || "").split(/\s+[-\u2014]\s+/)[0].trim();
  const parts = player.split(/\s+/);
  return (parts[parts.length - 1] || "").toLowerCase();
}

// Trimmed-median mark of the cheapest VERIFIED fixed-price asks for a query,
// via the site's own public comps endpoint (which handles eBay auth).
export async function compsMark(query, label, card = {}) {
  let url = SITE + "/api/comps?q=" + encodeURIComponent(query) + "&sort=price&limit=50&customid=price-engine";
  if (card.categoryIds) url += "&category_ids=" + encodeURIComponent(card.categoryIds);
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error('/api/comps "' + query + '" -> HTTP ' + r.status);
  const j = await r.json();
  const { verified } = verifyListings(j.listings || [], { ...card, query }, label);
  const asks = verified.map((l) => l.total);
  const trim = trimFor(asks.length);
  // IMAGE (added Sep 1 2026): the photo of a verified listing inside the mark
  // window - the same listing population the mark comes from, so the picture
  // is the card the price describes. Middle of the window, first with a photo.
  const image = pickImage(verified.slice(trim, trim + LOW_N).length ? verified.slice(trim, trim + LOW_N) : verified);
  if (asks.length < MIN_COMPS) return { price: null, comps: asks.length, shape: null, image };
  const window = asks.slice(trim, trim + LOW_N);
  // `asks` is already sorted ascending - askShape relies on that.
  return { price: Number(median(window).toFixed(2)), comps: asks.length, shape: askShape(asks), image };
}

// eBay listing photos come back as .../s-l225.jpg thumbnails; the same path at
// s-l500 is the 500px render. Hot-linked from eBay's CDN (never copied), and
// always shown wrapped in the EPN listing link - that keeps it inside the API
// and Partner Network terms and turns the picture into an affiliate click.
export function pickImage(listings) {
  if (!listings || !listings.length) return null;
  const order = [];
  const mid = Math.floor(listings.length / 2);
  for (let d = 0; d < listings.length; d++) { if (mid + d < listings.length) order.push(mid + d); if (d && mid - d >= 0) order.push(mid - d); }
  for (const i of order) {
    const l = listings[i];
    if (l && l.image && /^https:\/\/i\.ebayimg\.com\//.test(l.image)) {
      return { url: l.image.replace(/s-l\d+\./, "s-l500."), item: l.url || null, title: l.title || null, price: l.total ?? l.price ?? null };
    }
  }
  return null;
}

async function main() {
  const wl = readJsonFile(WATCHLIST, null);
  const cards = (wl?.cards || []).filter((c) => c && c.source === "ebay" && c.id && c.query);
  if (!cards.length) { console.log("No ebay-source cards in watchlist - nothing to do."); return; }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const history = readJsonFile(HISTORY_PATH, {});
  const day = today();
  const summary = { day, updated: 0, thin: 0, errors: [], dispersion: [] };

  for (const card of cards) {
    const key = card.source + ":" + card.id;
    try {
      const { price, comps, shape, image } = await compsMark(card.query, card.label, card);
      const entry = history[key] || { key, id: card.id, source: card.source, label: card.label, slug: card.slug || null, series: [] };
      entry.label = card.label || entry.label;
      entry.slug = card.slug || entry.slug || null;
      if (image) entry.image = { ...image, d: day }; // keep last known photo if tonight had none
      if (price != null) {
        entry.series = entry.series.filter((pt) => pt.d !== day); // idempotent per day
        // p = trimmed low-end mark (unchanged, back-compatible). n = verified ask
        // count. shape = the rest of the distribution, added Aug 20 2026; older
        // points simply lack these fields and readers must tolerate that.
        entry.series.push({ d: day, p: price, n: comps, ...(shape || {}) });
        summary.updated++;
        const flag = dispersionFlag(shape, comps);
        if (flag) {
          summary.dispersion.push(card.label + ": " + flag);
          console.log("DISPERSION FLAG - " + card.label + ": " + flag);
        }
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

    // ---- SUPPLY: how many verified asks exist, and which way that is moving.
    // Published as a FACT, not a signal. We do NOT claim falling supply predicts
    // price - the mark is a low-end median, so `p` and `n` move together partly
    // by construction. Until there is a real sample (n of cards, over months,
    // graded on /track-record like every other call), this is reported and not
    // interpreted.
    const withN = e.series.filter((pt) => Number.isFinite(pt.n));
    const lastPt = withN.length ? withN[withN.length - 1] : null;
    const supply = lastPt ? lastPt.n : null;
    let supply30 = null, supplyChange30 = null;
    if (lastPt && withN.length > 1) {
      const cutoff = new Date(new Date(lastPt.d).getTime() - 30 * 864e5).toISOString().slice(0, 10);
      // oldest point still inside the 30-day window, else the oldest we have
      const base = withN.find((pt) => pt.d >= cutoff) || withN[0];
      if (base && base !== lastPt && base.n > 0) {
        supply30 = base.n;
        supplyChange30 = Math.round(((lastPt.n - base.n) / base.n) * 1000) / 10;
      }
    }

    // ---- SIGNAL GATING (Sep 3 2026): a BUY/SELL must rest on a real sample.
    // Parked at HOLD (signalRaw keeps the chart's verdict) when the latest mark
    // is thin (< THIN_N verified asks), when tonight's ask distribution tripped
    // the dispersion flag (query probably matching two cards), or when the
    // series has gone stale (no fresh point for STALE_DAYS). Nothing on the
    // site should read BUY off two asks.
    const lastAny = e.series.length ? e.series[e.series.length - 1] : null;
    const gates = [];
    if (lastPt && Number.isFinite(lastPt.n) && lastPt.n < THIN_N) gates.push(`thin market - ${lastPt.n} verified asks (need ${THIN_N} for a call)`);
    if (lastAny && dispersionFlag({ q1: lastAny.q1, q3: lastAny.q3, med: lastAny.med, sd: lastAny.sd, lo: lastAny.lo, hi: lastAny.hi }, lastAny.n)) gates.push("ask spread implausible for one card - see dispersion flag");
    if (lastAny && (new Date(day) - new Date(lastAny.d)) / 864e5 >= STALE_DAYS) gates.push(`stale - last mark ${lastAny.d}`);
    const signalRaw = ta.signal;
    if (gates.length && ta.signal !== "HOLD") { ta.signal = "HOLD"; ta.reasons = [...gates, ...ta.reasons]; }
    else if (gates.length) { ta.reasons = [...gates, ...ta.reasons]; }

    return {
      key: e.key, label: e.label, source: e.source, slug: e.slug || null,
      cardType: wlCard.cardType || null, boardHide: !!wlCard.boardHide,
      image: e.image || null,
      last: ta.last, signal: ta.signal, signalRaw, gated: gates.length ? gates : null, confidence: ta.confidence,
      roc30: ta.roc30, sma30: ta.sma30, z: ta.z,
      retSkew: ta.retSkew, retKurtosis: ta.retKurtosis,
      retailBuy: null, retailSell: null,
      supply, supply30, supplyChange30,
      supplyDays: withN.length,
      askQ1: lastPt ? (lastPt.q1 ?? null) : null,
      askQ3: lastPt ? (lastPt.q3 ?? null) : null,
      points: ta.points, reasons: ta.reasons,
    };
  }).sort((a, b) => a.label.localeCompare(b.label));

  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
  fs.writeFileSync(LATEST_PATH, JSON.stringify({ generated: new Date().toISOString(), day, cards: latest }, null, 2));
  console.log(JSON.stringify({ ok: true, ...summary, cards: latest.length }));
  if (summary.errors.length) { console.error("errors:", summary.errors.join(" | ")); process.exitCode = summary.updated ? 0 : 1; }
}

// Run only when invoked directly (resolve-images.mjs imports compsMark/pickImage).
if (process.argv[1] && /snapshot-free\.mjs$/.test(process.argv[1])) {
  main().catch((e) => { console.error("fatal:", e); process.exit(1); });
}
