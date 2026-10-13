#!/usr/bin/env node
// uncap-indices.mjs — UNCAP every set index (Mo, Oct 12 2026: "Change the cap now. I approve everything.").
//
// The ruling: a set index is the cost of ONE COPY OF EVERY CARD in the basket, indexed to 100 at its base month. Weights are
// price ÷ basket value and move with prices; nothing is ever trimmed, so there is no rebalance step — only reconstitution
// (membership, via the divisor). The 25% single-card cap and the 5/50 group cap (Select Sector SPDR rule, Sep 15/25 2026)
// are retired on every ticker: they bound on 18 of 38 live indices, every one Pokémon, always on the card the set is known for
// (Base Set held 0.47 of a Charizard). Concentration is PUBLISHED instead (top-card weight, effective holdings, an ex-top-card
// line where the top card is ≥ 25%).
//
// Per ticker (data/indices.json):
//   1. every basket weight w in (0,1) → 1 (w = 0 line-only rows — TH26's RGB Mews, Mo Oct 4 — stay 0; that is a scope ruling, not a cap)
//   2. a ticker whose weights changed AND that carries a monthly reconstruction (.recon) gets the reconstruction re-chained on
//      the uncapped weights from PriceCharting's monthly history (same series the Sep 30 rebase used), base month unchanged;
//      today's level is re-linked to that chain and every live history row is rescaled by ONE factor (% moves unchanged) —
//      so the whole series, base → today, is on one method. The divisor is re-struck from the uncapped basket value.
//   3. a ticker whose weights changed but has no reconstruction keeps its level: divisor = Σprice ÷ level (logged).
//   4. a ticker with no weight below 1 is numerically untouched: metadata + log only.
//   5. a sector ticker whose top weighted card is ≥ 25% gets an EX sub-line ("ex-<card>", kind "ex"): the basket without that
//      card, price-weighted, chained from the same base month on the same series, so the two lines read against each other
//      from release. tools/build-sector-index.mjs marks and renders it.
// Every change is a divisorLog row; weight changes are capLog rows (w 1, note "uncapped"). cap → null, capRule → the ruling.
//
// Usage: node tools/uncap-indices.mjs [--ticker BS99,EVS21] [--dry] [--no-net]   (default: every ticker with a basket)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const DRY = args.includes("--dry"), NONET = args.includes("--no-net");
const TODAY = process.env.SIDX_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => Math.round(x * 100) / 100, r4 = (x) => Math.round(x * 1e4) / 1e4, r6 = (x) => Math.round(x * 1e6) / 1e6;
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CONC = +opt("--workers", 3), PAUSE = +opt("--pause", 1200);
const EX_AT = 0.25;

const UNCAP_RULE = "uncapped — price-weighted: the index is the cost of one copy of every card in the basket, indexed to 100 at the base month; weights are price ÷ basket value and move with prices; no cap, no rebalance — membership changes only, through the divisor (Mo, Oct 12 2026)";
const WHY_HEAD = `UNCAPPED (Mo, Oct 12 2026: "Change the cap now"). The 25% single-card cap and the 5/50 group cap are retired on every ticker: an ETF can trim a position, a set cannot, and the cap bound only on the card each set is known for. The index is now the cost of one copy of every card in the basket; concentration is published (top-card weight, effective holdings, an ex-top-card line where the top card is 25% or more) instead of suppressed.`;

