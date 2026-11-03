// tools/lib/move-guard.mjs — the MOVE-CONFIRMATION GUARD for raw set-index marks (CoS, Nov 3 2026, task
// price-truth-backlog-2026-11-03; Pokémon KB GAPS P14 / P33 (4) / P40 / P41 — the "price-band guard on thin holo-tier cards"
// ruled Oct 16 and never built).
//
// Why: a set index is the sum of per-card raw marks ÷ a divisor, so one card's unconfirmed jump moves the level and the plain
// read narrates it as the market. Cases: SK03 Charizard #146 $9,650 → $34,100 on one mislabelled row (Oct 15, +75% on the
// index); ND1E Shining Charizard #107 $2,987.50 → $1,600 on one sale (Oct 22); BS1E Mewtwo #10 $372.50 → $800 on a 90-day
// median of 11 (Nov 2) — 155% of BS1E's week while PriceCharting's ungraded value read ~$403.
//
// The rule (one function, used by every raw-mark writer in tools/build-sector-index.mjs):
//   A card's proposed raw mark is HELD at its prior mark when
//     (1) MOVE     it moves ≥ 50% against the prior mark (up ×1.5 or more, down to ×0.5 or less), or
//     (2) EDITION  it is a WOTC 1st Edition card whose paired Unlimited mark exists and the proposal LEAVES the
//                  1.2×–30× band around that Unlimited mark (a prior already outside the band is a data question for the
//                  sweep, not a reason to freeze the card),
//   and the card is MATERIAL — it can swing the level or be narrated: the dollar move is ≥ 0.25% of the ticker's basket value,
//   or the card marks at $10 or more on either side (the plain read's mover floor, js/plain-read.js). A 50% move on a 40¢
//   common neither moves a level nor reaches the plain read, and holding it only freezes noise. Dry run on the Nov 2 marks:
//   without this gate the guard held 98 of 3,884 rows (2.5%, 92 of them under $5); with it, 5 (0.13%).
//   It is released when CONFIRMED by
//     (a) DEPTH    ≥ 8 clean sales behind the proposal AND the proposal sits within 1.5× of PriceCharting's latest monthly
//                  ungraded value when the data has one (data/cards/h-<tk>.json — context only, never a mark), or
//     (b) 2ND READ the card was already held at the previous mark and this proposal is within 20% of that held proposal.
//   A held row keeps price = prior, prevPrice = prior (so no reader sees a move), is dated to this read, and carries
//   heldMove: { proposed, prior, since, n, pc?, unl?, why } — `since` is the first mark the proposal was held at and is kept
//   while the hold persists. A confirmed or ordinary mark deletes heldMove. Held moves are never narrated (plain read, movers).
//
// Thresholds were dry-run against the Nov 2 2026 marks of every live sector ticker before shipping (see the commit message).

import fs from "node:fs";
import path from "node:path";

export const MOVE_GUARD = {
  MOVE: 0.5,          // ≥ 50% vs the prior mark (ratio ≥ 1.5 or ≤ 0.5)
  MIN_N: 8,           // (a) clean sales behind the proposal
  PC_BAND: 1.5,       // (a) within 1.5× of PriceCharting's ungraded value, either side
  PC_MAX_AGE_D: 75,   // a PriceCharting month older than this (from the 1st of the month) is not a reference
  CONFIRM: 0.2,       // (b) second read within 20% of the held proposal
  ED_LO: 1.2,         // 1st Edition ÷ Unlimited band
  ED_HI: 30,
  IMPACT: 0.0025,     // materiality: |Δ$| ≥ 0.25% of the basket value …
  NARRATE_PX: 10,     // … or the card marks at ≥ $10 on either side
};

// WOTC 1st Edition ticker → its Unlimited twin (same slot numbers). BSSL is not a 1st Edition print and is left out.
export const EDITION_PAIR = { BS1E: "BS99", JU1E: "JU99", FO1E: "FO99", TR1E: "TR00", NG1E: "NG00", NDC1E: "NDC01", NR1E: "NR01", ND1E: "ND02" };

const r2 = (v) => Math.round(v * 100) / 100;

// PriceCharting's latest monthly ungraded value for a basket row, or null. h-<tk>.json is keyed by card key with a paths map
// for key safety: the reference is used only when that key's PriceCharting item is the row's own path.
const H_CACHE = new Map();
export function pcFile(root, ticker) {
  const tk = String(ticker).toLowerCase();
  if (!H_CACHE.has(tk)) {
    let j = null;
    try { j = JSON.parse(fs.readFileSync(path.join(root, "data/cards", `h-${tk}.json`), "utf8")); } catch (e) { j = null; }
    H_CACHE.set(tk, j);
  }
  return H_CACHE.get(tk);
}
export function pcRef(root, ticker, b, today) {
  const h = pcFile(root, ticker); if (!h || !h.cards) return null;
  const keys = [b.key, b.num].filter((k) => k != null).map(String);
  for (const k of keys) {
    const pts = h.cards[k]; if (!Array.isArray(pts) || !pts.length) continue;
    if (h.paths && h.paths[k] && b.path && h.paths[k] !== b.path) continue;
    for (let i = pts.length - 1; i >= 0; i--) {
      const [ym, ung] = pts[i];
      if (!(ung > 0)) continue;
      const age = (Date.parse(today) - Date.parse(`${ym}-01`)) / 864e5;
      if (!(age <= MOVE_GUARD.PC_MAX_AGE_D)) return null;
      return { value: ung, month: ym };
    }
  }
  return null;
}

