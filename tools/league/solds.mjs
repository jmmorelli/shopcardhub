#!/usr/bin/env node
// solds.mjs — dated SOLD comps for one card, from PriceCharting's public item page (no login, no key).
// League agents use this for every price they publish (LANE-RULES R18/R20: sold data only; asks are asks).
//
// Usage: node tools/league/solds.mjs <pricecharting-path> [--grade "PSA 10"] [--json]
//   e.g. node tools/league/solds.mjs pokemon-scarlet-violet-151/charizard-ex-199
//        node tools/league/solds.mjs football-cards-2026-topps-flagship/carnell-tate-318 --grade "PSA 10"
// Prints: n, window, median (30-day when n>=3, else 90-day when n>=2, else none) and the dated rows.
// A read of 30 rows is the 30 MOST RECENT (the tab is capped) — publish count + window beside the median.
// Only dates and prices leave the page (R17): titles are shown here for sanity, never published.
import { soldRows, medianOf } from "./lib.mjs";

const args = process.argv.slice(2);
const p = args.find((a) => !a.startsWith("--"));
if (!p) { console.error("usage: solds.mjs <pricecharting-path> [--grade \"PSA 10\"] [--json]"); process.exit(2); }
const grade = args.includes("--grade") ? args[args.indexOf("--grade") + 1] : null;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url) {
  for (let i = 1; i <= 3; i++) {
    const r = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
    if (r.status === 429 || r.status === 403) { await sleep(5000 * i); continue; }
    if (!r.ok) throw new Error(url + " -> HTTP " + r.status);
    return await r.text();
  }
  throw new Error(url + " -> rate limited after 3 attempts");
}
const html = await get("https://www.pricecharting.com/game/" + p.replace(/^\/+/, ""));
let cls = "used";
if (grade) {
  // find the tab whose label matches the grade ("PSA 10", "Grade 9", "SGC 9.5")
  // the condition <select> is the reliable label map: <option value="completed-auctions-manual-only">PSA 10 (30)
  // (the tab links are not — "Grade 9" and "sales per day" both sit near data-show-tab; Sep 26 2026, agent B)
  const tabs = [...html.matchAll(/<option[^>]*value="completed-auctions-([a-z0-9-]+)"[^>]*>([^<(]+)/g)].map((m) => ({ cls: m[1], label: m[2].trim() }));
  const hit = tabs.find((t) => t.label.toLowerCase() === grade.toLowerCase()) || tabs.find((t) => t.label.toLowerCase().startsWith(grade.toLowerCase()));
  if (!hit) { console.error("no tab for grade " + grade + "; tabs: " + tabs.map((t) => t.label).join(" | ")); process.exit(1); }
  cls = hit.cls;
}
const rows = soldRows(html, cls);
const today = new Date();
const days = (d) => Math.round((today - new Date(d + "T12:00:00Z")) / 864e5);
const r30 = rows.filter((r) => days(r.date) <= 30), r90 = rows.filter((r) => days(r.date) <= 90);
const mark = r30.length >= 3 ? { basis: "30d", n: r30.length, median: medianOf(r30.map((r) => r.price)) }
  : r90.length >= 2 ? { basis: "90d", n: r90.length, median: medianOf(r90.map((r) => r.price)) } : null;
const out = { path: p, tab: cls, grade: grade || "ungraded", n: rows.length, capped: rows.length >= 30, windowFrom: rows.at(-1)?.date || null, windowTo: rows[0]?.date || null, mark, rows: rows.map(({ date, price }) => ({ date, price })) };
if (args.includes("--json")) { console.log(JSON.stringify(out, null, 1)); }
else {
  console.log(`${p} [${out.grade}] n=${out.n}${out.capped ? " (capped at 30 most recent)" : ""} window ${out.windowFrom}..${out.windowTo}`);
  console.log(mark ? `mark: $${mark.median.toFixed(2)} (median of ${mark.n} sales, ${mark.basis})` : "mark: none (fewer than 3 sales in 30d and fewer than 2 in 90d)");
  for (const r of rows.slice(0, 12)) console.log(`  ${r.date}  $${r.price.toFixed(2)}  ${r.title.slice(0, 70)}`);
}
