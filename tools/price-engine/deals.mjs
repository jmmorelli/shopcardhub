#!/usr/bin/env node
// tools/price-engine/deals.mjs — the Deals screener: Buy It Now listings priced BELOW THE MARK (Oct 23 2026).
//
// Mo, Oct 23 2026 ("go on A1"), from the TCGBerg read (claude/cos/competitor-tcgberg-2026-10-23.md): a fixed-price
// listing under our own dated sold mark is the one row on the site whose only job is an eBay click with buying intent.
// The Auction Desk covers auctions; this covers Buy It Now.
//
// What it does, per run (GitHub Action deals.yml, 3x/day):
//   1. Candidates — the cards we already mark on dated SOLD comps:
//        • every live Pokémon set index basket (data/cards/<tk>.json): the top RAW_PER_TICKER cards by weight whose
//          raw mark is fresh and >= RAW_MIN_MARK;
//        • their PSA 10 / PSA 9 graded marks (data/cards/g-<tk>.json) when the mark is a 30-day median (basis "30d");
//        • the Bowman watchlist (data/watchlist.json) against data/feed/sold-marks.json (>= 3 sales in 30 days).
//   2. One /api/comps call per candidate (our own endpoint, tool header, customid=deals): Buy It Now only, inside the
//      price band [FLOOR x mark .. UNDER x mark], cheapest first. The band is what keeps this at ~500 Browse calls a run.
//   3. Verification, each stage logged by reason (the TCGBerg cascade, our rules):
//        L1 exact card — name tokens + card number in the title (Pokémon) / the engine's verifyListings (Bowman);
//        L2 variant — 1st Edition / Shadowless / Unlimited / language / reverse / promo must not contradict the basket;
//        L3 grade — PSA rows: the title names exactly that PSA grade and no other grader; raw rows: no grading words;
//        L4 condition — raw rows must be Ungraded/New with no damage words in the title (eBay's summary field only
//                       says Ungraded/Graded); PSA rows must not be marked Ungraded.
//   4. Deal = (price + shipping) <= UNDER x mark AND >= FLOOR x mark (deeper than that is a mislabel or damage, not a
//      deal — held back, counted). Top KEEP_PER_CARD per card+grade, sorted by discount.
//   5. Writes ONE file (--out; the Action publishes it as data/feed/deals-latest.json on main), derived rows only: our ids, numbers, the affiliate URL, image URL, end time, seller
//      feedback. NO listing titles (R17/R20 feed hygiene — same as the nightly feed).
//
// Mark freshness gates: raw <= RAW_MAX_AGE_DAYS, graded <= GRADED_MAX_AGE_DAYS, Bowman lastSale <= 30d.
//
//   node tools/price-engine/deals.mjs --out price-data/data/deals-latest.json
//   node tools/price-engine/deals.mjs --dry --tickers BS99,PRIS25 --limit 20     (no file, prints counts)
//
// Env: SITE_URL (default https://www.shopcardhub.com). Nothing secret — eBay auth lives behind /api/comps.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyListings } from "./snapshot-free.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SITE = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DRY = args.includes("--dry");
const OUT = arg("--out", "price-data/data/deals-latest.json");
const ONLY = (arg("--tickers", "") || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
const LIMIT = parseInt(arg("--limit", "0"), 10) || 0;          // cap candidates (testing)
const PAUSE_MS = parseInt(arg("--pause", "650"), 10);

// ---- tunables (all named here, all printed into the feed's `rules` block) ----
const RAW_PER_TICKER = 8, G10_PER_TICKER = 4, G9_PER_TICKER = 3, KEEP_PER_CARD = 2;
const RAW_MIN_MARK = 25, GRADED_MIN_MARK = 40;
const RAW_MAX_AGE_DAYS = 14, GRADED_MAX_AGE_DAYS = 21, BOWMAN_MAX_AGE_DAYS = 30;
// First full read (Oct 23 2026, 105 modern-Pokémon candidates): the raw sold mark (PriceCharting ungraded) sits ~10-15% above
// the eBay Buy It Now floor on modern cards, so "3% under" would have printed 139 raw rows — a shelf, not a screen. Raw rows
// must be 10% under; slabs (30-day PSA median of eBay sales, closer to the ask side) 5%. Floors: 55% — a PSA 10 at 46% of
// its 30-day median is where mislabels live, and the page would rather miss one real steal than print one fake.
const UNDER = { raw: 0.90, psa9: 0.95, psa10: 0.95, bowman: 0.90, sealed: 0.95 };
const FLOOR = { raw: 0.65, psa9: 0.55, psa10: 0.55, bowman: 0.55, sealed: 0.65 };   // deeper = mislabel/damage, held back
// Vintage raw (set released before VINTAGE_BEFORE): the second full read (78 WOTC-era candidates) printed 81 raw rows
// clustered at -40..-50% — played copies whose sellers said nothing, against a clean-sale mark. A raw vintage row only
// counts when the title itself claims the condition (NM / near mint / mint / pack fresh) and sits no deeper than -25%.
const VINTAGE_BEFORE = 2010;
const VINTAGE_RAW_FLOOR = 0.75;
const NM_CLAIM = /\b(nm|near\s?mint|mint|pack\s?fresh)\b/;
const MIN_SELLER_SCORE = 10;              // feedback count; a 100% seller with 2 reviews is not a trust signal
const MIN_SELLER_PCT = 97;                // below this the listing is dropped (believability)

const read = (f) => JSON.parse(fs.readFileSync(path.join(REPO, f), "utf8"));
const exists = (f) => fs.existsSync(path.join(REPO, f));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);
const ageDays = (d) => (d ? Math.round((Date.now() - new Date(d).getTime()) / 864e5) : Infinity);
const round2 = (x) => Math.round(x * 100) / 100;