// The paired Unlimited mark for a WOTC 1st Edition row (same num, priced), or null.
export function unlimitedMark(idx, ticker, b) {
  const tw = EDITION_PAIR[ticker]; if (!tw || !idx || !idx[tw] || !Array.isArray(idx[tw].basket)) return null;
  const u = idx[tw].basket.find((r) => String(r.num) === String(b.num) && typeof r.price === "number" && r.price > 0);
  return u ? u.price : null;
}

const edDist = (x) => (x < MOVE_GUARD.ED_LO ? MOVE_GUARD.ED_LO / x : x > MOVE_GUARD.ED_HI ? x / MOVE_GUARD.ED_HI : 1);

// guardMove({ prior, proposed, n, pc, unl, held, bv }) → { hold, why[], confirmed? }
//   prior    the stored mark (number) or null for a first mark / entrant (never held)
//   proposed this read's mark
//   n        clean sales behind the proposal (the window the proposal was taken on)
//   pc       PriceCharting's ungraded value (number) or null
//   unl      the paired Unlimited mark (1st Edition tickers) or null
//   held     the row's heldMove from the previous mark, if any
//   bv       the ticker's basket value before this mark (materiality); omitted → only the $10 test applies
export function guardMove({ prior, proposed, n, pc, unl, held, bv }) {
  const G = MOVE_GUARD, why = [];
  if (!(prior > 0) || !(proposed > 0)) return { hold: false, why };
  const material = Math.max(prior, proposed) >= G.NARRATE_PX || (bv > 0 && Math.abs(proposed - prior) >= G.IMPACT * bv);
  if (!material) return { hold: false, why };
  const r = proposed / prior;
  if (r >= 1 + G.MOVE || r <= 1 - G.MOVE) why.push(`moved ${r >= 1 ? "+" : "−"}${Math.abs((r - 1) * 100).toFixed(0)}% vs the prior mark $${prior}`);
  if (unl > 0) {
    const e = proposed / unl, ep = prior / unl;
    if (edDist(e) > 1 && edDist(ep) === 1) why.push(`1st Edition at ${e.toFixed(2)}× the Unlimited mark $${unl} (band ${G.ED_LO}–${G.ED_HI}×)`);
  }
  if (!why.length) return { hold: false, why };
  if (held && held.proposed > 0 && Math.abs(proposed / held.proposed - 1) <= G.CONFIRM) return { hold: false, why, confirmed: `second read: $${proposed} is within ${G.CONFIRM * 100}% of the $${held.proposed} held on ${held.since}` };
  const pcOk = !(pc > 0) || (proposed <= pc * G.PC_BAND && proposed >= pc / G.PC_BAND);
  if (n >= G.MIN_N && pcOk) return { hold: false, why, confirmed: `${n} clean sales${pc > 0 ? ` and within ${G.PC_BAND}× of PriceCharting's $${pc}` : ""}` };
  return { hold: true, why };
}

// Apply the guard to one basket row about to take mark `m` ({ price, win, n, wn? }). Returns true when the row was HELD (the
// caller must then not call setMark). ctx: { root, idx, ticker, today, window, bv, log }.
export function holdIfUnconfirmed(b, m, ctx) {
  const prior = typeof b.price === "number" && b.price > 0 && b.asOf ? b.price : null;
  if (prior == null) { delete b.heldMove; return false; }
  const n = m.win && ctx.window && m.win !== ctx.window && m.wn != null ? m.wn : m.n;
  const pc = pcRef(ctx.root, ctx.ticker, b, ctx.today);
  const unl = unlimitedMark(ctx.idx, ctx.ticker, b);
  const g = guardMove({ prior, proposed: m.price, n, pc: pc ? pc.value : null, unl, held: b.heldMove, bv: ctx.bv });
  if (!g.hold) {
    if (g.confirmed && ctx.log) ctx.log(`  move guard: ${b.name} #${b.num} $${prior} → $${m.price} CONFIRMED (${g.confirmed})`);
    delete b.heldMove;
    return false;
  }
  const since = b.heldMove && b.heldMove.since ? b.heldMove.since : ctx.today;
  b.prevPrice = prior; b.prevAsOf = b.asOf;
  b.asOf = ctx.today; b.n30 = m.n; b.carried = false;
  b.heldMove = { proposed: r2(m.price), prior, since, n, win: m.win, ...(pc ? { pc: pc.value, pcMonth: pc.month } : {}), ...(unl ? { unl } : {}), why: g.why.join("; ") };
  if (ctx.log) ctx.log(`  move guard: ${b.name} #${b.num} HELD at $${prior} (proposed $${m.price}, n ${n}${pc ? `, PriceCharting $${pc.value} ${pc.month}` : ""}) — ${g.why.join("; ")}`);
  return true;
}
