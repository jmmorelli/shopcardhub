#!/usr/bin/env node
// base-prices.mjs — give every chase-basket card its RELEASE-MONTH price so the holdings table can show "Since Release".
//
// Mo, Oct 12 2026: the chase pages' per-card column read "Since Launch" but measured against our Aug 24 2026 activation
// mark (data-launch) — so a DR25 card that is −4% since the May 2025 release showed −18.6%, and the whole index looked
// inception-based. This writes basket[i].basePx = PriceCharting's monthly ungraded price for the index's base month
// (the same series and month the index level is chained to in tools/build-recon.mjs), plus basePxMonth. A card with no
// price in that month gets basePx null and the table shows "—" (nothing is estimated).
//
// Usage: node tools/base-prices.mjs --ticker PB26,CR26,AH26,PRIS25,DR25,PF25 [--force]
//   Idempotent: a card that already has basePx for the current base month is not re-fetched unless --force.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const TKS = (args[args.indexOf("--ticker") + 1] || "").split(",").filter(Boolean);
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function series(p) {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch("https://www.pricecharting.com/game/" + p, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const h = await r.text();
    const m = h.match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/);
    const out = {};
    if (m) for (const [ms, cents] of (JSON.parse(m[1]).used || [])) { if (!cents) continue; out[new Date(ms + 12 * 3600e3).toISOString().slice(0, 7)] = cents / 100; }
    await sleep(700);
    return out;
  }
  throw new Error("rate limited");
}

const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
for (const tk of TKS) {
  const x = IDX[tk]; if (!x) { console.error("no ticker " + tk); continue; }
  if (!x.baseDate) { console.log(`${tk}: no baseDate — skip`); continue; }
  let fetched = 0, priced = 0, missing = [];
  for (const b of x.basket) {
    if (!FORCE && b.basePxMonth === x.baseDate && (b.basePx > 0 || b.basePx === null)) { if (b.basePx > 0) priced++; else missing.push(b.num); continue; }
    try {
      const s = await series(b.path); fetched++;
      b.basePx = s[x.baseDate] > 0 ? s[x.baseDate] : null; b.basePxMonth = x.baseDate;
      if (b.basePx > 0) priced++; else missing.push(b.num);
    } catch (e) { console.error(tk, b.path, e.message); }
  }
  console.log(`${tk}: base ${x.baseDate} · ${priced}/${x.basket.length} cards priced in the base month (${fetched} fetched)${missing.length ? ` · no base price: #${missing.join(", #")}` : ""}`);
}
fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n");
console.log("wrote data/indices.json");