// ---- title normalisation + verification ----
const norm = (s) => String(s || "").toLowerCase().replace(/[’']s\b/g, "").replace(/[^a-z0-9/#&. ]+/g, " ").replace(/\s+/g, " ").trim();
const NAME_STOP = new Set(["holo", "card", "pokemon", "the"]);
const nameTokens = (name) => norm(name).replace(/[/#&.]/g, " ").split(" ").filter((t) => t.length >= 4 && !NAME_STOP.has(t));
const numRe = (num) => {
  const n = String(num || "").trim();
  if (!n) return null;
  if (/^[a-z]+\s*\d+$/i.test(n)) { const m = /^([a-z]+)\s*(\d+)$/i.exec(n); return new RegExp(`\\b${m[1].toLowerCase()}\\s?0*${m[2]}(?![0-9])`); }
  if (/^\d+$/.test(n)) return new RegExp(`(^|[^0-9/.$])0*${n}(?![0-9])`);
  return new RegExp(`\\b${n.toLowerCase().replace(/[^a-z0-9]/g, "")}\\b`);
};
const LANG_BAD = /\b(japanese|japan|korean|chinese|german|french|italian|spanish|portuguese|jpn|\bjp\b|kor|ita|ger|deutsch)\b/;
const RAW_BAD = /\b(psa|bgs|sgc|cgc|tag|ace|beckett|graded|slab|gem\s?mint|reprint|digital|custom|proxy|lot|bulk|pick|choose|bundle|set\s?of|jumbo|oversize|sticker|signed|autograph|auto|error|miscut|misprint|test\s?print|prerelease|staff|world\s?championship|rc\b|rookie)\b/;
// eBay's trading-card condition field only says "Ungraded" / "Graded" in item summaries (checked Oct 23 2026), so the
// condition gate is: raw rows must be Ungraded (or New), graded rows must not be Ungraded, and the TITLE carries the
// damage screen. "READ" in a title means "read the description" — it is a damage flag in this hobby, so it is one here.
const RAW_DAMAGE = /\b(hp|mp|lp|dmg|damaged|damage|played|crease|creased|whitening|scratch|scratched|bent|water|stain|stained|ding|dinged|edge\s?wear|peel|peeling|poor|fair|read|excellent|very good|moderately|heavily|lightly|for\s?parts)\b/;
const GRADED_BAD = /\b(reprint|digital|custom|proxy|lot|bulk|pick|choose|bundle|set\s?of|jumbo|oversize|sticker|signed|autograph|error|miscut|misprint|test\s?print|prerelease|staff|world\s?championship)\b/;
const OTHER_GRADER = /\b(bgs|cgc|sgc|ace|beckett|tag\s?\d|tag\s?grad|pgi|cga|hga|gma|mnt)\b/;
const VARIANT = {
  first: /\b(1st|first)\s?(ed|edition)\b/,
  shadowless: /\bshadowless\b/,
  base2: /\b(base\s?set\s?2|bs2|legendary\s?collection|celebrations|xy\s?evolutions|151)\b/,
  reverse: /\breverse\b/,
  promo: /\b(promo|black\s?star|pokemon\s?center|pokémon\s?center|cosmos|stamped|league)\b/,
};

function verifyPokemon(l, c, grade, ed, wotc, vintage) {
  const t = norm(l.title);
  const toks = nameTokens(c.name);
  const miss = toks.find((tok) => !t.includes(tok));
  if (miss) return "L1 name token " + miss;
  const nr = numRe(c.num); if (nr && !nr.test(t)) return "L1 card number " + c.num;
  const q = norm(c.q);
  if (!LANG_BAD.test(q) && LANG_BAD.test(t)) return "L2 language";
  if (!VARIANT.reverse.test(q) && VARIANT.reverse.test(t)) return "L2 reverse holo";
  if (!VARIANT.promo.test(q) && VARIANT.promo.test(t)) return "L2 promo";
  if (wotc) {
    if (ed === "unl" && (VARIANT.first.test(t) || VARIANT.shadowless.test(t))) return "L2 edition (1st/shadowless on an unlimited ticker)";
    if (ed === "1st" && !VARIANT.first.test(t)) return "L2 edition (no 1st edition in title)";
    if (ed === "shadowless" && (!VARIANT.shadowless.test(t) || VARIANT.first.test(t))) return "L2 edition (shadowless ticker)";
    if (/\bbase set\b/.test(q) && VARIANT.base2.test(t)) return "L2 other set";
  }
  if (grade === "raw") {
    if (RAW_BAD.test(t)) return "L3 graded/other words: " + RAW_BAD.exec(t)[0];
    if (RAW_DAMAGE.test(t)) return "L4 damage word: " + RAW_DAMAGE.exec(t)[0];
    const cond = String(l.condition || "").toLowerCase();
    if (cond && !/ungraded|near mint|like new|^new\b|brand new/.test(cond)) return "L4 condition (" + cond + ")";
    if (vintage && !NM_CLAIM.test(t)) return "L4 vintage raw without an NM claim";
  } else {
    const cond = String(l.condition || "").toLowerCase();
    if (/ungraded/.test(cond)) return "L4 condition says ungraded on a PSA row";
    const g = grade === "psa10" ? 10 : 9;
    const gre = new RegExp(`\\bpsa\\s?${g}(?![0-9.])`);
    if (!gre.test(t)) return "L3 no PSA " + g + " in title";
    const other = t.replace(gre, " ");
    if (/\bpsa\s?\d/.test(other)) return "L3 another PSA grade in title";
    if (OTHER_GRADER.test(t)) return "L3 other grader";
    if (GRADED_BAD.test(t)) return "L3 blocklist: " + GRADED_BAD.exec(t)[0];
  }
  return null;
}

function verifyBowman(l, card) {
  const { verified, rejected } = verifyListings([l], card, card.label, { mode: "FIXED_PRICE" });
  if (!verified.length) return (rejected[0] && rejected[0].why) || "engine filter";
  if (card.cardType === "sealed") {
    const cond = String(l.condition || "").toLowerCase();
    if (!/new|sealed/.test(cond)) return "L4 condition not new (" + (cond || "unstated") + ")";
    if (/\b(open|opened|empty|no packs|loose|resealed)\b/.test(norm(l.title))) return "L4 opened";
    return null;
  }
  const t = norm(l.title);
  if (RAW_DAMAGE.test(t)) return "L4 damage word: " + RAW_DAMAGE.exec(t)[0];
  const cond = String(l.condition || "").toLowerCase();
  if (cond && !/ungraded|near mint|like new|^new\b|brand new/.test(cond)) return "L4 condition (" + cond + ")";
  return null;
}

// ---- candidates ----
function candidates() {
  const out = [];
  const idx = read("data/indices.json");
  for (const [tk, v] of Object.entries(idx)) {
    if (!v || typeof v !== "object" || v.status !== "live") continue;
    if (ONLY.length && !ONLY.includes(tk)) continue;
    const f = `data/cards/${tk.toLowerCase()}.json`;
    if (!exists(f)) continue;
    const b = read(f);
    const cards = (b.cards || []).filter((c) => c && typeof c === "object" && c.q);
    const year = parseInt(String(v.releaseDate || "").slice(0, 4), 10);
    const base = { tk, idx: v.name || b.name, page: v.page || b.page, ed: b.ed || null, wotc: !!b.wotc, vintage: Number.isFinite(year) && year < VINTAGE_BEFORE };
    const live = cards.filter((c) => Number.isFinite(c.raw) && !c.screened && c.raw >= RAW_MIN_MARK && ageDays(c.rawAsOf) <= RAW_MAX_AGE_DAYS)
      .sort((a, b2) => (b2.w || 0) - (a.w || 0)).slice(0, RAW_PER_TICKER);
    for (const c of live) out.push({ ...base, kind: "pokemon", grade: "raw", card: c, mark: c.raw, markAsOf: c.rawAsOf, markN: c.n30 ?? null, markBasis: `${b.window || 30}d median of clean ungraded sales`, q: c.q, categoryIds: "183454" });
    const gf = `data/cards/g-${tk.toLowerCase()}.json`;
    if (exists(gf)) {
      const g = read(gf).cards || {};
      const byKey = new Map(cards.map((c) => [String(c.key ?? c.num), c]));
      for (const [grade, per] of [["psa10", G10_PER_TICKER], ["psa9", G9_PER_TICKER]]) {
        const rows = [];
        for (const [key, gc] of Object.entries(g)) {
          if (!gc || typeof gc !== "object") continue;
          const m = gc[grade]; const c = byKey.get(String(key));
          if (!c || !m || m.basis !== "30d" || !Number.isFinite(m.m) || m.m < GRADED_MIN_MARK || ageDays(gc.asOf) > GRADED_MAX_AGE_DAYS) continue;
          rows.push({ ...base, kind: "pokemon", grade, card: c, mark: m.m, markAsOf: gc.asOf, markN: m.n, markBasis: `30d median of ${m.n} ${grade === "psa10" ? "PSA 10" : "PSA 9"} sales`, q: `${c.q} psa ${grade === "psa10" ? 10 : 9}`, categoryIds: "183454" });
        }
        rows.sort((a, b2) => b2.mark - a.mark);
        out.push(...rows.slice(0, per));
      }
    }
  }
  // Bowman watchlist vs sold marks
  if (!ONLY.length || ONLY.includes("BOWMAN")) {
    try {
      const wl = read("data/watchlist.json").cards || [];
      const uni = read("data/price-universe.json").cards || [];
      const sm = (read("data/feed/sold-marks.json").cards || []);
      const smBy = new Map(sm.map((r) => [r.key, r]));
      const uniBy = new Map(uni.map((u) => [u.key, u]));
      for (const c of wl) {
        if (!c || c.source !== "ebay" || !c.id || !c.query) continue;
        const u = uniBy.get(`bangers:${c.id}`); if (!u || !u.path) continue;
        const r = smBy.get(`sold:${u.path}`); if (!r || !Number.isFinite(r.last) || (r.n30 || 0) < 3 || ageDays(r.lastSale) > BOWMAN_MAX_AGE_DAYS) continue;
        const sealed = c.cardType === "sealed";
        out.push({ tk: sealed ? "SEALED" : "BOWMAN", idx: sealed ? "Sealed product" : "Bowman watchlist", page: c.slug ? "/" + c.slug : "/bowman-bangers", kind: "bowman", grade: sealed ? "sealed" : "raw", card: { id: c.id, name: c.label, num: null, q: c.query, path: null }, wlCard: c, mark: r.last, markAsOf: r.lastSale, markN: r.n30, markBasis: r.basis, q: c.query, categoryIds: c.categoryIds || null });
      }
    } catch (e) { console.warn("bowman candidates skipped: " + e.message); }
  }
  return LIMIT ? out.slice(0, LIMIT) : out;
}

// ---- fetch ----
async function comps(cand) {
  const tier = cand.kind === "bowman" ? cand.grade === "sealed" ? "sealed" : "bowman" : cand.grade;
  const floor = cand.vintage && cand.grade === "raw" ? VINTAGE_RAW_FLOOR : FLOOR[tier], under = UNDER[tier];
  const lo = Math.max(1, Math.floor(cand.mark * floor)), hi = Math.floor(cand.mark * under);
  if (hi <= lo) return { listings: [], floor, under };
  const u = new URL(SITE + "/api/comps");
  u.searchParams.set("q", cand.q); u.searchParams.set("buying", "FIXED_PRICE"); u.searchParams.set("price", `${lo}..${hi}`);
  u.searchParams.set("sort", "price"); u.searchParams.set("limit", "50"); u.searchParams.set("customid", "deals");
  if (cand.categoryIds) u.searchParams.set("category_ids", cand.categoryIds);
  const r = await fetch(u, { headers: { Accept: "application/json", "x-shopcardhub-client": "tool" } });
  if (!r.ok) throw new Error(`/api/comps -> HTTP ${r.status}`);
  const j = await r.json();
  return { listings: j.listings || [], floor, under };
}

function score(row) {
  // transparent, three parts: discount depth, seller trust, buyability. Printed, never hidden.
  let s = Math.min(40, Math.round(-row.disc * 200));                     // -10% -> 20, -20%+ -> 40
  const pct = Number(row.seller && row.seller.pct); const n = Number(row.seller && row.seller.score);
  s += pct >= 99.5 && n >= 500 ? 30 : pct >= 99 && n >= 100 ? 22 : pct >= 98 ? 12 : 4;
  s += row.ship === 0 ? 15 : row.shipUnknown ? 0 : 8;
  s += row.condStated ? 15 : 5;
  return s;
}

const MAX_CONSECUTIVE_ERRORS = 15, MAX_ERROR_SHARE = 0.25; // breaker; see main()

async function main() {
  const cands = candidates();
  const counts = { candidates: cands.length, calls: 0, scanned: 0, verified: 0, deals: 0, heldBelowFloor: 0, errors: 0, rejected: {} };
  const rows = [];
  const t0 = Date.now();
  let consecutiveErrors = 0;
  for (const [i, cand] of cands.entries()) {
    let listings = [], floor = 0.55, under = 0.9;
    try { ({ listings, floor, under } = await comps(cand)); counts.calls++; consecutiveErrors = 0; }
    catch (e) {
      counts.errors++; consecutiveErrors++;
      console.warn(`  ! ${cand.tk} ${cand.card.name} ${cand.grade}: ${e.message}`);
      // Breaker (CoS desk, Oct 23): the Browse quota ran out twice this week (Oct 21, Oct 23) and every call then
      // answers 502/429. Stop spending calls into the wall, and never publish an error-wiped feed over a good one.
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) { console.error(`::error::${consecutiveErrors} /api/comps errors in a row (quota?) - stopping, feed NOT written; the previous feed stays live`); process.exit(1); }
      await sleep(PAUSE_MS * 2); continue;
    }
    counts.scanned += listings.length;
    const kept = [];
    for (const l of listings) {
      if (l.buyingOption && l.buyingOption !== "FIXED_PRICE") continue;
      const why = cand.kind === "bowman" ? verifyBowman(l, cand.wlCard) : verifyPokemon(l, cand.card, cand.grade, cand.ed, cand.wotc, cand.vintage);
      if (why) { const k = why.split(" ").slice(0, 2).join(" "); counts.rejected[k] = (counts.rejected[k] || 0) + 1; continue; }
      const price = Number(l.price); if (!Number.isFinite(price) || price < 1) continue;
      const shipUnknown = !Number.isFinite(l.shipping);
      const ship = shipUnknown ? 0 : Number(l.shipping);
      const total = round2(price + ship);
      const sellerPct = Number(l.seller && l.seller.feedbackPct);
      const sellerN = Number(l.seller && l.seller.feedbackScore);
      if ((Number.isFinite(sellerPct) && sellerPct < MIN_SELLER_PCT) || (Number.isFinite(sellerN) && sellerN < MIN_SELLER_SCORE)) { counts.rejected["seller feedback"] = (counts.rejected["seller feedback"] || 0) + 1; continue; }
      counts.verified++;
      if (total > cand.mark * under) continue;
      if (total < cand.mark * floor) { counts.heldBelowFloor++; continue; }
      const row = {
        tk: cand.tk, idx: cand.idx, page: cand.page, kind: cand.kind, grade: cand.grade,
        cardId: cand.card.id, card: cand.card.name, num: cand.card.num || null,
        cardHref: cand.kind === "pokemon" ? `/card?id=${encodeURIComponent(cand.card.id)}` : cand.page,
        price, ship: shipUnknown ? null : ship, shipUnknown, total,
        mark: round2(cand.mark), markAsOf: cand.markAsOf, markN: cand.markN, markBasis: cand.markBasis,
        disc: round2(total / cand.mark - 1),
        url: l.url, image: l.image || null, ends: l.endDate || null,
        vintage: !!cand.vintage, cond: l.condition || null, condStated: /near mint|like new|new|graded/i.test(String(l.condition || "")),
        seller: l.seller ? { pct: l.seller.feedbackPct ?? null, score: l.seller.feedbackScore ?? null } : null,
      };
      row.score = score(row);
      kept.push(row);
    }
    kept.sort((a, b) => a.disc - b.disc);
    const top = kept.slice(0, KEEP_PER_CARD);
    counts.deals += top.length; rows.push(...top);
    if (top.length) console.log(`  ${cand.tk} ${cand.card.name} ${cand.grade}: ${top.length} deal${top.length === 1 ? "" : "s"} (best ${Math.round(top[0].disc * 100)}% vs $${cand.mark})`);
    if ((i + 1) % 50 === 0) console.log(`… ${i + 1}/${cands.length} (${Math.round((Date.now() - t0) / 1000)}s, ${rows.length} deals)`);
    await sleep(PAUSE_MS);
  }
  rows.sort((a, b) => a.disc - b.disc);
  const feed = {
    _comment: "GENERATED by tools/price-engine/deals.mjs — Buy It Now listings priced below our dated SOLD mark for the exact card and grade. Derived rows only: no listing titles, sellers' names or item ids. mark = the index's own dated sold comp (PriceCharting / SportsCardsPro ungraded, or the graded ladder's 30-day PSA median); the listing is a live eBay ask. Never blended.",
    generated: new Date().toISOString(), day: today(),
    rules: { under: UNDER, floor: FLOOR, vintageBefore: VINTAGE_BEFORE, vintageRawFloor: VINTAGE_RAW_FLOOR, vintageRawNeedsNmClaim: true, minSellerPct: MIN_SELLER_PCT, minSellerScore: MIN_SELLER_SCORE, rawPerTicker: RAW_PER_TICKER, g10PerTicker: G10_PER_TICKER, g9PerTicker: G9_PER_TICKER, keepPerCard: KEEP_PER_CARD, rawMinMark: RAW_MIN_MARK, gradedMinMark: GRADED_MIN_MARK, maxAgeDays: { raw: RAW_MAX_AGE_DAYS, graded: GRADED_MAX_AGE_DAYS, bowman: BOWMAN_MAX_AGE_DAYS } },
    counts, customId: "deals",
    affiliateTagged: rows.some((r) => r.url && r.url.includes("mkevt=")),
    rows,
  };
  console.log(JSON.stringify({ ...counts, seconds: Math.round((Date.now() - t0) / 1000), affiliateTagged: feed.affiliateTagged }, null, 1));
  if (counts.errors > Math.max(10, cands.length * MAX_ERROR_SHARE)) { console.error(`::error::${counts.errors} of ${cands.length} candidates errored - feed NOT written; the previous feed stays live`); process.exit(1); }
  if (DRY) { console.log("--dry: not written"); return; }
  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(path.resolve(OUT), JSON.stringify(feed, null, 1));
  console.log(`wrote ${OUT} (${rows.length} deals)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