// PriceCharting item page → { "YYYY-MM": price } monthly ungraded history (VGPC.chart_data.used), the Sep 30 rebase's series
async function series(p) {
  for (let i = 1; i <= 4; i++) {
    let r;
    try { r = await fetch("https://www.pricecharting.com/game/" + p, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(45000) }); }
    catch (e) { await sleep(5000 * i); continue; }
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const h = await r.text();
    const m = h.match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/);
    if (!m) return {};
    const out = {};
    for (const [ms, cents] of (JSON.parse(m[1]).used || [])) { if (!cents) continue; const d = new Date(ms + 12 * 3600e3); out[d.toISOString().slice(0, 7)] = cents / 100; }
    return out;
  }
  throw new Error("rate limited: " + p);
}
const CACHE_FILE = process.env.UNCAP_CACHE || null;
const CACHE = new Map();
if (CACHE_FILE && fs.existsSync(CACHE_FILE)) { try { for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(CACHE_FILE, "utf8")))) CACHE.set(k, v); } catch (e) {} }
const saveCache = () => { if (CACHE_FILE) fs.writeFileSync(CACHE_FILE, JSON.stringify(Object.fromEntries(CACHE))); };
async function fetchSeries(rows, label) {
  const todo = rows.filter((b) => !CACHE.has(b.path));
  let done = 0, i = 0;
  const worker = async () => {
    while (i < todo.length) {
      const b = todo[i++];
      try { CACHE.set(b.path, await series(b.path)); } catch (e) { console.error(`  ${label} ${b.name} #${b.num}: ${e.message}`); CACHE.set(b.path, {}); }
      done++; if (done % 25 === 0) { saveCache(); console.log(`  ${label}: ${done}/${todo.length} series read`); }
      await sleep(PAUSE);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONC, todo.length) }, worker));
  saveCache();
  return rows.map((b) => ({ b, s: CACHE.get(b.path) || {} }));
}
// chain-link a monthly level series on cards priced in both months; weights = b.w (all 1 after the uncap)
function chain(cards, base, upto) {
  const months = [...new Set(cards.flatMap((c) => Object.keys(c.s)))].sort().filter((m) => m >= base && m < upto);
  if (!months.length || months[0] !== base) return null;
  const L = { [base]: 100 };
  for (let i = 1; i < months.length; i++) {
    const a = months[i - 1], m = months[i];
    const both = cards.filter((c) => c.s[a] && c.s[m]);
    const num = both.reduce((s, c) => s + c.b.w * c.s[m], 0), den = both.reduce((s, c) => s + c.b.w * c.s[a], 0);
    L[m] = den ? L[a] * (num / den) : L[a];
  }
  return { months, L };
}
// today's level implied by the chain: L[last] × Σw·mark ÷ Σw·chart[last] on cards priced in the last recon month
function link(cards, L, last) {
  const lk = cards.filter((c) => c.s[last] && c.b.price != null);
  const num = lk.reduce((s, c) => s + c.b.w * c.b.price, 0), den = lk.reduce((s, c) => s + c.b.w * c.s[last], 0);
  return den ? L[last] * (num / den) : null;
}
const marksOnly = (h) => (h || []).filter((r) => r && r.kind !== "divisor");

