// ladder-guard.mjs — plausibility guards on the graded ladder (PSA 9 / PSA 10 / TAG 10) before any cell is published
// (price-truth backlog, CoS, Nov 3 2026). The Nov 3 sweep found four graded marks a visitor would act on that were wrong:
// TU19 #113 PSA 10 $9,100 = 57x its own PSA 9 (two fake "40% below" deals), NR01 #66 PSA 10 $130.50 below raw and PSA 9
// (2021 Classic Collection reprints in the median), BS99 #4 PSA 10 $10,300 at 0.39x PriceCharting with a $31,000 last sale
// (fed /should-i-grade and /best-charizard-cards), SK03 #150 PSA 10 $36,000 above its own $22,100 last sale.
//
// A held cell keeps its counts (n, n365) and moves its figures to `held` ({ m, m365, last, why }), so nothing that reads
// .m / .m365 / .last (card page, desks, should-i-grade, deals, checklists) can print or derive from it. Pages print the
// empty wording they already use ("No verified sale"). The next fresh read of the card replaces the row and re-runs the
// guards; an offline re-run (build-card-ladder.mjs --guard) never un-holds a held cell.
//
// The rules (R18 + the Nov 3 backlog). Each cell's figure v = m (the 30d/90d median) else m365 (the 12-month median);
// a cell with only a lone `last` sale is checked by (a) only, on that sale.
//   a-raw   v below the card's raw sold mark
//   a-psa9  PSA 10 below the same card's PSA 9 (its median, else its lone last sale)
//   a-tag-psa9  TAG 10 below the same card's PSA 9, same basis (Nov 4)
//   a-15x   PSA 10 more than 15x the same card's PSA 9 median when that median has >= 3 sales (another card's sales leaking in).
//           Exempt when PriceCharting's own PSA 10 estimate for BOTH of its last two months sits within 0.5-2x of our median:
//           WOTC PSA 10s routinely run 15-40x a PSA 9 (set medians 4.5-14x), and the literal rule held 72 cells, ~70 of them
//           matching PriceCharting. A leak shows as a level PriceCharting did not have the month before (TU19 #113: $850 -> $6,537).
//   b-pc    a PSA 10 median under 0.4x or over 2.5x PriceCharting's own PSA 10 estimate for the card (h-<tk>.json, its latest
//           month within 62 days of the read). PriceCharting's Grade 9 column mixes graders, so PSA 9 has no external check.
//   c-last  a median when the most recent title-verified sale of that grade is over 3x or under 0.33x it. Exempt: a median
//           PriceCharting's latest estimate corroborates (0.67-1.5x; PSA 10 vs its PSA 10, PSA 9 vs its Grade 9 — used only to
//           exempt, never to hold, because Grade 9 mixes graders) — then the lone last sale is the outlier, not the median
//           (AH26 #226: 29-sale median $187.50, PriceCharting $190, last sale $51; BS1E #4 PSA 9 $44,056 vs Grade 9 $33,573,
//           last "PSA 9" $6,850).
export const GUARD = { v: 1, x15: 15, x15MinN: 3, x15PcBand: [0.5, 2], pcLo: 0.4, pcHi: 2.5, pcMaxAgeDays: 62, lastHi: 3, lastLo: 0.33, lastPcBand: [0.67, 1.5] };
const GR = ["psa9", "psa10", "tag10"];
const fig = (x) => (x ? (x.m != null ? x.m : x.m365 != null ? x.m365 : null) : null);

// PriceCharting's estimates for the card (h-<tk>.json rows [month, ungraded, Grade 9 any grader, PSA 10]), each from its latest
// month within pcMaxAgeDays of the read: { v: PSA 10, prev: PSA 10 the month before, g9: Grade 9 } (null where missing)
export function pcOf(hist, asOf) {
  if (!Array.isArray(hist)) return null;
  const fresh = (r) => !asOf || (Date.parse(asOf) - Date.parse(r[0] + "-15")) / 864e5 <= GUARD.pcMaxAgeDays;
  const r10 = hist.filter((r) => Array.isArray(r) && r[3] > 0), r9 = hist.filter((r) => Array.isArray(r) && r[2] > 0);
  const a = r10[r10.length - 1], b = r9[r9.length - 1];
  const v = a && fresh(a) ? a[3] : null;
  return { v, prev: v != null && r10.length > 1 ? r10[r10.length - 2][3] : null, g9: b && fresh(b) ? b[2] : null };
}
const inBand = (x, [lo, hi]) => Number.isFinite(x) && x >= lo && x <= hi;

