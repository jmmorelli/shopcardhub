#!/usr/bin/env node
// BOW26 — 2026 Bowman 1st Chrome Index builder (Sep 7 2026, CoS weekly run).
//
// AUTOS tab (live): every watchlist card with cardType "chrome-auto" (the 1st
// Bowman Chrome Prospect Autos), price-weighted on the engine's nightly
// verified ASK-FLOOR marks — labeled ask-basis per Mo's Sep 4 directive
// (activate on ask, restate the divisor to hammer basis when hammer coverage
// reaches ~60% of basket value; the level never moves on a basis change).
// 15% single-card cap at (re)constitution: a card whose share would exceed 15%
// of basket value gets fractional units so its share is exactly 15%.
// Level = sum(units_i * price_i) / divisor; divisor = basketValue/100 at
// inception, so the level IS the cumulative return from activation day.
// The page recomputes the level nightly client-side from prices-history.json
// with the FIXED units + divisor stored here — no re-mark job needed. This
// script only (a) creates the entry at inception, or (b) appends a weekly
// history row (run with --remark on Mondays). Reconstitution (changing units,
// adding a card) is a divisor adjustment, logged in divisorLog.
//
// BASE tab (pre-activation): the 100 BCP prospect base cards from
// data/sets/2026-bowman-chrome-baseball.json. Activates when >= 60 of 100
// carry a sourced mark; until then the page lists the universe unpriced.
//
// Usage: node tools/build-bow26.mjs [--feed path.json] [--remark] [--dry]

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REPO = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const FEED_URL = "https://raw.githubusercontent.com/jmmorelli/shopcardhub/price-data/data/prices-latest.json";
const CAP = 0.15;
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const REMARK = args.includes("--remark");
const feedPath = args.includes("--feed") ? args[args.indexOf("--feed") + 1] : null;

const wl = JSON.parse(fs.readFileSync(path.join(REPO, "data/watchlist.json"), "utf8"));
const feed = feedPath
  ? JSON.parse(fs.readFileSync(feedPath, "utf8"))
  : await fetch(FEED_URL).then((r) => r.json());

const autos = (wl.cards || []).filter((c) => c && c.source === "ebay" && c.cardType === "chrome-auto");
const byKey = new Map((feed.cards || []).map((c) => [c.key, c]));

const rows = autos.map((c) => {
  const f = byKey.get("ebay:" + c.id);
  const code = (c.query.match(/\b(CPA-[A-Z]{1,3}\d{0,3})\b/) || [])[1] || c.id;
  const name = (c.label || c.id).split(" — ")[0];
  if (!f || typeof f.last !== "number" || !isFinite(f.last)) {
    throw new Error(`No numeric mark for ${c.id} in feed day ${feed.day} — cannot build basket.`);
  }
  return { key: "ebay:" + c.id, num: code, name, price: f.last };
});

// 15% cap: capped cards hold share = CAP exactly; uncapped hold 1 unit.
// T = S_uncapped / (1 - CAP * kCapped); iterate until the capped set is stable.
let capped = new Set();
let T = 0;
for (let iter = 0; iter < 12; iter++) {
  const sU = rows.filter((r) => !capped.has(r.num)).reduce((s, r) => s + r.price, 0);
  T = sU / (1 - CAP * capped.size);
  const need = rows.filter((r) => !capped.has(r.num) && r.price / T > CAP + 1e-9).map((r) => r.num);
  if (!need.length) break;
  need.forEach((n) => capped.add(n));
}
for (const r of rows) {
  r.units = capped.has(r.num) ? +((CAP * T) / r.price).toFixed(6) : 1;
  r.weight = +(((r.units * r.price) / T) * 100).toFixed(2);
}
const basketValue = +rows.reduce((s, r) => s + r.units * r.price, 0).toFixed(2);
const divisor = +(basketValue / 100).toFixed(6);
const day = feed.day || new Date().toISOString().slice(0, 10);

