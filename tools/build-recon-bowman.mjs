#!/usr/bin/env node
// build-recon-bowman.mjs — put the Bowman tickers (BOW26 · BB26 · BCB26, main line AND the BASE sub-index) on the
// release-date base (Mo, Oct 1 2026: "start at release date" — the Sep 30 Pokémon rule, extended to Bowman).
// Same method as tools/build-recon.mjs (PriceCharting VGPC.chart_data.used = monthly ungraded history, chain-linked on
// cards priced in both months, today's basket and weights, one factor per line rescales history + divisor, logged), with
// three Bowman-specific differences:
//   1. COHORT coverage. BOW26 is a year cohort: September's Chrome autos did not exist in May. A month's 90% coverage test
//      counts only cards whose release is on or before that month (May cards = BB26's universe; the rest = September).
//   2. The live link goes to the LAST live mark (L[last recon month] × Σw·mark ÷ Σw·chart), not to inception, so the
//      factor is exact for the row it is linked on.
//   3. A ticker whose release month IS its inception month (BCB26: street Sep 9, first sold mark Sep 25) gets the base
//      label and no reconstruction — there is no full month before the first mark to rebuild, and no level is invented.
// Usage: node tools/build-recon-bowman.mjs [--check]     (idempotent: a line that already has baseDate is skipped)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CHECK = process.argv.includes("--check");
const TODAY = process.env.SIDX_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => Math.round(x * 100) / 100;
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monName = (m) => `${MONS[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const longDate = (d) => `${MONS[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}, ${d.slice(0, 4)}`;
const CACHE = new Map();

async function series(p) {
  if (CACHE.has(p)) return CACHE.get(p);
  for (let i = 1; i <= 4; i++) {
    const r = await fetch("https://www.pricecharting.com/game/" + p, { headers: { "User-Agent": UA, Accept: "text/html" } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const h = await r.text();
    const m = h.match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/);
    const out = {};
    if (m) for (const [ms, cents] of (JSON.parse(m[1]).used || [])) { if (!cents) continue; out[new Date(ms + 12 * 3600e3).toISOString().slice(0, 7)] = cents / 100; }
    CACHE.set(p, out); await sleep(700);
    return out;
  }
  throw new Error("rate limited: " + p);
}

const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const MAY = String(IDX.BB26.releaseDate).slice(0, 7);
const mayNums = new Set([...(IDX.BB26.universe || []), ...((IDX.BB26.sub && IDX.BB26.sub.BASE && IDX.BB26.sub.BASE.universe) || [])].map((u) => String(u.num)));
const SEP = String(IDX.BCB26.releaseDate).slice(0, 7);
const cardRel = (tk, b) => tk === "BB26" ? MAY : tk === "BCB26" ? SEP : (mayNums.has(String(b.num)) ? MAY : SEP);

async function rebase(tk, x, line, label) {
  // line = the object carrying basket/history/divisor (the ticker itself, or x.sub.BASE)
  if (line.baseDate && !CHECK) { console.log(`${label}: already based (${line.baseDate}) — skip`); return; }
  const rel = String(x.releaseDate).slice(0, 7), incM = String(x.inception).slice(0, 7);
  const hist = line.history, last = hist[hist.length - 1];
  const stamp = (factor, base, rule, recon, note) => {
    if (CHECK) { console.log(`${label} check: base ${base} (${rule}) · factor ${factor.toFixed(6)} · recon ${recon.map((r) => r.month + "=" + r.level).join(" ")} · last ${r2(last.level * factor)}`); return; }
    const before = line.divisor;
    line.divisor = +(line.divisor / factor).toFixed(6);
    for (const h of hist) { h.level = r2(h.level * factor); if (h.divisor != null) h.divisor = line.divisor; }
    line.recon = recon; line.baseDate = base; line.baseRule = rule; line.baseNote = note;
    if (recon.length) line.reconBasis = "monthly, reconstructed from PriceCharting ungraded price history, current basket and weights, chain-linked on cards priced in both months; not live marks";
    line.rebase = { date: TODAY, factor: +factor.toFixed(6), ruling: "Mo 2026-10-01 in chat: \"Start at release date\" — Bowman indices based at the release month, like every Pokémon index (Sep 30)", inceptionLevel: hist[0].level };
    (line.divisorLog = line.divisorLog || []).push({ date: TODAY, before, after: line.divisor, why: `BASE (release-date rule, Mo Oct 1). ${note}. Every level × ${factor.toFixed(6)}; shape and % moves unchanged.` });
    console.log(`${label}: base ${base} (${rule}) · ${recon.length} recon months · factor ${factor.toFixed(4)} · level ${last.level}`);
  };
  if (rel === incM) {
    // BCB26: the first sold mark (Sep 25) sits inside the release month — label only, factor 1, nothing reconstructed.
    return stamp(1, rel, "release", [], `100 = ${monName(rel)}, the release month — the first sold-basis mark is ${longDate(x.inception)}, ${Math.round((Date.parse(x.inception) - Date.parse(x.releaseDate)) / 864e5)} days after the ${longDate(x.releaseDate)} street date, so release-week sales are not in the level`);
  }
  const cards = [];
  for (const b of line.basket) { try { cards.push({ b, rel: cardRel(tk, b), s: await series(b.path) }); } catch (e) { console.error(label, b.path, e.message); } }
  const val = (c) => c.b.price * (c.b.w == null ? 1 : c.b.w);
  const months = [...new Set(cards.flatMap((c) => Object.keys(c.s)))].filter((m) => m >= rel && m < incM).sort();
  const cov = (m) => { const pool = cards.filter((c) => c.rel <= m); const tot = pool.reduce((a, c) => a + val(c), 0); return tot ? pool.filter((c) => c.s[m]).reduce((a, c) => a + val(c), 0) / tot : 0; };
  for (const m of months) console.log(`  ${label} ${m}: cohort coverage ${(cov(m) * 100).toFixed(1)}%`);
  const base = months.find((m) => cov(m) >= 0.9);
  if (!base) { console.error(`${label}: no month before inception covers 90% of the cohort — not rebased`); return; }
  const rule = "release";
  const L = { [base]: 100 };
  const ms = months.filter((m) => m >= base);
  const w = (c) => (c.b.w == null ? 1 : c.b.w);
  for (let i = 1; i < ms.length; i++) {
    const a = ms[i - 1], m = ms[i];
    const both = cards.filter((c) => c.s[a] && c.s[m]);
    const num = both.reduce((s, c) => s + w(c) * c.s[m], 0), den = both.reduce((s, c) => s + w(c) * c.s[a], 0);
    L[m] = den ? L[a] * (num / den) : L[a];
  }
  const lastM = ms[ms.length - 1];
  // Link at INCEPTION on the cards priced in the last recon month: L[lastM] × Σw·inception mark ÷ Σw·chart[lastM]. The live
  // history (which, for BOW26, also carries September's cards from inception on) then keeps its own % moves untouched.
  // A card's inception mark is its prevPrice when that read is dated at inception (two-row history), else its price when
  // its own read is dated at inception; cards with neither are left out of the link (logged).
  const incPx = (b) => b.prevAsOf === x.inception && b.prevPrice > 0 ? b.prevPrice : b.asOf === x.inception ? b.price : (hist.length === 1 ? b.price : null);
  const lk = cards.filter((c) => c.s[lastM] && incPx(c.b) != null);
  const skipped = cards.filter((c) => c.s[lastM] && incPx(c.b) == null).length;
  if (skipped) console.log(`  ${label}: ${skipped} card(s) without an inception-dated read left out of the link`);
  const linkLevel = L[lastM] * lk.reduce((s, c) => s + w(c) * incPx(c.b), 0) / lk.reduce((s, c) => s + w(c) * c.s[lastM], 0);
  const factor = linkLevel / hist[0].level;
  const note = base === rel ? `100 = ${monName(base)}, the release month (${longDate(x.releaseDate)} street date)`
    : `100 = ${monName(base)}, the first month PriceCharting's monthly history covers 90% of the basket by value (release ${longDate(x.releaseDate)})`;
  stamp(factor, base, base === rel ? "release" : "first-reliable", ms.map((m) => ({ month: m, level: r2(L[m]) })), note);
}

for (const tk of ["BB26", "BOW26", "BCB26"]) {
  const x = IDX[tk]; if (!x) { console.error("no ticker " + tk); continue; }
  await rebase(tk, x, x, tk);
  if (x.sub && x.sub.BASE && x.sub.BASE.basket) await rebase(tk, x, x.sub.BASE, tk + "·BASE");
  // the chart shades the first 30 days after street: the release-premium window (KB 04 §2 — most 1st Bowman autos print
  // their high in release week and slide as supply posts). A band, not a level change.
  if (!CHECK) x.releaseWindowDays = 30;
}
if (!CHECK) fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n");
console.log(CHECK ? "check only — nothing written" : "wrote data/indices.json");