// returns { psa9?: why, psa10?: why, tag10?: why } — the cells to hold and the first rule each one failed
export function guardCard(c, raw, pc) {
  const out = {};
  if (!c || typeof c !== "object") return out;
  const rawOk = Number.isFinite(raw) && raw > 0;
  const lone = (x) => (x && x.m == null && x.m365 == null && x.last && Number.isFinite(x.last.p) ? x.last.p : null);
  // (a) raw floor, every grade — on the median figure, else the lone sale
  for (const k of GR) {
    const x = c[k]; if (!x || x.held) continue;
    const v = fig(x) != null ? fig(x) : lone(x);
    if (v != null && rawOk && v < raw) out[k] = "a-raw";
  }
  const p9 = c.psa9 && !out.psa9 && !c.psa9.held ? c.psa9 : null;
  const p9v = p9 ? (fig(p9) != null ? fig(p9) : lone(p9)) : null;
  const x10 = c.psa10;
  if (x10 && !x10.held && !out.psa10) {
    const v = fig(x10) != null ? fig(x10) : lone(x10);
    if (v != null && p9v != null && v < p9v) out.psa10 = "a-psa9";
    else if (fig(x10) != null && p9 && p9.m != null && p9.n >= GUARD.x15MinN && fig(x10) > GUARD.x15 * p9.m &&
      !(pc && pc.v && pc.prev && inBand(fig(x10) / pc.v, GUARD.x15PcBand) && inBand(fig(x10) / pc.prev, GUARD.x15PcBand))) out.psa10 = "a-15x";
    else if (fig(x10) != null && pc && pc.v && (fig(x10) < GUARD.pcLo * pc.v || fig(x10) > GUARD.pcHi * pc.v)) out.psa10 = "b-pc";
  }
  // (a-tag) TAG 10 below the same card's PSA 9 (its median, else its lone last sale) — Price Truth sweep Nov 3, 20 cells;
  // held, never restated (Night Crew Nov 4, interim for Price Truth under the CoS Nov 3 ruling)
  const t10 = c.tag10;
  if (t10 && !t10.held && !out.tag10) {
    const v = fig(t10) != null ? fig(t10) : lone(t10);
    if (v != null && p9v != null && v < p9v) out.tag10 = "a-tag-psa9";
  }
  // (c) last-sale sanity, every grade with a median
  for (const k of GR) {
    const x = c[k]; if (!x || x.held || out[k]) continue;
    const v = fig(x); if (v == null || !x.last || !Number.isFinite(x.last.p)) continue;
    const ref = !pc ? null : k === "psa10" ? pc.v : k === "psa9" ? pc.g9 : null;
    if (ref && inBand(v / ref, GUARD.lastPcBand)) continue;
    if (x.last.p > GUARD.lastHi * v || x.last.p < GUARD.lastLo * v) out[k] = "c-last";
  }
  return out;
}

// moves a cell's figures to `held`; returns the new cell
export function holdCell(x, why) {
  const held = { why, ...(x.m != null ? { m: x.m } : {}), ...(x.m365 != null ? { m365: x.m365 } : {}), ...(x.last ? { last: x.last } : {}) };
  const { m365, ...rest } = x;
  return { ...rest, m: null, basis: null, last: null, held };
}

// applies the guards to every card of one ticker in place. raws: Map(key -> raw mark), hists: { key: [[month, …, psa10]] }.
// Returns the list of held cells [{ key, grade, why, m, last }].
export function guardTicker(cards, raws, hists) {
  const held = [];
  for (const [key, c] of Object.entries(cards || {})) {
    const why = guardCard(c, raws.get(String(key)), pcOf(hists && hists[key], c && c.asOf));
    for (const [k, w] of Object.entries(why)) {
      held.push({ key, grade: k, why: w, m: c[k].m, m365: c[k].m365, last: c[k].last });
      c[k] = holdCell(c[k], w);
    }
  }
  return held;
}