const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const want = (opt("--ticker", "") || "").split(",").map((s) => s.trim()).filter(Boolean);
const tickers = Object.keys(IDX).filter((t) => IDX[t] && typeof IDX[t] === "object" && Array.isArray(IDX[t].basket) && IDX[t].basket.length && (!want.length || want.includes(t)));
const report = [];
for (const tk of tickers) {
  const x = IDX[tk];
  const hist = x.history || [], lastRow = hist[hist.length - 1];
  if (!lastRow) { console.log(`${tk}: no history — skipped`); continue; }
  const level = lastRow.level;
  const wOf = (b) => (b.w == null ? 1 : b.w);
  const priced = x.basket.filter((b) => typeof b.price === "number");
  const bvBefore = r2(priced.reduce((s, b) => s + b.price * wOf(b), 0));
  const lvlCheck = x.divisor ? r2(bvBefore / x.divisor) : null;
  if (lvlCheck != null && Math.abs(lvlCheck - level) > 0.02) { console.error(`${tk}: stored level ${level} ≠ Σpx·w/divisor ${lvlCheck} — refusing to touch an inconsistent ticker`); report.push({ tk, status: "REFUSED (inconsistent)" }); continue; }
  const changed = priced.filter((b) => wOf(b) > 0 && wOf(b) < 1).map((b) => ({ b, was: wOf(b) }));
  const lineOnly = priced.filter((b) => wOf(b) === 0);
  for (const b of x.basket) { if (b.w === 0) continue; b.w = 1; }
  const bvAfter = r2(priced.reduce((s, b) => s + b.price * b.w, 0));
  const weighted = priced.filter((b) => b.w > 0).sort((a, b) => b.price - a.price);
  const top = weighted[0], topW = top ? top.price / bvAfter : 0;
  const hhi = weighted.reduce((s, b) => s + Math.pow(b.price / bvAfter, 2), 0);
  const before = x.divisor;
  const hasRecon = Array.isArray(x.recon) && x.recon.length > 0 && x.baseDate;
  const needRecon = changed.length > 0 && hasRecon;
  const needEx = x.model === "sector" && topW >= EX_AT && !(x.sub && x.sub.EX);
  let divisor = before, newLevel = level, factor = 1, reconNote = "", exNote = "";
  let cards = null;
  if ((needRecon || needEx) && !NONET) {
    console.log(`${tk}: reading ${weighted.length} monthly series (${needRecon ? "re-chain the reconstruction" : ""}${needRecon && needEx ? " + " : ""}${needEx ? `ex-${top.name} line` : ""}) …`);
    cards = await fetchSeries(weighted, tk);
  }
  const incM = String(x.inception).slice(0, 7);
  if (needRecon) {
    if (!cards) { console.error(`${tk}: --no-net but the reconstruction needs re-chaining — level kept, recon left as is (FLAG)`); reconNote = " RECON NOT RE-CHAINED (--no-net)."; divisor = r6(bvAfter / level); }
    else {
      const ch = chain(cards, x.baseDate, incM);
      const lastFull = ch && ch.months[ch.months.length - 1];
      const lk = ch ? link(cards, ch.L, lastFull) : null;
      if (!ch || lk == null) { console.error(`${tk}: could not re-chain from ${x.baseDate} — level kept, recon left as is (FLAG)`); reconNote = " RECON NOT RE-CHAINED (chain failed)."; divisor = r6(bvAfter / level); }
      else {
        const cov = cards.filter((c) => c.s[x.baseDate]).reduce((s, c) => s + c.b.price, 0) / bvAfter;
        factor = lk / level;
        newLevel = r2(level * factor);
        for (const h of hist) { h.level = r2(h.level * factor); }
        divisor = r6(bvAfter / newLevel);
        for (const h of hist) { if (h.divisor != null) h.divisor = divisor; }
        const oldRecon = x.recon;
        x.recon = ch.months.map((m) => ({ month: m, level: r2(ch.L[m]) }));
        x.reconBasis = "monthly, reconstructed from PriceCharting ungraded price history, current basket, price-weighted and uncapped, chain-linked on cards priced in both months; not live marks";
        x.rebase = { ...(x.rebase || {}), uncap: { date: TODAY, factor: r6(factor), levelBefore: level, levelAfter: newLevel, reconMonths: x.recon.length, baseCoverage: r4(cov) } };
        reconNote = ` Monthly reconstruction re-chained on uncapped weights from ${x.baseDate} (${x.recon.length} months, base-month coverage ${(cov * 100).toFixed(0)}% of today's basket by value; was ${oldRecon.length} months); today's level re-linked to the chain: ${level} → ${newLevel} (every live row × ${factor.toFixed(6)}, % moves unchanged).`;
      }
    }
  } else if (changed.length) {
    divisor = r6(bvAfter / level);
    reconNote = hasRecon ? "" : " No monthly reconstruction on this ticker, so the level is kept and the divisor re-struck.";
  }
  if (needEx && cards) {
    const exCards = cards.filter((c) => c.b !== top);
    const exVal = r2(exCards.reduce((s, c) => s + c.b.price, 0));
    let exLevel = newLevel, exRecon = [];
    const ch = x.baseDate ? chain(exCards, x.baseDate, incM) : null;
    if (ch) { const last = ch.months[ch.months.length - 1]; const lk = link(exCards, ch.L, last); if (lk != null) { exLevel = r2(lk); exRecon = ch.months.map((m) => ({ month: m, level: r2(ch.L[m]) })); } }
    x.sub = x.sub || {};
    x.sub.EX = {
      kind: "ex", name: `ex-${top.name}`, nums: [String(top.num)],
      blurb: `${x.name.replace(/ Index$/, "")} without ${top.name} #${top.num} — the other ${exCards.length} cards, one copy each. ${top.name} is ${(topW * 100).toFixed(1)}% of the index; this line is what the rest of the set did.`,
      divisor: r4(exVal / exLevel), baseDate: exRecon.length ? x.baseDate : undefined, recon: exRecon.length ? exRecon : undefined,
      history: [{ date: TODAY, level: exLevel, basketValue: exVal, priced: exCards.length, note: exRecon.length ? "launched — months before are reconstructed from the same monthly series as the index, same base month" : `launched at the index level on ${TODAY}` }],
    };
    if (!exRecon.length) delete x.sub.EX.baseDate, delete x.sub.EX.recon;
    exNote = ` EX line added: ${x.sub.EX.name} at ${exLevel} (${exRecon.length ? `chained from ${x.baseDate}` : "launched at the index level"}).`;
  } else if (needEx && !cards) exNote = " EX line NOT added (--no-net).";
  x.divisor = divisor;
  x.cap = null;
  x.capRule = UNCAP_RULE;
  if (x.reconstitution && typeof x.reconstitution === "object") x.reconstitution = { ...x.reconstitution, cadence: String(x.reconstitution.cadence || "").replace(/quarterly rebalance[^;]*;?\s*/i, "quarterly reconstitution (membership only — no weight resets), first Monday of Jan/Apr/Jul/Oct; ").replace(/\s+;/g, ";") };
  x.capLog = x.capLog || [];
  x.capLog.push(...changed.map(({ b }) => ({ date: TODAY, num: b.num, name: b.name, w: 1, note: "uncapped" })));
  x.uncapped = { date: TODAY, weightsReset: changed.length, lineOnly: lineOnly.length, topCard: top ? `${top.name} #${top.num}` : null, topWeight: r4(topW), effectiveHoldings: hhi ? r2(1 / hhi) : null };
  const why = `${WHY_HEAD} ${changed.length ? `${changed.length} weight${changed.length === 1 ? "" : "s"} reset to 1: ${changed.map(({ b, was }) => `${b.name} #${b.num} (was ${was})`).join(", ")}.` : "No weight was below 1, so the level and divisor are unchanged — metadata only."}${lineOnly.length ? ` ${lineOnly.length} line-only row${lineOnly.length === 1 ? "" : "s"} (weight 0 by scope ruling, not by cap) unchanged: ${lineOnly.map((b) => `${b.name} #${b.num}`).join(", ")}.` : ""} Basket value Σpx·w $${bvBefore} → $${bvAfter} (one copy of each of ${weighted.length} priced cards); divisor ${before} → ${divisor}.${reconNote}${exNote} Top card ${top ? `${top.name} #${top.num} ${(topW * 100).toFixed(1)}%` : "—"}, effective holdings ${hhi ? (1 / hhi).toFixed(1) : "—"}.`;
  x.divisorLog = x.divisorLog || [];
  x.divisorLog.push({ date: TODAY, before, after: divisor, why });
  report.push({ tk, status: changed.length ? (needRecon ? "uncapped + re-chained" : "uncapped") : "no-op", reset: changed.length, levelBefore: level, levelAfter: newLevel, divisor: `${before}→${divisor}`, top: top ? `${top.name} ${(topW * 100).toFixed(1)}%` : "", eff: hhi ? (1 / hhi).toFixed(1) : "", ex: x.sub && x.sub.EX ? x.sub.EX.name : "" });
  console.log(`${tk}: ${report[report.length - 1].status} · reset ${changed.length} · level ${level} → ${newLevel} · divisor ${before} → ${divisor} · top ${top ? `${top.name} ${(topW * 100).toFixed(1)}%` : "—"} · eff ${hhi ? (1 / hhi).toFixed(1) : "—"}${exNote}`);
}
if (!DRY) { IDX.updated = TODAY; fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n"); console.log("wrote data/indices.json"); } else console.log("--dry: nothing written");
console.log("\nticker | status | weights reset | level before → after | top card | eff. holdings | ex line");
for (const r of report) console.log(`${r.tk} | ${r.status} | ${r.reset ?? ""} | ${r.levelBefore ?? ""} → ${r.levelAfter ?? ""} | ${r.top ?? ""} | ${r.eff ?? ""} | ${r.ex ?? ""}`);
