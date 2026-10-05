#!/usr/bin/env node
// build-recon.mjs — put a NEW Pokémon sector ticker on the release-date base (Mo, Sep 30 2026: "going from inception is dumb
// compared to going from release date"). Same method the Sep 30 rebase used for the 20 existing tickers:
//   · PriceCharting item pages embed VGPC.chart_data.used — monthly ungraded price history (the same basis as our marks).
//   · Chain-linked monthly on cards priced in both months, with TODAY's basket and weights.
//   · Base = the release month when the history covers >= 90% of the basket by value then; otherwise the first month it
//     does ("first reliable month" — every WOTC set predates PriceCharting's history).
//   · One factor per ticker rescales history + divisor (logged in divisorLog and rebase{}); % moves are unchanged.
// Usage: node tools/build-recon.mjs --ticker BS1E[,BSSL,...]   (run right after --init, before the first --bake)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const TKS = (args[args.indexOf("--ticker") + 1] || "").split(",").filter(Boolean);
const TODAY = process.env.SIDX_TODAY || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const r2 = (x) => Math.round(x * 100) / 100;
const MONS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monName = (m) => `${MONS[+m.slice(5, 7) - 1]} ${m.slice(0, 4)}`;
const longDate = (d) => `${MONS[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}, ${d.slice(0, 4)}`;

async function series(p) {
  for (let i = 1; i <= 4; i++) {
    const r = await fetch("https://www.pricecharting.com/game/" + p, { headers: { "User-Agent": UA } });
    if (r.status === 429 || r.status === 403 || r.status >= 500) { await sleep(6000 * i); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    const h = await r.text();
    const m = h.match(/VGPC\.chart_data\s*=\s*(\{[\s\S]*?\});/);
    if (!m) return {};
    const used = (JSON.parse(m[1]).used || []);
    const out = {};
    for (const [ms, cents] of used) { if (!cents) continue; const d = new Date(ms + 12 * 3600e3); out[d.toISOString().slice(0, 7)] = cents / 100; }
    return out;
  }
  throw new Error("rate limited");
}

const idxPath = path.join(ROOT, "data/indices.json");
const IDX = JSON.parse(fs.readFileSync(idxPath, "utf8"));
for (const tk of TKS) {
  const x = IDX[tk]; if (!x) { console.error("no ticker " + tk); continue; }
  if (x.baseDate && !args.includes("--check")) { console.log(`${tk}: already based (${x.baseDate}) — skip`); continue; }
  // Oct 4 2026 (DLR26 pre): a ticker whose live inception falls inside its own release month has no month to reconstruct —
  // the first live mark IS the release-month base (factor 1, the BCB26 case of Oct 1). Without this the link month below
  // is undefined and the factor is NaN.
  if (!args.includes("--check") && x.releaseDate && String(x.inception).slice(0, 7) === String(x.releaseDate).slice(0, 7)) {
    const rel0 = String(x.releaseDate).slice(0, 7);
    x.recon = []; x.baseDate = rel0; x.baseRule = "release";
    x.baseNote = `100 = ${monName(rel0)}, the set's release month`;
    x.rebase = { date: TODAY, factor: 1, ruling: "Mo 2026-09-30 in chat: every Pokémon index is based at its release date — this ticker launched inside its release month, so its first live mark is the base", inceptionLevel: x.history[0].level };
    (x.divisorLog = x.divisorLog || []).push({ date: TODAY, before: x.divisor, after: x.divisor, why: `BASE (release-date rule). ${x.baseNote}; inception ${x.inception} is inside the release month, so no reconstruction and factor 1.` });
    console.log(`${tk}: inception inside the release month — base ${rel0}, factor 1, no reconstruction`);
    continue;
  }
  const cards = [];
  for (const b of x.basket) { try { cards.push({ b, s: await series(b.path) }); } catch (e) { console.error(tk, b.path, e.message); } await sleep(900); }
  const total = cards.reduce((a, c) => a + c.b.price * c.b.w, 0);
  const months = [...new Set(cards.flatMap((c) => Object.keys(c.s)))].sort();
  const cov = (m) => cards.filter((c) => c.s[m]).reduce((a, c) => a + c.b.price * c.b.w, 0) / total;
  const rel = String(x.releaseDate || "").slice(0, 7);
  let base = months.find((m) => m >= rel && cov(m) >= 0.9), rule = base === rel ? "release" : "first-reliable";
  if (!base) { console.error(`${tk}: no month covers 90% of the basket — not rebased`); continue; }
  const L = { [base]: 100 };
  const ms = months.filter((m) => m >= base);
  for (let i = 1; i < ms.length; i++) {
    const a = ms[i - 1], m = ms[i];
    const both = cards.filter((c) => c.s[a] && c.s[m]);
    const num = both.reduce((s, c) => s + c.b.w * c.s[m], 0), den = both.reduce((s, c) => s + c.b.w * c.s[a], 0);
    L[m] = den ? L[a] * (num / den) : L[a];
  }
  const incM = String(x.inception).slice(0, 7);
  // link the live inception mark to the last full recon month: L[last] × Σw·mark / Σw·chart[last] on cards priced in both
  const lastFull = ms.filter((m) => m < incM).slice(-1)[0];
  const lk = cards.filter((c) => c.s[lastFull]);
  const linkLevel = L[lastFull] * lk.reduce((s, c) => s + c.b.w * c.b.price, 0) / lk.reduce((s, c) => s + c.b.w * c.s[lastFull], 0);
  if (args.includes("--check")) { console.log(`${tk} link level ${linkLevel.toFixed(2)}`); }
  if (args.includes("--check")) { console.log(`${tk} check: base ${base} (${rule}) vs stored ${x.baseDate}; ${incM} level ${L[incM] && L[incM].toFixed(2)} vs stored inception ${x.rebase && x.rebase.inceptionLevel}; last recon ${JSON.stringify((x.recon || []).slice(-1))} vs ${ms.slice(-4).map((m) => m + "=" + L[m].toFixed(2)).join(" ")}`); continue; }
  const factor = linkLevel / 100;
  const before = x.divisor;
  x.divisor = +(x.divisor / factor).toFixed(6);
  for (const h of x.history) { h.level = r2(h.level * factor); h.divisor = x.divisor; }
  x.recon = ms.filter((m) => m < incM).map((m) => ({ month: m, level: r2(L[m]) }));
  x.reconBasis = "monthly, reconstructed from PriceCharting ungraded price history, current basket and weights, chain-linked on cards priced in both months; not live marks";
  x.baseDate = base; x.baseRule = rule;
  x.baseNote = rule === "release" ? `100 = ${monName(base)}, the set's release month`
    : `100 = ${monName(base)}, the first month PriceCharting's ungraded sold history covers 90% of the basket by value — the ${longDate(x.releaseDate)} release predates the data, so no release-day level is claimed`;
  x.rebase = { date: TODAY, factor: +factor.toFixed(6), ruling: "Mo 2026-09-30 in chat: every Pokémon index is based at its release date — this ticker launched on that basis", inceptionLevel: x.history[0].level };
  (x.divisorLog = x.divisorLog || []).push({ date: TODAY, before, after: x.divisor, why: `BASE (release-date rule). ${x.baseNote}. Every level × ${factor.toFixed(6)}; shape and % moves unchanged.` });
  console.log(`${tk}: base ${base} (${rule}) · ${x.recon.length} recon months · factor ${factor.toFixed(4)} · level ${x.history[x.history.length - 1].level}`);
}
if (!args.includes("--check")) fs.writeFileSync(idxPath, JSON.stringify(IDX, null, 1) + "\n");
console.log("wrote data/indices.json");