const setFile = JSON.parse(fs.readFileSync(path.join(REPO, "data/sets/2026-bowman-chrome-baseball.json"), "utf8"));
const bcp = (setFile.groups[0].cards || []).map((c) => ({ num: c.n, name: c.player, team: c.team || null, first: !!c.first }));

const idxPath = path.join(REPO, "data/indices.json");
const idx = JSON.parse(fs.readFileSync(idxPath, "utf8"));

if (idx.BOW26 && REMARK) {
  // Weekly history row from tonight's marks with the FIXED stored units+divisor.
  const B = idx.BOW26;
  const stored = new Map(B.basket.map((b) => [b.key, b]));
  let bv = 0;
  for (const r of rows) {
    const s = stored.get(r.key);
    if (!s) { console.log(`NOTE: ${r.key} not in stored basket — reconstitution needed, skipping it.`); continue; }
    s.prevPrice = s.price; s.prevAsOf = s.asOf;   // movers contract (Aug 31)
    s.price = r.price; s.asOf = day;
    bv += s.units * r.price;
  }
  bv = +bv.toFixed(2);
  const level = +(bv / B.divisor).toFixed(2);
  B.history.push({ date: day, level, basketValue: bv, divisor: B.divisor, note: "weekly re-mark (ask basis, nightly engine marks)" });
  console.log(`BOW26 re-mark ${day}: level ${level} (basket $${bv})`);
} else if (!idx.BOW26) {
  idx.BOW26 = {
    name: "2026 Bowman 1st Chrome Index",
    page: "/bowman-1st-chrome-index",
    base: 100.0,
    status: "live",
    basis: "ask",
    _basisNote: "ASK-BASIS ACTIVATION (Mo, Sep 4 2026 directive — supersedes the sold-only rule above for Bowman indices): constituent marks are the price engine's nightly verified ask-floor medians for the exact card (verifyListings, 7f1d51c). Labeled 'ask basis' on the page. When hammer coverage reaches ~60% of basket value (market-latest.json, inside 30 days), restate the divisor to hammer basis — the level never moves on a basis change; log it in divisorLog. Level moves nightly, computed client-side from prices-history.json with the fixed units + divisor here.",
    inception: day,
    divisor,
    divisorLog: [{ date: day, before: null, after: divisor, why: `inception: basket $${basketValue} / base 100.00 — 10 1st Chrome autos, price-weighted on nightly ask-floor marks, 15% single-card cap (capped: ${[...capped].join(", ") || "none"})` }],
    universeComplete: true,
    universe: rows.map((r) => ({ num: r.num, name: r.name, rarity: "AUTO" })),
    basket: rows.map((r) => ({ num: r.num, name: r.name, rarity: "AUTO", key: r.key, units: r.units, price: r.price, basis: "ask", asOf: day })),
    history: [{ date: day, level: 100.0, basketValue, divisor, note: "inception — ask-basis activation on nightly engine marks; 15% cap applied at constitution" }],
    baseTab: {
      status: "pre-activation",
      note: "Top-100 base Chrome (BCP-151-250). Activates when >= 60 of 100 carry a sourced mark (PriceCharting ungraded solds; paper marks until Chrome streets Sep 9-10, Chrome solds ~3 weeks after). Unpriced cards carry zero weight and enter by divisor adjustment.",
      universe: bcp,
    },
  };
  console.log(`BOW26 inception ${day}: basket $${basketValue}, divisor ${divisor}, capped: ${[...capped].join(", ") || "none"}`);
  for (const r of rows) console.log(`  ${r.num.padEnd(8)} ${r.name.padEnd(18)} $${String(r.price).padEnd(8)} units ${r.units} weight ${r.weight}%`);
} else {
  console.log("BOW26 already exists; use --remark for a weekly history row.");
}

if (!DRY) fs.writeFileSync(idxPath, JSON.stringify(idx, null, 1));
console.log(DRY ? "(dry run — nothing written)" : "data/indices.json written.");
