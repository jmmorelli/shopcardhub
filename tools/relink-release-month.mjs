#!/usr/bin/env node
// relink-release-month.mjs — finish the release-date base for a ticker that LAUNCHED INSIDE its release month.
//
// Mo, Oct 12 2026: "I think we are still going from our own inception date on the newer sets and we need to change that to
// the product launch date and backdate the prices and marks." He was right about two tickers: TH26 (30th Celebration,
// street Sep 16, first mark Sep 25) and BCB26 (2026 Bowman Chrome, street Sep 9, first mark Sep 25). Both were labelled
// "100 = Sep 2026" by the Sep 30 / Oct 1 rebases but carried factor 1 — 100 was our first live mark, not the release month —
// because September was still open and PriceCharting's month point did not exist yet. It does now.
//
// METHOD (the same chain tools/build-recon.mjs uses for every other Pokémon ticker): PriceCharting's monthly ungraded
// history (VGPC.chart_data.used) gives one price per card for the release month. On the cards priced in that month,
//     level_today = 100 × Σ(w · today's mark) ÷ Σ(w · PC release-month price)
// One factor = level_today ÷ current level rescales every history row and the divisor; % moves between marks are unchanged.
// Coverage gate: the release-month prices must cover ≥ 90% of today's basket value, else the line is left alone (logged).
// The release month becomes recon[0] = 100 so the chart draws the base point like every other release-based ticker.
//
// Usage: node tools/relink-release-month.mjs --ticker TH26,BCB26 [--check]
//   Idempotent: a line whose rebase.linkedToMonth is already set is skipped.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const TKS = (args[args.indexOf("--ticker") + 1] || "").split(",").filter(Boolean);
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
  throw new Error("rate limited");
}

const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
const w = (b) => (b.w == null ? 1 : b.w);

// line = the object carrying divisor/history (the ticker, or a sub-index); cards = the basket rows that price it
async function relink(x, line, cards, label) {
  const rel = String(x.releaseDate || "").slice(0, 7), incM = String(x.inception || "").slice(0, 7);
  if (!rel || rel !== incM) { console.log(`${label}: inception ${incM} is not inside the release month ${rel} — not this tool's case`); return; }
  if (line.rebase && line.rebase.linkedToMonth) { console.log(`${label}: already linked to ${line.rebase.linkedToMonth} — skip`); return; }
  if (TODAY.slice(0, 7) <= rel) { console.log(`${label}: release month ${rel} is still open — wait for it to close`); return; }
  const hist = line.history || [];
  if (!hist.length) { console.log(`${label}: no history`); return; }
  const rows = [];
  for (const b of cards) { if (!(w(b) > 0) || !(b.price > 0)) continue; try { rows.push({ b, s: await series(b.path) }); } catch (e) { console.error(label, b.path, e.message); } }
  const total = rows.reduce((a, r) => a + r.b.price * w(r.b), 0);
  const inM = rows.filter((r) => r.s[rel] > 0);
  const cov = inM.reduce((a, r) => a + r.b.price * w(r.b), 0) / total;
  const sumNow = inM.reduce((a, r) => a + w(r.b) * r.b.price, 0), sumRel = inM.reduce((a, r) => a + w(r.b) * r.s[rel], 0);
  const last = hist[hist.length - 1];
  const levelNow = 100 * sumNow / sumRel;
  const factor = levelNow / last.level;
  console.log(`${label}: ${inM.length}/${rows.length} cards priced in ${rel} · coverage ${(cov * 100).toFixed(1)}% · Σnow $${sumNow.toFixed(2)} vs Σ${rel} $${sumRel.toFixed(2)} · level ${last.level} → ${levelNow.toFixed(2)} (×${factor.toFixed(6)})`);
  if (cov < 0.9) { console.error(`${label}: release-month prices cover ${(cov * 100).toFixed(1)}% < 90% of the basket — not relinked`); return; }
  if (CHECK) return;
  const before = line.divisor;
  line.divisor = +(line.divisor / factor).toFixed(6);
  for (const h of hist) { h.level = r2(h.level * factor); if (h.divisor != null) h.divisor = line.divisor; }
  line.recon = [{ month: rel, level: 100 }];
  line.reconBasis = "the release month is PriceCharting's monthly ungraded price for each card, chain-linked to today's marks on the cards priced in both; not a live mark";
  line.baseDate = rel; line.baseRule = "release";
  line.baseNote = `100 = ${monName(rel)}, the release month (${longDate(x.releaseDate)} street date) — PriceCharting's month price for every card, so release-week sales are in the base; live marks since ${longDate(x.inception)}`;
  line.rebase = Object.assign({}, line.rebase || {}, { date: TODAY, factor: +((line.rebase && line.rebase.factor || 1) * factor).toFixed(6), linkedToMonth: rel, linkFactor: +factor.toFixed(6), linkCoverage: +cov.toFixed(4), linkCards: inM.length, levelBefore: last.level, levelAfter: r2(levelNow), ruling: "Mo 2026-10-12 in chat: the newer sets were still based at our first mark — base them at the product launch and backdate; release-month point from PriceCharting once the month closed", inceptionLevel: hist[0].level });
  (line.divisorLog = line.divisorLog || []).push({ date: TODAY, before, after: line.divisor, why: `RELINK to the release month (Mo, Oct 12 2026). 100 = ${monName(rel)} on PriceCharting's month prices (${inM.length} cards, ${(cov * 100).toFixed(1)}% of basket value); the first live mark had been sitting at 100. Every level × ${factor.toFixed(6)}; shape and % moves unchanged.` });
}

for (const tk of TKS) {
  const x = IDX[tk]; if (!x) { console.error("no ticker " + tk); continue; }
  await relink(x, x, x.basket, tk);
  for (const [k, sx] of Object.entries(x.sub || {})) {
    if (sx.kind === "ex") continue;                                   // ex-top-card lines ride the main index
    const cards = sx.basket ? sx.basket : sx.nums ? x.basket.filter((b) => sx.nums.includes(b.num)).map((b) => Object.assign({}, b, { w: 1 })) : null;
    if (!cards) { console.log(`${tk}·${k}: no basket or nums — skipped`); continue; }
    if (!sx.baseDate) { sx.baseDate = null; }
    await relink(x, sx, cards, `${tk}·${k}`);
  }
}
if (!CHECK) fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n");
console.log(CHECK ? "check only — nothing written" : "wrote data/indices.json");
