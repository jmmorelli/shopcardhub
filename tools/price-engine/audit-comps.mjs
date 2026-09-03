#!/usr/bin/env node
// audit-comps.mjs - the Pricing Integrity agent's daily instrument (Sep 3 2026).
//
// Mo's rule: the price we quote must be THIS card and nothing else. This script
// runs every watchlist query through the exact same verifyListings() the nightly
// engine uses and shows a human what the mark is made of:
//   - every VERIFIED listing (title + landed price) that can enter the window
//   - every REJECTED listing and the reason
//   - leak heuristics on the verified set: a foreign card code, a parallel word,
//     an aftermarket-signature word, or a price > 3x the window median
//   - sample size (thin < THIN_N) and the dispersion tripwire
// Exit 1 when any card has a suspected leak or a dispersion flag, so a scheduled
// run notices. Read-only: never writes to the price-data branch.
//
// Usage: node tools/price-engine/audit-comps.mjs [--watchlist data/watchlist.json] [--only id,id] [--json] [--quiet]
import fs from "node:fs";
import { verifyListings, cardCode } from "./snapshot-free.mjs";

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith("--")) { const k = a.slice(2); const v = process.argv[i + 1]; if (v && !v.startsWith("--")) { args[k] = v; i++; } else args[k] = true; }
}
const WATCHLIST = args.watchlist || "data/watchlist.json";
const SITE = (process.env.SITE_URL || "https://www.shopcardhub.com").replace(/\/$/, "");
const ONLY = args.only ? String(args.only).split(",") : null;
const THIN_N = 8;
const LEAK_SPORTS = /(refractor|fractor|shimmer|lava|mojo|speckle|wave|atomic|prism|padparadscha|\/\d{1,4}\b|\bcoa\b|\bjsa\b|\bip\b|signed|hangul|variation|redemption|\b(gold|orange|green|blue|purple|red|yellow|pink|black)\b|psa|bgs|sgc|cgc|\btag\s?(mint\s?)?\d|slab|graded|lot\b)/i;
const LEAK_TCG = /(psa|bgs|sgc|cgc|\btag\s?(mint\s?)?\d|\bace\s?\d|slab|graded|fan\s?art|\bdiy\b|placeholder|proxy|custom|damage|reprint|lot\b|bulk|jumbo|metal|gold\s?card)/i;
const TEAM = /\b(red sox|white sox|blue jays|reds)\b/gi;

const wl = JSON.parse(fs.readFileSync(WATCHLIST, "utf8"));
const cards = (wl.cards || []).filter((c) => c.source === "ebay" && c.query && (!ONLY || ONLY.includes(c.id)));
const report = []; let bad = 0;
for (const card of cards) {
  let url = SITE + "/api/comps?q=" + encodeURIComponent(card.query) + "&sort=price&limit=50&customid=price-audit";
  if (card.categoryIds) url += "&category_ids=" + encodeURIComponent(card.categoryIds);
  let j;
  try { const r = await fetch(url, { headers: { Accept: "application/json" } }); if (!r.ok) throw new Error("HTTP " + r.status); j = await r.json(); }
  catch (e) { report.push({ id: card.id, error: String(e.message || e) }); bad++; continue; }
  const { verified, rejected, code, year } = verifyListings(j.listings || [], card, card.label);
  const asks = verified.map((l) => l.total);
  const trim = asks.length >= 12 ? 2 : asks.length >= 8 ? 1 : 0;
  const win = asks.slice(trim, trim + 10);
  const med = win.length ? win.slice().sort((a, b) => a - b)[Math.floor(win.length / 2)] : null;
  const leaks = [], outliers = [];
  for (const l of verified) {
    const t = String(l.title).replace(TEAM, " ");
    const m = ((card.cardType === "tcg-single") ? LEAK_TCG : LEAK_SPORTS).exec(t);
    if (m) leaks.push({ title: l.title, price: l.total, why: "looks like a parallel/aftermarket/graded listing: '" + m[0] + "'" });
    else if (med && l.total > med * 3) outliers.push({ title: l.title, price: l.total, why: `ask ${l.total} is > 3x the window median ${med} (above the window - does not move the mark)` });
  }
  const sorted = asks.slice().sort((a, b) => a - b);
  const q = (p) => sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))] : null;
  const disp = sorted.length >= 6 && q(0.25) ? q(0.75) / q(0.25) : null;
  const flags = [];
  if (leaks.length) flags.push(`${leaks.length} suspected leak(s) in the verified set`);
  if (outliers.length) flags.push(`${outliers.length} high-ask outlier(s) above the window (info)`);
  if (asks.length < THIN_N) flags.push(`thin: ${asks.length} verified asks`);
  if (disp != null && disp >= 4) flags.push(`dispersion: q3/q1 = ${disp.toFixed(1)}x`);
  if (!code && (card.cardType || "chrome-auto") !== "tcg-single" && card.cardType !== "sapphire-base") flags.push("no card code in query - add one (e.g. CPA-XX) so base/aftermarket cards cannot leak");
  if (leaks.length || (disp != null && disp >= 4)) bad++;
  report.push({ id: card.id, label: card.label, code, year, fetched: (j.listings || []).length, verified: asks.length, window: win, mark: med, q1: q(0.25), q3: q(0.75), lo: sorted[0] ?? null, hi: sorted[sorted.length - 1] ?? null, flags, leaks, outliers, verifiedTitles: verified.map((l) => [l.total, l.title]), rejected: rejected.map((r) => [r.price, r.why, r.title]) });
}
if (args.json) { console.log(JSON.stringify({ day: new Date().toISOString().slice(0, 10), bad, cards: report }, null, 2)); }
else {
  for (const r of report) {
    if (r.error) { console.log(`\n## ${r.id}  ERROR ${r.error}`); continue; }
    console.log(`\n## ${r.id}  code=${r.code || "-"} year=${r.year || "-"}  fetched=${r.fetched} verified=${r.verified}  mark=${r.mark ?? "-"}  q1=${r.q1 ?? "-"} q3=${r.q3 ?? "-"}  lo=${r.lo ?? "-"} hi=${r.hi ?? "-"}`);
    for (const f of r.flags) console.log("   !! " + f);
    for (const l of r.leaks) console.log(`   LEAK ${l.price}  ${l.title}  <- ${l.why}`);
    for (const l of r.outliers || []) console.log(`   info ${l.price}  ${l.title}  <- ${l.why}`);
    if (!args.quiet) {
      for (const [p, t] of r.verifiedTitles) console.log(`   V ${String(p).padStart(8)}  ${t}`);
      const byWhy = {}; for (const [, why] of r.rejected) byWhy[why.split(":")[0]] = (byWhy[why.split(":")[0]] || 0) + 1;
      console.log("   rejected: " + Object.entries(byWhy).map(([k, v]) => `${k} x${v}`).join(", "));
    }
  }
  console.log(`\n${cards.length} cards audited - ${bad} with suspected leaks or dispersion flags.`);
}
process.exitCode = bad ? 1 : 0;
